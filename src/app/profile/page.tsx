import type { Metadata } from 'next';
import { getUserData } from '@/lib/react-query/auth-actions';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ProfileContent } from './profile-content';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your Profile - DeepVest',
  description: 'Manage your DeepVest profile',
};

export default async function ProfilePage() {
  const userData = await getUserData();

  return (
    <ProtectedRoute>
      <ProfileContent userData={userData} />
    </ProtectedRoute>
  );
}
