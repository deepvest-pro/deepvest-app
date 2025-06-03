import { NextResponse } from 'next/server';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { snapshotSchema } from '@/lib/validations/project';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]/snapshots
 * Get all snapshots for a project
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

  const { id: projectId } = await params;

  // Check if user has at least viewer permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'viewer');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to view this project' },
      { status: 403 },
    );
  }

  // Get all snapshots for this project (raw data first)
  const { data: rawSnapshots, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch author profiles separately to avoid schema cache issues
  const snapshotsWithAuthors = [];
  for (const snapshot of rawSnapshots || []) {
    let authorProfile = null;
    if (snapshot.author_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, nickname, avatar_url')
        .eq('id', snapshot.author_id)
        .single();

      if (profile) {
        authorProfile = {
          id: profile.id,
          email: undefined,
          user_profiles: profile,
        };
      }
    }

    snapshotsWithAuthors.push({
      ...snapshot,
      author_id: authorProfile || snapshot.author_id,
    });
  }

  return NextResponse.json({ snapshots: snapshotsWithAuthors });
}

/**
 * POST /api/projects/[id]/snapshots
 * Create a new snapshot for editing (stored in new_snapshot_id)
 */
export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;

  // Check if user has at least editor permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to edit this project' },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();

    // Validate the request body
    const validatedData = snapshotSchema.parse(json);

    // Get the current project to check for existing new_snapshot
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('new_snapshot_id, public_snapshot_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('POST /api/projects/[id]/snapshots - Project snapshot IDs:', {
      public_snapshot_id: project.public_snapshot_id,
      new_snapshot_id: project.new_snapshot_id,
      areEqual: project.public_snapshot_id === project.new_snapshot_id,
    });

    let snapshotId: string;

    // If new_snapshot_id exists AND differs from public_snapshot_id, we're editing a draft
    // If they are equal (or new_snapshot_id is null), we need to create a new snapshot
    const isEditingDraft =
      project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id;

    if (isEditingDraft) {
      // Update existing draft snapshot (new_snapshot_id differs from public_snapshot_id)
      console.log('Updating existing draft snapshot:', project.new_snapshot_id);
      const { data: updatedSnapshot, error: updateError } = await supabase
        .from('snapshots')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.new_snapshot_id)
        .eq('is_locked', false) // Ensure we can only update unlocked snapshots
        .select()
        .single();

      if (updateError || !updatedSnapshot) {
        return NextResponse.json(
          { error: updateError?.message || 'Failed to update snapshot' },
          { status: 500 },
        );
      }

      snapshotId = updatedSnapshot.id;
    } else {
      // Create new snapshot (no draft exists or new_snapshot_id equals public_snapshot_id)
      console.log('Creating new snapshot for project:', projectId);

      // Get the next version number
      const { data: latestSnapshot } = await supabase
        .from('snapshots')
        .select('version')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (latestSnapshot?.version || 0) + 1;

      // Create new snapshot
      const { data: newSnapshot, error: createError } = await supabase
        .from('snapshots')
        .insert({
          project_id: projectId,
          version: nextVersion,
          author_id: user.id,
          is_locked: false,
          ...validatedData,
        })
        .select()
        .single();

      if (createError || !newSnapshot) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create snapshot' },
          { status: 500 },
        );
      }

      snapshotId = newSnapshot.id;

      // Update project to reference the new snapshot
      const { error: projectUpdateError } = await supabase
        .from('projects')
        .update({ new_snapshot_id: snapshotId })
        .eq('id', projectId);

      if (projectUpdateError) {
        // Rollback: delete the created snapshot
        await supabase.from('snapshots').delete().eq('id', snapshotId);
        return NextResponse.json({ error: 'Failed to link snapshot to project' }, { status: 500 });
      }
    }

    // Fetch the complete snapshot data to return
    const { data: snapshot, error: fetchError } = await supabase
      .from('snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (fetchError || !snapshot) {
      return NextResponse.json(
        { error: 'Snapshot created but failed to fetch details' },
        { status: 500 },
      );
    }

    return NextResponse.json({ snapshot });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error creating/updating snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]/snapshots/publish
 * Publish the current new_snapshot (move it to public_snapshot_id and lock it)
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;

  // Check if user has owner permission (only owners can publish)
  const isOwner = await checkUserProjectRole(user.id, projectId, 'owner');

  if (!isOwner) {
    return NextResponse.json({ error: 'Only project owners can publish changes' }, { status: 403 });
  }

  try {
    // Get the current project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('new_snapshot_id, public_snapshot_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.new_snapshot_id) {
      return NextResponse.json({ error: 'No draft changes to publish' }, { status: 400 });
    }

    // Start a transaction-like operation
    // 1. Lock the old public snapshot if it exists
    if (project.public_snapshot_id) {
      await supabase
        .from('snapshots')
        .update({ is_locked: true })
        .eq('id', project.public_snapshot_id);
    }

    // 2. Lock the new snapshot and make it public
    const { error: lockError } = await supabase
      .from('snapshots')
      .update({ is_locked: true })
      .eq('id', project.new_snapshot_id);

    if (lockError) {
      return NextResponse.json({ error: 'Failed to lock snapshot' }, { status: 500 });
    }

    // 3. Update project to move new_snapshot to public_snapshot
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        public_snapshot_id: project.new_snapshot_id,
        new_snapshot_id: null,
      })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to publish changes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Changes published successfully' });
  } catch (error) {
    console.error('Error publishing snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
