import React from 'react';
import type { Metadata } from 'next';
import { TanStackQueryProvider } from '@/lib/react-query/provider';
import { NavBar, RootLayoutContent } from '@/components/layout';

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
        <TanStackQueryProvider>
          <RootLayoutContent>
            <NavBar />
            <main style={{ flex: '1 1 auto' }}>{children}</main>
          </RootLayoutContent>
        </TanStackQueryProvider>
      </body>
    </html>
  );
}
