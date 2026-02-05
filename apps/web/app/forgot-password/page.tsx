'use client';
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-[12px] border bg-white p-6 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Reset password</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Enter your email and we’ll send a reset link.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
            <button
              type="submit"
              className="w-full rounded-[8px] bg-[var(--color-primary)] px-4 py-2 text-white hover:bg-[var(--color-primary-dark)]"
            >
              Send reset link
            </button>
          </form>
          {sent && (
            <div className="mt-4 rounded-[8px] border bg-[var(--bg-accent)] p-3 text-sm" style={{ borderColor: 'var(--border-color)' }}>
              Check your email for the reset link.
            </div>
          )}
          <div className="mt-6 text-sm">
            <Link href="/signin" className="text-[var(--color-primary)]">Back to sign in</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
