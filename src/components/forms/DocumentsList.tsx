'use client';

import { useState } from 'react';
import { Flex, Button, AlertDialog } from '@radix-ui/themes';
import { ProjectContentWithAuthor } from '@/types/supabase';
import { DocumentsDisplay } from './DocumentsDisplay';

interface DocumentsListProps {
  documents: ProjectContentWithAuthor[];
  onEdit: (document: ProjectContentWithAuthor) => void;
  onDelete: (documentId: string) => void;
  onToggleVisibility: (documentId: string, isPublic: boolean) => void;
  onGetContent?: (document: ProjectContentWithAuthor) => void;
  transcribingDocuments?: Set<string>;
  canEdit?: boolean;
}

export function DocumentsList({
  documents,
  onEdit,
  onDelete,
  onToggleVisibility,
  onGetContent,
  transcribingDocuments,
  canEdit = false,
}: DocumentsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      onDelete(documentToDelete);
      setDocumentToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <DocumentsDisplay
        documents={documents}
        showActions={true}
        onEdit={onEdit}
        onDelete={handleDeleteClick}
        onToggleVisibility={onToggleVisibility}
        onGetContent={onGetContent}
        transcribingDocuments={transcribingDocuments}
        canEdit={canEdit}
        emptyMessage="No documents uploaded yet"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Document</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this document? This action cannot be undone.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
