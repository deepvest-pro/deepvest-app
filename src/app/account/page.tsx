import type { Metadata } from 'next';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { getUserData } from '@/lib/react-query/auth-queries';
import { AccountContent } from './account-content';

export const metadata: Metadata = {
  title: 'Your Account - DeepVest',
  description: 'Manage your DeepVest account and profile',
};

export default async function AccountPage() {
  const userData = await getUserData();

  return (
    <ProtectedRoute>
      <AccountContent userData={userData} />
    </ProtectedRoute>
  );
}
