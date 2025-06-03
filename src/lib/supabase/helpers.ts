import type { Project, ProjectRole, Snapshot } from '@/types/supabase';
import { createServerSupabaseClient } from './client';

/**
 * Fetches a project by ID with permissions and snapshots
 */
export async function getProjectWithDetails(projectId: string) {
  const supabase = await createServerSupabaseClient();

  // Fetch the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: projectError?.message || 'Project not found', data: null };
  }

  // Fetch permissions
  const { data: permissions, error: permissionsError } = await supabase
    .from('project_permissions')
    .select('*, user_id(id, full_name, nickname, avatar_url)')
    .eq('project_id', projectId);

  if (permissionsError) {
    return { error: permissionsError.message, data: null };
  }

  // Fetch public snapshot if exists
  let publicSnapshot: Snapshot | null = null;
  if (project.public_snapshot_id) {
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select('*, author_id(id, full_name, nickname, avatar_url)')
      .eq('id', project.public_snapshot_id)
      .single();

    if (snapshotError) {
      return { error: snapshotError.message, data: null };
    }
    publicSnapshot = snapshot;
  }

  // Fetch new snapshot if exists
  let newSnapshot: Snapshot | null = null;
  if (project.new_snapshot_id) {
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select('*, author_id(id, full_name, nickname, avatar_url)')
      .eq('id', project.new_snapshot_id)
      .single();

    if (snapshotError) {
      return { error: snapshotError.message, data: null };
    }
    newSnapshot = snapshot;
  }

  return {
    data: {
      ...project,
      permissions,
      public_snapshot: publicSnapshot,
      new_snapshot: newSnapshot,
    },
    error: null,
  };
}

/**
 * Fetches a user's projects with their roles
 */
export async function getUserProjects(userId: string | undefined) {
  if (!userId) {
    return { data: null, error: 'User ID is required' };
  }

  const supabase = await createServerSupabaseClient();

  const { data: permissions, error: permissionsError } = await supabase
    .from('project_permissions')
    .select('*, project:project_id(*)')
    .eq('user_id', userId);

  if (permissionsError) {
    return { error: permissionsError.message, data: null };
  }

  // Transform the data to match our expected format
  interface PermissionWithProject {
    project: Project;
    role: ProjectRole;
  }

  const projects = permissions.map((permission: PermissionWithProject) => ({
    ...permission.project,
    role: permission.role,
  }));

  return { data: projects, error: null };
}

/**
 * Checks if a user has a specific role (or higher) in a project
 */
export async function checkUserProjectRole(
  userId: string | undefined,
  projectId: string,
  requiredRole: ProjectRole,
) {
  if (!userId) return false;

  const supabase = await createServerSupabaseClient();

  // Determine the hierarchy of roles
  const roleHierarchy: Record<ProjectRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
    owner: 4,
  };

  const requiredRoleLevel = roleHierarchy[requiredRole];

  // Fetch the user's role for this project
  const { data: permission, error } = await supabase
    .from('project_permissions')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single();

  if (error || !permission) return false;

  // Check if the user's role is high enough
  const userRoleLevel = roleHierarchy[permission.role as ProjectRole];
  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Creates a new project with an initial snapshot
 */
export async function createNewProject(
  name: string,
  slug: string,
  description: string,
  status: string,
) {
  const supabase = await createServerSupabaseClient();

  // Use the database function to create a project with proper permissions
  const { data, error } = await supabase.rpc('create_project', {
    p_name: name,
    p_slug: slug,
    p_description: description,
    p_status: status,
  });

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Checks if a slug is available for use
 */
export async function isSlugAvailable(slug: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('projects')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    return { error: error.message, available: false };
  }

  return { error: null, available: !data };
}

/**
 * Updates a project's metadata (not the snapshot content)
 */
export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>,
) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    return { error: error.message, data: null };
  }

  return { data, error: null };
}

/**
 * Creates a new snapshot for a project
 */
