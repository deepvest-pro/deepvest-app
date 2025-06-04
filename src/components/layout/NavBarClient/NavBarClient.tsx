'use client';

import type { UserData } from '@/types/auth';
import { useUserData } from '@/lib/react-query/auth-queries-client';
import { NavBarContent } from '@/components/layout';

interface NavBarClientProps {
  initialUserData: UserData | null;
  initialIsAuthenticated: boolean;
}

export function NavBarClient({ initialUserData, initialIsAuthenticated }: NavBarClientProps) {
  const { data: userData, isLoading } = useUserData({
    initialData: initialUserData,
  });

  const isAuthenticated = userData ? !!userData.user : initialIsAuthenticated;
  const displayUserData = userData || initialUserData;

  return (
    <NavBarContent
      userData={displayUserData}
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
    />
  );
}
