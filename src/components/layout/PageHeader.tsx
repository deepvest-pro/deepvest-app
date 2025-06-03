'use client';

import React from 'react';
import { Flex, Heading, Text, Separator } from '@radix-ui/themes';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <Flex direction="column" gap="3" mb="6">
      <Heading size="8" align="center">
        {title}
      </Heading>
      {subtitle && (
        <Text align="center" size="5">
          {subtitle}
        </Text>
      )}
      <Separator size="4" />
    </Flex>
  );
}
