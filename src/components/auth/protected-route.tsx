import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/react-query/auth-queries';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Server component that protects routes requiring authentication
 * Redirects unauthenticated users to the specified path or sign-in by default
 */
export async function ProtectedRoute({
  children,
  redirectTo = '/auth/sign-in',
}: ProtectedRouteProps) {
  const userData = await getUserData();

  if (!userData) {
    redirect(redirectTo);
  }

  return <>{children}</>;
}
