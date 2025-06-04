'use client';

import React from 'react';
import { Box, Heading, Text, Button, Flex } from '@radix-ui/themes';
import { ResponsiveContainer } from '../../layout/ResponsiveContainer/ResponsiveContainer';
import { PlusIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import styles from './HeroSection.module.scss';

export interface HeroSectionProps {
  title: string;
  subtitle: string;
  description?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
  stats?: Array<{
    value: string;
    label: string;
  }>;
}

export function HeroSection({
  title,
  subtitle,
  description,
  showCTA = false,
  ctaText = 'Get Started',
  ctaHref = '#',
  stats = [],
}: HeroSectionProps) {
  return (
    <Box className={styles.heroSection}>
      {/* Decorative elements */}
      <Box className={styles.decorativeElement1} />
      <Box className={styles.decorativeElement2} />

      <ResponsiveContainer size="4" className={styles.content}>
        <Flex direction="column" align="start" gap="6" py="8">
          <Box className={styles.contentInner}>
            <Text size="2" weight="medium" className={styles.subtitle}>
              {subtitle}
            </Text>

            <Heading size="9" weight="bold" className={styles.title}>
              {title}
            </Heading>

            {description && (
              <Text size="4" className={styles.description}>
                {description}
              </Text>
            )}

            {showCTA && (
              <Link href={ctaHref}>
                <Button size="4" className={styles.ctaButton}>
                  <PlusIcon width="18" height="18" />
                  {ctaText}
                </Button>
              </Link>
            )}
          </Box>

          {/* Stats section */}
          {stats.length > 0 && (
            <Flex gap="8" wrap="wrap" mt="6" className={styles.stats}>
              {stats.map((stat, index) => (
                <Box key={index} className={styles.statItem}>
                  <Text size="6" weight="bold" className={styles.statValue}>
                    {stat.value}
                  </Text>
                  <Text size="2" className={styles.statLabel}>
                    {stat.label}
                  </Text>
                </Box>
              ))}
            </Flex>
          )}
        </Flex>
      </ResponsiveContainer>
    </Box>
  );
}
