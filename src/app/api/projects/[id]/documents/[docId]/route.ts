import { createAPIHandlerWithParams } from '@/lib/api/base-handler';
import { requireAuth, requireProjectPermission, APIError } from '@/lib/api/middleware/auth';
import { ValidationSchemas } from '@/lib/validations';
import { projectDocumentsRepository } from '@/lib/supabase/repositories/project-documents';
import { syncSnapshotData } from '@/lib/utils/snapshot-sync';

// GET /api/projects/[id]/documents/[docId] - Get specific document
export const GET = createAPIHandlerWithParams(async (request, params) => {
  const { id: projectId, docId } = params;

  // Get the document first
  const { data: document, error: documentError } = await projectDocumentsRepository.findById(docId);

  if (documentError || !document) {
    throw new APIError('Document not found', 404);
  }

  // Verify document belongs to the project
  if (document.project_id !== projectId) {
    throw new APIError('Document not found', 404);
  }

  // Check if document is deleted
  if (document.deleted_at) {
    throw new APIError('Document not found', 404);
  }

  // Check access permissions
  if (!document.is_public) {
    // Private document - require authentication and project access
    const user = await requireAuth();
    await requireProjectPermission(user.id, projectId, 'viewer');
  }

  return { document };
});

// PUT /api/projects/[id]/documents/[docId] - Update document
export const PUT = createAPIHandlerWithParams(async (request, params) => {
  const user = await requireAuth();
  const { id: projectId, docId } = params;

  // Check project permissions
  const permission = await requireProjectPermission(user.id, projectId, 'editor');

  // Get the document to check ownership and existence
  const { data: existingDocument, error: docError } =
    await projectDocumentsRepository.findById(docId);

  if (docError || !existingDocument) {
    throw new APIError('Document not found', 404);
  }

  // Verify document belongs to the project
  if (existingDocument.project_id !== projectId) {
    throw new APIError('Document not found', 404);
  }

  // Check if document is deleted
  if (existingDocument.deleted_at) {
    throw new APIError('Document not found', 404);
  }

  // Check if user can edit this document (author or admin/owner)
  const canEdit =
    existingDocument.author_id === user.id || ['admin', 'owner'].includes(permission.role);

  if (!canEdit) {
    throw new APIError('Insufficient permissions to edit this document', 403);
  }

  // Validate request body
  const body = await request.json();
  const validatedData = ValidationSchemas.document.update.parse(body);

  if (validatedData.slug && validatedData.slug !== existingDocument.slug) {
    const { data: isSlugAvailable, error: slugError } =
      await projectDocumentsRepository.isSlugAvailable(projectId, validatedData.slug, docId);

    if (slugError) {
      throw new APIError('Failed to check slug availability', 500);
    }

    if (!isSlugAvailable) {
      throw new APIError('Slug already exists in this project', 400);
    }
  }

  // Update the document
  const { data: updatedDocument, error: updateError } = await projectDocumentsRepository.update(
    docId,
    validatedData,
  );

  if (updateError || !updatedDocument) {
    throw new APIError(updateError || 'Failed to update document', 500);
  }

  // Update snapshot contents to mark it as changed
  await syncSnapshotData(projectId);

  return { document: updatedDocument };
});

// DELETE /api/projects/[id]/documents/[docId] - Soft delete document
export const DELETE = createAPIHandlerWithParams(async (request, params) => {
  const user = await requireAuth();
  const { id: projectId, docId } = params;

  // Check project permissions
  const permission = await requireProjectPermission(user.id, projectId, 'editor');

  // Get the document to check ownership and existence
  const { data: existingDocument, error: docError } =
    await projectDocumentsRepository.findById(docId);

  if (docError || !existingDocument) {
    throw new APIError('Document not found', 404);
  }

  // Verify document belongs to the project
  if (existingDocument.project_id !== projectId) {
    throw new APIError('Document not found', 404);
  }

  // Check if document is already deleted
  if (existingDocument.deleted_at) {
    throw new APIError('Document not found', 404);
  }

  // Check if user can delete this document (author or admin/owner)
  const canDelete =
    existingDocument.author_id === user.id || ['admin', 'owner'].includes(permission.role);

  if (!canDelete) {
    throw new APIError('Insufficient permissions to delete this document', 403);
  }

  // Soft delete the document using the dedicated method
  const { data: deleteSuccess, error: deleteError } =
    await projectDocumentsRepository.softDelete(docId);

  if (deleteError) {
    console.error(`Failed to soft delete document ${docId}:`, deleteError);
    throw new APIError(`Failed to delete document: ${deleteError}`, 500);
  }

  if (!deleteSuccess) {
    console.error(`Soft delete returned false for document ${docId}`);
    throw new APIError('Failed to delete document: operation was not successful', 500);
  }

  // Update snapshot contents to mark it as changed
  try {
    await syncSnapshotData(projectId);
  } catch (syncError) {
    console.warn(`Failed to sync snapshot data for project ${projectId}:`, syncError);
    // Don't fail the delete operation if snapshot sync fails
  }

  return { success: true };
});
