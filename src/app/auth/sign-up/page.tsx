import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/react-query/auth-actions';
import { SignUpForm } from '@/components/auth/sign-up-form';

export const metadata: Metadata = {
  title: 'Sign Up - DeepVest',
  description: 'Create a new DeepVest profile',
};

export default async function SignUpPage() {
  const userData = await getUserData();

  if (userData) {
    redirect('/');
  }

  return <SignUpForm />;
}
