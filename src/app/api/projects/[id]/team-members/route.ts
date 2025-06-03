import { NextResponse } from 'next/server';
import { checkUserProjectRole, getPublicProjectTeamMembers } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { createTeamMemberSchema } from '@/lib/validations/team';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]/team-members
 * Get team members for a specific project
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id: projectId } = await params;
    const url = new URL(request.url);
    const publicOnly = url.searchParams.get('public_only') === 'true';

    if (publicOnly) {
      // Use helper function for public team members
      const { data: teamMembers, error } = await getPublicProjectTeamMembers(projectId);

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
      }

      return NextResponse.json({ team_members: teamMembers });
    }

    // For non-public requests, check authentication and permissions
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view this project
    const { data: permission, error: permissionError } = await supabase
      .from('project_permissions')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (permissionError || !permission) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    // Get all team members for the project (not just public ones)
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
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

    return NextResponse.json({ team_members: teamMembersWithAuthors });
  } catch (error) {
    console.error('Error fetching project team members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/team-members
 * Create a new team member
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

  console.log('POST team member - User ID:', user.id);
  console.log('POST team member - Project ID:', projectId);

  // Check if user has permission to manage team members (editor, admin, or owner)
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

  console.log('POST team member - Has editor+ access:', hasAccess);

  if (!hasAccess) {
    return NextResponse.json(
      {
        error:
          'You do not have permission to manage team members for this project. Editor role or higher required.',
      },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();

    // Handle both 'position' (string) and 'positions' (array) fields
    let positions = json.positions;
    if (!positions && json.position) {
      // Convert single position string to array
      positions = [json.position];
    }

    // Add project_id and author_id to the request data
    const teamMemberData = {
      ...json,
      positions, // Use the processed positions array
      project_id: projectId,
      author_id: user.id,
    };

    // Remove the old 'position' field if it exists
    delete teamMemberData.position;

    console.log('Team member data to validate:', teamMemberData);

    // Validate the request body
    const validatedData = createTeamMemberSchema.parse(teamMemberData);

    console.log('Validated team member data:', validatedData);

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
        return NextResponse.json(
          { error: 'A team member with this email already exists in this project' },
          { status: 409 },
        );
      }
    }

    console.log('Inserting team member into database...');

    // Create the team member
    const { data, error } = await supabase
      .from('team_members')
      .insert(validatedData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating team member:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        {
          error: 'Failed to create team member',
          details: error.message,
          code: error.code,
        },
        { status: 500 },
      );
    }

    console.log('Team member created successfully:', data);

    return NextResponse.json({ team_member: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 },
      );
    }

    console.error('Error in POST /api/projects/[id]/team-members:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
