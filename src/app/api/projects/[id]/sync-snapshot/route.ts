import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { checkUserProjectRole } from '@/lib/supabase/helpers';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has editor permissions or higher for this project
    const hasAccess = await checkUserProjectRole(user.id, projectId, 'editor');

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Editor role or higher required.' },
        { status: 403 },
      );
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Perform snapshot sync
    const syncResult = await syncSnapshotData(projectId);

    if (!syncResult.success) {
      return NextResponse.json(
        { error: syncResult.error || 'Failed to sync snapshot' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Snapshot synced successfully',
      contentCount: syncResult.contentCount,
      teamMemberCount: syncResult.teamMemberCount,
    });
  } catch (error) {
    console.error('Error in sync-snapshot API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