export async function createNewSnapshot(
  projectId: string,
  snapshotData: Omit<Snapshot, 'id' | 'created_at' | 'updated_at'>,
) {
  const supabase = await createServerSupabaseClient();

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
    return { error: versionError.message, data: null };
  }

  const nextVersion = versionData ? versionData.version + 1 : 1;

  // Create the new snapshot
  const { data: snapshot, error: snapshotError } = await supabase
    .from('snapshots')
    .insert({
      ...snapshotData,
      project_id: projectId,
      version: nextVersion,
    })
    .select()
    .single();

  if (snapshotError) {
    return { error: snapshotError.message, data: null };
  }

  // Update the project's new_snapshot_id
  const { error: projectError } = await supabase
    .from('projects')
    .update({ new_snapshot_id: snapshot.id })
    .eq('id', projectId);

  if (projectError) {
    return { error: projectError.message, data: null };
  }

  return { data: snapshot, error: null };
}

/**
 * Publishes a snapshot (sets it as the public snapshot)
 */
export async function publishSnapshot(projectId: string, snapshotId: string) {
  const supabase = await createServerSupabaseClient();

  // First lock the snapshot
  const { error: lockError } = await supabase
    .from('snapshots')
    .update({ is_locked: true })
    .eq('id', snapshotId);

  if (lockError) {
    return { error: lockError.message, success: false };
  }

  // Update the project to set this as the public snapshot
  const { data, error } = await supabase
    .from('projects')
    .update({
      public_snapshot_id: snapshotId,
      is_public: true,
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    return { error: error.message, success: false };
  }

  return { data, success: true, error: null };
}

/**
 * Adds a user to a project with a specific role
 */
export async function addUserToProject(projectId: string, userEmail: string, role: ProjectRole) {
  const supabase = await createServerSupabaseClient();

  // First, find the user by email
  const { data: userData, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', (await supabase.from('auth').select('id').eq('email', userEmail).single()).data?.id)
    .single();

  if (userError || !userData) {
    return { error: userError?.message || 'User not found', success: false };
  }

  // Check if the user already has a role in this project
  const { data: existingRole, error: roleError } = await supabase
    .from('project_permissions')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userData.id)
    .maybeSingle();

  if (roleError && roleError.code !== 'PGRST116') {
    return { error: roleError.message, success: false };
  }

  if (existingRole) {
    // Update the role if it already exists
    const { error: updateError } = await supabase
      .from('project_permissions')
      .update({ role })
      .eq('id', existingRole.id);

    if (updateError) {
      return { error: updateError.message, success: false };
    }
  } else {
    // Add a new role
    const { error: insertError } = await supabase.from('project_permissions').insert({
      project_id: projectId,
      user_id: userData.id,
      role,
    });

    if (insertError) {
      return { error: insertError.message, success: false };
    }
  }

  return { success: true, error: null };
}

/**
 * Removes a user from a project
 */
export async function removeUserFromProject(projectId: string, userId: string) {
  const supabase = await createServerSupabaseClient();

  // Check if the user is the owner
  const { data: isOwner, error: ownerCheckError } = await supabase
    .from('project_permissions')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('role', 'owner')
    .maybeSingle();

  if (ownerCheckError) {
    return { error: ownerCheckError.message, success: false };
  }

  if (isOwner) {
    return { error: 'Cannot remove the project owner', success: false };
  }

  // Remove the user from the project
  const { error } = await supabase
    .from('project_permissions')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true, error: null };
}

/**
 * Updates a user's role in a project
 */
export async function updateUserRole(projectId: string, userId: string, newRole: ProjectRole) {
  const supabase = await createServerSupabaseClient();

  // Check if the user is the owner and trying to change their role
  if (newRole !== 'owner') {
    const { data: isOwner, error: ownerCheckError } = await supabase
      .from('project_permissions')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .eq('role', 'owner')
      .maybeSingle();

    if (ownerCheckError) {
      return { error: ownerCheckError.message, success: false };
    }

    if (isOwner) {
      return { error: 'Cannot change the role of the project owner', success: false };
    }
  }

  // Update the role
  const { error } = await supabase
    .from('project_permissions')
    .update({ role: newRole })
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message, success: false };
  }

  return { success: true, error: null };
}
