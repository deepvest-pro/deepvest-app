'use client';

import { useState } from 'react';
import { Button } from '@radix-ui/themes';
import { signOut } from '@/lib/supabase/auth-actions';

interface SignOutButtonProps {
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost' | 'soft';
}

export function SignOutButton({ className = '', variant = 'solid' }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      // No need to handle redirect as signOut function already redirects
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
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
