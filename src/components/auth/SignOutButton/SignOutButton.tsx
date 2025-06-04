'use client';

import { Button } from '@radix-ui/themes';
import { useSignOut } from '@/lib/auth/auth-hooks';
import { useToast } from '@/providers/ToastProvider';

interface SignOutButtonProps {
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost' | 'soft';
}

export function SignOutButton({ className = '', variant = 'solid' }: SignOutButtonProps) {
  const { signOut, isLoading } = useSignOut();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast('You have been successfully signed out', 'success', 'Signed Out');
    } else if (result.error) {
      toast(result.error, 'error', 'Sign Out Failed');
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
