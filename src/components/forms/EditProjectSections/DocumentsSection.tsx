'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Card, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { FileTextIcon, PlusIcon } from '@radix-ui/react-icons';
import { ProjectContentWithAuthor } from '@/types/supabase';
import { useToastHelpers } from '@/components/layout/ToastProvider';
import { DocumentsList } from '@/components/forms/DocumentsList';
import { DocumentForm } from '@/components/forms/DocumentForm';

interface DocumentsSectionProps {
  projectId: string;
}

type ViewMode = 'list' | 'create' | 'edit';

interface DocumentFormData {
  title: string;
  slug: string;
  content_type: string;
  content?: string;
  is_public: boolean;
}

export function DocumentsSection({ projectId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<ProjectContentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingDocument, setEditingDocument] = useState<ProjectContentWithAuthor | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const { success: showSuccessToast, error: showErrorToast } = useToastHelpers();
  const showErrorToastRef = useRef(showErrorToast);
  showErrorToastRef.current = showErrorToast;

  // Load documents on component mount
  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/documents`);

      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);

      // Check if user can edit (this would normally come from project permissions)
      // For now, we'll assume they can edit if the API call succeeds
      setCanEdit(true);
    } catch (error) {
      console.error('Error loading documents:', error);
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
      setIsSubmitting(true);

      // First, upload the files
      const uploadPromises = files.map(async file => {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('uploadType', 'document');

        const uploadResponse = await fetch(`/api/projects/${projectId}/upload`, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const uploadData = await uploadResponse.json();
        // Use fileUrl instead of url, and ensure it's not null
        return uploadData.fileUrl || uploadData.url;
      });

      const fileUrls = await Promise.all(uploadPromises);

      // Filter out any null/undefined URLs
      const validFileUrls = fileUrls.filter(url => url != null);

      if (validFileUrls.length === 0) {
        throw new Error('No valid file URLs received from upload');
      }

      // Then create the document record
      const documentData = {
        ...formData,
        file_urls: validFileUrls,
      };

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create document');
      }

      const data = await response.json();
      setDocuments(prev => [data.document, ...prev]);
      setViewMode('list');
      showSuccessToast('Document created successfully');
    } catch (error: unknown) {
      console.error('Error creating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create document';
      showErrorToast(errorMessage);
      throw error; // Re-throw to handle in form
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDocument = async (formData: DocumentFormData) => {
    if (!editingDocument) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/projects/${projectId}/documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update document');
      }

      const data = await response.json();
      setDocuments(prev => prev.map(doc => (doc.id === editingDocument.id ? data.document : doc)));
      setViewMode('list');
      setEditingDocument(null);
      showSuccessToast('Document updated successfully');
    } catch (error: unknown) {
      console.error('Error updating document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update document';
      showErrorToast(errorMessage);
      throw error; // Re-throw to handle in form
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      showSuccessToast('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      showErrorToast('Failed to delete document');
    }
  };

  const handleToggleVisibility = async (documentId: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_public: isPublic }),
      });

      if (!response.ok) {
        throw new Error('Failed to update document visibility');
      }

      const data = await response.json();
      setDocuments(prev => prev.map(doc => (doc.id === documentId ? data.document : doc)));
      showSuccessToast(`Document made ${isPublic ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Error updating document visibility:', error);
      showErrorToast('Failed to update document visibility');
    }
  };

  const handleEditClick = (document: ProjectContentWithAuthor) => {
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
              canEdit={canEdit}
            />
          )}

          {viewMode === 'create' && (
            <DocumentForm
              onSubmit={handleCreateDocument}
              onCancel={handleCancelForm}
              isLoading={isSubmitting}
            />
          )}

          {viewMode === 'edit' && editingDocument && (
            <DocumentForm
              document={editingDocument}
              onSubmit={formData => handleEditDocument(formData)}
              onCancel={handleCancelForm}
              isLoading={isSubmitting}
            />
          )}
        </Flex>
      </Box>
    </Card>
  );
}
