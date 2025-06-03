import { NextResponse } from 'next/server';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RouteContext {
  params: {
    id: string;
    snapshotId: string;
  };
}

/**
 * GET /api/projects/[id]/snapshots/[snapshotId]
 * Get a specific snapshot
 */
export async function GET(request: Request, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, snapshotId } = params;

  // Check if user has at least viewer permission for this project
  const hasAccess = await checkUserProjectRole(session.user.id, projectId, 'viewer');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to view this project' },
      { status: 403 },
    );
  }

  // Get the specific snapshot
  const { data, error } = await supabase
    .from('snapshots')
    .select('*, author_id(id, full_name, nickname, avatar_url)')
    .eq('id', snapshotId)
    .eq('project_id', projectId) // Ensure the snapshot belongs to the specified project
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 },
    );
  }

  return NextResponse.json({ snapshot: data });
}

/**
 * PUT /api/projects/[id]/snapshots/[snapshotId]
 * Update a specific snapshot (if not locked)
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, snapshotId } = params;

  // Check if user has at least editor permission for this project
  const hasAccess = await checkUserProjectRole(session.user.id, projectId, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to edit this project' },
      { status: 403 },
    );
  }

  // Check if snapshot is locked
  const { data: snapshot, error: snapshotError } = await supabase
    .from('snapshots')
    .select('is_locked')
    .eq('id', snapshotId)
    .eq('project_id', projectId)
    .single();

  if (snapshotError) {
    return NextResponse.json(
      { error: snapshotError.message },
      { status: snapshotError.code === 'PGRST116' ? 404 : 500 },
    );
  }

  if (snapshot.is_locked) {
    return NextResponse.json({ error: 'Cannot update a locked snapshot' }, { status: 403 });
  }

  // Update the snapshot
  try {
    const json = await request.json();

    // Only update fields that are in the request body
    const { data: updatedSnapshot, error: updateError } = await supabase
      .from('snapshots')
      .update(json)
      .eq('id', snapshotId)
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ snapshot: updatedSnapshot });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
