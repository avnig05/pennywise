import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="bg-[var(--bg-page)]">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <div className="rounded-[16px] border bg-[var(--bg-accent)] p-10 md:p-12 text-center shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)]">Ready to make money simple?</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Start learning and act on clear, personalized guidance today.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/signup" className="rounded-[8px] bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-dark)] transition">
              Get Started Free
            </Link>
            <Link href="/login" className="rounded-[8px] border border-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--bg-page)] transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
