/**
 * Project API server functions
 * These functions use server-side helpers and are intended for API routes
 */

import { APIClient } from '@/lib/utils/api';
import type { ProjectDataFromAI, TeamMemberFromAI } from '@/types/ai';
import { generateSlug } from '@/lib/utils/slug.util';
import { removeFileExtension } from '@/lib/utils/file-validation';

/**
 * Gets project details with permissions and snapshots
 * @param projectId Project ID
 * @returns Project details
 */
export const getProjectWithDetails = async (projectId: string) => {
  const { getProjectWithDetails: getProjectWithDetailsHelper } = await import(
    '@/lib/supabase/helpers'
  );
  return getProjectWithDetailsHelper(projectId);
};

/**
 * Gets public project documents
 * @param projectId Project ID
 * @returns Public documents
 */
export const getPublicProjectDocuments = async (projectId: string) => {
  const { getPublicProjectDocuments: getPublicProjectDocumentsHelper } = await import(
    '@/lib/supabase/helpers'
  );
  return getPublicProjectDocumentsHelper(projectId);
};

/**
 * Gets public project team members
 * @param projectId Project ID
 * @returns Public team members
 */
export const getPublicProjectTeamMembers = async (projectId: string) => {
  const { getPublicProjectTeamMembers: getPublicProjectTeamMembersHelper } = await import(
    '@/lib/supabase/helpers'
  );
  return getPublicProjectTeamMembersHelper(projectId);
};

/**
 * Updates project
 * @param projectId Project ID
 * @param projectFields Data to update
 * @returns Updated project
 */
export const updateProject = async (projectId: string, projectFields: Record<string, unknown>) => {
  const { updateProject: updateProjectHelper } = await import('@/lib/supabase/helpers');
  return updateProjectHelper(projectId, projectFields);
};

/**
 * Deletes project
 * @param projectId Project ID
 * @returns Deletion result
 */
