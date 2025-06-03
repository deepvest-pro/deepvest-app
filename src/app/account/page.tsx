import type { Metadata } from 'next';
import { getUserData } from '@/lib/react-query/auth-actions';
import { ProtectedRoute } from '@/components/auth/protected-route';
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
