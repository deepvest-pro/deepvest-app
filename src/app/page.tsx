import type { ReactNode } from 'react';
import { getUserData } from '@/lib/react-query/auth-actions';
import { AuthStatus } from '@/components/auth/auth-status';
import { HomePageContent } from '@/components/home/home-page-content';

export default async function HomePage() {
  const userData = await getUserData();
  const isAuthenticated = !!userData;

  // Get AuthStatus component content
  const authStatusContent = (await AuthStatus()) as ReactNode;

  return (
    <HomePageContent isAuthenticated={isAuthenticated} authStatusContent={authStatusContent} />
  );
}
