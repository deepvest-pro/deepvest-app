import { NextResponse } from 'next/server';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { bulkTeamMemberSchema } from '@/lib/validations/team';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/projects/[id]/team-members/bulk
 * Perform bulk operations on team members
 */
export async function POST(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;

  // Check if user has permission to manage team members (editor, admin, or owner)
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to manage team members for this project' },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();

    // Validate the request body
    const { team_member_ids, action } = bulkTeamMemberSchema.parse(json);

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
      console.error('Error fetching team members:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    if (!existingMembers || existingMembers.length !== team_member_ids.length) {
      return NextResponse.json({ error: 'Some team members not found' }, { status: 404 });
    }

    // Check permissions for each team member
    const unauthorizedMembers = existingMembers.filter(
      member => member.author_id !== user.id && !isAdminOrOwner,
    );

    if (unauthorizedMembers.length > 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some team members' },
        { status: 403 },
      );
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
          console.error('Error checking locked snapshots:', snapshotError);
          return NextResponse.json(
            { error: 'Failed to check snapshot references' },
            { status: 500 },
          );
        }

        if (lockedSnapshots && lockedSnapshots.length > 0) {
          const referencedMembers = lockedSnapshots.some(snapshot =>
            snapshot.team_members?.some((memberId: string) => team_member_ids.includes(memberId)),
          );

          if (referencedMembers) {
            return NextResponse.json(
              { error: 'Cannot delete team members: some are referenced in locked snapshots' },
              { status: 409 },
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
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
      console.error('Error performing bulk operation:', error);
      return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action,
      affected_count: data?.length || 0,
      team_members: data || [],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 },
      );
    }

    console.error('Error in POST /api/projects/[id]/team-members/bulk:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
