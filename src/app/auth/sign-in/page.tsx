import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/react-query/auth-actions';
import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata: Metadata = {
  title: 'Sign In - DeepVest',
  description: 'Sign in to your DeepVest account',
};

export default async function SignInPage() {
  const userData = await getUserData();

  if (userData) {
    redirect('/');
  }

  return <SignInForm />;
}
