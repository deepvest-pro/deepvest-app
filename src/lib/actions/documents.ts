'use server';

import { projectDocumentsRepository } from '@/lib/supabase/repositories';
import { requireAuth, requireProjectPermission } from '@/lib/api/middleware/auth';
import type { ProjectDocumentWithAuthor } from '@/lib/supabase/repositories/project-documents';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

/**
 * Server Action to get documents for a specific project
 * Handles authentication and permissions on the server side
 */
export async function getProjectDocuments(projectId: string): Promise<{
  documents: ProjectDocumentWithAuthor[] | null;
  error: string | null;
}> {
  try {
    // Require authentication and permissions
    const user = await requireAuth();
    await requireProjectPermission(user.id, projectId, 'viewer');

    // Get documents
    const { data: documents, error } = await projectDocumentsRepository.findByProjectId(
      projectId,
      true,
    );

    if (error) {
      return { documents: null, error: 'Failed to fetch documents' };
    }

    return { documents: documents || [], error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
    return { documents: null, error: errorMessage };
  }
}

/**
 * Server Action to create a new document
 */
export async function createProjectDocument(
  projectId: string,
  documentData: {
    title: string;
    slug: string;
    content_type: string;
    content?: string;
    is_public: boolean;
    file_urls: string[];
  },
): Promise<{
  document: ProjectDocumentWithAuthor | null;
  error: string | null;
}> {
  try {
    const user = await requireAuth();
    await requireProjectPermission(user.id, projectId, 'editor');

    const { data: document, error } = await projectDocumentsRepository.createDocument({
      ...documentData,
      project_id: projectId,
      author_id: user.id,
    });

    if (error || !document) {
      return { document: null, error: error || 'Failed to create document' };
    }

    // Sync snapshot data after creating document
    try {
      await syncSnapshotData(projectId);
    } catch (syncError) {
      console.warn(`Failed to sync snapshot data for project ${projectId}:`, syncError);
      // Don't fail the request if sync fails
    }

    // Convert to ProjectDocumentWithAuthor by adding author info
    const documentWithAuthor: ProjectDocumentWithAuthor = {
      ...document,
      author: null, // Will be populated by the component when it refreshes
    };

    return { document: documentWithAuthor, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create document';
    return { document: null, error: errorMessage };
  }
}

/**
 * Server Action to update a document
 */
export async function updateProjectDocument(
  projectId: string,
  documentId: string,
  updateData: Partial<{
    title: string;
    slug: string;
    content: string;
    is_public: boolean;
  }>,
): Promise<{
  document: ProjectDocumentWithAuthor | null;
  error: string | null;
}> {
  try {
    const user = await requireAuth();
    const permission = await requireProjectPermission(user.id, projectId, 'editor');

    // Get the document to check ownership
    const { data: existingDocument, error: docError } =
      await projectDocumentsRepository.findById(documentId);

    if (docError || !existingDocument) {
      return { document: null, error: 'Document not found' };
    }

    // Check if user can edit this document
    const canEdit =
      existingDocument.author_id === user.id || ['admin', 'owner'].includes(permission.role);

    if (!canEdit) {
      return { document: null, error: 'Insufficient permissions to edit this document' };
    }

    const { data: document, error } = await projectDocumentsRepository.update(
      documentId,
      updateData,
    );

    if (error || !document) {
      return { document: null, error: error || 'Failed to update document' };
    }

    // Sync snapshot data after updating document
    try {
      await syncSnapshotData(projectId);
    } catch (syncError) {
      console.warn(`Failed to sync snapshot data for project ${projectId}:`, syncError);
      // Don't fail the request if sync fails
    }

    // Convert to ProjectDocumentWithAuthor by adding author info
    const documentWithAuthor: ProjectDocumentWithAuthor = {
      ...document,
      author: null, // Will be populated by the component when it refreshes
    };

    return { document: documentWithAuthor, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update document';
    return { document: null, error: errorMessage };
  }
}

/**
 * Server Action to delete a document
 */
export async function deleteProjectDocument(
  projectId: string,
  documentId: string,
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const user = await requireAuth();
    const permission = await requireProjectPermission(user.id, projectId, 'editor');

    // Get the document to check ownership
    const { data: existingDocument, error: docError } =
      await projectDocumentsRepository.findById(documentId);

    if (docError || !existingDocument) {
      return { success: false, error: 'Document not found' };
    }

    // Check if user can delete this document
    const canDelete =
      existingDocument.author_id === user.id || ['admin', 'owner'].includes(permission.role);

    if (!canDelete) {
      return { success: false, error: 'Insufficient permissions to delete this document' };
    }

    const { data: success, error } = await projectDocumentsRepository.softDelete(documentId);

    if (error || !success) {
      return { success: false, error: error || 'Failed to delete document' };
    }

    // Sync snapshot data after deleting document
    try {
      await syncSnapshotData(projectId);
    } catch (syncError) {
      console.warn(`Failed to sync snapshot data for project ${projectId}:`, syncError);
      // Don't fail the request if sync fails
    }

    return { success: true, error: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
    return { success: false, error: errorMessage };
  }
}
