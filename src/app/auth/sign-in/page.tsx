import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/react-query/auth-queries';
import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata: Metadata = {
  title: 'Sign In - DeepVest',
  description: 'Sign in to your DeepVest account',
};

export default async function SignInPage() {
  // Redirect if user is already logged in
  const userData = await getUserData();

  if (userData) {
    redirect('/');
  }

  return <SignInForm />;
}
