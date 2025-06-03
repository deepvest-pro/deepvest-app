import { NextResponse } from 'next/server';
import { checkUserProjectRole, publishSnapshot } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';

interface RouteContext {
  params: Promise<{
    id: string;
    snapshotId: string;
  }>;
}

/**
 * POST /api/projects/[id]/snapshots/[snapshotId]/publish
 * Publish a snapshot (set as public snapshot)
 */
export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, snapshotId } = await params;

  // Check if user has at least admin permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'admin');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to publish snapshots for this project' },
      { status: 403 },
    );
  }

  // Publish the snapshot
  const { success, error, data } = await publishSnapshot(projectId, snapshotId);

  if (!success) {
    return NextResponse.json({ error: error || 'Failed to publish snapshot' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    project: data,
  });
}
