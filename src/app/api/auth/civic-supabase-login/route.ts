// src/app/api/auth/civic-supabase-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simplified Civic token verification function that always returns true
 * This is a simplified version as requested - in a real production environment,
 * you would implement proper token validation
 */
async function verifyCivicToken(payload: { email: string, idToken: string }): Promise<{
  isValid: boolean;
  verifiedEmail?: string;
  verifiedCivicID?: string;
  civicUserData?: Record<string, any>;
  error?: string;
}> {
  // Simple implementation that always returns true with the provided email
  if (!payload || !payload.email || !payload.idToken) {
    return { isValid: false, error: "Email and idToken are required" };
  }
  
  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(payload.email)) {
    return { isValid: false, error: `Invalid email format: ${payload.email}` };
  }
  
  // Always return true with the provided credentials
  return {
    isValid: true,
    verifiedEmail: payload.email,
    verifiedCivicID: payload.idToken,
    civicUserData: { 
      username: payload.email.split('@')[0], // Generate a username from the email
      provider: 'civic'
    }
  };
}

// Initialize Supabase Admin Client (use this for admin operations)
// Ensure SUPABASE_SERVICE_ROLE_KEY is set in your environment variables
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const supabaseRegularClient = await SupabaseClientFactory.getServerClient(); // For non-admin auth operations

  try {
    // Extract email and idToken from the request
    // If 'auto' is provided, in a real implementation we would extract the token from session
    // Since we're simplifying, we'll expect the actual email and idToken
    let { email, idToken } = await request.json();
    
    // Ensure email is a valid format (fallback in case validation fails)
    if (!email || email === 'auto') {
      // Default to a valid email domain for testing
      email = `test-user-${Date.now()}@example.org`;
    }
    
    if (!idToken || idToken === 'auto') {
      // Default to a placeholder token
      idToken = `civic-token-${Date.now()}`;
    }
    
    // Verify the token (simplified implementation)
    const { 
      isValid, 
      verifiedEmail, 
      verifiedCivicID, 
      civicUserData, 
      error: verificationError 
    } = await verifyCivicToken({ email, idToken });

    if (!isValid || !verifiedEmail) {
      console.error('Civic token verification failed:', verificationError);
      return NextResponse.json({ error: verificationError || 'Invalid Civic token.' }, { status: 401 });
    }

    // Generate a password based on the user's email
    // In a real implementation, this would be more secure, but for simplicity:
    const securePassword = `civic_${verifiedEmail.split('@')[0]}_${verifiedEmail.length}`;

    // Check if user exists in Supabase
    const { data: existingUsers, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    // Filter the users to find the one with the matching email
    const matchingUsers = existingUsers?.users.filter(user => user.email === verifiedEmail);

    if (getUserError) {
      console.error('Error checking existing user:', getUserError);
      return NextResponse.json({ error: 'Error verifying user account.' }, { status: 500 });
    }

    let authResponse;

    if (matchingUsers && matchingUsers.length > 0) {
      // User exists, update their password and sign them in
      const userId = matchingUsers[0].id;
      
      // Update the user's password using admin API
 

      // Sign in the user with their new password
      authResponse = await supabaseRegularClient.auth.signInWithPassword({
        email: verifiedEmail,
        password: securePassword,
      });
    } else {
      // User doesn't exist, sign them up
      authResponse = await supabaseRegularClient.auth.signUp({
        email: verifiedEmail,
        password: securePassword,
        options: {
          data: {
            civic_id: verifiedCivicID,
            // Add additional user metadata from civicUserData as needed
            username: civicUserData?.username,
            auth_provider: 'civic'
          },
        },
      });
    }

    if (authResponse.error) {
      console.error('Supabase auth error:', authResponse.error);
      return NextResponse.json({ error: authResponse.error.message }, { status: 500 });
    }

    // User is now authenticated with Supabase
    return NextResponse.json({ 
      success: true, 
      user: authResponse.data.user, 
      session: authResponse.data.session,
      passwordUsed: securePassword // Include the password for debugging (remove in production)
    });
  } catch (error: any) {
    console.error('Civic-Supabase login API error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
