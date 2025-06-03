import { redirect } from 'next/navigation';
import { getUserWithProfile } from '@/lib/supabase/client';
import { NewProjectPageContent } from '@/components/projects/NewProjectPageContent';

export const metadata = {
  title: 'Create New Project | DeepVest',
  description: 'Create a new project on DeepVest platform',
};

export default async function NewProjectPage() {
  const userData = await getUserWithProfile();

  if (!userData) {
    redirect('/auth/sign-in?returnUrl=/projects/new');
  }

  const { user, profile } = userData;

  return (
    <NewProjectPageContent userFullName={profile?.full_name || ''} userEmail={user.email || ''} />
  );
}
