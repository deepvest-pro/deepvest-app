import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, requireProjectPermission, APIError } from '@/lib/api/middleware/auth';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();

  const { id: projectId } = params;

  await requireProjectPermission(user.id, projectId, 'editor');

  const supabase = await SupabaseClientFactory.getServerClient();

  // Verify project exists
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new APIError('Project not found', 404);
  }

  const syncResult = await syncSnapshotData(projectId);

  if (!syncResult.success) {
    throw new Error(syncResult.error || 'Failed to sync snapshot');
  }

  return {
    success: true,
    message: 'Snapshot synced successfully',
    contentCount: syncResult.contentCount,
    teamMemberCount: syncResult.teamMemberCount,
  };
});