export const deleteProject = async (projectId: string) => {
  try {
    // Delete project files from storage
    const { deleteProjectFiles } = await import('@/lib/supabase/helpers');
    const { success: filesDeleted, error: filesError } = await deleteProjectFiles(projectId);

    if (!filesDeleted) {
      console.error('Failed to delete project files:', filesError);
      // Continue with project deletion even if files weren't deleted
      // This prevents orphaned records in the database
    }

    // Delete project from database (permissions and snapshots will be deleted cascadingly)
    const { SupabaseClientFactory } = await import('@/lib/supabase/client-factory');
    const supabase = await SupabaseClientFactory.getServerClient();
    const { error } = await supabase.from('projects').delete().eq('id', projectId);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Creates a new project via API
 * @param projectData Project data
 * @param skipAutoTeam Skip automatic CEO team member creation (for AI-generated projects)
 * @returns Created project
 */
export const createProject = async (
  projectData: {
    name: string;
    slug: string;
    description: string;
    status: string;
  },
  skipAutoTeam = false,
) => {
  const response = await APIClient.post('/projects', {
    ...projectData,
    skipAutoTeam, // Add flag to skip auto team creation
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create project');
  }

  return response.data;
};

/**
 * Creates a snapshot for a project
 * @param projectId Project ID
 * @returns Created snapshot
 */
export const createSnapshot = async (projectId: string) => {
  const response = await APIClient.post(`/projects/${projectId}/snapshots`, {
    name: 'Initial snapshot',
    description: 'Auto-generated from presentation upload',
    status: 'idea',
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create snapshot');
  }

  return response.data;
};

/**
 * Updates a snapshot with new data
 * @param projectId Project ID
 * @param snapshotData Snapshot data to update
 */
export const updateSnapshot = async (projectId: string, snapshotData: Record<string, unknown>) => {
  // Get the current new_snapshot_id from the project
  const projectResponse = await APIClient.get<{
    project: { new_snapshot_id?: string };
    documents: unknown[];
    team: unknown[];
  }>(`/projects/${projectId}`);

  if (!projectResponse.success || !projectResponse.data) {
    throw new Error('Failed to get project details');
  }

  // Handle new API response structure
  const project = projectResponse.data.project;
  const newSnapshotId = project?.new_snapshot_id;

  if (!newSnapshotId) {
    throw new Error('No snapshot found to update');
  }

  const response = await APIClient.put(
    `/projects/${projectId}/snapshots/${newSnapshotId}`,
    snapshotData,
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update snapshot');
  }

  return response.data;
};

/**
 * Uploads a file to a project
 * @param projectId Project ID
 * @param file File to upload
 * @returns Upload result
 */
export const uploadFile = async (projectId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadType', 'document');

  const response = await APIClient.upload(`/projects/${projectId}/upload`, formData);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to upload file');
  }

  return response.data;
};

/**
 * Creates a document entry for a project
 * @param projectId Project ID
 * @param fileName File name
 * @param fileUrl File URL
 * @returns Created document
 */
export const createDocument = async (projectId: string, fileName: string, fileUrl: string) => {
  // Generate slug from filename
  const slug = generateSlug(fileName);

  const response = await APIClient.post(`/projects/${projectId}/documents`, {
    title: removeFileExtension(fileName), // Remove extension for title
    slug: slug,
    content_type: 'presentation',
    file_urls: [fileUrl],
    description: 'Presentation uploaded via drag & drop',
    is_public: true,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create document');
  }

  return response.data;
};

/**
 * Transcribes a file using the transcription API
 * @param fileUrl File URL to transcribe
 * @returns Transcription result
 */
export const transcribeFile = async (fileUrl: string) => {
  const response = await APIClient.post('/transcribe', {
    url: fileUrl,
    prompt:
      'Extract all text content from this document. Preserve the structure and formatting as much as possible.',
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to transcribe file');
  }

  return response.data;
};

/**
 * Generates project data from transcription using AI
 * @param transcription Transcription text
 * @param userData User data for team extraction context
 * @returns Generated project data
 */
export const generateProjectData = async (
  transcription: string,
  userData?: { name: string; email: string },
): Promise<ProjectDataFromAI> => {
  const { getPrompt } = await import('@/lib/prompts');
  let prompt = getPrompt('PROJECT_DATA_GENERATION');

  // Replace user context placeholders if userData is provided
  if (userData) {
    prompt = prompt
      .replace(/\{\{USER_NAME\}\}/g, userData.name)
      .replace(/\{\{USER_EMAIL\}\}/g, userData.email);
  } else {
    // If no user data, remove the user context section
    prompt = prompt.replace(
      /Current user context:[\s\S]*?Content to analyze:/,
      'Content to analyze:',
    );
  }

  prompt = prompt + '\n\n' + transcription;

  const response = await APIClient.post<{
    result: string;
    metadata?: {
      promptLength: number;
      model: string;
    };
  }>('/ai/generate-content', {
    prompt: prompt,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to generate project data');
  }

  // Parse the JSON from the result string
  const { parseAIResponse } = await import('@/lib/utils/project-helpers');
  return parseAIResponse(response.data.result);
};

/**
 * Updates a document with content
 * @param projectId Project ID
 * @param documentId Document ID
 * @param content Content to update
 */
export const updateDocument = async (projectId: string, documentId: string, content: string) => {
  const response = await APIClient.put(`/projects/${projectId}/documents/${documentId}`, {
    content: content,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update document');
  }

  return response.data;
};

/**
 * Creates team members from AI-extracted data
 * @param projectId Project ID
 * @param teamData Team data from AI
 * @param authorId ID of the user creating the project
 * @returns Array of created team members
 */
export const createTeamFromAI = async (
  projectId: string,
  teamData: TeamMemberFromAI[],
  authorId: string,
): Promise<unknown[]> => {
  if (!teamData || teamData.length === 0) {
    return [];
  }

  const createdMembers = [];

  for (const member of teamData) {
    try {
      const teamMemberData = {
        project_id: projectId,
        author_id: authorId,
        name: member.name,
        email: member.email || null,
        phone: null,
        image_url: null,
        country: null,
        city: null,
        is_founder: true,
        equity_percent: null,
        positions: member.positions,
        status: 'active' as const,
        x_url: null,
        github_url: null,
        linkedin_url: null,
        user_id: null, // Will be linked later if user registers
        joined_at: new Date().toISOString(),
        departed_at: null,
        departed_reason: null,
      };

      const response = await APIClient.post<{ team_member: unknown }>(
        `/projects/${projectId}/team-members`,
        teamMemberData,
      );

      if (!response.success || !response.data) {
        console.error(`Failed to create team member ${member.name}:`, response.error);
        continue; // Skip this member but continue with others
      }

      createdMembers.push(response.data.team_member);
      console.log(`Team member created: ${member.name} with positions:`, member.positions);
    } catch (error) {
      console.error(`Error creating team member ${member.name}:`, error);
      // Continue with other members
    }
  }

  return createdMembers;
};
