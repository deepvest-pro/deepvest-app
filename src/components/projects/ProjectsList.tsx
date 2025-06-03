'use client';

import Link from 'next/link';
import { PlusIcon } from '@radix-ui/react-icons';
import { Heading, Container, Text, Box, Button, Flex, Card } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import type { ProjectWithSnapshot } from '@/types/supabase';

interface ProjectsListProps {
  isAuthenticated: boolean;
}

interface ProjectsResponse {
  projects: (ProjectWithSnapshot & { role?: string | null })[];
}

export function ProjectsList({ isAuthenticated }: ProjectsListProps) {
  const [projects, setProjects] = useState<(ProjectWithSnapshot & { role?: string | null })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [isAuthenticated]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects');

      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.status}`);
      }

      const data: ProjectsResponse = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const renderProjectCard = (project: ProjectWithSnapshot & { role?: string | null }) => {
    const currentSnapshot = project.new_snapshot || project.public_snapshot;
    const projectName = currentSnapshot?.name || 'Unnamed Project';
    const projectDescription = currentSnapshot?.description || 'No description provided.';
    const projectStatus = currentSnapshot?.status || 'Unknown';

    const isUserProject = project.role !== null && project.role !== undefined;
    const isPublic = project.is_public;

    return (
      <Card key={project.id} variant="surface">
        <Box p="4">
          <Flex justify="between" align="start" mb="3">
            <Box>
              <Heading size="4" mb="1">
                <Link href={`/projects/${project.id}`} className="hover:underline">
                  {projectName}
                </Link>
              </Heading>
              <Flex align="center" gap="2" mb="1">
                <Text size="2" color="gray">
                  /{project.slug}
                </Text>
                {isUserProject && (
                  <Text
                    size="1"
                    style={{
                      backgroundColor: 'var(--blue-3)',
                      color: 'var(--blue-11)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '500',
                    }}
                  >
                    Your Project
                  </Text>
                )}
                {isUserProject && !isPublic && (
                  <Text
                    size="1"
                    style={{
                      backgroundColor: 'var(--orange-3)',
                      color: 'var(--orange-11)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '500',
                    }}
                  >
                    Private
                  </Text>
                )}
              </Flex>
            </Box>
          </Flex>

          <Text
            size="2"
            mb="3"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {projectDescription}
          </Text>

          <Flex justify="between" align="center">
            <Text size="1" color="gray">
              Status: {projectStatus}
            </Text>
            <Text size="1" color="gray">
              {project.created_at
                ? new Date(project.created_at).toLocaleDateString('en-GB')
                : 'Unknown date'}
            </Text>
          </Flex>
        </Box>
      </Card>
    );
  };

  return (
    <Container size="3" py="6">
      <Flex justify="between" align="center" mb="6">
        <Box>
          <Heading size="6" mb="2">
            Projects
          </Heading>
          <Text size="2" color="gray">
            {isAuthenticated
              ? 'Manage your projects and find investment opportunities'
              : 'Find investment opportunities or create your own project'}
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

      {loading ? (
        <Card variant="surface">
          <Box p="6">
            <Flex direction="column" align="center" justify="center" gap="4" py="8">
              <Text size="4">Loading projects...</Text>
            </Flex>
          </Box>
        </Card>
      ) : error ? (
        <Card variant="surface">
          <Box p="6">
            <Flex direction="column" align="center" justify="center" gap="4" py="8">
              <Text size="4" color="red">
                Error loading projects: {error}
              </Text>
              <Button onClick={loadProjects}>Try Again</Button>
            </Flex>
          </Box>
        </Card>
      ) : projects.length === 0 ? (
        <Card variant="surface">
          <Box p="6">
            <Flex direction="column" align="center" justify="center" gap="4" py="8">
              {isAuthenticated ? (
                <>
                  <Text size="5" weight="bold">
                    Start creating your first project!
                  </Text>
                  <Link href="/projects/new">
                    <Button size="3">
                      <PlusIcon /> Create New Project
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Text size="5" weight="bold">
                    No public projects available yet
                  </Text>
                  <Text size="3" color="gray">
                    Sign in to create your own project
                  </Text>
                  <Link href="/auth/sign-in?returnUrl=/projects">
                    <Button size="3">Sign In</Button>
                  </Link>
                </>
              )}
            </Flex>
          </Box>
        </Card>
      ) : (
        <Box>
          <Flex direction="column" gap="4">
            {projects.map(renderProjectCard)}
          </Flex>
        </Box>
      )}
    </Container>
  );
}
