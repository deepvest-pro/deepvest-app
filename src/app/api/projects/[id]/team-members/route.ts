import { NextRequest } from 'next/server';
import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import {
  APIError,
  requireAuth,
  requireProjectPermission,
  getOptionalAuth,
} from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { getPublicProjectTeamMembers, checkUserProjectRole } from '@/lib/supabase/helpers';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

/**
 * GET /api/projects/[id]/team-members
 * Get team members for a specific project
 */
export const GET = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const { id: projectId } = params;
  const url = new URL(request.url);
  const publicOnly = url.searchParams.get('public_only') === 'true';

  // If explicitly requested public only, return public team members without authentication
  if (publicOnly) {
    const { data: teamMembers, error } = await getPublicProjectTeamMembers(projectId);

    if (error) {
      throw new APIError('Failed to fetch team members', 500);
    }

    return { team_members: teamMembers };
  }

  // Check if user is authenticated and has project access
  const user = await getOptionalAuth();
  let hasProjectAccess = false;

  if (user) {
    // Check if user has access to this project
    hasProjectAccess = await checkUserProjectRole(user.id, projectId, 'viewer');
  }

  // If user has project access, return all team members (including private ones)
  if (hasProjectAccess) {
    const supabase = await SupabaseClientFactory.getServerClient();

    // Get all team members for the project (not just public ones)
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (teamError) {
      throw new APIError('Failed to fetch team members', 500);
    }

    // Get author information if we have team members
    let teamMembersWithAuthors = teamMembers || [];
    if (teamMembers && teamMembers.length > 0) {
      const authorIds = [...new Set(teamMembers.map(member => member.author_id))];

      const { data: authors } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', authorIds);

      // Map authors to team members
      teamMembersWithAuthors = teamMembers.map(member => ({
        ...member,
        author: authors?.find(author => author.id === member.author_id) || null,
      }));
    }

    return { team_members: teamMembersWithAuthors };
  }

  // If no project access, check if project is public and return only public team members
  const supabase = await SupabaseClientFactory.getServerClient();
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('is_public, is_archived')
    .eq('id', projectId)
    .single();

  if (projectError || !project?.is_public || project.is_archived) {
    throw new APIError('Project not found or access denied', 404);
  }

  // Return public team members for public project
  const { data: teamMembers, error } = await getPublicProjectTeamMembers(projectId);

  if (error) {
    throw new APIError('Failed to fetch team members', 500);
  }

  return { team_members: teamMembers };
});

/**
 * POST /api/projects/[id]/team-members
 * Create a new team member
 */
export const POST = createAPIHandlerWithParams(async (request: NextRequest, params) => {
  const user = await requireAuth();
  const { id: projectId } = params;

  // Check if user has permission to manage team members (editor, admin, or owner)
  await requireProjectPermission(user.id, projectId, 'editor');

  const body = await request.json();

  // Handle both 'position' (string) and 'positions' (array) fields for backward compatibility
  let positions = body.positions;
  if (!positions && body.position) {
    // Convert single position string to array
    positions = [body.position];
  }

  // Add project_id and author_id to the request data
  const teamMemberData = {
    ...body,
    positions, // Use the processed positions array
    project_id: projectId,
    author_id: user.id,
  };

  // Remove the old 'position' field if it exists
  delete teamMemberData.position;

  // Validate the request body
  const validatedData = ValidationSchemas.team.create.parse(teamMemberData);

  const supabase = await SupabaseClientFactory.getServerClient();

  // Check if email is already used by another team member in this project
  if (validatedData.email) {
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', validatedData.email)
      .is('deleted_at', null)
      .single();

    if (existingMember) {
      throw new APIError('A team member with this email already exists in this project', 409);
    }
  }

  // Create the team member
  const { data, error } = await supabase
    .from('team_members')
    .insert(validatedData)
    .select('*')
    .single();

  if (error) {
    throw new APIError(`Failed to create team member: ${error.message}`, 500);
  }

  // Sync snapshot contents and team members to keep data up to date
  await syncSnapshotData(projectId);

  return { team_member: data };
});
