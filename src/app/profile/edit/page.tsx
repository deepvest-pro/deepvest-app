import { redirect } from 'next/navigation';
import { getUserWithProfile } from '@/lib/supabase/client';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ProfileEditForm } from './profile-edit-form';

export const dynamic = 'force-dynamic';

export default async function ProfileEditPage() {
  const userData = await getUserWithProfile();

  if (!userData) {
    redirect('/auth/sign-in');
  }

  return (
    <ProtectedRoute>
      <ProfileEditForm initialData={userData.profile} />
    </ProtectedRoute>
  );
}
