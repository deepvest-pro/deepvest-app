'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, Box, Flex, Text, Avatar } from '@radix-ui/themes';
import { ArrowTopRightIcon, GlobeIcon } from '@radix-ui/react-icons';
import type { CrowdfundingProject } from '@/types/crowdfunding';
import styles from './CrowdfundingCard.module.scss';

interface CrowdfundingCardProps {
  project: CrowdfundingProject;
}

export function CrowdfundingCard({ project }: CrowdfundingCardProps) {
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
    <Link href={`/crowdfunding/${project.id}`} className="block">
      <Card className={styles.card}>
        {/* Hover overlay */}
        <Box className={styles.hoverOverlay} />

        {/* Status badge */}
        <Box className={`${styles.statusBadge} ${styles[project.status]}`}>{project.status}</Box>

        {/* Banner */}
        <Box className={styles.banner}>
          {project.bannerUrl ? (
            <Image
              src={project.bannerUrl}
              alt={`${project.name} banner`}
              fill
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <Box
              style={{
                background:
                  'linear-gradient(135deg, var(--flow-green) 0%, var(--gradient-blue) 100%)',
                width: '100%',
                height: '100%',
              }}
            />
          )}
        </Box>

        {/* Content */}
        <Box className={styles.content}>
          {/* Header with logo and title */}
          <Flex className={styles.header}>
            <Box className={styles.logo}>
              {project.logoUrl ? (
                <Image
                  src={project.logoUrl}
                  alt={`${project.name} logo`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <Avatar
                  size="4"
                  fallback={project.name.charAt(0)}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </Box>

            <Box className={styles.projectInfo}>
              <Flex className={styles.titleRow}>
                <Text className={styles.title}>{project.name}</Text>
                <ArrowTopRightIcon width="16" height="16" className={styles.arrowIcon} />
              </Flex>

              <Flex className={styles.location}>
                <GlobeIcon width="14" height="14" />
                <Text>{project.country}</Text>
              </Flex>

              <Box className={styles.category}>{project.category}</Box>
            </Box>
          </Flex>

          {/* Description */}
          <Text className={styles.description}>{project.description}</Text>

          {/* Progress */}
          <Box className={styles.progress}>
            <Flex className={styles.progressHeader}>
              <Text className={styles.progressLabel}>Raised</Text>
              <Text className={styles.progressPercentage}>
                {project.percentage}% - {project.daysLeft} days left
              </Text>
            </Flex>

            <Box className={styles.progressBar}>
              <Box
                className={`${styles.progressFill} ${styles[project.status]}`}
                style={{ width: `${Math.min(project.percentage, 100)}%` }}
              />
            </Box>
          </Box>

          {/* Metrics */}
          <Flex className={styles.metrics}>
            <Box className={styles.metric}>
              <Text className={styles.metricLabel}>Valuation</Text>
              <Text className={styles.metricValue}>{formatCurrency(project.raised)}</Text>
            </Box>

            <Box className={styles.metric}>
              <Text className={styles.metricLabel}>Target</Text>
              <Text className={styles.metricValue}>{formatCurrency(project.target)}</Text>
            </Box>

            <Box className={styles.metric}>
              <Text className={styles.metricLabel}>Investors</Text>
              <Text className={styles.metricValue}>{formatNumber(project.investors)}</Text>
            </Box>
          </Flex>
        </Box>
      </Card>
    </Link>
  );
}
