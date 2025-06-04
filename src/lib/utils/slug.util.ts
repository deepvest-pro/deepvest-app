import { z } from 'zod';
import reactSlugify from 'react-slugify';
import type { RepositoryResponse } from '@/lib/supabase';

/**
 * Configuration options for slug generation
 */
export interface SlugGenerationOptions {
  /** Remove file extension from input before generating slug */
  removeFileExtension?: boolean;
  /** Allow underscores in the slug (default: false, only hyphens allowed) */
  allowUnderscores?: boolean;
  /** Maximum number of attempts to find unique slug (default: 100) */
  maxAttempts?: number;
  /** Function to check if slug is available */
  checkAvailability?: (slug: string, excludeId?: string) => Promise<RepositoryResponse<boolean>>;
  /** ID to exclude from availability check (for updates) */
  excludeId?: string;
}

/**
 * Local slug validation schema to avoid circular imports
 */
const slugSchema = z
  .string()
  .min(2, 'Must be at least 2 characters')
  .max(50, 'Must be less than 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Can only contain lowercase letters, numbers, and hyphens');

/**
 * Validation schema for slug generation input
 */
const slugGenerationSchema = z.object({
  input: z.string().min(1, 'Input string cannot be empty'),
  options: z
    .object({
      removeFileExtension: z.boolean().optional(),
      allowUnderscores: z.boolean().optional(),
      maxAttempts: z.number().int().min(1).max(1000).optional(),
      excludeId: z.string().optional(),
    })
    .optional(),
});

/**
 * Universal slug generation utility.
 * Generates URL-friendly slugs with optional uniqueness checking.
 * Uses react-slugify for base slug generation.
 *
 * @param input - The input string to convert to a slug.
 * @param options - Configuration options for slug generation.
 * @returns A promise that resolves to a RepositoryResponse containing the generated slug or an error message.
 */
export async function generateSlug(
  input: string,
  options: SlugGenerationOptions = {},
): Promise<RepositoryResponse<string>> {
  try {
    // Validate input using centralized validation
    const validationResult = slugGenerationSchema.safeParse({ input, options });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ');
      return { data: null, error: `Validation failed: ${errors}` };
    }

    const {
      removeFileExtension: shouldRemoveExtension = false,
      allowUnderscores = false,
      maxAttempts = 100,
      checkAvailability,
      excludeId,
    } = options;

    // Process input string
    let processedInput = input.trim();

    // Remove file extension if requested
    if (shouldRemoveExtension) {
      processedInput = removeFileExtension(processedInput);
    }

    // Generate base slug
    const baseSlug = createSlugFromString(processedInput, { allowUnderscores });

    // Validate generated slug against local slug schema
    const slugValidation = slugSchema.safeParse(baseSlug);
    if (!slugValidation.success) {
      return {
        data: null,
        // Ensure to access errors array safely
        error: `Generated slug is invalid: ${slugValidation.error.errors[0]?.message || 'Unknown validation error'}`,
      };
    }

    // If no availability checker provided, return base slug
    if (!checkAvailability) {
      return { data: baseSlug, error: null };
    }

    // Find unique slug
    return await findUniqueSlug(baseSlug, checkAvailability, excludeId, maxAttempts);
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred during slug generation',
    };
  }
}

/**
 * Creates a URL-friendly slug from a string.
 * This is an internal helper function.
 * @param input - The string to slugify.
 * @param options - Options for slug creation, e.g., allowing underscores.
 * @returns The generated slug string.
 */
function createSlugFromString(input: string, options: { allowUnderscores?: boolean } = {}): string {
  const { allowUnderscores = false } = options;

  // Use react-slugify for base slug generation. It handles lowercasing, special chars, etc.
  // reactSlugify is expected to lowercase by default based on typical slugify behavior.
  let slug = reactSlugify(input.trim());

  if (!allowUnderscores) {
    // If underscores are not allowed, replace any underscore with a hyphen.
    slug = slug.replace(/_/g, '-');
  }

  // Ensure multiple hyphens (possibly introduced by replacing underscores or by react-slugify itself) are condensed.
  // Also remove leading/trailing hyphens, though react-slugify might handle this.
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');

  return slug;
}

/**
 * Finds a unique slug by checking availability and adding suffixes if needed.
 * This is an internal helper function.
 * @param baseSlug - The base slug to start with.
 * @param checkAvailability - Function to check if a slug is available.
 * @param excludeId - Optional ID to exclude from availability check.
 * @param maxAttempts - Maximum attempts to find a unique slug.
 * @returns A promise that resolves to a RepositoryResponse containing the unique slug or an error.
 */
async function findUniqueSlug(
  baseSlug: string,
  checkAvailability: NonNullable<SlugGenerationOptions['checkAvailability']>,
  excludeId?: string,
  maxAttempts = 100,
): Promise<RepositoryResponse<string>> {
  let currentSlug = baseSlug;
  let counter = 1;

  while (counter <= maxAttempts) {
    // Check if current slug is available
    const availabilityResult = await checkAvailability(currentSlug, excludeId);

    if (availabilityResult.error) {
      return {
        data: null,
        error: `Failed to check slug availability: ${availabilityResult.error}`,
      };
    }

    if (availabilityResult.data === true) {
      return { data: currentSlug, error: null };
    }

    // Slug is taken, try with a number suffix
    currentSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Safety fallback: use timestamp if too many attempts failed
  const timestampSlug = `${baseSlug}-${Date.now()}`;
  // Log a warning or inform about fallback, if a logging mechanism is in place
  console.warn(
    `Max attempts reached for slug "${baseSlug}". Using timestamp fallback: "${timestampSlug}".`,
  );
  return { data: timestampSlug, error: null };
}

/**
 * Removes file extension from a filename.
 * This is an internal helper function.
 * @param filename - The filename to remove the extension from.
 * @returns Filename without its extension.
 */
export function removeFileExtension(filename: string): string {
  if (!filename) return '';
  return filename.replace(/\.[^/.]+$/, '');
}
