'use client';

import Link from 'next/link';
import { Container, Flex, Heading, Text, Grid, Card, Box } from '@radix-ui/themes';
import { ProjectCreationDropzone } from './ProjectCreationDropzone';

export function HomePageContent() {
  return (
    <Container size="3" py="8">
      <Flex direction="column" align="center" mb="8" gap="4">
        <Heading size="8" align="center">
          Welcome to DeepVest
        </Heading>
        <Text size="5" color="gray" align="center" mb="4">
          The modern investment platform for connecting founders and investors
        </Text>
      </Flex>

      {/* Project Creation Dropzone */}
      <Box mb="8">
        <ProjectCreationDropzone />
      </Box>

      <Grid columns={{ initial: '1', md: '3' }} gap="6" mt="9">
        <Card>
          <Flex direction="column" align="center" gap="2" p="4">
            <Heading size="4">For Founders</Heading>
            <Text color="gray" align="center" mb="3">
              Showcase your projects to potential investors and secure the funding you need to grow.
            </Text>
            <Link href="/projects/new">
              <span>
                <Text color="blue">Create a Project</Text>
              </span>
            </Link>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" align="center" gap="2" p="4">
            <Heading size="4">For Investors</Heading>
            <Text color="gray" align="center" mb="3">
              Discover promising projects and opportunities to invest in the next big thing.
            </Text>
            <Link href="/leaderboard">
              <span>
                <Text color="blue">View Leaderboard</Text>
              </span>
            </Link>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" align="center" gap="2" p="4">
            <Heading size="4">How It Works</Heading>
            <Text color="gray" align="center" mb="3">
              Our platform connects founders with investors through a secure, transparent process.
            </Text>
            <Link href="/how-it-works">
              <span>
                <Text color="blue">Learn more</Text>
              </span>
            </Link>
          </Flex>
        </Card>
      </Grid>
    </Container>
  );
}
