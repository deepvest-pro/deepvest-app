import React from 'react';
import type { Metadata } from 'next';
import { Providers } from '@/lib/auth/providers';
import { getSession, getUserData } from '@/lib/react-query/auth-actions';
import { NavBar, RootLayoutContent } from '@/components/layout';

import '../styles/global/globals.css';
import '../styles/app.scss';

export const metadata: Metadata = {
  title: 'DeepVest - Investment Platform',
  description: 'A modern investment platform for project funding',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const userData = await getUserData();

  return (
    <html lang="en">
      <body>
        <Providers initialSession={session} initialUser={userData}>
          <RootLayoutContent>
            <NavBar />
            <main style={{ flex: '1 1 auto' }}>{children}</main>
          </RootLayoutContent>
        </Providers>
      </body>
    </html>
  );
}
