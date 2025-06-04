import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth } from '@/lib/api/middleware/auth';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

/**
 * GET /api/projects/[id]/permissions/user
 * Get the current user's role in the project
 */
export const GET = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  // Require authentication
  const user = await requireAuth();

  const { id: projectId } = params;
  const supabase = await SupabaseClientFactory.getServerClient();

  // Get the current user's permissions for this project
  const { data, error } = await supabase
    .from('project_permissions')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No permission found - user has no access to this project
      return { data: null };
    }
    console.error('Error fetching user permissions:', error);
    throw new Error('Failed to fetch user permissions');
  }

  return { data };
});
