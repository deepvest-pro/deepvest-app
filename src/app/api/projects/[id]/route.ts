import { NextResponse } from 'next/server';
import { checkUserProjectRole, getProjectWithDetails, updateProject } from '@/lib/supabase/helpers';
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
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { id } = await params;

  // 1. Check project existence and public status using RPC
  const { data: projectStatusData, error: rpcError } = await supabase.rpc(
    'get_project_status_by_id',
    { p_project_id: id },
  );

  // Correctly access the first element if data is an array
  const projectStatus =
    Array.isArray(projectStatusData) && projectStatusData.length > 0 ? projectStatusData[0] : null;

  if (rpcError || !projectStatus) {
    console.error('RPC error or project not found:', rpcError);
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { is_public: isPublic, is_archived: isArchived } = projectStatus;

  if (isArchived) {
    return NextResponse.json({ error: 'Project has been archived' }, { status: 410 }); // 410 Gone
  }

  // 2. If project is not public and user is a guest (no user), return 403
  if (!isPublic && !user) {
    return NextResponse.json(
      { error: 'This project is private. Please sign in to check your access.' },
      { status: 403 },
    );
  }

  // 3. If user is authenticated, check their specific role
  if (user) {
    const hasViewerAccess = await checkUserProjectRole(user.id, id, 'viewer');
    if (!hasViewerAccess && !isPublic) {
      // Authenticated user, project is private, and user doesn't have even viewer access
      return NextResponse.json(
        { error: 'You do not have permission to view this private project.' },
        { status: 403 },
      );
    }
    // If user has viewer access OR project is public, proceed to fetch details.
  }
  // If it's a guest and project is public, also proceed.

  // 4. Fetch full project details
  const { data, error } = await getProjectWithDetails(id);

  if (error || !data) {
    // This might happen if RLS rules prevent access despite the RPC check passing (e.g. for a specific authenticated user)
    // Or if there's an internal error in getProjectWithDetails
    console.error('Error fetching project details after RPC/auth checks:', error);
    return NextResponse.json(
      { error: error || 'Failed to fetch project details' },
      { status: 500 },
    );
  }

  return NextResponse.json({ project: data });
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

  // Delete project (will cascade delete permissions and snapshots due to DB constraints)
  const { error } = await supabase.from('projects').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
