import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, requireProjectPermission, APIError } from '@/lib/api/middleware/auth';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();

  const { id: projectId } = params;

  // Check if user has owner permissions (only owners can publish drafts)
  await requireProjectPermission(user.id, projectId, 'owner');

  const supabase = await SupabaseClientFactory.getServerClient();

  // Get project with current snapshot info
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, public_snapshot_id, new_snapshot_id, user_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new APIError('Project not found', 404);
  }

  // Double-check ownership (redundant but safe)
  if (project.user_id !== user.id) {
    throw new APIError('Only project owner can publish drafts', 403);
  }

  // Check if there's a draft to publish
  if (!project.new_snapshot_id || project.new_snapshot_id === project.public_snapshot_id) {
    throw new APIError('No draft to publish', 400);
  }

  // Start transaction: update project and lock the snapshot
  const { error: updateError } = await supabase.rpc('publish_project_draft', {
    project_id: projectId,
    new_public_snapshot_id: project.new_snapshot_id,
  });

  if (updateError) {
    console.error('Error publishing draft:', updateError);
    throw new Error('Failed to publish draft');
  }

  return {
    success: true,
    message: 'Draft published successfully',
  };
});
