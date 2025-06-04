import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, requireProjectPermission } from '@/lib/api/middleware/auth';
import { publishSnapshot } from '@/lib/supabase/helpers';

/**
 * POST /api/projects/[id]/snapshots/[snapshotId]/publish
 * Publish a snapshot (set as public snapshot)
 */
export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();

  const { id: projectId, snapshotId } = params;

  await requireProjectPermission(user.id, projectId, 'admin');

  const { success, error, data } = await publishSnapshot(projectId, snapshotId);

  if (!success) {
    throw new Error(error || 'Failed to publish snapshot');
  }

  return {
    success: true,
    project: data,
  };
});
