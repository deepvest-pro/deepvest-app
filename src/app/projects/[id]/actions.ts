'use server';

import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/supabase';
import { checkUserProjectRole, deleteProjectFiles } from '@/lib/supabase/helpers';
import { createSupabaseServerClient } from '@/lib/supabase/client'; // New client

interface ToggleProjectPublicationArgs {
  projectId: string;
  isCurrentlyPublic: boolean;
}

export async function toggleProjectPublication({
  projectId,
  isCurrentlyPublic,
}: ToggleProjectPublicationArgs): Promise<{
  success: boolean;
  error?: string;
  isPublic?: boolean;
}> {
  console.error(
    `[Action] toggleProjectPublication called for project ${projectId}. Currently public: ${isCurrentlyPublic}`,
  );

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Action] User not authenticated:', authError);
      return { success: false, error: 'User not authenticated' };
    }

    console.error(`[Action] User authenticated: ${user.id}`);

    // Check permissions directly in the database first
    const { data: permissionCheck, error: permissionError } = await supabase
      .from('project_permissions')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    console.log(`[Action] Direct permission check result:`, { permissionCheck, permissionError });

    const isOwner = await checkUserProjectRole(user.id, projectId, 'owner');
    if (!isOwner) {
      console.warn(`[Action] User ${user.id} is not owner of project ${projectId}.`);
      return { success: false, error: 'Only the project owner can perform this action' };
    }

    console.log(`[Action] User ${user.id} is confirmed owner of project ${projectId}`);

    const newPublicStatus = !isCurrentlyPublic;
    console.log(`[Action] New public status will be: ${newPublicStatus}`);

    const updateData: Partial<Database['public']['Tables']['projects']['Row']> = {
      is_public: newPublicStatus,
    };

    if (newPublicStatus) {
      console.log(
        '[Action] Attempting to publish. Checking public_snapshot_id and new_snapshot_id...',
      );
      const { data: currentProject, error: fetchError } = await supabase
        .from('projects')
        .select('public_snapshot_id, new_snapshot_id')
        .eq('id', projectId)
        .single();

      if (fetchError) {
        console.error(`[Action] Error fetching project ${projectId} details:`, fetchError);
        return { success: false, error: 'Failed to fetch project details for publishing.' };
      }

      console.log('[Action] Fetched project state:', currentProject);

      if (
        currentProject &&
        currentProject.public_snapshot_id === null &&
        currentProject.new_snapshot_id
      ) {
        console.log(
          `[Action] Conditions met: public_snapshot_id is null, new_snapshot_id (${currentProject.new_snapshot_id}) is not. Updating public_snapshot_id.`,
        );
        updateData.public_snapshot_id = currentProject.new_snapshot_id;
      } else {
        console.log('[Action] Conditions not met for updating public_snapshot_id:');
        if (!currentProject) console.log(' - currentProject is null/undefined');
        if (currentProject?.public_snapshot_id !== null)
          console.log(` - public_snapshot_id is NOT null (${currentProject?.public_snapshot_id})`);
        if (!currentProject?.new_snapshot_id)
          console.log(` - new_snapshot_id is null/undefined (${currentProject?.new_snapshot_id})`);
      }
    } else {
      console.log('[Action] Unpublishing. public_snapshot_id will not be changed.');
    }

    console.log('[Action] Final updateData to be sent to Supabase:', updateData);

    // First, let's check current project state before update
    const { data: beforeUpdate, error: beforeError } = await supabase
      .from('projects')
      .select('is_public, public_snapshot_id, new_snapshot_id')
      .eq('id', projectId)
      .single();

    console.log('[Action] Project state before update:', { beforeUpdate, beforeError });

    // Perform the update
    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      console.error(`[Action] Supabase update error for project ${projectId}:`, updateError);
      return { success: false, error: updateError.message };
    }

    console.log(
      `[Action] Project ${projectId} successfully updated to is_public: ${newPublicStatus}`,
    );

    // Verify the update was successful by fetching the project again
    const { data: verificationProject, error: verificationError } = await supabase
      .from('projects')
      .select('is_public')
      .eq('id', projectId)
      .single();

    if (verificationError) {
      console.warn(`[Action] Could not verify update for project ${projectId}:`, verificationError);
      // Don't fail the action if verification fails, as the update might have succeeded
    } else if (verificationProject && verificationProject.is_public !== newPublicStatus) {
      console.error(
        `[Action] Update verification failed. Expected: ${newPublicStatus}, Got: ${verificationProject.is_public}`,
      );
      return { success: false, error: 'Update verification failed' };
    } else {
      console.log(
        `[Action] Update verified successfully. Project is_public: ${verificationProject?.is_public}`,
      );
    }

    console.log(`[Action] Update verified successfully. Revalidating paths...`);

    // Revalidate paths
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/projects');
    revalidatePath('/profile');

    console.log(`[Action] Paths revalidated. Returning success with isPublic: ${newPublicStatus}`);

    return { success: true, isPublic: newPublicStatus };
  } catch (error) {
    console.error('[Action] Unexpected error in toggleProjectPublication:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

interface PublishDraftArgs {
  projectId: string;
}

export async function publishDraft({ projectId }: PublishDraftArgs): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log(`[Action] publishDraft called for project ${projectId}`);

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Action] User not authenticated:', authError);
      return { success: false, error: 'User not authenticated' };
    }

    console.log(`[Action] User authenticated: ${user.id}`);

    // Check if user is owner
    const isOwner = await checkUserProjectRole(user.id, projectId, 'owner');
    if (!isOwner) {
      console.warn(`[Action] User ${user.id} is not owner of project ${projectId}.`);
      return { success: false, error: 'Only the project owner can publish drafts' };
    }

    console.log(`[Action] User ${user.id} is confirmed owner of project ${projectId}`);

    // Get project details to check if there's a draft to publish
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('public_snapshot_id, new_snapshot_id')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      console.error(`[Action] Error fetching project ${projectId}:`, fetchError);
      return { success: false, error: 'Project not found' };
    }

    console.log('[Action] Project state:', project);

    // Check if there's a draft to publish
    if (!project.new_snapshot_id || project.new_snapshot_id === project.public_snapshot_id) {
      console.log('[Action] No draft to publish');
      return { success: false, error: 'No draft to publish' };
    }

    console.log(`[Action] Publishing draft snapshot ${project.new_snapshot_id}`);

    // Call the database function to publish the draft
    const { error: publishError } = await supabase.rpc('publish_project_draft', {
      project_id: projectId,
      new_public_snapshot_id: project.new_snapshot_id,
    });

    if (publishError) {
      console.error(`[Action] Error publishing draft:`, publishError);
      return { success: false, error: 'Failed to publish draft' };
    }

    console.log(`[Action] Draft published successfully`);

    // Revalidate paths
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/projects');
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('[Action] Unexpected error in publishDraft:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

interface DeleteProjectArgs {
  projectId: string;
}

export async function deleteProject({ projectId }: DeleteProjectArgs): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log(`[Action] deleteProject called for project ${projectId}`);

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Action] User not authenticated:', authError);
      return { success: false, error: 'User not authenticated' };
    }

    console.log(`[Action] User authenticated: ${user.id}`);

    // Check if user is owner
    const isOwner = await checkUserProjectRole(user.id, projectId, 'owner');
    if (!isOwner) {
      console.warn(`[Action] User ${user.id} is not owner of project ${projectId}.`);
      return { success: false, error: 'Only the project owner can delete this project' };
    }

    console.log(`[Action] User ${user.id} is confirmed owner of project ${projectId}`);

    // Delete project files from storage first
    console.log(`[Action] Deleting project files for project ${projectId}`);
    const { success: filesDeleted, error: filesError } = await deleteProjectFiles(projectId);

    if (!filesDeleted) {
      console.error('[Action] Failed to delete project files:', filesError);
      // Continue with project deletion even if file deletion fails
      // This prevents orphaned database records
    } else {
      console.log(`[Action] Project files deleted successfully for project ${projectId}`);
    }

    // Delete project directly using Supabase (will cascade delete permissions and snapshots due to DB constraints)
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId);

    if (deleteError) {
      console.error(`[Action] Supabase delete error:`, deleteError);
      return { success: false, error: deleteError.message };
    }

    console.log(`[Action] Project ${projectId} deleted successfully`);

    // Revalidate paths (but not the current project page since it no longer exists)
    revalidatePath('/projects');
    revalidatePath('/profile');
    // Note: We don't revalidate `/projects/${projectId}` because the project no longer exists

    return { success: true };
  } catch (error) {
    console.error('[Action] Unexpected error in deleteProject:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
