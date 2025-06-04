'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { TanStackQueryProvider } from '@/lib/react-query/provider';
import { ToastProvider } from '@/providers/ToastProvider';
import { CivicAuthProvider } from '@civic/auth-web3/nextjs';
import type { Session } from '@supabase/supabase-js';
import type { UserData } from '@/types/auth';

interface ProvidersProps {
  children: ReactNode;
  initialSession: Session | null;
  initialUser: UserData | null;
}

/**
 * Main providers wrapper component
 * Provides context for the entire application
 */
export function Providers({ children, initialSession, initialUser }: ProvidersProps) {
  return (
    <TanStackQueryProvider>
      <CivicAuthProviderWrapper>
        <AuthProvider initialSession={initialSession} initialUser={initialUser}>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </CivicAuthProviderWrapper>
    </TanStackQueryProvider>
  );
}

/**
 * Wrapper for CivicAuthProvider with error handling
 * This prevents SSR issues and provides fallback behavior
 */
function CivicAuthProviderWrapper({ children }: { children: ReactNode }) {
  try {
    return <CivicAuthProvider>{children}</CivicAuthProvider>;
  } catch (error) {
    // Fallback if Civic auth fails to initialize (e.g., during SSR)
    console.warn('Failed to initialize Civic Auth, falling back to children only:', error);
    return <>{children}</>;
  }
}
