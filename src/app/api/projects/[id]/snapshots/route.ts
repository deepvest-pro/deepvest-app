import { NextResponse } from 'next/server';
import { checkUserProjectRole, createNewSnapshot } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { snapshotSchema } from '@/lib/validations/project';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/projects/[id]/snapshots
 * Get all snapshots for a project
 */
export async function GET(request: Request, { params }: RouteContext) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;

  // Check if user has at least viewer permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'viewer');

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'You do not have permission to view this project' },
      { status: 403 },
    );
  }

  // Get all snapshots for this project (raw data first)
  const { data: rawSnapshots, error } = await supabase
    .from('snapshots')
    .select('*')
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch author profiles separately to avoid schema cache issues
  const snapshotsWithAuthors = [];
  for (const snapshot of rawSnapshots || []) {
    let authorProfile = null;
    if (snapshot.author_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, nickname, avatar_url')
        .eq('id', snapshot.author_id)
        .single();

      if (profile) {
        authorProfile = {
          id: profile.id,
          email: undefined,
          user_profiles: profile,
        };
      }
    }

    snapshotsWithAuthors.push({
      ...snapshot,
      author_id: authorProfile || snapshot.author_id,
    });
  }

  return NextResponse.json({ snapshots: snapshotsWithAuthors });
}

/**
 * POST /api/projects/[id]/snapshots
 * Create a new snapshot for a project
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

  // Check if user has at least editor permission for this project
  const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

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
      author_id: user.id,
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
