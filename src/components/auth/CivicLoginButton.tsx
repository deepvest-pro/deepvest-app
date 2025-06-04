import React from 'react';
import { Button } from '@radix-ui/themes';
import { useCivicAuth } from '@/lib/hooks/useCivicAuth';

interface CivicLoginButtonProps {
  redirectTo?: string;
  label?: string;
  className?: string;
}

export const CivicLoginButton: React.FC<CivicLoginButtonProps> = ({ 
  redirectTo = '/', 
  label = 'Login with Civic', 
  className = '' 
}) => {
  const { signIn, isAuthenticated, isLoading, error } = useCivicAuth();

  const handleCivicLogin = async () => {
    await signIn(redirectTo);
  };

  // If user is already logged in, don't show the button
  if (isAuthenticated) {
    return null;
  }

  return (
    <div>
      <Button 
        onClick={handleCivicLogin} 
        disabled={isLoading}
        className={className}
      >
        {isLoading ? 'Logging in...' : label}
      </Button>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
};
