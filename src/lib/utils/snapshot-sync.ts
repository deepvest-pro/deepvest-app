import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

// Type for snapshot data used in sync
type SnapshotData = {
  name: string;
  description: string;
  status: string;
  slogan: string | null;
  country: string | null;
  city: string | null;
  repository_urls: string[] | null;
  website_urls: string[] | null;
  logo_url: string | null;
  banner_url: string | null;
  video_urls: string[] | null;
};

/**
 * Synchronizes snapshot contents and team_members arrays with current project data
 * Creates a new snapshot if the current one is locked
 * @param projectId - The project ID to sync
 * @returns Promise with sync result
 */
export async function syncSnapshotData(projectId: string) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    // Get project with current snapshot info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('new_snapshot_id, public_snapshot_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Failed to fetch project: ${projectError?.message || 'Project not found'}`);
    }

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

    // Determine which snapshot to update or if we need to create a new one
    let targetSnapshotId: string | null = null;
    let shouldCreateNew = false;

    if (project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id) {
      // We have a draft snapshot, check if it's locked
      const { data: draftSnapshot, error: draftError } = await supabase
        .from('snapshots')
        .select('is_locked')
        .eq('id', project.new_snapshot_id)
        .single();

      if (!draftError && !draftSnapshot.is_locked) {
        targetSnapshotId = project.new_snapshot_id;
      } else {
        shouldCreateNew = true;
      }
    } else if (project.public_snapshot_id) {
      // Check if the public snapshot is locked
      const { data: publicSnapshot, error: publicError } = await supabase
        .from('snapshots')
        .select('is_locked')
        .eq('id', project.public_snapshot_id)
        .single();

      if (!publicError && !publicSnapshot.is_locked) {
        targetSnapshotId = project.public_snapshot_id;
      } else {
        shouldCreateNew = true;
      }
    } else {
      // No snapshot exists at all
      shouldCreateNew = true;
    }

    if (shouldCreateNew) {
      // Create a new snapshot
      // First, get the current highest version number
      const { data: versionData, error: versionError } = await supabase
        .from('snapshots')
        .select('version')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (versionError && versionError.code !== 'PGRST116') {
        // PGRST116 is "Results contain 0 rows" which is fine for first snapshot
        throw new Error(`Failed to get version: ${versionError.message}`);
      }

      const nextVersion = versionData ? versionData.version + 1 : 1;

      // Get project author for the snapshot
      const { data: projectData, error: projectDataError } = await supabase
        .from('project_permissions')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('role', 'owner')
        .single();

      if (projectDataError || !projectData) {
        throw new Error(
          `Failed to get project owner: ${projectDataError?.message || 'Owner not found'}`,
        );
      }

      // Get data from existing snapshot (prefer new_snapshot_id, then public_snapshot_id)
      const sourceSnapshotId = project.new_snapshot_id || project.public_snapshot_id;
      let snapshotData: SnapshotData | null = null;

      if (sourceSnapshotId) {
        const { data: existingSnapshot, error: snapshotError } = await supabase
          .from('snapshots')
          .select(
            'name, description, status, slogan, country, city, repository_urls, website_urls, logo_url, banner_url, video_urls',
          )
          .eq('id', sourceSnapshotId)
          .single();

        if (!snapshotError && existingSnapshot) {
          snapshotData = existingSnapshot as SnapshotData;
        }
      }

      // If no existing snapshot data, use defaults
      if (!snapshotData) {
        snapshotData = {
          name: `Project Snapshot v${nextVersion}`,
          description: 'Project description',
          status: 'idea',
          slogan: null,
          country: null,
          city: null,
          repository_urls: [],
          website_urls: [],
          logo_url: null,
          banner_url: null,
          video_urls: [],
        };
      }

      // Create the new snapshot
      const { data: newSnapshot, error: createError } = await supabase
        .from('snapshots')
        .insert({
          project_id: projectId,
          version: nextVersion,
          name: snapshotData.name || `Project Snapshot v${nextVersion}`,
          slogan: snapshotData.slogan,
          description: snapshotData.description || '',
          status: snapshotData.status || 'idea',
          country: snapshotData.country,
          city: snapshotData.city,
          repository_urls: snapshotData.repository_urls || [],
          website_urls: snapshotData.website_urls || [],
          logo_url: snapshotData.logo_url,
          banner_url: snapshotData.banner_url,
          video_urls: snapshotData.video_urls || [],
          contents: contentsArray,
          team_members: teamMembersArray,
          is_locked: false,
          author_id: projectData.user_id,
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create snapshot: ${createError.message}`);
      }

      // Update the project's new_snapshot_id
      const { error: updateProjectError } = await supabase
        .from('projects')
        .update({ new_snapshot_id: newSnapshot.id })
        .eq('id', projectId);

      if (updateProjectError) {
        throw new Error(`Failed to update project: ${updateProjectError.message}`);
      }

      return {
        success: true,
        contentCount: contentsArray.length,
        teamMemberCount: teamMembersArray.length,
        snapshotId: newSnapshot.id,
        action: 'created_new',
      };
    } else if (targetSnapshotId) {
      // Update the existing unlocked snapshot
      const { error: updateError } = await supabase
        .from('snapshots')
        .update({
          contents: contentsArray,
          team_members: teamMembersArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetSnapshotId);

      if (updateError) {
        throw new Error(`Failed to update snapshot: ${updateError.message}`);
      }

      return {
        success: true,
        contentCount: contentsArray.length,
        teamMemberCount: teamMembersArray.length,
        snapshotId: targetSnapshotId,
        action: 'updated_existing',
      };
    } else {
      throw new Error('Unable to determine target snapshot');
    }
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
