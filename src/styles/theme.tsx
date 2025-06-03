'use client';

import React from 'react';
import { Theme } from '@radix-ui/themes';
import type { ThemeProps } from '@radix-ui/themes';

// Theme configuration
export const themeConfig: ThemeProps = {
  accentColor: 'blue',
  grayColor: 'slate',
  radius: 'medium',
  scaling: '100%',
  panelBackground: 'solid',
};

// Theme provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <Theme {...themeConfig}>{children}</Theme>;
}

// Export theme component for individual use
export { Theme };
