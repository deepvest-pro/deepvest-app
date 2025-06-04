import { NavBarClient } from '@/components/layout';
import { getUserData } from '@/lib/react-query/auth-actions';
import { cookies } from 'next/headers';

/**
 * Server component wrapper for NavBar
 * Provides initial data from the server and passes it to the client component
 * to prevent flickering when loading
 */
export async function NavBar() {
  await cookies();

  const initialUserData = await getUserData();
  const initialIsAuthenticated = !!initialUserData;

  return (
    <NavBarClient
      initialUserData={initialUserData}
      initialIsAuthenticated={initialIsAuthenticated}
    />
  );
}
