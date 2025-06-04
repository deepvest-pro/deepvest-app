'use client';

import { useState, useCallback, useEffect } from 'react';
import { useUser, useToken } from '@civic/auth-web3/react';
import { useRouter } from 'next/navigation';
import { linkCivicWithSupabase } from '@/lib/auth/civic-auth-helpers';

/**
 * React hook that combines Civic Auth with Supabase
 * Provides a unified interface for handling the Civic-Supabase authentication flow
 */

/**
 * Debug function to monitor Civic user and token updates
 * @param enable Whether to enable debug logging
 */
export function useCivicDebug(enable = true) {
  const { user } = useUser();
  const tokenContext = useToken();
  
  useEffect(() => {
    if (!enable) return;
    console.log('[Civic Debug] User updated:', user);
    
    if (user) {
      // Log important user properties
      console.log('[Civic Debug] User details:', {
        id: user.id,
        email: user.email,
        chainAddress: user.chainAddress,
      });
    } else {
      console.log('[Civic Debug] User is null');
    }
  }, [user, enable]);
  
  useEffect(() => {
    if (!enable) return;
    console.log('[Civic Debug] Token context updated');
    
    // Safely inspect the token context
    if (tokenContext) {
      // Type assertion to any to allow property inspection
      const tokenAny = tokenContext as any;
      
      // Log all available methods and properties safely
      console.log('[Civic Debug] Token context methods:', 
        Object.getOwnPropertyNames(tokenContext)
          .filter(name => typeof tokenAny[name] === 'function')
      );
      
      // Attempt to safely access any token data
      Object.keys(tokenAny).forEach(key => {
        try {
          const value = tokenAny[key];
          if (value !== undefined && value !== null && key !== 'Provider') {
            if (typeof value === 'string' && value.length > 40) {
              console.log(`[Civic Debug] ${key}:`, value.substring(0, 20) + '...');
            } else if (typeof value !== 'function') {
              console.log(`[Civic Debug] ${key}:`, value);
            }
          }
        } catch (e) {
          // Ignore errors when accessing properties
        }
      });
    } else {
      console.log('[Civic Debug] Token context is null');
    }
  }, [tokenContext, enable]);
  
  return { user, tokenContext };
}

let previousEmail: string | null | undefined = undefined;
let authCompleteCallback: (() => void) | null = null;

export function useCivicAuth() {
  const { signIn: civicSignIn, signOut: civicSignOut, user: civicUser } = useUser();
  const civicTokenContext = useToken();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const router = useRouter();
  
  // Enable debug monitoring
  useCivicDebug();
  
  // Handle Supabase linking when user or token changes
  useEffect(() => {
    // Only proceed if we have both a user and are not already in the linking process
    if (civicUser && !isLoading) {
      const currentEmail = civicUser.email;
      
      // Only link if:
      // 1. We haven't linked this user before OR
      // 2. The email has changed
      if (currentEmail && previousEmail !== null && currentEmail != previousEmail) {
        console.log('User state change detected - attempting to link with Supabase ' + currentEmail + ' ' + previousEmail);
        previousEmail = currentEmail;
        // Perform linking asynchronously
        const linkUser = async () => {
          try {
            
            // Extract user data
            const email = civicUser.email;
            const idToken = civicUser.id;
            console.error('Cannot link: No email found in Civic user');
            if (!email) {
              console.error('Cannot link: No email found in Civic user');
              return;
            }
            
            if (!idToken) {
              console.error('Cannot link: No ID found in Civic user');
              return;
            }
            
            console.log('Linking with Supabase:', { 
              email, 
              idToken: idToken.substring(0, 10) + '...' 
            });
            
            
            // Link with Supabase
            const result = await linkCivicWithSupabase(email, idToken);
            if (!result.success) {
              throw new Error(result.error);
            }
            
            // Mark as linked and store the email
            setIsLinked(true);
            
            // Execute callback if provided
            if (authCompleteCallback != null) {
              console.log('Auth complete, executing callback12');
              authCompleteCallback();
              authCompleteCallback = null;
            }
            
            // Handle redirect if needed
            if (redirectPath) {
              router.push(redirectPath);
              setRedirectPath(null); // Clear the redirect path
            }
          } catch (err: any) {
            console.error('Civic-Supabase linking error:', err);
            setError(err.message || 'Failed to link Civic account with Supabase');
          } finally {
            setIsLoading(false);
          }
        };
        
        linkUser();
      }
    }
  }, [civicUser, router]);

  /**
   * Sign in with Civic and link with Supabase
   * This function handles the authentication flow:
   * 1. Authenticate with Civic
   * 2. Store redirect path if provided (actual redirect happens in the useEffect)
   * 
   * The linking with Supabase and redirect happen automatically via useEffect
   * when the civicUser becomes available
   * 
   * @param redirectTo Optional path to redirect to after successful login
   * @param onAuthComplete Optional callback to be executed when authentication is fully complete
   */
  const signIn = useCallback(async (redirectTo?: string, onAuthComplete?: () => void) => {
    try {
      setIsLoading(true);
      setError(null);

      // Store the redirect path for use after successful auth
      if (redirectTo) {
        setRedirectPath(redirectTo);
      }

      // Store the callback for use when auth is complete
      if (onAuthComplete) {
        authCompleteCallback = onAuthComplete;
      }

      // Step 1: Authenticate with Civic
      await civicSignIn();
      console.log('Civic sign-in triggered');
      
      // The rest of the flow (linking with Supabase and redirect)
      // is handled by the useEffect when civicUser becomes available

      return true;
    } catch (err: any) {
      console.error('Civic authentication error:', err);
      setError(err.message || 'Failed to authenticate with Civic');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [civicSignIn]);

  /**
   * Sign out from both Civic and Supabase
   * This performs a complete logout
   * 
   * @param redirectTo Optional path to redirect to after signing out
   */
  const signOut = useCallback(async (redirectTo?: string) => {
    try {
      setIsLoading(true);
      
      // Sign out from Civic
      await civicSignOut();
      
      // Sign out from Supabase by calling a server action or API
      // This could be implemented as needed, potentially with a fetch to a logout endpoint
      
      // Redirect if needed
      if (redirectTo) {
        router.push(redirectTo);
      }
      
      return true;
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [civicSignOut, router]);

  return {
    signIn,
    signOut,
    isAuthenticated: !!civicUser,
    user: civicUser,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
