import type {
  Project,
  ProjectPermission,
  ProjectRole,
  Snapshot,
  ExpandedUser,
  UserProfile,
  UUID,
  ProjectScoring,
  SnapshotWithAuthorAndScoring,
} from '@/types/supabase';
import { getCurrentUser } from './client';
import { SupabaseClientFactory } from './client-factory';
import { REGEX_PATTERNS } from '@/lib/constants';

/**
 * Helper function to fetch and construct snapshot with expanded author
 */
async function fetchAndProcessSnapshot(
  snapshotId: UUID,
): Promise<SnapshotWithAuthorAndScoring | null> {
  const supabase = await SupabaseClientFactory.getServerClient();
  let snapshotData: SnapshotWithAuthorAndScoring | null = null;

  // Fetch raw snapshot data first (both for authenticated and guest users)
  const { data: rawData, error: rawError } = await supabase
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (rawError || !rawData) {
    console.warn(
      `[fetchAndProcessSnapshot] Failed to fetch raw snapshot ${snapshotId}. Error: ${rawError?.message}. RawData: ${JSON.stringify(rawData)}`,
    );
    return null;
  }

  // Now fetch author profile separately if author_id exists
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
        user_profiles: profile as UserProfile,
      };
    } else if (profileError) {
      console.warn(
        `[fetchAndProcessSnapshot] Failed to fetch profile for author ${rawData.author_id}: ${profileError.message}`,
      );
    }
  }

  // Fetch project scoring if scoring_id exists
  let scoringData: ProjectScoring | null = null;
  if (rawData.scoring_id) {
    const { data: scoring, error: scoringError } = await supabase
      .from('project_scoring')
      .select('*')
      .eq('id', rawData.scoring_id)
      .single();

    if (!scoringError && scoring) {
      scoringData = scoring;
    } else if (scoringError) {
      console.warn(
        `[fetchAndProcessSnapshot] Failed to fetch scoring for snapshot ${snapshotId}: ${scoringError.message}`,
      );
    }
  }

  // Assign the constructed data with author and scoring
  snapshotData = {
    ...rawData,
    author_id: authorInfo || rawData.author_id,
    scoring: scoringData,
  };
  return snapshotData;
}

/**
 * Fetches a project by ID with permissions and snapshots
 */
export async function getProjectWithDetails(projectId: string) {
  const supabase = await SupabaseClientFactory.getServerClient();
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
        let userDetails: ExpandedUser | null = null;
        const userId = rawPerm.user_id as UUID;

        if (userId) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, full_name, nickname, avatar_url')
            .eq('id', userId)
            .single();

          if (profileError) {
            console.warn(
              `[getProjectWithDetails] Auth user: Failed to fetch profile for user ${userId} in project ${projectId}: ${profileError.message}`,
            );
          } else if (profile) {
            userDetails = {
              id: profile.id,
              email: undefined,
              user_profiles: profile as UserProfile,
            };
          }
        }
        processedPermissions.push({
          ...rawPerm,
          user_id: userId,
          user_details: userDetails,
        });
      }
      permissions = processedPermissions;
    } else {
      permissions = [];
    }
  }

  let publicSnapshot: SnapshotWithAuthorAndScoring | null = null;
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

  let newSnapshot: SnapshotWithAuthorAndScoring | null = null;
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
 * Fetches a user's projects with their roles and snapshots
 */
export async function getUserProjects(userId: string | undefined) {
  if (!userId) {
    return { data: null, error: 'User ID is required' };
  }

  const supabase = await SupabaseClientFactory.getServerClient();

  // First get the user's project permissions
  const { data: permissions, error: permissionsError } = await supabase
    .from('project_permissions')
    .select('project_id, role')
    .eq('user_id', userId);

  if (permissionsError) {
    return { error: permissionsError.message, data: null };
  }

  if (!permissions || permissions.length === 0) {
    return { data: [], error: null };
  }

  // Get project IDs
  const projectIds = permissions.map(p => p.project_id);

  // Fetch projects with snapshots
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(
      `
      *,
      new_snapshot:new_snapshot_id(*),
      public_snapshot:public_snapshot_id(*)
    `,
    )
    .in('id', projectIds);

  if (projectsError) {
    return { error: projectsError.message, data: null };
  }

  // Combine project data with user roles
  const projectsWithRoles =
    projects?.map(project => {
      const permission = permissions.find(p => p.project_id === project.id);
      return {
        ...project,
        role: permission?.role || 'viewer',
      };
    }) || [];

  return { data: projectsWithRoles, error: null };
}

