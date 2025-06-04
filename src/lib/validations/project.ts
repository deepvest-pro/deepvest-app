import { z } from 'zod';
import { generateSlug } from '@/lib/utils/slug.util';
import type { ProjectStatus } from '@/types/supabase';
import type { RepositoryResponse } from '@/lib/supabase';

// Enums for dropdown selection
export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'concept', label: 'Concept' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'mvp', label: 'MVP' },
  { value: 'beta', label: 'Beta' },
  { value: 'launched', label: 'Launched' },
  { value: 'growing', label: 'Growing' },
  { value: 'scaling', label: 'Scaling' },
  { value: 'established', label: 'Established' },
  { value: 'acquired', label: 'Acquired' },
  { value: 'closed', label: 'Closed' },
];

/**
 * Generates a unique project slug by checking availability via API
 * @param baseName - The base name to generate slug from
 * @param excludeId - Optional project ID to exclude during availability check (for updates)
 * @returns Promise<string> A unique slug for the project, or the base slug with a timestamp on error/max attempts.
 */
export async function generateUniqueProjectSlug(
  baseName: string,
  excludeId?: string,
): Promise<string> {
  const checkAvailability = async (
    slugToCheck: string,
    currentExcludeId?: string,
  ): Promise<RepositoryResponse<boolean>> => {
    try {
      const queryParams = new URLSearchParams({ slug: slugToCheck });
      if (currentExcludeId) {
        queryParams.append('excludeId', currentExcludeId);
      }
      const response = await fetch(`/api/projects/check-slug?${queryParams.toString()}`);

      if (!response.ok) {
        console.warn(
          `Failed to check project slug availability (status: ${response.status}), using fallback logic for slug: ${slugToCheck}`,
        );
        // Consider unavailable if API call fails, to force suffixing or timestamp
        return { data: false, error: `API error: ${response.statusText}` };
      }

      const result = await response.json();
      // Assuming the API returns { available: boolean }
      return { data: result.available, error: null };
    } catch (error) {
      console.warn(`Error checking project slug availability for slug: ${slugToCheck}:`, error);
      // Consider unavailable on network error, to force suffixing or timestamp
      return { data: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  };

  const slugResponse = await generateSlug(baseName, {
    checkAvailability,
    excludeId, // Pass excludeId to generateSlug options
    allowUnderscores: false, // Project slugs typically don't allow underscores
  });

  if (slugResponse.error || !slugResponse.data) {
    console.warn(
      `Slug generation failed for baseName '${baseName}'. Error: ${slugResponse.error}. Using fallback. Fallback slug: ${baseName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    );
    // Fallback if generateSlug itself has an error or returns no data
    // This should be a simple, safe slug as a last resort.
    const safeBase =
      baseName
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'project';
    return `${safeBase}-${Date.now()}`;
  }

  return slugResponse.data;
}

/**
 * Schema for creating a new project
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Project name must be at least 2 characters' })
    .max(50, { message: 'Project name cannot exceed 50 characters' }),
  slug: z
    .string()
    .min(2, { message: 'URL must be at least 2 characters' })
    .max(50, { message: 'URL cannot exceed 50 characters' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'URL can only contain lowercase letters, numbers, and hyphens',
    }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(500, { message: 'Description cannot exceed 500 characters' }),
  status: z.enum([
    'idea',
    'concept',
    'prototype',
    'mvp',
    'beta',
    'launched',
    'growing',
    'scaling',
    'established',
    'acquired',
    'closed',
  ]),
});

/**
 * Type for creating a new project
 */
export type CreateProjectForm = z.infer<typeof createProjectSchema>;

/**
 * Schema for updating a project (includes id for full validation)
 */
export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Schema for updating a project body (without id, used in API routes)
 */
export const updateProjectBodySchema = createProjectSchema.partial();

/**
 * Type for updating a project
 */
export type UpdateProjectForm = z.infer<typeof updateProjectSchema>;

/**
 * Type for updating a project body
 */
export type UpdateProjectBodyForm = z.infer<typeof updateProjectBodySchema>;

/**
 * Schema for validating project snapshots (matching DB structure)
 */
export const snapshotSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  slogan: z
    .string()
    .max(200, { message: 'Slogan cannot exceed 200 characters' })
    .optional()
    .nullable(),
  description: z
    .string()
    .min(1, { message: 'Description is required' })
    .max(2000, { message: 'Description cannot exceed 2000 characters' }),
  status: z.enum([
    'idea',
    'concept',
    'prototype',
    'mvp',
    'beta',
    'launched',
    'growing',
    'scaling',
    'established',
    'acquired',
    'closed',
  ]),
  country: z
    .string()
    .max(100, { message: 'Country cannot exceed 100 characters' })
    .optional()
    .nullable(),
  city: z.string().max(100, { message: 'City cannot exceed 100 characters' }).optional().nullable(),
  repository_urls: z
    .array(z.string().url({ message: 'Must be a valid URL' }))
    .optional()
    .nullable(),
  website_urls: z
    .array(z.string().url({ message: 'Must be a valid URL' }))
    .optional()
    .nullable(),
  logo_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  banner_url: z.string().url({ message: 'Must be a valid URL' }).optional().nullable(),
  video_urls: z
    .array(z.string().url({ message: 'Must be a valid URL' }))
    .optional()
    .nullable(),
});

/**
 * Type for snapshot form data
 */
export type SnapshotForm = z.infer<typeof snapshotSchema>;

/**
 * Schema for project permission management
 */
export const permissionSchema = z.object({
  email: z.string().email({ message: 'Must be a valid email address' }),
  role: z.enum(['viewer', 'editor', 'admin', 'owner']),
});

/**
 * Type for project permission form
 */
export type PermissionForm = z.infer<typeof permissionSchema>;
