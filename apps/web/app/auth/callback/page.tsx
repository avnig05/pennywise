'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabaseClient';
import { getProfile } from '@/lib/api/profile';

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // Supabase puede enviarnos access_token en el hash (flujo implícito)
        // o un authorization code en query/hash (PKCE)
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash?.replace(/^#/, '') || '');

        const accessTokenFromHash = hash.get('access_token');
        const code = query.get('code') ?? hash.get('code');

        const supabase = getSupabase();
        let accessToken: string | null = null;

        if (accessTokenFromHash) {
          accessToken = accessTokenFromHash;
        } else if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError || !data.session?.access_token) {
            throw new Error(exchangeError?.message || 'Sign in failed. Please try again.');
          }
          accessToken = data.session.access_token;
        } else {
          throw new Error('Missing authorization code. Please try signing in again.');
        }

        // Persist auth token for backend
        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
        await new Promise((r) => setTimeout(r, 100));

        // Detect if the user already has a profile -> onboarding completed
        let onboardingComplete = false;
        try {
          await getProfile();
          onboardingComplete = true;
        } catch (err) {
          if (err instanceof Error && err.message.includes('Profile not found')) {
            onboardingComplete = false;
          } else {
            throw err;
          }
        }

        document.cookie = `onboarding-complete=${onboardingComplete ? 'true' : 'false'}; path=/; max-age=${60 * 60 * 24 * 30}`;

        // Redirect based on onboarding status
        window.location.href = onboardingComplete ? '/dashboard' : '/onboarding';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      }
    };

    void run();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/login" className="text-sage-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-gray-600">Signing you in…</p>
    </div>
  );
}
