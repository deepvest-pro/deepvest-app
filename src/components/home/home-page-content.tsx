'use client';

import Link from 'next/link';
import { Flex, Heading, Text, Grid, Card, Box, Button } from '@radix-ui/themes';
import { ArrowRightIcon, RocketIcon, PersonIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { ProjectCreationDropzone } from '@/components/project-edit';
import { ResponsiveContainer } from '@/components/layout';
import { HeroSection } from '@/components/ui';

export function HomePageContent() {
  const stats = [
    { value: '500+', label: 'Projects Funded' },
    { value: '$10M+', label: 'Total Investment' },
    { value: '95%', label: 'Success Rate' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <HeroSection
        title="SHOWCASE YOUR PROJECT TO THE WORLD"
        subtitle="DeepVest Platform"
        description="Transform your innovative ideas into compelling project profiles. Connect with investors and bring your vision to life."
        showCTA={true}
        ctaText="Add Your Project"
        ctaHref="/projects/new"
        stats={stats}
      />

      {/* Project Creation Dropzone */}
      <ResponsiveContainer size="4" py="12">
        <Box mb="8">
          <Box mb="6" style={{ textAlign: 'center' }}>
            <Text
              size="5"
              weight="bold"
              style={{
                color: 'var(--text-primary)',
                marginTop: '24px',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              Quick Start
            </Text>
            <Text size="3" style={{ color: 'var(--text-secondary)' }}>
              Drop your project files here to get started instantly
            </Text>
          </Box>
          <ProjectCreationDropzone />
        </Box>

        {/* Section Header */}
        <Box mb="8" style={{ textAlign: 'center' }}>
          <Text
            size="6"
            weight="bold"
            style={{
              color: 'var(--text-primary)',
              marginBottom: '16px',
              display: 'block',
            }}
          >
            Why Choose DeepVest?
          </Text>
          <Text
            size="4"
            style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}
          >
            Our platform provides everything you need to succeed in the modern investment landscape
          </Text>
        </Box>

        <Grid columns={{ initial: '1', md: '3' }} gap="8">
          <Card
            style={{
              background: 'var(--gradient-card)',
              border: '1px solid rgba(0, 168, 107, 0.1)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
            }}
            className="hover:shadow-flow-lg hover:scale-105"
          >
            <Flex direction="column" align="center" gap="4" p="6">
              <Box
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--gradient-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <RocketIcon width="28" height="28" color="white" />
              </Box>
              <Heading size="5" style={{ color: 'var(--text-primary)' }}>
                For Founders
              </Heading>
              <Text style={{ color: 'var(--text-secondary)', textAlign: 'center' }} mb="4">
                Showcase your projects to potential investors and secure the funding you need to
                grow your vision into reality.
              </Text>
              <Link href="/projects/new">
                <Button
                  style={{
                    background: 'var(--gradient-accent)',
                    border: 'none',
                    fontWeight: '500',
                  }}
                >
                  Create a Project <ArrowRightIcon />
                </Button>
              </Link>
            </Flex>
          </Card>

          <Card
            style={{
              background: 'var(--gradient-card)',
              border: '1px solid rgba(0, 168, 107, 0.1)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
            }}
            className="hover:shadow-flow-lg hover:scale-105"
          >
            <Flex direction="column" align="center" gap="4" p="6">
              <Box
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--gradient-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonIcon width="28" height="28" color="white" />
              </Box>
              <Heading size="5" style={{ color: 'var(--text-primary)' }}>
                For Investors
              </Heading>
              <Text style={{ color: 'var(--text-secondary)', textAlign: 'center' }} mb="4">
                Discover promising projects and opportunities to invest in the next big innovation
                that will shape the future.
              </Text>
              <Link href="/projects">
                <Button
                  style={{
                    background: 'var(--gradient-accent)',
                    border: 'none',
                    fontWeight: '500',
                  }}
                >
                  Explore Projects <ArrowRightIcon />
                </Button>
              </Link>
            </Flex>
          </Card>

          <Card
            style={{
              background: 'var(--gradient-card)',
              border: '1px solid rgba(0, 168, 107, 0.1)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
            }}
            className="hover:shadow-flow-lg hover:scale-105"
          >
            <Flex direction="column" align="center" gap="4" p="6">
              <Box
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--gradient-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MagnifyingGlassIcon width="28" height="28" color="white" />
              </Box>
              <Heading size="5" style={{ color: 'var(--text-primary)' }}>
                How It Works
              </Heading>
              <Text style={{ color: 'var(--text-secondary)', textAlign: 'center' }} mb="4">
                Our platform connects founders with investors through a secure, transparent, and
                efficient process.
              </Text>
              <Link href="/leaderboard">
                <Button
                  style={{
                    background: 'var(--gradient-accent)',
                    border: 'none',
                    fontWeight: '500',
                  }}
                >
                  View Leaderboard <ArrowRightIcon />
                </Button>
              </Link>
            </Flex>
          </Card>
        </Grid>
      </ResponsiveContainer>
    </Box>
  );
}
