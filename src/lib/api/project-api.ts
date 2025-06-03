/**
 * Project API client functions
 */

import type { ProjectDataFromAI } from '@/types/ai';
import { generateSlug } from '@/lib/validations/project';
import { removeFileExtension } from '@/lib/utils/file-validation';

/**
 * Creates a new project via API
 * @param projectData Project data
 * @returns Created project
 */
export const createProject = async (projectData: {
  name: string;
  slug: string;
  description: string;
  status: string;
}) => {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create project: ${errorText}`);
  }

  const result = await response.json();
  return result.project;
};

/**
 * Creates a snapshot for a project
 * @param projectId Project ID
 * @returns Created snapshot
 */
export const createSnapshot = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}/snapshots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Initial snapshot',
      description: 'Auto-generated from presentation upload',
      status: 'idea',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create snapshot: ${errorText}`);
  }

  return response.json();
};

/**
 * Updates a snapshot with new data
 * @param projectId Project ID
 * @param snapshotData Snapshot data to update
 */
export const updateSnapshot = async (projectId: string, snapshotData: Record<string, unknown>) => {
  // Get the current new_snapshot_id from the project
  const projectResponse = await fetch(`/api/projects/${projectId}`);
  if (!projectResponse.ok) {
    throw new Error('Failed to get project details');
  }

  const projectResult = await projectResponse.json();
  const newSnapshotId = projectResult.project.new_snapshot_id;

  if (!newSnapshotId) {
    throw new Error('No snapshot found to update');
  }

  const response = await fetch(`/api/projects/${projectId}/snapshots/${newSnapshotId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snapshotData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update snapshot: ${errorText}`);
  }

  return response.json();
};

/**
 * Updates a project with new data
 * @param projectId Project ID
 * @param projectFields Project fields to update
 */
export const updateProject = async (projectId: string, projectFields: Record<string, unknown>) => {
  if (Object.keys(projectFields).length === 0) {
    return; // Nothing to update
  }

  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectFields),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`Failed to update project fields: ${errorText}`);
    // Don't throw error, this is not critical
  }
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

  const response = await fetch(`/api/projects/${projectId}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload file: ${errorText}`);
  }

  return response.json();
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

  const response = await fetch(`/api/projects/${projectId}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: removeFileExtension(fileName), // Remove extension for title
      slug: slug,
      content_type: 'presentation',
      file_urls: [fileUrl],
      description: 'Presentation uploaded via drag & drop',
      is_public: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create document: ${errorText}`);
  }

  return response.json();
};

/**
 * Transcribes a file using the transcription API
 * @param fileUrl File URL to transcribe
 * @returns Transcription result
 */
export const transcribeFile = async (fileUrl: string) => {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: fileUrl,
      prompt:
        'Extract all text content from this document. Preserve the structure and formatting as much as possible.',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to transcribe file: ${errorText}`);
  }

  return response.json();
};

/**
 * Generates project data from transcription using AI
 * @param transcription Transcription text
 * @returns Generated project data
 */
export const generateProjectData = async (transcription: string): Promise<ProjectDataFromAI> => {
  const { getPrompt } = await import('@/lib/prompts');
  const prompt = getPrompt('PROJECT_DATA_GENERATION') + '\n\n' + transcription;

  const response = await fetch('/api/ai/generate-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate project data: ${errorText}`);
  }

  const result = await response.json();

  // Parse the JSON from the result string
  const { parseAIResponse } = await import('@/lib/utils/project-helpers');
  return parseAIResponse(result.result);
};

/**
 * Updates a document with content
 * @param projectId Project ID
 * @param documentId Document ID
 * @param content Content to update
 */
export const updateDocument = async (projectId: string, documentId: string, content: string) => {
  const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: content,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update document: ${errorText}`);
  }

  return response.json();
};
