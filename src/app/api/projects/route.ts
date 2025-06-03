import { NextResponse } from 'next/server';
import { createNewProject, getUserProjects, isSlugAvailable } from '@/lib/supabase/helpers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createProjectSchema } from '@/lib/validations/project';
import { z } from 'zod';

/**
 * GET /api/projects
 * Get all projects for the current user
 */
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await getUserProjects(session.user.id);

  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to fetch projects' }, { status: 500 });
  }

  return NextResponse.json({ projects: data });
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();

    // Validate the request body
    const { name, slug, description, status } = createProjectSchema.parse(json);

    // Check if slug is available
    const { available, error: slugError } = await isSlugAvailable(slug);

    if (slugError) {
      return NextResponse.json({ error: slugError }, { status: 500 });
    }

    if (!available) {
      return NextResponse.json(
        { error: 'Project URL is already taken. Please choose a different one.' },
        { status: 409 },
      );
    }

    // Create the project
    const { data, error } = await createNewProject(name, slug, description, status);

    if (error || !data) {
      return NextResponse.json({ error: error || 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
