import { createSupabaseServerClient } from '@/lib/supabase/client';

/**
 * Synchronizes snapshot contents and team_members arrays with current project data
 * @param projectId - The project ID to sync
 * @returns Promise with sync result
 */
export async function syncSnapshotData(projectId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get all public, non-deleted content for this project
    const { data: contentIds, error: contentError } = await supabase
      .from('project_content')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_public', true)
      .is('deleted_at', null);

    if (contentError) {
      throw new Error(`Failed to fetch project content: ${contentError.message}`);
    }

    // Get all active (non-deleted) team members for this project
    const { data: teamMemberIds, error: teamError } = await supabase
      .from('team_members')
      .select('id')
      .eq('project_id', projectId)
      .is('deleted_at', null);

    if (teamError) {
      throw new Error(`Failed to fetch team members: ${teamError.message}`);
    }

    // Convert to UUID arrays (handle empty results)
    const contentsArray = contentIds?.map(item => item.id) || [];
    const teamMembersArray = teamMemberIds?.map(item => item.id) || [];

    // Update the snapshot for this project
    const { error: updateError } = await supabase
      .from('snapshots')
      .update({
        contents: contentsArray,
        team_members: teamMembersArray,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);

    if (updateError) {
      throw new Error(`Failed to update snapshot: ${updateError.message}`);
    }

    return {
      success: true,
      contentCount: contentsArray.length,
      teamMemberCount: teamMembersArray.length,
    };
  } catch (error) {
    console.error('Error syncing snapshot data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Client-side function to call snapshot sync API
 * @param projectId - The project ID to sync
 * @returns Promise with API response
 */
export async function syncSnapshotViaAPI(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}/sync-snapshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync snapshot');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling snapshot sync API:', error);
    throw error;
  }
}
