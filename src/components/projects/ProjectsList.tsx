'use client';

import Link from 'next/link';
import { PlusIcon } from '@radix-ui/react-icons';
import { Heading, Container, Text, Box, Button, Flex, Card } from '@radix-ui/themes';

interface ProjectsListProps {
  isAuthenticated: boolean;
}

export function ProjectsList({ isAuthenticated }: ProjectsListProps) {
  return (
    <Container size="3" py="6">
      <Flex justify="between" align="center" mb="6">
        <Box>
          <Heading size="6" mb="2">
            Projects
          </Heading>
          <Text size="2" color="gray">
            Find investment opportunities or create your own project
          </Text>
        </Box>

        {isAuthenticated && (
          <Link href="/projects/new">
            <Button size="3">
              <PlusIcon /> Create New Project
            </Button>
          </Link>
        )}
      </Flex>

      <Card variant="surface">
        <Box p="6">
          <Flex direction="column" align="center" justify="center" gap="4" py="8">
            <Text size="5" weight="bold">
              {isAuthenticated
                ? 'Start creating your first project!'
                : 'Sign in to create projects or view your existing ones'}
            </Text>

            {isAuthenticated ? (
              <Link href="/projects/new">
                <Button size="3">
                  <PlusIcon /> Create New Project
                </Button>
              </Link>
            ) : (
              <Link href="/auth/sign-in?returnUrl=/projects">
                <Button size="3">Sign In</Button>
              </Link>
            )}
          </Flex>
        </Box>
      </Card>
    </Container>
  );
}
