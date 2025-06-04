'use client';

import Link from 'next/link';
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { LockClosedIcon, ArrowLeftIcon } from '@radix-ui/react-icons';

interface UnauthorizedAccessProps {
  title?: string;
  message?: string;
  backUrl?: string;
  backText?: string;
}

export function UnauthorizedAccess({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  backUrl = '/',
  backText = 'Go Back',
}: UnauthorizedAccessProps) {
  return (
    <Container size="2" p="6">
      <Flex direction="column" align="center" gap="6">
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--red-3)',
            color: 'var(--red-9)',
          }}
        >
          <LockClosedIcon width="40" height="40" />
        </Box>

        <Heading size="7" align="center">
          {title}
        </Heading>

        <Text size="3" color="gray" align="center" style={{ maxWidth: '600px' }}>
          {message}
        </Text>

        <Link href={backUrl}>
          <Button variant="soft" size="3">
            <ArrowLeftIcon width="16" height="16" />
            {backText}
          </Button>
        </Link>
      </Flex>
    </Container>
  );
}
