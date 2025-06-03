import { NextResponse } from 'next/server';
import { checkUserProjectRole, getProjectWithDetails, updateProject } from '@/lib/supabase/helpers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { updateProjectSchema } from '@/lib/validations/project';
import { z } from 'zod';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/projects/[id]
 * Get a specific project with permissions and snapshots
 */
export async function GET(request: Request, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Check if user has at least viewer permission for this project
  const hasAccess = await checkUserProjectRole(session.user.id, id, 'viewer');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to view this project' },
      { status: 403 },
    );
  }

  const { data, error } = await getProjectWithDetails(id);

  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to fetch project' }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

/**
 * PUT /api/projects/[id]
 * Update a specific project
 */
export async function PUT(request: Request, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Check if user has at least editor permission for this project
  const hasAccess = await checkUserProjectRole(session.user.id, id, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to edit this project' },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();

    // Validate the request body
    const validatedData = updateProjectSchema.omit({ id: true }).parse(json);

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
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Check if user is owner of this project
  const isOwner = await checkUserProjectRole(session.user.id, id, 'owner');

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
