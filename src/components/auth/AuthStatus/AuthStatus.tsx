import { getUserData } from '@/lib/react-query/auth-actions';
import type { UserData } from '@/types/auth';
import { AuthStatusContent } from '@/components/auth';

/**
 * Server component that displays user authentication status
 */
export async function AuthStatus() {
  const userData = await getUserData();

  return <AuthStatusContent userData={userData as UserData | null} />;
}
