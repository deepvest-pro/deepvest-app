import type {
  Project,
  ProjectPermission,
  ProjectRole,
  Snapshot,
  ExpandedUser,
  UserProfile,
  UUID,
} from '@/types/supabase';
import { createServerSupabaseClient, getCurrentUser } from './client';

/**
 * Fetches a project by ID with permissions and snapshots
 */
export async function getProjectWithDetails(projectId: string) {
  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();

  // Fetch the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: projectError?.message || 'Project not found', data: null };
  }

  let permissions: ProjectPermission[] = [];

  if (user) {
    // For authenticated users, fetch raw permissions first, then expand user_id manually
    const { data: rawPermissions, error: rawPermissionsError } = await supabase
      .from('project_permissions')
      .select('*') // Select raw data, user_id will be UUID
      .eq('project_id', projectId);

    if (rawPermissionsError) {
      console.error(
        `[getProjectWithDetails] Auth user: Failed to fetch raw permissions for project ${projectId}: ${rawPermissionsError.message}`,
      );
      return { error: rawPermissionsError.message, data: null };
    }

    if (rawPermissions) {
      const processedPermissions: ProjectPermission[] = [];
      for (const rawPerm of rawPermissions) {
        let expandedUser: ExpandedUser | null = null;
        const userId = rawPerm.user_id as UUID; // Cast to UUID, as it's raw from DB

        if (userId) {
          // Attempt to fetch the user's profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, full_name, nickname, avatar_url')
            .eq('id', userId)
            .single();

          if (profileError) {
            console.warn(
              `[getProjectWithDetails] Auth user: Failed to fetch profile for user ${userId} in project ${projectId}: ${profileError.message}`,
            );
            // If profile fetch fails, expandedUser remains null, and later userId (UUID) will be used.
          } else if (profile) {
            expandedUser = {
              id: profile.id,
              email: undefined, // Email is not fetched here to avoid RLS issues on auth.users
              user_profiles: profile as UserProfile,
            };
          }
        }
        // If expandedUser is still null (profile fetch failed or no userId), use userId (UUID).
        // Otherwise, use the constructed expandedUser object.
        processedPermissions.push({ ...rawPerm, user_id: expandedUser || userId });
      }
      permissions = processedPermissions;
    } else {
      permissions = [];
    }
  }

  // Helper function to fetch and construct snapshot with expanded author
  async function fetchAndProcessSnapshot(snapshotId: UUID): Promise<Snapshot | null> {
    let snapshotData: Snapshot | null = null;

    if (user) {
      // Authenticated user: try relational select first
      const { data: relationalData, error: relationalError } = await supabase
        .from('snapshots')
        .select('*, author_id(id, email, user_profiles(id, full_name, nickname, avatar_url))')
        .eq('id', snapshotId)
        .single();

      if (!relationalError && relationalData) {
        // Cast to Snapshot, assuming the select expands author_id to ExpandedUser
        snapshotData = relationalData as Snapshot;
      } else {
        if (relationalError) {
          console.warn(
            `[getProjectWithDetails] Auth user: Relational select for snapshot ${snapshotId} author failed: ${relationalError.message}. Falling back.`,
          );
        }
        // Fallback for authenticated user or if relational select somehow fails to expand
        const { data: rawData, error: rawError } = await supabase
          .from('snapshots')
          .select('*')
          .eq('id', snapshotId)
          .single();
        if (rawError || !rawData) return null;

        // rawData.author_id is UUID here. We need to fetch profile and construct ExpandedUser.
        let authorInfo: ExpandedUser | null = null;
        if (rawData.author_id) {
          // author_id is UUID from rawData
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, full_name, nickname, avatar_url') // Select only needed fields
            .eq('id', rawData.author_id) // Use the UUID
            .single();
          if (!profileError && profile) {
            authorInfo = {
              id: profile.id,
              email: undefined,
              /* email might be available if we query auth.users, but sticking to profiles for now */ user_profiles:
                profile as UserProfile,
            };
          } else if (profileError) {
            console.warn(
              `[getProjectWithDetails] Auth user (fallback): Failed to fetch profile for author ${rawData.author_id}: ${profileError.message}`,
            );
          }
        }
        snapshotData = { ...rawData, author_id: authorInfo || rawData.author_id }; // Assign constructed author or keep UUID if profile fetch failed
      }
    } else {
      // Guest user: fetch snapshot raw, then profile separately
      const { data: rawData, error: rawError } = await supabase
        .from('snapshots')
        .select('*')
        .eq('id', snapshotId)
        .single();

      if (rawError || !rawData) {
        console.warn(
          `[FAPS] Guest: Failed to fetch raw snapshot ${snapshotId}. Error: ${rawError?.message}. RawData: ${JSON.stringify(rawData)}`,
        );
        return null;
      }

      let authorInfo: ExpandedUser | null = null;
      if (rawData.author_id) {
        // author_id is UUID
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, nickname, avatar_url')
          .eq('id', rawData.author_id) // Use the UUID
          .single();

        if (!profileError && profile) {
          authorInfo = { id: profile.id, email: undefined, user_profiles: profile as UserProfile };
        } else if (profileError) {
          console.warn(
            `[getProjectWithDetails] Guest: Failed to fetch profile for author ${rawData.author_id}: ${profileError.message}`,
          );
        }
      }
      // Assign the constructed ExpandedUser to author_id, or keep the original UUID if profile fetch failed
      snapshotData = { ...rawData, author_id: authorInfo || rawData.author_id };
    }
    return snapshotData;
  }

  let publicSnapshot: Snapshot | null = null;
  if (project.public_snapshot_id) {
    publicSnapshot = await fetchAndProcessSnapshot(project.public_snapshot_id);
    if (!publicSnapshot) {
      // If fetching public snapshot fails critically
      console.error(
        `[getProjectWithDetails] CRITICAL: Failed to fetch public snapshot ${project.public_snapshot_id}`,
      );
      // Decide if this should return an error for the whole project or continue with a null snapshot
      // For now, let's allow project to load without a public snapshot if its fetch fails
    }
  }

  let newSnapshot: Snapshot | null = null;
  if (project.new_snapshot_id) {
    newSnapshot = await fetchAndProcessSnapshot(project.new_snapshot_id);
    if (!newSnapshot) {
      console.warn(
        `[getProjectWithDetails] WARN: Failed to fetch new snapshot ${project.new_snapshot_id}`,
      );
      // Allow project to load without a new snapshot if its fetch fails
    }
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
 * Check if a project slug is available
 * @param slug The slug to check
 * @returns Object containing available status and error if any
 */
export async function isSlugAvailable(
  slug: string,
): Promise<{ available: boolean; error?: string }> {
  try {
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return {
        available: false,
        error: 'Slug can only contain lowercase letters, numbers, and hyphens',
      };
    }

    if (slug.length < 3 || slug.length > 60) {
      return {
        available: false,
        error: 'Slug must be between 3 and 60 characters long',
      };
    }

    // Check if slug is already taken
    try {
      const supabase = await createServerSupabaseClient();

      // Verify supabase client was created successfully
      if (!supabase) {
        console.error('Failed to create Supabase client');
        return {
          available: false,
          error: 'Database connection failed',
        };
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', slug)
        .limit(1);

      if (error) {
        console.error('Error checking slug availability:', error);
        return {
          available: false,
          error: 'An error occurred while checking slug availability',
        };
      }

      return {
        available: !data || data.length === 0,
      };
    } catch (clientError) {
      console.error('Error creating or using Supabase client:', clientError);
      return {
        available: false,
        error: 'Failed to connect to database',
      };
    }
  } catch (error) {
    console.error('Error in isSlugAvailable:', error);
    return {
      available: false,
      error: 'An unexpected error occurred',
    };
  }
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
