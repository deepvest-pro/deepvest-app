'use client';

import React from 'react';
import { Theme } from '@radix-ui/themes';
import type { ThemeProps } from '@radix-ui/themes';

// Theme configuration with green accent inspired by Flow
export const themeConfig: ThemeProps = {
  accentColor: 'green',
  grayColor: 'slate',
  radius: 'medium',
  scaling: '100%',
  panelBackground: 'solid',
  appearance: 'light', // Force light theme
};

// Theme provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <Theme {...themeConfig}>{children}</Theme>;
}

// Export theme component for individual use
export { Theme };
