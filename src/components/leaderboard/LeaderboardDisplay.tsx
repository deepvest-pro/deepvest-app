'use client';

import Link from 'next/link';
import { StarIcon } from '@radix-ui/react-icons';
import { Heading, Container, Text, Box, Button, Flex, Card, Badge } from '@radix-ui/themes';
import type { LeaderboardProject } from '@/app/api/leaderboard/route';
import { LeaderboardFilters } from './LeaderboardFilters';
import { LeaderboardPagination } from './LeaderboardPagination';

interface LeaderboardResponse {
  projects: LeaderboardProject[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface LeaderboardDisplayProps {
  initialData: LeaderboardResponse | null;
  error: string | null;
  currentPage?: number;
}

export function LeaderboardDisplay({
  initialData,
  error,
  currentPage = 1,
}: LeaderboardDisplayProps) {
  const projects = initialData?.projects || [];

  const getRankDisplay = (index: number) => {
    const globalRank = (initialData?.pagination.offset || 0) + index + 1;

    if (globalRank === 1) {
      return { emoji: '🥇', label: '#1', color: 'amber' as const };
    } else if (globalRank === 2) {
      return { emoji: '🥈', label: '#2', color: 'gray' as const };
    } else if (globalRank === 3) {
      return { emoji: '🥉', label: '#3', color: 'orange' as const };
    }

    return { emoji: null, label: `#${globalRank}`, color: 'gray' as const };
  };

  const renderProjectCard = (project: LeaderboardProject, index: number) => {
    const rank = getRankDisplay(index);

    return (
      <Card key={project.project_id} variant="surface">
        <Box p="4">
          <Flex gap="4" align="start">
            {/* Rank Display */}
            <Box style={{ flexShrink: 0, width: '60px' }}>
              <Flex direction="column" align="center" gap="1">
                {rank.emoji && <Text style={{ fontSize: '24px' }}>{rank.emoji}</Text>}
                <Text size="3" weight="bold" color={rank.color}>
                  {rank.label}
                </Text>
              </Flex>
            </Box>

            {/* Project Content */}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Flex justify="between" align="start" mb="3">
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Heading size="4" mb="1">
                    <Link href={`/projects/${project.project_id}`} className="hover:underline">
                      {project.project_name}
                    </Link>
                  </Heading>

                  <Flex align="center" gap="2" mb="2" wrap="wrap">
                    <Badge variant="soft" size="2">
                      {project.project_status}
                    </Badge>

                    <Badge variant="soft" size="1" color="blue">
                      <Flex gap="1" align="center">
                        <StarIcon />
                        <Text>v{project.snapshot_version}</Text>
                      </Flex>
                    </Badge>
                  </Flex>
                </Box>

                {/* Score Display */}
                <Box style={{ textAlign: 'right', flexShrink: 0 }}>
                  <Text size="6" weight="bold" color="blue" style={{ lineHeight: 1 }}>
                    {project.score}
                  </Text>
                  <Text size="2" color="gray">
                    /100
                  </Text>
                </Box>
              </Flex>

              {project.project_slogan && (
                <Text
                  size="2"
                  mb="3"
                  color="gray"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {project.project_slogan}
                </Text>
              )}

              {/* Quick Metrics */}
              <Flex gap="4" wrap="wrap" mb="2">
                {project.investment_rating && (
                  <Text size="1" color="gray">
                    Investment: <strong>{project.investment_rating}</strong>
                  </Text>
                )}
                {project.market_potential && (
                  <Text size="1" color="gray">
                    Market: <strong>{project.market_potential}</strong>
                  </Text>
                )}
                {project.team_competency && (
                  <Text size="1" color="gray">
                    Team: <strong>{project.team_competency}</strong>
                  </Text>
                )}
                {project.execution_risk && (
                  <Text size="1" color="gray">
                    Risk: <strong>{project.execution_risk}</strong>
                  </Text>
                )}
              </Flex>

              <Flex justify="between" align="center">
                <Text size="1" color="gray">
                  Last analyzed: {new Date(project.scoring_created_at).toLocaleDateString('en-GB')}
                </Text>

                <Link href={`/projects/${project.project_id}`}>
                  <Button variant="soft" size="1">
                    View Project
                  </Button>
                </Link>
              </Flex>
            </Box>
          </Flex>
        </Box>
      </Card>
    );
  };

  if (error) {
    return (
      <Container size="3" py="6">
        <Card variant="surface">
          <Box p="6">
            <Flex direction="column" align="center" justify="center" gap="4" py="8">
              <Text size="4" color="red">
                Failed to load leaderboard
              </Text>
              <Text size="2" color="gray">
                {error}
              </Text>
              <Link href="/leaderboard">
                <Button>Reload Page</Button>
              </Link>
            </Flex>
          </Box>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="3" py="6">
      {/* Header */}
      <Flex justify="between" align="center" mb="6">
        <Box>
          <Heading size="6" mb="2">
            🏆 Project Leaderboard
          </Heading>
          <Text size="2" color="gray">
            Discover the highest-scoring startups on DeepVest, ranked by our AI analysis
          </Text>
        </Box>

        {/* Filters Component */}
        <LeaderboardFilters />
      </Flex>

      {/* Projects List */}
      <Flex direction="column" gap="4">
        {projects.length === 0 ? (
          <Card variant="surface">
            <Box p="6">
              <Flex direction="column" align="center" justify="center" gap="4" py="8">
                <Text size="4">No projects found</Text>
                <Text size="2" color="gray">
                  No projects match the current criteria. Try adjusting your filters or check back
                  later.
                </Text>
                <Link href="/leaderboard">
                  <Button variant="soft">Show All Projects</Button>
                </Link>
              </Flex>
            </Box>
          </Card>
        ) : (
          projects.map((project, index) => renderProjectCard(project, index))
        )}
      </Flex>

      {/* Pagination */}
      {projects.length > 0 && initialData && (
        <LeaderboardPagination
          currentPage={currentPage}
          hasMore={initialData.pagination.hasMore}
          totalShown={projects.length}
          offset={initialData.pagination.offset}
        />
      )}

      {/* Footer */}
      <Box mt="8" pt="4" style={{ borderTop: '1px solid var(--gray-6)' }}>
        <Flex direction="column" align="center" gap="2">
          <Text size="1" color="gray">
            Rankings are updated automatically based on our AI analysis. Last updated:{' '}
            {new Date().toLocaleDateString('en-GB')}
          </Text>
        </Flex>
      </Box>
    </Container>
  );
}
