import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { APIError, requireAuth, requireProjectPermission } from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

/**
 * GET /api/projects/[id]/snapshots
 * Get all snapshots for a project
 */
export const GET = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has at least viewer permission for this project
  await requireProjectPermission(user.id, projectId, 'viewer');

  const supabase = await SupabaseClientFactory.getServerClient();

  // Get all snapshots for this project (raw data first)
  const { data: rawSnapshots, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  if (error) {
    throw new APIError(error.message, 500);
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

  return { snapshots: snapshotsWithAuthors };
});

/**
 * POST /api/projects/[id]/snapshots
 * Create a new snapshot for editing (stored in new_snapshot_id)
 */
export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has at least editor permission for this project
  await requireProjectPermission(user.id, projectId, 'editor');

  // Validate request body
  const body = await request.json();
  const validatedData = ValidationSchemas.project.snapshot.parse(body);

  const supabase = await SupabaseClientFactory.getServerClient();

  // Get the current project to check for existing new_snapshot
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('new_snapshot_id, public_snapshot_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new APIError('Project not found', 404);
  }

  let snapshotId: string;

  // If new_snapshot_id exists AND differs from public_snapshot_id, we're editing a draft
  // If they are equal (or new_snapshot_id is null), we need to create a new snapshot
  const isEditingDraft =
    project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id;

  if (isEditingDraft) {
    // Update existing draft snapshot (new_snapshot_id differs from public_snapshot_id)
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
      throw new APIError(updateError?.message || 'Failed to update snapshot', 500);
    }

    snapshotId = updatedSnapshot.id;
  } else {
    // Create new snapshot (no draft exists or new_snapshot_id equals public_snapshot_id)

    // Get the next version number
    const { data: latestSnapshot } = await supabase
      .from('snapshots')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (latestSnapshot?.version || 0) + 1;

    // Get the previous snapshot to copy contents and members from
    let previousSnapshotData = null;
    if (project.public_snapshot_id) {
      // Copy from the current public snapshot
      const { data: publicSnapshot } = await supabase
        .from('snapshots')
        .select('contents, team_members')
        .eq('id', project.public_snapshot_id)
        .single();

      previousSnapshotData = publicSnapshot;
    } else {
      // If no public snapshot, try to get the latest snapshot
      const { data: lastSnapshot } = await supabase
        .from('snapshots')
        .select('contents, team_members')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      previousSnapshotData = lastSnapshot;
    }

    // Create new snapshot with copied data
    const { data: newSnapshot, error: createError } = await supabase
      .from('snapshots')
      .insert({
        project_id: projectId,
        version: nextVersion,
        author_id: user.id,
        is_locked: false,
        // Copy contents and team_members from previous snapshot, but not scoring_id
        contents: previousSnapshotData?.contents || null,
        team_members: previousSnapshotData?.team_members || null,
        ...validatedData,
      })
      .select()
      .single();

    if (createError || !newSnapshot) {
      throw new APIError(createError?.message || 'Failed to create snapshot', 500);
    }

    snapshotId = newSnapshot.id;

    // Update project's new_snapshot_id to point to this new snapshot
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ new_snapshot_id: snapshotId })
      .eq('id', projectId);

    if (projectUpdateError) {
      throw new APIError('Failed to update project snapshot reference', 500);
    }
  }

  return { snapshotId, success: true };
});

/**
 * PUT /api/projects/[id]/snapshots
 * Update snapshot metadata (like title, description)
 */
export const PUT = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has at least editor permission for this project
  await requireProjectPermission(user.id, projectId, 'editor');

  // Validate request body
  const body = await request.json();
  const validatedData = ValidationSchemas.project.snapshot.parse(body);

  const supabase = await SupabaseClientFactory.getServerClient();

  // Get the current project's new_snapshot_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('new_snapshot_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project || !project.new_snapshot_id) {
    throw new APIError('No active snapshot found for this project', 404);
  }

  // Update the snapshot
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
    throw new APIError(updateError?.message || 'Failed to update snapshot', 500);
  }

  return { snapshot: updatedSnapshot, success: true };
});
