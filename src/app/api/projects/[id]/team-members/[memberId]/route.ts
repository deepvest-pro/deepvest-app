import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { updateTeamMemberSchema } from '@/lib/validations/team';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

interface RouteContext {
  params: Promise<{
    id: string;
    memberId: string;
  }>;
}

/**
 * GET /api/projects/[id]/team-members/[memberId]
 * Get a specific team member
 */
export async function GET(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }

  const { id: projectId, memberId } = await params;

  // Check if user has access to view team members
  let hasAccess = false;

  if (user) {
    // Authenticated user - check project permissions
    hasAccess = await checkUserProjectRole(user.id, projectId, 'viewer');
  }

  if (!hasAccess) {
    // Check if project is public for guest access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('is_public, is_archived')
      .eq('id', projectId)
      .single();

    if (projectError || !project?.is_public || project.is_archived) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }
  }

  try {
    // Get the specific team member
    const { data, error } = await supabase
      .from('team_members')
      .select(
        `
        *,
        author:author_id(id, full_name, email),
        user:user_id(id, email, user_profiles(full_name, nickname, avatar_url))
      `,
      )
      .eq('id', memberId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
      }
      console.error('Error fetching team member:', error);
      return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 });
    }

    return NextResponse.json({ team_member: data });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/team-members/[memberId]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]/team-members/[memberId]
 * Update a specific team member
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

  const { id: projectId, memberId } = await params;

  // Check if user has permission to manage team members
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to manage team members for this project' },
      { status: 403 },
    );
  }

  try {
    // Get the existing team member to check ownership
    const { data: existingMember, error: fetchError } = await supabase
      .from('team_members')
      .select('author_id')
      .eq('id', memberId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch team member' }, { status: 500 });
    }

    // Check if user can edit this team member (author or admin/owner)
    const userRole = await supabase
      .from('project_permissions')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    const canEdit =
      existingMember.author_id === user.id ||
      (userRole.data && ['admin', 'owner'].includes(userRole.data.role));

    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const json = await request.json();

    // Add the member ID to the request data
    const updateData = {
      ...json,
      id: memberId,
    };

    // Validate the request body
    const validatedData = updateTeamMemberSchema.parse(updateData);

    // Check if email is already used by another team member in this project (if email is being updated)
    if (validatedData.email) {
      const { data: existingEmailMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('email', validatedData.email)
        .neq('id', memberId)
        .is('deleted_at', null)
        .single();

      if (existingEmailMember) {
        return NextResponse.json(
          { error: 'A team member with this email already exists in this project' },
          { status: 409 },
        );
      }
    }

    // Remove the id from the update data as it shouldn't be updated
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...updateFields } = validatedData;

    // Update the team member
    const { data, error } = await supabase
      .from('team_members')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .select(
        `
        *,
        author:author_id(id, full_name, email),
        user:user_id(id, email, user_profiles(full_name, nickname, avatar_url))
      `,
      )
      .single();

    if (error) {
      console.error('Error updating team member:', error);
      return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }

    // Sync snapshot contents and team members to keep data up to date
    await syncSnapshotData(projectId);

    return NextResponse.json({ team_member: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 },
      );
    }

    console.error('Error in PUT /api/projects/[id]/team-members/[memberId]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]/team-members/[memberId]
 * Soft delete a team member
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, memberId } = await params;

  // Check if user has permission to manage team members
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to manage team members for this project' },
      { status: 403 },
    );
  }

  try {
    // Soft delete the team member using database function to bypass RLS
    const { data: deleteSuccess, error } = await supabase.rpc('soft_delete_team_member', {
      p_member_id: memberId,
      p_project_id: projectId,
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error calling soft_delete_team_member function:', error);
      return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
    }

    if (!deleteSuccess) {
      console.log('Soft delete returned false - team member not found or insufficient permissions');
      return NextResponse.json(
        {
          error: 'Team member not found or you do not have permission to delete it',
        },
        { status: 404 },
      );
    }

    console.log('Team member soft deleted successfully');

    // Sync snapshot contents and team members to keep data up to date
    await syncSnapshotData(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/team-members/[memberId]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
