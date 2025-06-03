'use client';

import React from 'react';
import { Container, Flex } from '@radix-ui/themes';

interface PageContainerProps {
  children: React.ReactNode;
  size?: '1' | '2' | '3' | '4';
  gap?: string;
}

export function PageContainer({ children, size = '3', gap = '6' }: PageContainerProps) {
  return (
    <Container size={size}>
      <Flex direction="column" gap={gap} py="8">
        {children}
      </Flex>
    </Container>
  );
}
