import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, requireProjectPermission, APIError } from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

/**
 * GET /api/projects/[id]/snapshots/[snapshotId]
 * Get a specific snapshot
 */
export const GET = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();

  const { id: projectId, snapshotId } = params;

  // Check if user has at least viewer permission for this project
  await requireProjectPermission(user.id, projectId, 'viewer');

  const supabase = await SupabaseClientFactory.getServerClient();

  // Get the specific snapshot (raw data first)
  const { data: rawSnapshot, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .eq('project_id', projectId) // Ensure the snapshot belongs to the specified project
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new APIError('Snapshot not found', 404);
    }
    console.error('Error fetching snapshot:', error);
    throw new Error('Failed to fetch snapshot');
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

  return { snapshot: snapshotWithAuthor };
});

/**
 * PUT /api/projects/[id]/snapshots/[snapshotId]
 * Update a specific snapshot (if not locked)
 */
export const PUT = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  // Require authentication
  const user = await requireAuth();

  const { id: projectId, snapshotId } = params;

  // Check if user has at least editor permission for this project
  await requireProjectPermission(user.id, projectId, 'editor');

  const supabase = await SupabaseClientFactory.getServerClient();

  // Check if snapshot is locked
  const { data: snapshot, error: snapshotError } = await supabase
    .from('snapshots')
    .select('is_locked')
    .eq('id', snapshotId)
    .eq('project_id', projectId)
    .single();

  if (snapshotError) {
    if (snapshotError.code === 'PGRST116') {
      throw new APIError('Snapshot not found', 404);
    }
    console.error('Error fetching snapshot:', snapshotError);
    throw new Error('Failed to fetch snapshot');
  }

  if (snapshot.is_locked) {
    throw new APIError('Cannot update a locked snapshot', 403);
  }

  const body = await request.json();

  const validatedData = ValidationSchemas.project.snapshot.partial().parse(body);

  // Update the snapshot
  const { data: updatedSnapshot, error: updateError } = await supabase
    .from('snapshots')
    .update(validatedData)
    .eq('id', snapshotId)
    .eq('project_id', projectId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating snapshot:', updateError);
    throw new Error('Failed to update snapshot');
  }

  return { snapshot: updatedSnapshot };
});
