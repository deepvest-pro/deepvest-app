import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { APIError, requireAuth } from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

/**
 * POST /api/projects/[id]/team-members/bulk
 * Perform bulk operations on team members
 */
export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has permission to manage team members (editor, admin, or owner)
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

  if (!hasAccess) {
    throw new APIError('You do not have permission to manage team members for this project', 403);
  }

  const body = await request.json();

  // Validate the request body
  const { team_member_ids, action } = ValidationSchemas.team.bulk.parse(body);

  const supabase = await SupabaseClientFactory.getServerClient();

  // Get user's role to check permissions for different actions
  const { data: userRole } = await supabase
    .from('project_permissions')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  const isAdminOrOwner = userRole && ['admin', 'owner'].includes(userRole.role);

  // Verify all team members exist and user has permission to modify them
  const { data: existingMembers, error: fetchError } = await supabase
    .from('team_members')
    .select('id, author_id')
    .eq('project_id', projectId)
    .in('id', team_member_ids)
    .is('deleted_at', null);

  if (fetchError) {
    throw new APIError('Failed to fetch team members', 500);
  }

  if (!existingMembers || existingMembers.length !== team_member_ids.length) {
    throw new APIError('Some team members not found', 404);
  }

  // Check permissions for each team member
  const unauthorizedMembers = existingMembers.filter(
    member => member.author_id !== user.id && !isAdminOrOwner,
  );

  if (unauthorizedMembers.length > 0) {
    throw new APIError('Insufficient permissions for some team members', 403);
  }

  const updateData: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  // Prepare update data based on action
  switch (action) {
    case 'delete':
      // Check if any team members are referenced in locked snapshots
      const { data: lockedSnapshots, error: snapshotError } = await supabase
        .from('snapshots')
        .select('id, team_members')
        .eq('project_id', projectId)
        .eq('is_locked', true);

      if (snapshotError) {
        throw new APIError('Failed to check snapshot references', 500);
      }

      if (lockedSnapshots && lockedSnapshots.length > 0) {
        const referencedMembers = lockedSnapshots.some(snapshot =>
          snapshot.team_members?.some((memberId: string) => team_member_ids.includes(memberId)),
        );

        if (referencedMembers) {
          throw new APIError(
            'Cannot delete team members: some are referenced in locked snapshots',
            409,
          );
        }
      }

      updateData.deleted_at = new Date().toISOString();
      break;

    case 'activate':
      updateData.status = 'active';
      break;

    case 'deactivate':
      updateData.status = 'inactive';
      break;

    case 'invite':
      updateData.status = 'invited';
      break;

    default:
      throw new APIError('Invalid action', 400);
  }

  // Perform the bulk update
  const { data, error } = await supabase
    .from('team_members')
    .update(updateData)
    .eq('project_id', projectId)
    .in('id', team_member_ids)
    .is('deleted_at', null).select(`
      *,
      author:author_id(id, full_name, email),
      user:user_id(id, email, user_profiles(full_name, nickname, avatar_url))
    `);

  if (error) {
    throw new APIError('Failed to perform bulk operation', 500);
  }

  // Sync snapshot contents and team members to keep data up to date
  await syncSnapshotData(projectId);

  return {
    success: true,
    action,
    affected_count: data?.length || 0,
    team_members: data || [],
  };
});
