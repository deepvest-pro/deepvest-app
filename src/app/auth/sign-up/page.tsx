import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserData } from '@/lib/react-query/auth-queries';
import { SignUpForm } from '@/components/auth/sign-up-form';

export const metadata: Metadata = {
  title: 'Sign Up - DeepVest',
  description: 'Create a new DeepVest account',
};

export default async function SignUpPage() {
  // Redirect if user is already logged in
  const userData = await getUserData();

  if (userData) {
    redirect('/');
  }

  return <SignUpForm />;
}
