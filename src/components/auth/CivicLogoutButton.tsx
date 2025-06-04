import React from 'react';
import { Button } from '@radix-ui/themes';
import { useCivicAuth } from '@/lib/hooks/useCivicAuth';

interface CivicLogoutButtonProps {
  redirectTo?: string;
  label?: string;
  className?: string;
}

export const CivicLogoutButton: React.FC<CivicLogoutButtonProps> = ({ 
  redirectTo = '/', 
  label = 'Logout', 
  className = '' 
}) => {
  const { signOut, isAuthenticated, isLoading } = useCivicAuth();

  const handleLogout = async () => {
    await signOut(redirectTo);
  };

  // If user is not logged in, don't show the button
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button 
      onClick={handleLogout} 
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Logging out...' : label}
    </Button>
  );
};
