import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, APIError } from '@/lib/api/middleware/auth';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

export const GET = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();

  const { id: projectId } = params;
  const supabase = await SupabaseClientFactory.getServerClient();

  // Get project with snapshots info
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(
      `
      id, 
      slug, 
      public_snapshot_id, 
      new_snapshot_id,
      is_public, 
      is_archived,
      created_at,
      updated_at,
      user_id
    `,
    )
    .eq('id', projectId)
    .single();

  if (projectError) {
    throw new APIError('Project not found', 404);
  }

  // Only allow project owner or admin to access debug info
  // This is sensitive information that should be restricted
  if (project.user_id !== user.id) {
    throw new APIError('Access denied. Only project owner can view debug information.', 403);
  }

  // Get all snapshots for this project
  const { data: snapshots, error: snapshotsError } = await supabase
    .from('snapshots')
    .select('id, project_id, version, name, status, created_at, is_locked')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  // Try to get the specific public snapshot if it exists
  let publicSnapshot = null;
  let publicSnapshotError = null;

  if (project.public_snapshot_id) {
    const { data: pubSnap, error: pubSnapError } = await supabase
      .from('snapshots')
      .select('*')
      .eq('id', project.public_snapshot_id)
      .single();

    publicSnapshot = pubSnap;
    publicSnapshotError = pubSnapError;
  }

  return {
    project,
    snapshots: snapshots || [],
    publicSnapshot,
    publicSnapshotError,
    snapshotsError,
    debug: {
      hasPublicSnapshotId: !!project.public_snapshot_id,
      snapshotsCount: snapshots?.length || 0,
      publicSnapshotExists: !!publicSnapshot,
    },
  };
});
