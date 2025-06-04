'use client';

import Link from 'next/link';
import { StarIcon } from '@radix-ui/react-icons';
import { Text, Box, Flex, Card, Badge, Button } from '@radix-ui/themes';
import type { LeaderboardProject } from '@/app/api/leaderboard/route';
import { LeaderboardFilters, LeaderboardPagination } from '@/components/leaderboard';
import { ResponsiveContainer } from '../../layout/ResponsiveContainer/ResponsiveContainer';
import { HeroSection } from '../../ui';
import styles from './LeaderboardDisplay.module.scss';

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
      <Link
        key={project.project_id}
        href={`/projects/${project.project_id}`}
        className={styles.projectLink}
      >
        <Card
          variant="surface"
          className={styles.projectCard}
          style={{
            background: 'var(--gradient-card)',
            border: '1px solid rgba(0, 168, 107, 0.1)',
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {/* Hover overlay */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'linear-gradient(135deg, rgba(0, 168, 107, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              zIndex: 1,
              pointerEvents: 'none',
            }}
            className={styles.hoverOverlay}
          />

          <Box p="3" style={{ position: 'relative', zIndex: 2 }}>
            <Flex gap="4" align="start">
              {/* Project Logo */}
              <Box style={{ flexShrink: 0 }}>
                <Box
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '12px',
                    background: 'var(--gradient-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                  }}
                  className={styles.projectLogo}
                >
                  <Text size="6" weight="bold" style={{ color: 'white' }}>
                    {project.project_name.charAt(0).toUpperCase()}
                  </Text>
                </Box>
              </Box>

              {/* Project Content */}
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Flex justify="between" align="start">
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Flex align="center" gap="2" mb="2">
                      <Text
                        size="5"
                        weight="bold"
                        style={{
                          color: 'var(--text-primary)',
                          lineHeight: '1.3',
                        }}
                        className={styles.projectTitle}
                      >
                        {project.project_name}
                      </Text>
                    </Flex>
                    <Flex align="center" gap="2" mb="3" wrap="wrap">
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

                    {project.project_slogan && (
                      <Text
                        size="3"
                        mb="4"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                        }}
                      >
                        {project.project_slogan}
                      </Text>
                    )}

                    {/* Quick Metrics - Single Horizontal Line */}
                    <Flex gap="6" wrap="wrap" mb="3" className={styles.quickMetrics}>
                      {project.investment_rating && (
                        <Text size="2" className={styles.metric}>
                          <Text style={{ color: 'var(--text-muted)' }}>Investment:</Text>{' '}
                          <Text weight="medium" style={{ color: 'var(--text-primary)' }}>
                            {project.investment_rating}
                          </Text>
                        </Text>
                      )}
                      {project.market_potential && (
                        <Text size="2" className={styles.metric}>
                          <Text style={{ color: 'var(--text-muted)' }}>Market:</Text>{' '}
                          <Text weight="medium" style={{ color: 'var(--text-primary)' }}>
                            {project.market_potential}
                          </Text>
                        </Text>
                      )}
                      {project.team_competency && (
                        <Text size="2" className={styles.metric}>
                          <Text style={{ color: 'var(--text-muted)' }}>Team:</Text>{' '}
                          <Text weight="medium" style={{ color: 'var(--text-primary)' }}>
                            {project.team_competency}
                          </Text>
                        </Text>
                      )}
                      {project.execution_risk && (
                        <Text size="2" className={styles.metric}>
                          <Text style={{ color: 'var(--text-muted)' }}>Risk:</Text>{' '}
                          <Text weight="medium" style={{ color: 'var(--text-primary)' }}>
                            {project.execution_risk}
                          </Text>
                        </Text>
                      )}
                    </Flex>

                    <Flex justify="between" align="center">
                      <Text size="2" style={{ color: 'var(--text-muted)' }}>
                        Last analyzed:{' '}
                        {new Date(project.scoring_created_at).toLocaleDateString('en-GB')}
                      </Text>
                    </Flex>
                  </Box>

                  {/* Rank and Score Display - Right Side */}
                  <Box className={styles.rankScoreDisplay}>
                    {/* Rank with Medal */}
                    <Flex direction="column" align="center" gap="1" mb="2">
                      {rank.emoji && <Text className={styles.rankEmoji}>{rank.emoji}</Text>}
                      <Text size="2" weight="bold" color={rank.color} className={styles.rankLabel}>
                        {rank.label}
                      </Text>
                    </Flex>

                    {/* Score Below Rank */}
                    <Box className={styles.scoreDisplay}>
                      <Text size="6" weight="bold" color="blue" className={styles.scoreValue}>
                        {project.score}
                      </Text>
                      <Text size="1" color="gray" className={styles.scoreMax}>
                        /100
                      </Text>
                    </Box>
                  </Box>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </Card>
      </Link>
    );
  };

  if (error) {
    return (
      <Box>
        {/* Hero Section */}
        <HeroSection
          title="PROJECT LEADERBOARD"
          subtitle="DeepVest Rankings"
          description="Discover the highest-scoring startups on DeepVest, ranked by our AI analysis"
        />

        <ResponsiveContainer size="4" py="8">
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
        </ResponsiveContainer>
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection
        title="PROJECT LEADERBOARD"
        subtitle="DeepVest Rankings"
        description="Discover the highest-scoring startups on DeepVest, ranked by our AI analysis"
      />

      <ResponsiveContainer size="4" py="8">
        {/* Section Header with Filters */}
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
              🏆 Top Performing Projects
            </Text>
            <Text size="3" style={{ color: 'var(--text-secondary)' }}>
              Projects ranked by our comprehensive AI analysis
            </Text>
          </Box>

          {/* Filters Component */}
          <LeaderboardFilters />
        </Flex>

        {/* Projects List */}
        <Flex direction="column" gap="4">
          {projects.length === 0 ? (
            <Card variant="surface">
              <Box p="6" className={styles.emptyState}>
                <Flex direction="column" align="center" justify="center" gap="4" py="8">
                  <Text size="4" className={styles.emptyTitle}>
                    No projects found
                  </Text>
                  <Text size="2" color="gray" className={styles.emptyDescription}>
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
        <Box className={styles.footer}>
          <Flex direction="column" align="center" gap="2">
            <Text size="1" color="gray" className={styles.footerText}>
              Rankings are updated automatically based on our AI analysis. Last updated:{' '}
              {new Date().toLocaleDateString('en-GB')}
            </Text>
          </Flex>
        </Box>
      </ResponsiveContainer>
    </Box>
  );
}
