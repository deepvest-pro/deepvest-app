import { NextResponse } from 'next/server';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';

interface RouteContext {
  params: Promise<{
    id: string;
    snapshotId: string;
  }>;
}

/**
 * GET /api/projects/[id]/snapshots/[snapshotId]
 * Get a specific snapshot
 */
export async function GET(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, snapshotId } = await params;

  // Check if user has at least viewer permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'viewer');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to view this project' },
      { status: 403 },
    );
  }

  // Get the specific snapshot (raw data first)
  const { data: rawSnapshot, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .eq('project_id', projectId) // Ensure the snapshot belongs to the specified project
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'PGRST116' ? 404 : 500 },
    );
  }

  // Fetch author profile separately to avoid schema cache issues
  let authorProfile = null;
  if (rawSnapshot.author_id) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, full_name, nickname, avatar_url')
      .eq('id', rawSnapshot.author_id)
      .single();

    if (profile) {
      authorProfile = {
        id: profile.id,
        email: undefined,
        user_profiles: profile,
      };
    }
  }

  const snapshotWithAuthor = {
    ...rawSnapshot,
    author_id: authorProfile || rawSnapshot.author_id,
  };

  return NextResponse.json({ snapshot: snapshotWithAuthor });
}

/**
 * PUT /api/projects/[id]/snapshots/[snapshotId]
 * Update a specific snapshot (if not locked)
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, snapshotId } = await params;

  // Check if user has at least editor permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

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
