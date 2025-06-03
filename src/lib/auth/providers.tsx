'use client';

import { ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { TanStackQueryProvider } from '@/lib/react-query/provider';
import { ToastProvider } from '@/components/layout/ToastProvider';
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
      <AuthProvider initialSession={initialSession} initialUser={initialUser}>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </TanStackQueryProvider>
  );
}
