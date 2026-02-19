/**
 * Auth utilities for checking authentication status and logout
 */

import { getSupabase } from './supabaseClient';

/**
 * Check if user is authenticated by looking for the access token
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'sb-access-token' && value && value.length > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'sb-access-token') {
      return value;
    }
  }
  
  return null;
}

/**
 * Logout user by clearing session and cookies
 */
export async function logout(): Promise<void> {
  try {
    // Sign out from Supabase
    const supabase = getSupabase();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Clear cookies
  document.cookie = 'sb-access-token=; path=/; max-age=0';
  document.cookie = 'onboarding-complete=; path=/; max-age=0';
  
  // Redirect to landing page
  window.location.href = '/';
}

