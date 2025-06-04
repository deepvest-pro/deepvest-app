import React from 'react';
import type { Metadata } from 'next';
import { Providers } from '@/lib/auth/providers';
import { getUserData } from '@/lib/react-query/auth-actions';
import { RootLayoutContent } from '@/components/layout';
import { NavBar } from '@/components/layout/NavBar/NavBar';
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";

import '../styles/global/globals.css';
import '../styles/app.scss';

export const metadata: Metadata = {
  title: 'DeepVest - Investment Platform',
  description: 'A modern investment platform for project funding',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'DeepVest',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Use getUserData instead of getSession for security
  // getUserData includes user info which is sufficient for layout initialization
  const userData = await getUserData();

  return (
    <html lang="en">
      <body>
        <CivicAuthProvider>
          <Providers initialSession={null} initialUser={userData}>
            <RootLayoutContent>
              <NavBar />
              <main style={{ flex: '1 1 auto' }}>{children}</main>
            </RootLayoutContent>
          </Providers>
        </CivicAuthProvider>
      </body>
    </html>
  );
}
