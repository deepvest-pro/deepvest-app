'use client';

import Link from 'next/link';
import { Flex, Text, Heading, Button, Card } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

export default function CrowdfundingProjectNotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--gray-1)',
        paddingTop: '80px',
        paddingBottom: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card size="4" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <Flex direction="column" align="center" justify="center" gap="4" p="6">
          <ExclamationTriangleIcon width="48" height="48" color="var(--orange-9)" />

          <Heading size="6" align="center" style={{ color: 'var(--text-primary)' }}>
            Crowdfunding Project Not Found
          </Heading>

          <Text color="gray" align="center" size="3">
            The crowdfunding project you&apos;re looking for doesn&apos;t exist or has been removed.
          </Text>

          <Flex gap="3" mt="4">
            <Link href="/crowdfunding" passHref>
              <Button color="green" size="3">
                Browse Projects
              </Button>
            </Link>

            <Link href="/" passHref>
              <Button variant="soft" size="3">
                Go Home
              </Button>
            </Link>
          </Flex>
        </Flex>
      </Card>
    </main>
  );
}
