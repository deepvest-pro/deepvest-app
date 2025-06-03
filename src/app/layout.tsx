import React from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from '../styles/theme';

// Import global styles
import '../styles/global/globals.css';

export const metadata: Metadata = {
  title: 'DeepVest - Investment Platform',
  description: 'A modern investment platform for project funding',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
