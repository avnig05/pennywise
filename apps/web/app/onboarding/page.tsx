import { redirect } from "next/navigation";
import OnboardingForm from "../../components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  
  try {
    const res = await fetch(`${apiBase}/me`, { cache: "no-store" });
    
    // If user already has a profile, redirect to dashboard
    if (res.ok) {
      redirect("/dashboard");
    }
  } catch {
    // If API is down, allow access to onboarding
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Personalize your Pennywise</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Answer a few questions so we can tailor recommendations.
        </p>
        <div className="mt-8 rounded-lg border p-6">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
