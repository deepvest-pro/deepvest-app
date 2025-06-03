'use server';

import { cookies } from 'next/headers';

/**
 * Safe getter for cookies that always uses await
 * Use this function instead of directly calling cookies() to avoid errors
 */
export async function getSafeCookies() {
  return await cookies();
}

/**
 * Returns all current cookies for debugging
 */
export async function logCookies() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  return allCookies;
}

/**
 * Checks for the presence of a Supabase auth cookie
 */
export async function checkAuthCookie() {
  const cookieStore = await cookies();
  const authCookies = cookieStore.getAll().filter(cookie => cookie.name.includes('auth-token'));
  return authCookies.length > 0 ? { exists: true, cookies: authCookies } : { exists: false };
}
