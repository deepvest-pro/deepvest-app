'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Flex, Text, Heading, Avatar, Button, Card } from '@radix-ui/themes';
import {
  GlobeIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  PersonIcon,
  RocketIcon,
  TargetIcon,
  StarIcon,
} from '@radix-ui/react-icons';
import type { CrowdfundingProject } from '@/types/crowdfunding';
import styles from './CrowdfundingContent.module.scss';

interface CrowdfundingContentProps {
  project: CrowdfundingProject;
}

export function CrowdfundingContent({ project }: CrowdfundingContentProps) {
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
      {/* Hero Section */}
      <Box className={styles.hero}>
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

        <Box className={styles.heroOverlay}>
          <Heading className={styles.heroTitle}>{project.name}</Heading>

          <Flex className={styles.heroMeta}>
            <Box className={styles.metaItem}>
              <GlobeIcon width="16" height="16" />
              <Text>{project.country}</Text>
            </Box>

            <Box className={styles.metaItem}>
              <CalendarIcon width="16" height="16" />
              <Text>Founded {project.foundedYear}</Text>
            </Box>

            <Box className={`${styles.statusBadge} ${styles[project.status]}`}>
              {project.status}
            </Box>
          </Flex>
        </Box>
      </Box>

      {/* Main Content */}
      <Box className={styles.content}>
        {/* Left Column - Main Content */}
        <Box className={styles.mainContent}>
          {/* Description */}
          <Card className={styles.section}>
            <Heading className={styles.sectionTitle}>
              <RocketIcon width="24" height="24" />
              About This Project
            </Heading>

            <div>
              <Text className={styles.description}>
                {project.fullDescription || project.description}
              </Text>
            </div>

            <br />

            {project.highlights && (
              <>
                <Heading size="4" mb="3" style={{ color: 'var(--text-primary)' }}>
                  Key Highlights
                </Heading>
                <ul className={styles.highlights}>
                  {project.highlights.map((highlight, index) => (
                    <li key={index} className={styles.highlight}>
                      <CheckCircledIcon width="20" height="20" className={styles.checkIcon} />
                      <Text>{highlight}</Text>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {/* Team */}
          {project.team && project.team.length > 0 && (
            <Card className={styles.section}>
              <Heading className={styles.sectionTitle}>
                <PersonIcon width="24" height="24" />
                Meet the Team
              </Heading>

              <Box className={styles.teamGrid}>
                {project.team.map(member => (
                  <Box key={member.id} className={styles.teamMember}>
                    <Avatar
                      size="5"
                      src={member.avatar}
                      fallback={member.name.charAt(0)}
                      className={styles.memberAvatar}
                    />
                    <Text className={styles.memberName}>{member.name}</Text>
                    <Text className={styles.memberRole}>{member.role}</Text>
                  </Box>
                ))}
              </Box>
            </Card>
          )}

          {/* Roadmap */}
          {project.roadmap && project.roadmap.length > 0 && (
            <Card className={styles.section}>
              <Heading className={styles.sectionTitle}>
                <TargetIcon width="24" height="24" />
                Project Roadmap
              </Heading>

              <Box className={styles.roadmapList}>
                {project.roadmap.map((item, index) => (
                  <Box key={index} className={styles.roadmapItem}>
                    <Box
                      className={`${styles.roadmapIcon} ${item.completed ? styles.completed : styles.pending}`}
                    >
                      {item.completed ? (
                        <CheckCircledIcon width="14" height="14" />
                      ) : (
                        <ClockIcon width="14" height="14" />
                      )}
                    </Box>

                    <Box className={styles.roadmapContent}>
                      <Text className={styles.roadmapTitle}>{item.title}</Text>
                      <Text className={styles.roadmapDescription}>{item.description}</Text>
                      {item.date && <Text className={styles.roadmapDate}>{item.date}</Text>}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
          )}
        </Box>

        {/* Right Column - Sidebar */}
        <Box className={styles.sidebar}>
          {/* Investment Progress */}
          <Card className={styles.progressCard}>
            <Box className={styles.progressHeader}>
              <Text className={styles.progressAmount}>{formatCurrency(project.raised)}</Text>
              <br />
              <Text className={styles.progressTarget}>
                raised of {formatCurrency(project.target)} target
              </Text>
            </Box>

            {/* Progress Bar with Label */}
            <Box className={styles.progress}>
              <Flex className={styles.progressHeaderBar}>
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

            <Box className={styles.progressStats}>
              <Box className={styles.progressStat}>
                <Text className="value">{project.percentage}%</Text>
                <Text className="label">Funded</Text>
              </Box>

              <Box className={styles.progressStat}>
                <Text className="value">{formatNumber(project.investors)}</Text>
                <Text className="label">Investors</Text>
              </Box>

              <Box className={styles.progressStat}>
                <Text className="value">{project.daysLeft}</Text>
                <Text className="label">Days Left</Text>
              </Box>
            </Box>

            <Button className={styles.investButton} disabled={project.status !== 'active'}>
              {project.status === 'active'
                ? 'Invest Now'
                : project.status === 'funded'
                  ? 'Fully Funded'
                  : 'Campaign Ended'}
            </Button>
          </Card>

          {/* Project Metrics */}
          {project.metrics && project.metrics.length > 0 && (
            <Card className={styles.section}>
              <Heading className={styles.sectionTitle}>
                <StarIcon width="24" height="24" />
                Key Metrics
              </Heading>

              <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {project.metrics.map((metric, index) => (
                  <Flex key={index} justify="between" align="center">
                    <Text style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {metric.label}
                    </Text>
                    <Text style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {metric.value}
                    </Text>
                  </Flex>
                ))}
              </Box>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
}
