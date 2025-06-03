'use client';

import { Heading, Container, Text, Box } from '@radix-ui/themes';
import NewProjectForm from '@/app/projects/new/NewProjectForm';

interface NewProjectPageContentProps {
  userFullName?: string;
  userEmail?: string;
}

export function NewProjectPageContent({ userFullName, userEmail }: NewProjectPageContentProps) {
  return (
    <Container size="2" py="6">
      <Box mb="6">
        <Heading size="6" mb="2">
          Create New Project
        </Heading>
        <Text size="2" color="gray">
          Create your project in a few simple steps. You can save your progress at any time and come
          back later.
        </Text>
      </Box>
      <NewProjectForm userFullName={userFullName} userEmail={userEmail} />
    </Container>
  );
}
