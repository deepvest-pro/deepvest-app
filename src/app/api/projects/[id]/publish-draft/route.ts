import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    const { id: projectId } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project with current snapshot info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, public_snapshot_id, new_snapshot_id, user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has permission to publish (owner only)
    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if there's a draft to publish
    if (!project.new_snapshot_id || project.new_snapshot_id === project.public_snapshot_id) {
      return NextResponse.json({ error: 'No draft to publish' }, { status: 400 });
    }

    // Start transaction: update project and lock the snapshot
    const { error: updateError } = await supabase.rpc('publish_project_draft', {
      project_id: projectId,
      new_public_snapshot_id: project.new_snapshot_id,
    });

    if (updateError) {
      console.error('Error publishing draft:', updateError);
      return NextResponse.json({ error: 'Failed to publish draft' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft published successfully',
    });
  } catch (error) {
    console.error('Error in publish-draft endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
