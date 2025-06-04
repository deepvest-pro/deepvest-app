'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Card, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { FileTextIcon, PlusIcon } from '@radix-ui/react-icons';
import type { ProjectDocumentWithAuthor } from '@/lib/supabase/repositories/project-documents';
import { TranscribeRequest, TranscribeResponse } from '@/types/transcribe';
import { getPrompt } from '@/lib/prompts';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import { DocumentsList } from '@/components/forms/DocumentsList';
import { DocumentForm } from '@/components/forms/DocumentForm';
import { useUploadMutation, useApiMutation } from '@/hooks';
import {
  getProjectDocuments,
  createProjectDocument,
  updateProjectDocument,
  deleteProjectDocument,
} from '@/lib/actions/documents';

interface DocumentsSectionProps {
  projectId: string;
}

type ViewMode = 'list' | 'create' | 'edit';

interface DocumentFormData {
  title: string;
  slug: string;
  content_type: string;
  description?: string;
  is_public: boolean;
}

export function DocumentsSection({ projectId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<ProjectDocumentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingDocument, setEditingDocument] = useState<ProjectDocumentWithAuthor | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [transcribingDocuments, setTranscribingDocuments] = useState<Set<string>>(new Set());

  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const showErrorToastRef = useRef(showErrorToast);
  showErrorToastRef.current = showErrorToast;

  // Mutations using new hooks
  const uploadMutation = useUploadMutation<{ fileUrl?: string; url?: string }>(
    `/projects/${projectId}/upload`,
    {
      onError: error => showErrorToast(`Upload failed: ${error}`),
    },
  );

  const transcribeMutation = useApiMutation<TranscribeResponse, TranscribeRequest>(
    '/transcribe',
    'POST',
    {
      onError: error => showErrorToast(`Transcription failed: ${error}`),
    },
  );

  // Load documents on component mount using Server Action
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);

      const { documents: loadedDocuments, error } = await getProjectDocuments(projectId);

      if (error) {
        throw new Error(error);
      }

      setDocuments(loadedDocuments || []);
      setCanEdit(true);
    } catch {
      showErrorToastRef.current('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleCreateDocument = async (formData: DocumentFormData, files: File[]) => {
    try {
      const uploadPromises = files.map(async file => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('uploadType', 'document');

        return uploadMutation.mutateAsync(formDataUpload);
      });

      const uploadResults = await Promise.all(uploadPromises);
      const validFileUrls = uploadResults
        .map(result => result.fileUrl || result.url)
        .filter(url => url != null);

      if (validFileUrls.length === 0) {
        throw new Error('No valid file URLs received from upload');
      }

      const documentData = {
        ...formData,
        file_urls: validFileUrls,
      };

      const { document, error } = await createProjectDocument(projectId, documentData);

      if (error) {
        throw new Error(error);
      }

      if (document) {
        setDocuments(prev => [document, ...prev]);
      }
      setViewMode('list');
      showSuccessToast('Document created successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';
      showErrorToast(errorMessage);
      throw error;
    }
  };

  const handleEditDocument = async (formData: DocumentFormData) => {
    if (!editingDocument) return;

    try {
      const { document, error } = await updateProjectDocument(
        projectId,
        editingDocument.id,
        formData,
      );

      if (error) {
        throw new Error(error);
      }

      if (document) {
        setDocuments(prev => prev.map(doc => (doc.id === editingDocument.id ? document : doc)));
      }
      setViewMode('list');
      setEditingDocument(null);
      showSuccessToast('Document updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update document';
      showErrorToast(errorMessage);
      throw error;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { success, error } = await deleteProjectDocument(projectId, documentId);

      if (!success || error) {
        throw new Error(error || 'Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      showSuccessToast('Document deleted successfully');
    } catch {
      showErrorToast('Failed to delete document');
    }
  };

  const handleToggleVisibility = async (documentId: string, isPublic: boolean) => {
    try {
      const { document, error } = await updateProjectDocument(projectId, documentId, {
        is_public: isPublic,
      });

      if (error) {
        throw new Error(error);
      }

      if (document) {
        setDocuments(prev => prev.map(doc => (doc.id === documentId ? document : doc)));
      }
      showSuccessToast(`Document made ${isPublic ? 'public' : 'private'}`);
    } catch {
      showErrorToast('Failed to update document visibility');
    }
  };

  const handleGetContent = async (document: ProjectDocumentWithAuthor) => {
    if (!document.file_urls.length) {
      showErrorToast('No file available for transcription');
      return;
    }

    try {
      setTranscribingDocuments(prev => new Set(prev).add(document.id));
      showSuccessToast('Starting content extraction...');

      const transcribeRequest: TranscribeRequest = {
        url: document.file_urls[0],
        prompt: getPrompt('DOCUMENT_CONTENT_EXTRACTION'),
      };

      const response = await transcribeMutation.mutateAsync(transcribeRequest);

      const { document: updatedDocument, error } = await updateProjectDocument(
        projectId,
        document.id,
        { content: response.result },
      );

      if (error) {
        throw new Error(error);
      }

      if (updatedDocument) {
        setDocuments(prev => prev.map(doc => (doc.id === document.id ? updatedDocument : doc)));
      }

      showSuccessToast('Content extracted and saved successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract content';
      showErrorToast(errorMessage);
    } finally {
      setTranscribingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(document.id);
        return newSet;
      });
    }
  };

  const handleEditClick = (document: ProjectDocumentWithAuthor) => {
    setEditingDocument(document);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setEditingDocument(null);
  };

  if (isLoading) {
    return (
      <Card size="3">
        <Box p="5">
          <Flex direction="column" gap="5">
            <Flex align="center" gap="2" mb="3">
              <FileTextIcon width="20" height="20" color="var(--blue-9)" />
              <Heading size="5">Documents</Heading>
            </Flex>
            <Text>Loading documents...</Text>
          </Flex>
        </Box>
      </Card>
    );
  }

  return (
    <Card size="3">
      <Box p="5">
        <Flex direction="column" gap="5">
          {/* Header */}
          <Flex align="center" justify="between" mb="3">
            <Flex align="center" gap="2">
              <FileTextIcon width="20" height="20" color="var(--blue-9)" />
              <Heading size="5">Documents</Heading>
              {documents.length > 0 && (
                <Text size="2" color="gray">
                  ({documents.length})
                </Text>
              )}
            </Flex>

            {canEdit && viewMode === 'list' && (
              <Button onClick={() => setViewMode('create')}>
                <PlusIcon width="16" height="16" />
                Add Document
              </Button>
            )}
          </Flex>

          {/* Content based on view mode */}
          {viewMode === 'list' && (
            <DocumentsList
              documents={documents}
              onEdit={handleEditClick}
              onDelete={handleDeleteDocument}
              onToggleVisibility={handleToggleVisibility}
              onGetContent={handleGetContent}
              transcribingDocuments={transcribingDocuments}
              canEdit={canEdit}
            />
          )}

          {viewMode === 'create' && (
            <DocumentForm
              onSubmit={handleCreateDocument}
              onCancel={handleCancelForm}
              isLoading={uploadMutation.isPending}
            />
          )}

          {viewMode === 'edit' && editingDocument && (
            <DocumentForm
              document={editingDocument}
              onSubmit={formData => handleEditDocument(formData)}
              onCancel={handleCancelForm}
              isLoading={false} // Edit doesn't require uploads
            />
          )}
        </Flex>
      </Box>
    </Card>
  );
}
