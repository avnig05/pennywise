 'use client';
 import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-[12px] border bg-white p-6 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Personalize your Pennywise</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Answer a few questions so we can tailor recommendations.</p>
          <div className="mt-6">
            <OnboardingForm />
          </div>
        </div>
      </section>
    </main>
  );
}
