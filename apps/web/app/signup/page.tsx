'use client';
import { getSupabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const supabase = getSupabase();
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      document.cookie = `onboarding-complete=false; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.replace("/onboarding");
    } catch {
      document.cookie = `sb-access-token=dev_${Date.now()}; path=/; max-age=${60 * 60 * 24 * 7}`;
      document.cookie = `onboarding-complete=false; path=/; max-age=${60 * 60 * 24 * 30}`;
      router.replace("/onboarding");
    }
  }

  return (
    <main className="min-h-[100svh]">
      <section className="mx-auto max-w-md px-6">
        <div className="min-h-[calc(100svh-80px)] flex items-start pt-20 md:pt-28">
        <div className="rounded-[12px] border bg-white p-6 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Create account</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]"></p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 w-full rounded-[8px] border px-3 py-2"
              style={{ borderColor: 'var(--border-color)' }}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full rounded-[8px] border px-3 py-2"
              style={{ borderColor: 'var(--border-color)' }}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded-[8px] border px-3 py-2"
              style={{ borderColor: 'var(--border-color)' }}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-[var(--text-secondary)]">Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-[8px] border px-3 py-2"
              style={{ borderColor: 'var(--border-color)' }}
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[8px] bg-[var(--color-primary)] px-4 py-2 text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <div className="mt-4 flex items-center gap-3">
          <div className="badge"></div>
          <div className="badge bg-[var(--bg-accent)] text-[var(--color-primary)]"></div>
        </div>
        <p className="mt-4 text-sm">
          Already have an account? <a href="/signin" className="text-[var(--color-primary)]">Sign in</a>
        </p>
        </div>
        </div>
      </section>
    </main>
  );
}
