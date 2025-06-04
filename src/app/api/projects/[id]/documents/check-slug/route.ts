import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { APIError } from '@/lib/api/middleware/auth';
import { projectDocumentsRepository } from '@/lib/supabase/repositories/project-documents';
import { REGEX_PATTERNS } from '@/lib/constants';

/**
 * GET /api/projects/[id]/documents/check-slug
 * Check if a document slug is available within a specific project
 *
 * Query parameters:
 * - slug: The slug to check
 * - excludeId: (optional) Document ID to exclude from check (for updates)
 */
export const GET = createAPIHandlerWithParams(async (request, params) => {
  const { id: projectId } = params;
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const excludeId = url.searchParams.get('excludeId');

  if (!slug) {
    throw new APIError('Slug parameter is required', 400);
  }

  // Validate slug format using centralized regex
  if (!REGEX_PATTERNS.documentSlug.test(slug)) {
    return {
      available: false,
      error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
    };
  }

  if (slug.length < 1 || slug.length > 100) {
    return {
      available: false,
      error: 'Slug must be between 1 and 100 characters long',
    };
  }

  // Check if slug is available within the project
  const { data: isAvailable, error } = await projectDocumentsRepository.isSlugAvailable(
    projectId,
    slug,
    excludeId || undefined,
  );

  if (error) {
    throw new APIError('Failed to check slug availability', 500);
  }

  return {
    available: isAvailable,
  };
});
