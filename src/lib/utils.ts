/**
 * Generates a URL-friendly slug from any string
 * @param input - The input string to convert to slug
 * @returns A clean slug with only lowercase letters, numbers, hyphens, and underscores
 */
export function generateSlug(input: string): string {
  if (!input) return '';

  // Remove file extension if present
  const nameWithoutExt = input.replace(/\.[^/.]+$/, '');

  // Convert to lowercase and replace spaces and special characters with hyphens
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-') // Replace non-alphanumeric chars (except - and _) with -
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a slug specifically from a filename
 * @param filename - The filename to convert to slug
 * @returns A clean slug based on the filename
 */
export function generateSlugFromFilename(filename: string): string {
  return generateSlug(filename);
}
