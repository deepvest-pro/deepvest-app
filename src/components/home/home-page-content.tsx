'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Container, Flex, Heading, Text, Grid, Card, Box, Button } from '@radix-ui/themes';

interface HomePageContentProps {
  isAuthenticated: boolean;
  authStatusContent: ReactNode;
}

export function HomePageContent({ isAuthenticated, authStatusContent }: HomePageContentProps) {
  return (
    <Container size="3" py="8">
      <Flex direction="column" align="center" mb="8" gap="4">
        <Heading size="8" align="center">
          Welcome to DeepVest
        </Heading>
        <Text size="5" color="gray" align="center" mb="4">
          The modern investment platform for connecting founders and investors
        </Text>

        <Box mb="4">{authStatusContent}</Box>

        {!isAuthenticated ? (
          <Flex gap="4" justify="center" direction={{ initial: 'column', sm: 'row' }}>
            <Link href="/auth/sign-up">
              <span>
                <Button size="3" color="blue">
                  Create an Account
                </Button>
              </span>
            </Link>
            <Link href="/auth/sign-in">
              <span>
                <Button size="3" variant="outline">
                  Sign In
                </Button>
              </span>
            </Link>
          </Flex>
        ) : (
          <Flex gap="4" justify="center" direction={{ initial: 'column', sm: 'row' }}>
            <Link href="/projects">
              <span>
                <Button size="3" color="blue">
                  Explore Projects
                </Button>
              </span>
            </Link>
            <Link href="/profile">
              <span>
                <Button size="3" variant="outline">
                  View Profile
                </Button>
              </span>
            </Link>
          </Flex>
        )}
      </Flex>

      <Grid columns={{ initial: '1', md: '3' }} gap="6" mt="9">
        <Card>
          <Flex direction="column" align="center" gap="2" p="4">
            <Heading size="4">For Founders</Heading>
            <Text color="gray" align="center" mb="3">
              Showcase your projects to potential investors and secure the funding you need to grow.
            </Text>
            <Link href="/founders">
              <span>
                <Text color="blue">Learn more</Text>
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
            <Link href="/investors">
              <span>
                <Text color="blue">Learn more</Text>
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
