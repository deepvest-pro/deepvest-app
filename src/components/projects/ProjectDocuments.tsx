'use client';

import React, { useState, useEffect } from 'react';
import { Box, Text, Heading } from '@radix-ui/themes';
import { ProjectContentWithAuthor } from '@/types/supabase';
import { DocumentsDisplay } from '../forms/DocumentsDisplay';

interface ProjectDocumentsProps {
  projectId: string;
}

export function ProjectDocuments({ projectId }: ProjectDocumentsProps) {
  const [documents, setDocuments] = useState<ProjectContentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/documents?public_only=true`);

        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        console.error('Error fetching public documents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchPublicDocuments();
    }
  }, [projectId]);

  if (loading) {
    return (
      <Box>
        <Heading size="4" mb="4">
          Documents
        </Heading>
        <Text size="2" color="gray">
          Loading documents...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Heading size="4" mb="4">
          Documents
        </Heading>
        <Text size="2" color="red">
          {error}
        </Text>
      </Box>
    );
  }

  // Don't render the section if there are no public documents
  if (documents.length === 0) {
    return null;
  }

  return (
    <Box>
      <Heading size="4" mb="4">
        Documents
      </Heading>
      <DocumentsDisplay
        documents={documents}
        showActions={false}
        canEdit={false}
        emptyMessage="No public documents available"
      />
    </Box>
  );
}
