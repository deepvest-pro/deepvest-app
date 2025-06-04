/**
 * Utility function for testing Civic-Supabase integration directly
 * This allows for manual testing of the integration flow
 */

/**
 * Test function to directly call the Civic-Supabase login endpoint
 * This bypasses the Civic authentication UI for testing purposes
 * 
 * @param email - Test email to use
 * @param idToken - Optional test ID token (defaults to a generated value)
 * @returns Promise with the login response
 */
export async function testCivicSupabaseLogin(email: string, idToken?: string) {
  if (!email) {
    throw new Error('Email is required for testing');
  }

  const testIdToken = idToken || `test_civic_token_${new Date().getTime()}`;
  
  try {
    const response = await fetch('/api/auth/civic-supabase-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        idToken: testIdToken,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to test Civic-Supabase login');
    }
    
    return {
      success: true,
      data: data,
      testCredentials: {
        email,
        idToken: testIdToken,
        // The API returns the generated password for testing purposes
        password: data.passwordUsed
      }
    };
  } catch (error: any) {
    console.error('Test Civic-Supabase login error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}
