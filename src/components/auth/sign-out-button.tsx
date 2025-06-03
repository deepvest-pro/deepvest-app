'use client';

import { Button } from '@radix-ui/themes';
import { useSignOut } from '@/lib/auth/auth-hooks';

interface SignOutButtonProps {
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost' | 'soft';
}

export function SignOutButton({ className = '', variant = 'solid' }: SignOutButtonProps) {
  const { signOut, isLoading } = useSignOut();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Button
      variant={variant}
      color="blue"
      disabled={isLoading}
      onClick={handleSignOut}
      className={className}
    >
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
