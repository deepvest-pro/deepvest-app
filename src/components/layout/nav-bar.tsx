import type { UserData } from '@/types/auth';
import { getUserData } from '@/lib/react-query/auth-queries';
import { NavBarContent } from '@/components/layout/nav-bar-content';

export async function NavBar() {
  const userData = await getUserData();
  const isAuthenticated = !!userData;

  return <NavBarContent userData={userData as UserData | null} isAuthenticated={isAuthenticated} />;
}
