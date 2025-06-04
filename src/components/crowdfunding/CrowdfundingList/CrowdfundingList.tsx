'use client';

import React from 'react';
import { Box, Text, Heading, Button } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import type { CrowdfundingProject, CrowdfundingStats } from '@/types/crowdfunding';
import { CrowdfundingCard } from '../CrowdfundingCard/CrowdfundingCard';
import styles from './CrowdfundingList.module.scss';

interface CrowdfundingListProps {
  projects: CrowdfundingProject[];
  stats: CrowdfundingStats;
}

export function CrowdfundingList({ projects, stats }: CrowdfundingListProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M USDC`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K USDC`;
    }
    return `${amount.toLocaleString()} USDC`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  return (
    <Box className={styles.container}>
      {/* Header */}
      <Box className={styles.header}>
        <Heading className={styles.title}>Crowdfunding Projects</Heading>
        <Text className={styles.subtitle}>
          Discover and invest in innovative projects that are shaping the future. Join thousands of
          investors supporting breakthrough ideas.
        </Text>

        {/* Stats */}
        <Box className={styles.stats} mt="3">
          <Box className={styles.stat}>
            <Text className={styles.statValue}>{stats.totalProjects}</Text>
            <Text className={styles.statLabel}>Total Projects</Text>
          </Box>

          <Box className={styles.stat}>
            <Text className={styles.statValue}>{formatCurrency(stats.totalRaised)}</Text>
            <Text className={styles.statLabel}>Total Raised</Text>
          </Box>

          <Box className={styles.stat}>
            <Text className={styles.statValue}>{formatNumber(stats.totalInvestors)}</Text>
            <Text className={styles.statLabel}>Total Investors</Text>
          </Box>

          <Box className={styles.stat}>
            <Text className={styles.statValue}>{stats.successRate}%</Text>
            <Text className={styles.statLabel}>Success Rate</Text>
          </Box>
        </Box>
      </Box>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <Box className={styles.grid}>
          {projects.map(project => (
            <CrowdfundingCard key={project.id} project={project} />
          ))}
        </Box>
      ) : (
        <Box className={styles.emptyState}>
          <MagnifyingGlassIcon width="48" height="48" className={styles.emptyIcon} />
          <Heading className={styles.emptyTitle}>No projects found</Heading>
          <Text className={styles.emptyDescription}>
            No crowdfunding projects available at the moment.
          </Text>
        </Box>
      )}

      {/* Load More (placeholder for future pagination) */}
      {projects.length > 0 && projects.length >= 6 && (
        <Box className={styles.loadMore}>
          <Button size="3" disabled>
            Load More Projects
          </Button>
        </Box>
      )}
    </Box>
  );
}
