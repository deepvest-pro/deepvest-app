'use client';

import React from 'react';
import { Box, Card, Flex, Text, Heading, Badge } from '@radix-ui/themes';
import { FileTextIcon } from '@radix-ui/react-icons';

interface DocumentsSectionProps {
  projectId?: string;
}

export function DocumentsSection({}: DocumentsSectionProps) {
  return (
    <Card size="3">
      <Box p="5">
        <Flex direction="column" gap="5">
          <Flex align="center" gap="2" mb="3">
            <FileTextIcon width="20" height="20" color="var(--blue-9)" />
            <Heading size="5">Documents</Heading>
            <Badge size="1" color="orange">
              Coming Soon
            </Badge>
          </Flex>

          <Box
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--gray-2)',
              borderRadius: 'var(--radius-3)',
              border: '2px dashed var(--gray-6)',
            }}
          >
            <FileTextIcon
              width="48"
              height="48"
              color="var(--gray-8)"
              style={{ margin: '0 auto 16px' }}
            />
            <Heading size="4" mb="2" color="gray">
              Document Management
            </Heading>
            <Text size="3" color="gray" mb="4">
              This section will allow you to upload and manage project documents such as:
            </Text>
            <Flex direction="column" gap="2" align="center">
              <Text size="2" color="gray">
                • Pitch decks and presentations
              </Text>
              <Text size="2" color="gray">
                • Business plans and whitepapers
              </Text>
              <Text size="2" color="gray">
                • Technical documentation
              </Text>
              <Text size="2" color="gray">
                • Financial reports and projections
              </Text>
              <Text size="2" color="gray">
                • Legal documents and contracts
              </Text>
            </Flex>
            <Text size="2" color="gray" mt="4" style={{ fontStyle: 'italic' }}>
              Document management functionality will be available in a future update.
            </Text>
          </Box>
        </Flex>
      </Box>
    </Card>
  );
}
