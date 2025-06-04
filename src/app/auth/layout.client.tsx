"use client";

import React from 'react';
import { CivicAuthProvider } from "@civic/auth-web3/nextjs";

export function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  // Wrap children in the auth provider
  try {
    return (
      <CivicAuthProvider>
        {children}
      </CivicAuthProvider>
    );
  } catch (error) {
    // Fallback if Civic auth fails
    console.error("Failed to initialize Civic Auth:", error);
    return <>{children}</>;
  }
}
