'use client';

import { useState } from 'react';
import { Heading, Container, Text, Box, Flex, Button } from '@radix-ui/themes';
import { Pencil1Icon, UploadIcon } from '@radix-ui/react-icons';
import NewProjectForm from '@/app/projects/new/NewProjectForm';
import { ProjectCreationDropzone } from '@/components/project-edit';

interface NewProjectPageContentProps {
  userFullName?: string;
  userEmail?: string;
}

type CreationMode = 'dragdrop' | 'form';

export function NewProjectPageContent({ userFullName, userEmail }: NewProjectPageContentProps) {
  const [creationMode, setCreationMode] = useState<CreationMode>('dragdrop');

  return (
    <Container size="2" py="6">
      <Box mb="6">
        <Heading size="6" mb="2">
          Create New Project
        </Heading>
        <Text size="2" color="gray" mb="4">
          Choose how you want to create your project. You can upload a presentation for AI-powered
          extraction or use the simple form.
        </Text>

        <Flex justify="center" mb="4">
          <Button
            variant="outline"
            onClick={() => setCreationMode(creationMode === 'dragdrop' ? 'form' : 'dragdrop')}
            size="2"
          >
            {creationMode === 'dragdrop' ? (
              <>
                <Pencil1Icon width="16" height="16" />
                Switch to Simple Form
              </>
            ) : (
              <>
                <UploadIcon width="16" height="16" />
                Switch to Upload Presentation
              </>
            )}
          </Button>
        </Flex>
      </Box>

      {/* Content based on selected mode */}
      {creationMode === 'dragdrop' ? (
        <ProjectCreationDropzone />
      ) : (
        <NewProjectForm userFullName={userFullName} userEmail={userEmail} />
      )}
    </Container>
  );
}
