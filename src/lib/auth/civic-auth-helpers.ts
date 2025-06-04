/**
 * Civic Auth integration helpers
 * Provides utility functions for integrating Civic Auth with our Supabase backend
 */

/**
 * Calls our custom API endpoint to link a Civic authenticated user with Supabase
 * This function should be called after a successful Civic authentication
 *
 * @param email - User's email address
 * @param idToken - Civic ID token
 * @returns Promise with Supabase session data or error
 */
export async function linkCivicWithSupabase(email: string, idToken: string) {
  try {
    // Call our custom backend API that handles the Civic-Supabase integration
    const response = await fetch('/api/auth/civic-supabase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        idToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to link Civic account with Supabase');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error linking Civic with Supabase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

/**
 * Gets the Civic authentication status
 * This is a simple utility to check if the user is authenticated with Civic
 *
 * @param user The user object from Civic's useUser hook
 * @returns Boolean indicating if the user is authenticated with Civic
 */
export function isCivicAuthenticated(user: unknown) {
  return !!user;
}
