import { NextResponse } from 'next/server';
import {
  addUserToProject,
  checkUserProjectRole,
  removeUserFromProject,
  updateUserRole,
} from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { permissionSchema } from '@/lib/validations/project';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/projects/[id]/permissions
 * Add a user to the project with a specific role
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

  // Check if user has admin permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'admin');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to manage users for this project' },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();

    // Validate the request body
    const { email, role } = permissionSchema.parse(json);

    // Add the user to the project
    const { success, error } = await addUserToProject(projectId, email, role);

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to add user to project' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]/permissions
 * Update user's role in the project
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

  const { id: projectId } = await params;

  // Check if user has admin permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'admin');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to manage users for this project' },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();

    // For update, we need the user ID instead of email
    const updateSchema = z.object({
      userId: z.string().uuid(),
      role: z.enum(['viewer', 'editor', 'admin', 'owner']),
    });

    // Validate the request body
    const { userId, role } = updateSchema.parse(json);

    // Update the user's role
    const { success, error } = await updateUserRole(projectId, userId, role);

    if (!success) {
      return NextResponse.json({ error: error || 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]/permissions
 * Remove a user from the project
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

  const { id: projectId } = await params;

  // Check if user has admin permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'admin');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to manage users for this project' },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Remove the user from the project
    const { success, error } = await removeUserFromProject(projectId, userId);

    if (!success) {
      return NextResponse.json(
        { error: error || 'Failed to remove user from project' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
