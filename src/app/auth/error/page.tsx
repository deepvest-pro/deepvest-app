import type { Metadata } from 'next';
import { AuthError } from '@/components/auth/auth-error';

export const metadata: Metadata = {
  title: 'Authentication Error - DeepVest',
  description: 'Authentication error occurred',
};

export default function AuthErrorPage() {
  return <AuthError />;
}
