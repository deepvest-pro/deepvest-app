import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = await createSupabaseServerClient();

    // Get project with snapshots info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        `
        id, 
        slug, 
        public_snapshot_id, 
        new_snapshot_id,
        is_public, 
        is_archived,
        created_at,
        updated_at
      `,
      )
      .eq('id', projectId)
      .single();

    if (projectError) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        details: projectError,
      });
    }

    // Get all snapshots for this project
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('snapshots')
      .select('id, project_id, version, name, status, created_at, is_locked')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Try to get the specific public snapshot if it exists
    let publicSnapshot = null;
    let publicSnapshotError = null;

    if (project.public_snapshot_id) {
      const { data: pubSnap, error: pubSnapError } = await supabase
        .from('snapshots')
        .select('*')
        .eq('id', project.public_snapshot_id)
        .single();

      publicSnapshot = pubSnap;
      publicSnapshotError = pubSnapError;
    }

    return NextResponse.json({
      success: true,
      data: {
        project,
        snapshots: snapshots || [],
        publicSnapshot,
        publicSnapshotError,
        snapshotsError,
        debug: {
          hasPublicSnapshotId: !!project.public_snapshot_id,
          snapshotsCount: snapshots?.length || 0,
          publicSnapshotExists: !!publicSnapshot,
        },
      },
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
