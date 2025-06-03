import { NextResponse } from 'next/server';
import {
  checkUserProjectRole,
  getProjectWithDetails,
  updateProject,
  deleteProjectFiles,
  getPublicProjectDocuments,
  getPublicProjectTeamMembers,
} from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { updateProjectSchema } from '@/lib/validations/project';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]
 * Get a specific project with permissions and snapshots
 */
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { id: projectId } = await params;

    // Get project details
    const { data: project, error: projectError } = await getProjectWithDetails(projectId);

    if (projectError || !project) {
      return NextResponse.json({ error: projectError || 'Project not found' }, { status: 404 });
    }

    // Get public documents using helper function
    const { data: documents } = await getPublicProjectDocuments(projectId);

    // Get public team members using helper function
    const { data: team } = await getPublicProjectTeamMembers(projectId);

    // Return structured response
    return NextResponse.json({
      project,
      documents,
      team,
    });
  } catch (error) {
    console.error('Error fetching project with details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]
 * Update a specific project
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check if user has at least editor permission for this project
  const hasAccess = await checkUserProjectRole(user.id, id, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to edit this project' },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();
    console.log('PUT /api/projects/[id] - Request data:', json);

    // Validate the request body
    const validatedData = updateProjectSchema.omit({ id: true }).parse(json);
    console.log('PUT /api/projects/[id] - Validated data:', validatedData);

    // Update the project
    const { data, error } = await updateProject(id, validatedData);

    if (error || !data) {
      return NextResponse.json({ error: error || 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project (only available to project owner)
 */
export async function DELETE(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check if user is owner of this project
  const isOwner = await checkUserProjectRole(user.id, id, 'owner');

  if (!isOwner) {
    return NextResponse.json(
      { error: 'Only the project owner can delete this project' },
      { status: 403 },
    );
  }

  // Delete project files from storage first
  const { success: filesDeleted, error: filesError } = await deleteProjectFiles(id);

  if (!filesDeleted) {
    console.error('Failed to delete project files:', filesError);
    // Continue with project deletion even if file deletion fails
    // This prevents orphaned database records
  }

  // Delete project (will cascade delete permissions and snapshots due to DB constraints)
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