/**
 * Fetches all projects that should be visible to a user:
 * - All public projects (for everyone including guests)
 * - User's own projects (if authenticated)
 */
export async function getAllVisibleProjects(userId?: string) {
  const supabase = await SupabaseClientFactory.getServerClient();

  try {
    if (!userId) {
      // For guests: only show public projects (without snapshots to avoid RLS issues)
      const { data: publicProjects, error: publicError } = await supabase
        .from('projects')
        .select('*')
        .eq('is_public', true)
        .eq('is_archived', false);

      if (publicError) {
        return { error: publicError.message, data: null };
      }

      // For each project, fetch snapshots separately if they exist
      const projectsWithSnapshots = [];
      for (const project of publicProjects || []) {
        let publicSnapshot = null;
        let newSnapshot = null;

        // Fetch public snapshot if it exists
        if (project.public_snapshot_id) {
          publicSnapshot = await fetchAndProcessSnapshot(project.public_snapshot_id);
        }

        // Fetch new snapshot if it exists
        if (project.new_snapshot_id) {
          newSnapshot = await fetchAndProcessSnapshot(project.new_snapshot_id);
        }

        projectsWithSnapshots.push({
          ...project,
          public_snapshot: publicSnapshot,
          new_snapshot: newSnapshot,
          role: null, // Guests don't have roles
        });
      }

      return { data: projectsWithSnapshots, error: null };
    }

    // For authenticated users: get all public projects + user's own projects

    // First get user's project permissions to find their projects
    const { data: permissions, error: permissionsError } = await supabase
      .from('project_permissions')
      .select('project_id, role')
      .eq('user_id', userId);

    if (permissionsError) {
      return { error: permissionsError.message, data: null };
    }

    const userProjectIds = permissions?.map(p => p.project_id) || [];

    // Get all projects that are either:
    // 1. Public and not archived, OR
    // 2. User's own projects (regardless of public status)
    let query = supabase.from('projects').select(
      `
        *,
        new_snapshot:new_snapshot_id(*),
        public_snapshot:public_snapshot_id(*)
      `,
    );

    if (userProjectIds.length > 0) {
      // User has projects: show public projects OR user's projects
      query = query.or(
        `and(is_public.eq.true,is_archived.eq.false),id.in.(${userProjectIds.join(',')})`,
      );
    } else {
      // User has no projects: show only public projects
      query = query.eq('is_public', true).eq('is_archived', false);
    }

    const { data: projects, error: projectsError } = await query;

    if (projectsError) {
      return { error: projectsError.message, data: null };
    }

    // Add role information for user's projects
    const projectsWithRoles =
      projects?.map(project => {
        const permission = permissions?.find(p => p.project_id === project.id);
        return {
          ...project,
          role: permission?.role || null, // null for public projects user doesn't own
        };
      }) || [];

    return { data: projectsWithRoles, error: null };
  } catch (error) {
    console.error('Error fetching visible projects:', error);
    return { error: 'Failed to fetch projects', data: null };
  }
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

  const supabase = await SupabaseClientFactory.getServerClient();

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
  const supabase = await SupabaseClientFactory.getServerClient();

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
    // Validate slug format using centralized regex
    if (!REGEX_PATTERNS.projectSlug.test(slug)) {
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
      const supabase = await SupabaseClientFactory.getServerClient();

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
  const supabase = await SupabaseClientFactory.getServerClient();

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
  const supabase = await SupabaseClientFactory.getServerClient();

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
  const supabase = await SupabaseClientFactory.getServerClient();

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
 * Adds a user to a project by user ID (not email)
 */
export async function addUserToProjectById(projectId: string, userId: string, role: ProjectRole) {
  const supabase = await SupabaseClientFactory.getServerClient();

  // Check if the user already has a role in this project
  const { data: existingRole, error: roleError } = await supabase
    .from('project_permissions')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
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
      user_id: userId,
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
  const supabase = await SupabaseClientFactory.getServerClient();

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
  const supabase = await SupabaseClientFactory.getServerClient();

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

/**
 * Updates the contents array in the current snapshot when documents are modified
 */
export async function updateSnapshotContents(projectId: string) {
  const supabase = await SupabaseClientFactory.getServerClient();

  // Get the current project to find the new_snapshot_id
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('new_snapshot_id, public_snapshot_id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return { error: projectError?.message || 'Project not found', success: false };
  }

  // Get all document IDs for this project
  const { data: documents, error: documentsError } = await supabase
    .from('project_contents')
    .select('id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (documentsError) {
    return { error: documentsError.message, success: false };
  }

  const documentIds = documents?.map(doc => doc.id) || [];

  // If there's a new_snapshot_id that differs from public_snapshot_id, update it
  // Otherwise, create a new snapshot
  const isEditingDraft =
    project.new_snapshot_id && project.new_snapshot_id !== project.public_snapshot_id;

  if (isEditingDraft) {
    // Update existing draft snapshot
    const { error: updateError } = await supabase
      .from('snapshots')
      .update({
        contents: documentIds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.new_snapshot_id)
      .eq('is_locked', false);

    if (updateError) {
      return { error: updateError.message, success: false };
    }
  } else {
    // Need to create a new snapshot or update the existing one
    // This should trigger the same logic as when editing project content
    // For now, we'll just update the public snapshot if it exists and is unlocked
    if (project.public_snapshot_id) {
      const { data: snapshot, error: snapshotError } = await supabase
        .from('snapshots')
        .select('is_locked')
        .eq('id', project.public_snapshot_id)
        .single();

      if (!snapshotError && !snapshot.is_locked) {
        const { error: updateError } = await supabase
          .from('snapshots')
          .update({
            contents: documentIds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.public_snapshot_id);

        if (updateError) {
          return { error: updateError.message, success: false };
        }
      }
    }
  }

  return { success: true, error: null };
}

/**
 * Fetches the core status (public, archived) of a project by its ID using an RPC call.
 * This is a lightweight check often used before fetching full project details.
 */
export async function getProjectCoreStatus(projectId: string): Promise<{
  data: { is_public: boolean; is_archived: boolean }[] | null;
  error: string | null;
}> {
  const supabase = await SupabaseClientFactory.getServerClient();
  const { data, error } = await supabase.rpc('get_project_status_by_id', {
    p_project_id: projectId,
  });

  if (error) {
    console.error(`[getProjectCoreStatus] RPC error for project ${projectId}: ${error.message}`);
    return { data: null, error: error.message };
  }

  // Ensure data is in the expected array format, even if RPC returns a single object
  const projectStatusArray = Array.isArray(data)
    ? data
    : data
      ? [data] // Wrap single object in an array
      : [];

  if (projectStatusArray.length === 0) {
    console.warn(`[getProjectCoreStatus] No status found for project ${projectId} via RPC.`);
    // It's important to return a structure that page.tsx expects.
    // If no data means "not found" or an issue, an error might be more appropriate,
    // or an empty array if the caller handles that. For now, returning null data and an error message.
    return { data: null, error: 'Project status not found.' };
  }

  // Explicitly type the returned data if possible, or ensure the caller handles it.
  // Assuming the RPC returns objects matching { is_public: boolean; is_archived: boolean }
  return {
    data: projectStatusArray as { is_public: boolean; is_archived: boolean }[],
    error: null,
  };
}

/**
 * Adds a user to a project with a specific role (by email)
 */
export async function addUserToProject(projectId: string, userEmail: string, role: ProjectRole) {
  const supabase = await SupabaseClientFactory.getServerClient();

  // First, find the user by email
  const { data: userData, error: userError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', (await supabase.from('auth').select('id').eq('email', userEmail).single()).data?.id)
    .single();

  if (userError || !userData) {
    return { error: userError?.message || 'User not found', success: false };
  }

  // Use the new function to add user by ID
  return await addUserToProjectById(projectId, userData.id, role);
}

/**
 * Deletes all files in a project folder from storage
 */
export async function deleteProjectFiles(projectId: string) {
  const supabase = await SupabaseClientFactory.getServerClient();

  try {
    // Helper function to recursively list all files in a folder
    const listAllFiles = async (folderPath: string): Promise<string[]> => {
      const { data: items, error } = await supabase.storage.from('project-files').list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) {
        throw error;
      }

      if (!items || items.length === 0) {
        return [];
      }

      const allFiles: string[] = [];

      for (const item of items) {
        const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;

        // Try to list contents of this item to see if it's a folder
        const { data: subItems, error: subError } = await supabase.storage
          .from('project-files')
          .list(itemPath, { limit: 1 });

        if (!subError && subItems && subItems.length > 0) {
          // This is a folder, get all files from it recursively
          const subFiles = await listAllFiles(itemPath);
          allFiles.push(...subFiles);
        } else {
          // This is a file (or empty folder, which we can treat as a file)
          allFiles.push(itemPath);
        }
      }

      return allFiles;
    };

    // List all files in the project folder recursively
    const allFiles = await listAllFiles(projectId);

    if (allFiles.length === 0) {
      return { success: true, error: null };
    }

    // Delete files in batches to avoid potential issues with large numbers of files
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < allFiles.length; i += batchSize) {
      batches.push(allFiles.slice(i, i + batchSize));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      const { error: deleteError } = await supabase.storage.from('project-files').remove(batch);

      if (deleteError) {
        console.error(`Error deleting batch ${i + 1}:`, deleteError);
        return { success: false, error: `Failed to delete files: ${deleteError.message}` };
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Unexpected error deleting project files:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while deleting project files',
    };
  }
}

/**
 * Get public documents for a project
 */
export async function getPublicProjectDocuments(projectId: string) {
  const supabase = await SupabaseClientFactory.getServerClient();

  // Build query for public documents only
  const { data: documents, error } = await supabase
    .from('project_content')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_public', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public documents:', error);
    return { data: [], error };
  }

  // Get author information if we have documents
  let documentsWithAuthors = documents || [];
  if (documents && documents.length > 0) {
    const authorIds = [...new Set(documents.map(doc => doc.author_id))];

    const { data: authors } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', authorIds);

    // Map authors to documents
    documentsWithAuthors = documents.map(doc => ({
      ...doc,
      author: authors?.find(author => author.id === doc.author_id) || null,
    }));
  }

  return { data: documentsWithAuthors, error: null };
}

/**
 * Get public team members for a project
 */
export async function getPublicProjectTeamMembers(projectId: string) {
  const supabase = await SupabaseClientFactory.getServerClient();

  // Build query for active team members (public by default)
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public team members:', error);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

/**
 * Fetches leaderboard projects for SSR
 * Uses the same database function as the API but returns server-side
 */
export async function getLeaderboardProjects(options?: {
  limit?: number;
  offset?: number;
  minScore?: number;
}) {
  const supabase = await SupabaseClientFactory.getServerClient();

  const { limit = 20, offset = 0, minScore } = options || {};

  try {
    // Use the existing get_scoring_leaderboard function
    const { data, error } = await supabase.rpc('get_scoring_leaderboard', {
      p_limit: limit,
      p_offset: offset,
      p_min_score: minScore || null,
    });

    if (error) {
      console.error('Leaderboard query error:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        projects: data || [],
        pagination: {
          limit,
          offset,
          hasMore: (data?.length || 0) === limit,
        },
      },
      error: null,
    };
  } catch (err) {
    console.error('Error in getLeaderboardProjects:', err);
    return { data: null, error: 'Failed to fetch leaderboard data' };
  }
}
