import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import {
  requireAuth,
  requireProjectPermission,
  getOptionalAuth,
  APIError,
} from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { teamMembersRepository } from '@/lib/supabase/repositories/team-members';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

/**
 * GET /api/projects/[id]/team-members/[memberId]
 * Get a specific team member
 */
export const GET = createAPIHandlerWithParams(async (request, params) => {
  const { id: projectId, memberId } = params;

  // Get the team member first
  const { data: teamMember, error: memberError } = await teamMembersRepository.findById(memberId);

  if (memberError || !teamMember) {
    throw new APIError('Team member not found', 404);
  }

  // Verify team member belongs to the project
  if (teamMember.project_id !== projectId) {
    throw new APIError('Team member not found', 404);
  }

  if (teamMember.deleted_at) {
    throw new APIError('Team member not found', 404);
  }

  // Check access permissions based on project visibility
  const user = await getOptionalAuth();

  if (user) {
    // Authenticated user - check if they have project access
    try {
      await requireProjectPermission(user.id, projectId, 'viewer');
      // User has access, return the team member
      return { team_member: teamMember };
    } catch {
      // User doesn't have access, fall through to public check
    }
  }

  // Check if project is public for guest access or users without permission
  const supabase = await SupabaseClientFactory.getServerClient();
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('is_public, is_archived')
    .eq('id', projectId)
    .single();

  if (projectError || !project?.is_public || project.is_archived) {
    throw new APIError('Team member not found', 404);
  }

  return { team_member: teamMember };
});

/**
 * PUT /api/projects/[id]/team-members/[memberId]
 * Update a specific team member
 */
export const PUT = createAPIHandlerWithParams(async (request, params) => {
  const user = await requireAuth();
  const { id: projectId, memberId } = params;

  // Check project permissions
  const permission = await requireProjectPermission(user.id, projectId, 'editor');

  // Get the team member to check ownership and existence
  const { data: existingMember, error: memberError } =
    await teamMembersRepository.findById(memberId);

  if (memberError || !existingMember) {
    throw new APIError('Team member not found', 404);
  }

  // Verify team member belongs to the project
  if (existingMember.project_id !== projectId) {
    throw new APIError('Team member not found', 404);
  }

  // Check if team member is deleted
  if (existingMember.deleted_at) {
    throw new APIError('Team member not found', 404);
  }

  // Check if user can edit this team member (author or admin/owner)
  const canEdit =
    existingMember.author_id === user.id || ['admin', 'owner'].includes(permission.role);

  if (!canEdit) {
    throw new APIError('Insufficient permissions to edit this team member', 403);
  }

  // Validate request body
  const body = await request.json();
  const validatedData = ValidationSchemas.team.update.parse(body);

  // Check if email is already used by another team member in this project (if email is being updated)
  if (validatedData.email && validatedData.email !== existingMember.email) {
    const { data: isEmailAvailable, error: emailError } =
      await teamMembersRepository.isEmailAvailableInProject(
        projectId,
        validatedData.email,
        memberId,
      );

    if (emailError) {
      throw new APIError('Failed to check email availability', 500);
    }

    if (!isEmailAvailable) {
      throw new APIError('A team member with this email already exists in this project', 409);
    }
  }

  // Update the team member
  const { data: updatedMember, error: updateError } = await teamMembersRepository.update(
    memberId,
    validatedData,
  );

  if (updateError || !updatedMember) {
    throw new APIError(updateError || 'Failed to update team member', 500);
  }

  // Sync snapshot contents and team members to keep data up to date
  await syncSnapshotData(projectId);

  return { team_member: updatedMember };
});

/**
 * DELETE /api/projects/[id]/team-members/[memberId]
 * Soft delete a team member
 */
export const DELETE = createAPIHandlerWithParams(async (request, params) => {
  const user = await requireAuth();
  const { id: projectId, memberId } = params;

  // Check project permissions
  const permission = await requireProjectPermission(user.id, projectId, 'editor');

  // Get the team member to check ownership and existence
  const { data: existingMember, error: memberError } =
    await teamMembersRepository.findById(memberId);

  if (memberError || !existingMember) {
    throw new APIError('Team member not found', 404);
  }

  // Verify team member belongs to the project
  if (existingMember.project_id !== projectId) {
    throw new APIError('Team member not found', 404);
  }

  // Check if team member is already deleted
  if (existingMember.deleted_at) {
    throw new APIError('Team member not found', 404);
  }

  // Check if user can delete this team member (author or admin/owner)
  const canDelete =
    existingMember.author_id === user.id || ['admin', 'owner'].includes(permission.role);

  if (!canDelete) {
    throw new APIError('Insufficient permissions to delete this team member', 403);
  }

  // Soft delete the team member using the dedicated method
  const { data: deleteSuccess, error: deleteError } =
    await teamMembersRepository.softDelete(memberId);

  if (deleteError) {
    console.error(`Failed to soft delete team member ${memberId}:`, deleteError);
    throw new APIError(`Failed to delete team member: ${deleteError}`, 500);
  }

  if (!deleteSuccess) {
    console.error(`Soft delete returned false for team member ${memberId}`);
    throw new APIError('Failed to delete team member: operation was not successful', 500);
  }

  // Sync snapshot contents and team members to keep data up to date
  try {
    await syncSnapshotData(projectId);
  } catch (syncError) {
    console.warn(`Failed to sync snapshot data for project ${projectId}:`, syncError);
    // Don't fail the delete operation if snapshot sync fails
  }

  return { success: true };
});
