import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/react-query/auth-queries';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password - DeepVest',
  description: 'Reset your DeepVest account password',
};

export default async function ResetPasswordPage() {
  // Redirect if user is already logged in
  const userData = await getUserData();

  if (userData) {
    redirect('/');
  }

  return <ResetPasswordForm />;
}
