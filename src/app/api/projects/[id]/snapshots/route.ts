import { NextResponse } from 'next/server';
import { checkUserProjectRole, createNewSnapshot } from '@/lib/supabase/helpers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { snapshotSchema } from '@/lib/validations/project';
import { z } from 'zod';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/projects/[id]/snapshots
 * Get all snapshots for a project
 */
export async function GET(request: Request, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = params;

  // Check if user has at least viewer permission for this project
  const hasAccess = await checkUserProjectRole(session.user.id, projectId, 'viewer');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to view this project' },
      { status: 403 },
    );
  }

  // Get all snapshots for this project
  const { data, error } = await supabase
    .from('snapshots')
    .select('*, author_id(id, full_name, nickname, avatar_url)')
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ snapshots: data });
}

/**
 * POST /api/projects/[id]/snapshots
 * Create a new snapshot for a project
 */
export async function POST(request: Request, { params }: RouteContext) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = params;

  // Check if user has at least editor permission for this project
  const hasAccess = await checkUserProjectRole(session.user.id, projectId, 'editor');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to edit this project' },
      { status: 403 },
    );
  }

  try {
    const json = await request.json();

    // Validate the request body
    const formData = snapshotSchema.parse(json);

    // Get project name for snapshot creation
    const { data: projectData } = await supabase
      .from('projects')
      .select('new_snapshot_id')
      .eq('id', projectId)
      .single();

    // Check if there's an existing new snapshot to get its data
    let currentSnapshot = null;

    if (projectData?.new_snapshot_id) {
      const { data: existingSnapshot } = await supabase
        .from('snapshots')
        .select('name, status, country, city')
        .eq('id', projectData.new_snapshot_id)
        .single();

      if (existingSnapshot) {
        currentSnapshot = existingSnapshot;
      }
    }

    // Create the new snapshot
    const { data, error } = await createNewSnapshot(projectId, {
      name: formData.title, // Map title from form to name in database
      project_id: projectId,
      author_id: session.user.id,
      description: formData.description || '',
      status: currentSnapshot?.status || 'idea',
      country: currentSnapshot?.country || null,
      city: currentSnapshot?.city || null,
      is_locked: false,
      version: 0, // This will be calculated in the helper function
      // Add any other required fields
      slogan: null,
      repository_urls: null,
      website_urls: null,
      logo_url: null,
      banner_url: null,
      video_urls: null,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ snapshot: data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
