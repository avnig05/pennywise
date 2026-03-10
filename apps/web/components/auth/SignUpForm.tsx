'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabase } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export default function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/onboarding')}`;
      const supabase = getSupabase();
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      });
      if (err) {
        setError(err.message);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError('Could not start Google sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail ?? 'Failed to send verification code.');
        return;
      }
      setSuccessMessage('Check your email for the 6-digit code.');
      setStep('verify');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-and-create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          password,
          name: name.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail ?? 'Invalid or expired code. Request a new one.');
        return;
      }
      const supabase = getSupabase();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) {
        setError('Account created but sign-in failed. Try signing in with your email and password.');
        return;
      }
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.access_token) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        document.cookie = `onboarding-complete=false; path=/; max-age=${60 * 60 * 24 * 30}`;
        await new Promise((r) => setTimeout(r, 100));
        window.location.href = '/onboarding';
      } else {
        setError('Account created. Please sign in with your email and password.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {step === 'form' ? 'Create your account' : 'Verify your email'}
          </h1>
          <p className="text-gray-600">
            {step === 'form'
              ? 'Start your financial education journey today'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full py-6 rounded-full text-base font-medium" disabled={loading}>
              {loading ? 'Sending...' : 'Send verification code'}
              <Mail className="ml-2" size={18} />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-gray-500">
                Code sent to {email}. Expires in 15 minutes.
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
            <Button type="submit" className="w-full py-6 rounded-full text-base font-medium" disabled={loading}>
              {loading ? 'Creating account...' : 'Verify and create account'}
              <ArrowRight className="ml-2" size={18} />
            </Button>
            <button
              type="button"
              onClick={() => { setStep('form'); setCode(''); setError(null); setSuccessMessage(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Use a different email
            </button>
          </form>
        )}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">or</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full py-6 rounded-full border-gray-300 hover:bg-gray-50"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </Button>
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-sage-500 hover:text-sage-600 font-medium">
            Sign in
          </Link>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-sage-500 hover:underline">Terms</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-sage-500 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
