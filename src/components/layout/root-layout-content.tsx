'use client';

import React from 'react';
import { Flex } from '@radix-ui/themes';
import { ThemeProvider } from '@/styles/theme';

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  return (
    <ThemeProvider>
      <Flex direction="column" style={{ minHeight: '100vh' }}>
        {children}
      </Flex>
    </ThemeProvider>
  );
}
