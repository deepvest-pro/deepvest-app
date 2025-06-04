'use client';

import React from 'react';
import { Container } from '@radix-ui/themes';
import type { ContainerProps } from '@radix-ui/themes';

interface ResponsiveContainerProps extends Omit<ContainerProps, 'size'> {
  size?: '1' | '2' | '3' | '4';
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive container component that provides consistent padding and max-width
 * across different screen sizes while preventing content from touching screen edges
 */
export function ResponsiveContainer({
  size = '4',
  children,
  className = '',
  style,
  ...props
}: ResponsiveContainerProps) {
  const containerStyle = {
    paddingLeft: 'var(--responsive-padding)',
    paddingRight: 'var(--responsive-padding)',
    ...style,
  };

  return (
    <Container
      size={size}
      className={`responsive-container ${className}`}
      style={containerStyle}
      {...props}
    >
      {children}
    </Container>
  );
}
