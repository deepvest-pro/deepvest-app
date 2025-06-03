'use client';

import Link from 'next/link';
import { Container, Flex, Heading, Text, Button } from '@radix-ui/themes';

export default function NotFound() {
  return (
    <Container size="3" py="9">
      <Flex direction="column" align="center" gap="6">
        <Heading size="9" align="center">
          404
        </Heading>
        <Heading size="6" align="center">
          Page Not Found
        </Heading>
        <Text size="4" align="center" color="gray">
          Sorry, the page you are looking for doesn&apos;t exist or has been moved.
        </Text>

        <Link href="/">
          <span className="inline-block">
            <Button size="3" color="blue">
              Back to Home
            </Button>
          </span>
        </Link>
      </Flex>
    </Container>
  );
}
