'use client';

import Link from 'next/link';
import { PlusIcon } from '@radix-ui/react-icons';
import { Text, Box, Button, Flex, Card } from '@radix-ui/themes';
import { useApiQuery, QUERY_KEYS } from '@/hooks';
import type { ProjectWithSnapshot } from '@/types';
import { ResponsiveContainer } from '../../layout/ResponsiveContainer/ResponsiveContainer';
import { HeroSection } from '../../ui';
import { ProjectCard } from '@/components/projects';

interface ProjectsListProps {
  isAuthenticated: boolean;
  initialProjects?: (ProjectWithSnapshot & { role?: string | null })[];
  error?: string | null;
}

interface ProjectsAPIResponse {
  projects: (ProjectWithSnapshot & { role?: string | null })[];
}

export function ProjectsList({
  isAuthenticated,
  initialProjects = [],
  error: initialError = null,
}: ProjectsListProps) {
  // Use new API hook with fallback to initial data
  const {
    data: apiData,
    isLoading: loading,
    error: apiError,
  } = useApiQuery<ProjectsAPIResponse>('/projects', {
    queryKey: QUERY_KEYS.projects.all,
    enabled: initialProjects.length === 0 && !initialError, // Only fetch if no initial data
  });

  // Use API data if available, otherwise use initial data
  const projects = apiData?.projects || initialProjects;
  const error = apiError || initialError;

  // Calculate stats for hero section
  const stats = [
    { value: `${projects.length}+`, label: 'Active Projects' },
    { value: '100K+', label: 'Total Investment' },
    { value: '50+', label: 'Success Stories' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection
        title="DISCOVER & INVEST IN INNOVATIVE PROJECTS"
        subtitle="Investment Platform"
        description={
          isAuthenticated
            ? 'Manage your projects and discover new investment opportunities in our growing ecosystem.'
            : 'Join our platform to discover innovative projects and start your investment journey today.'
        }
        showCTA={isAuthenticated}
        ctaText="Create New Project"
        ctaHref="/projects/new"
        stats={stats}
      />

      {/* Projects Content */}
      <ResponsiveContainer size="4" py="8">
        {/* Section Header */}
        <Flex justify="between" align="center" mb="8">
          <Box>
            <Text
              size="6"
              weight="bold"
              style={{
                color: 'var(--text-primary)',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              Featured Projects
            </Text>
            <Text size="3" style={{ color: 'var(--text-secondary)' }}>
              {isAuthenticated
                ? 'Manage your projects and explore new opportunities'
                : 'Discover innovative projects seeking investment'}
            </Text>
          </Box>

          {isAuthenticated && (
            <Link href="/projects/new">
              <Button
                size="3"
                style={{
                  background: 'var(--gradient-accent)',
                  border: 'none',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(0, 168, 107, 0.25)',
                }}
              >
                <PlusIcon /> Create Project
              </Button>
            </Link>
          )}
        </Flex>

        {loading ? (
          <Card
            variant="surface"
            style={{
              background: 'var(--gradient-card)',
              border: '1px solid rgba(0, 168, 107, 0.1)',
              borderRadius: '16px',
            }}
          >
            <Box p="8">
              <Flex direction="column" align="center" justify="center" gap="4" py="8">
                <Text size="4" style={{ color: 'var(--text-secondary)' }}>
                  Loading projects...
                </Text>
              </Flex>
            </Box>
          </Card>
        ) : error ? (
          <Card
            variant="surface"
            style={{
              background: 'var(--gradient-card)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '16px',
            }}
          >
            <Box p="8">
              <Flex direction="column" align="center" justify="center" gap="4" py="8">
                <Text size="4" style={{ color: 'var(--error)' }}>
                  Error loading projects: {error}
                </Text>
                <Button
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'var(--gradient-accent)',
                    border: 'none',
                  }}
                >
                  Try Again
                </Button>
              </Flex>
            </Box>
          </Card>
        ) : projects.length === 0 ? (
          <Card
            variant="surface"
            style={{
              background: 'var(--gradient-card)',
              border: '1px solid rgba(0, 168, 107, 0.1)',
              borderRadius: '16px',
            }}
          >
            <Box p="8">
              <Flex direction="column" align="center" justify="center" gap="6" py="8">
                {isAuthenticated ? (
                  <>
                    <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
                      Start creating your first project!
                    </Text>
                    <Link href="/projects/new">
                      <Button
                        size="3"
                        style={{
                          background: 'var(--gradient-accent)',
                          border: 'none',
                          fontWeight: '500',
                        }}
                      >
                        <PlusIcon /> Create New Project
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Text size="5" weight="bold" style={{ color: 'var(--text-primary)' }}>
                      No public projects available yet
                    </Text>
                    <Text size="3" style={{ color: 'var(--text-secondary)' }}>
                      Sign in to create your own project
                    </Text>
                    <Link href="/auth/sign-in?returnUrl=/projects">
                      <Button
                        size="3"
                        style={{
                          background: 'var(--gradient-accent)',
                          border: 'none',
                        }}
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </Flex>
            </Box>
          </Card>
        ) : (
          <Box>
            <Box
              className="responsive-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                gap: '24px',
              }}
            >
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </Box>
          </Box>
        )}
      </ResponsiveContainer>
    </Box>
  );
}
