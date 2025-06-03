'use client';

import { Box, Heading } from '@radix-ui/themes';
import { ProjectContentWithAuthor } from '@/types/supabase';
import { DocumentsDisplay } from '@/components/forms/DocumentsDisplay';

interface ProjectDocumentsProps {
  documents: ProjectContentWithAuthor[];
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
        onGetContent={() => {}} // Включаем показ кнопки "Show content" для документов с контентом
      />
    </Box>
  );
}
