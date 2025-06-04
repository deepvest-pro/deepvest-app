'use client';

import { Box, Heading } from '@radix-ui/themes';
import type { ProjectDocumentWithAuthor } from '@/lib/supabase/repositories/project-documents';
import { DocumentsDisplay } from '@/components/projects';

interface ProjectDocumentsProps {
  documents: ProjectDocumentWithAuthor[];
}

export function ProjectDocuments({ documents }: ProjectDocumentsProps) {
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return (
      <Box>
        <Heading size="4" mb="3">
          Documents
        </Heading>
        <DocumentsDisplay
          documents={[]}
          showActions={false}
          canEdit={false}
          emptyMessage="No public documents available for this project."
        />
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="4" mb="4">
        Documents ({documents.length})
      </Heading>

      <DocumentsDisplay
        documents={documents}
        showActions={false}
        canEdit={false}
        onGetContent={() => {}} // Enable "Show content" button for documents with content
      />
    </Box>
  );
}
