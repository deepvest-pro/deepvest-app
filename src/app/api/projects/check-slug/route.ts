import { NextRequest } from 'next/server';
import { createAPIHandler } from '@/lib/api/base-handler';
import { REGEX_PATTERNS } from '@/lib/constants';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * GET /api/projects/check-slug
 * Check if a project slug is available
 *
 * Query parameters:
 * - slug: The slug to check
 * - excludeId: (optional) Project ID to exclude from check (for updates)
 */
export const GET = createAPIHandler(async (request: NextRequest) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const excludeId = url.searchParams.get('excludeId');

  if (!slug) {
    throw new Error('Slug parameter is required');
  }

  // Validate slug format using centralized regex
  if (!REGEX_PATTERNS.projectSlug.test(slug)) {
    return {
      available: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens',
    };
  }

  if (slug.length < 3 || slug.length > 63) {
    return {
      available: false,
      error: 'Slug must be between 3 and 63 characters long',
    };
  }

  const supabase = await createSupabaseServerClient();

  // Check if slug exists
  let query = supabase.from('projects').select('id').eq('slug', slug);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" which means slug is available
    throw new Error('Database error while checking slug');
  }

  return {
    available: !data, // Available if no data found
  };
});
