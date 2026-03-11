import { redirect } from "next/navigation";
import OnboardingForm from "../../components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  try {
    const res = await fetch(`${apiBase}/me`, { cache: "no-store" });

    if (res.ok) {
      redirect("/dashboard");
    }
  } catch {
    // If API is down, allow access to onboarding
  }

  return (
    <main
      className="relative h-[100dvh] overflow-hidden px-4 py-4 md:px-6 md:py-4"
      style={{ backgroundColor: "#a2c7bf" }}
    >
      <div className="absolute left-[-100px] top-[-80px] h-56 w-56 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-90px] h-68 w-68 rounded-full bg-[#928b5b]/20 blur-3xl" />

      <div className="relative mx-auto grid h-full max-w-6xl min-h-0 gap-4 md:grid-cols-[0.92fr_1.08fr] md:gap-6">
        <section className="flex min-h-0 flex-col items-center justify-center">
          <div className="w-full max-w-[520px] text-center">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-[#173b37]/70">
              Onboarding
            </p>

            <h1 className="font-serif text-[3.9rem] font-bold leading-[0.95] tracking-[-0.03em] text-[#012825] sm:text-[4.3rem] md:text-[4rem]">
              <span className="block md:hidden">Personalize your money plan.</span>
              <span className="hidden md:block">Personalize</span>
              <span className="hidden md:block">your money</span>
              <span className="hidden md:block">plan.</span>
            </h1>

            <div className="mt-2 font-serif text-[3.2rem] italic font-semibold leading-[0.95] tracking-[-0.03em] text-[#928b5b] sm:text-[3.7rem] md:text-[3.35rem]">
              <span className="block md:hidden">Make Pennywise yours.</span>
              <span className="hidden md:block">Make</span>
              <span className="hidden md:block">Pennywise</span>
              <span className="hidden md:block">yours.</span>
            </div>

            <p className="mx-auto mt-4 max-w-[500px] text-[15px] leading-7 text-[#173b37] md:mt-5 md:text-base">
              Answer a few quick questions so your dashboard, recommendations,
              and financial learning path feel tailored to you.
            </p>

            <div className="mx-auto mt-5 grid max-w-[500px] gap-3 md:mt-6">
              <div className="rounded-[22px] border border-white/35 bg-white/18 px-5 py-4 text-center backdrop-blur-sm">
                <p className="text-base font-semibold text-[#012825]">
                  Personalized dashboard
                </p>
                <p className="mt-1 text-[15px] leading-6 text-[#173b37]/80">
                  Get recommendations that actually fit your financial situation.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/35 bg-white/18 px-5 py-4 text-center backdrop-blur-sm">
                <p className="text-base font-semibold text-[#012825]">
                  Smarter learning path
                </p>
                <p className="mt-1 text-[15px] leading-6 text-[#173b37]/80">
                  Build habits and confidence with content tailored to your goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="min-h-0">
          <div className="flex h-full min-h-0 rounded-[28px] border border-white/40 bg-white/28 p-2.5 shadow-[0_20px_60px_rgba(1,40,37,0.12)] backdrop-blur-xl md:p-3">
            <OnboardingForm />
          </div>
        </section>
      </div>
    </main>
  );
}