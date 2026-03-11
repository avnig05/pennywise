import { redirect } from "next/navigation";
import OnboardingForm from "../../components/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <main
      className="relative h-screen overflow-hidden px-4 py-4 md:px-6 md:py-5"
      style={{ backgroundColor: "#a2c7bf" }}
    >
      <div className="absolute left-[-100px] top-[-80px] h-56 w-56 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute bottom-[-100px] right-[-80px] h-72 w-72 rounded-full bg-[#928b5b]/20 blur-3xl" />

      <div className="relative mx-auto flex h-full max-w-5xl flex-col">
        <div className="mb-3 text-center md:mb-4">
          <h1 className="font-serif text-3xl font-bold leading-tight text-[#012825] md:text-5xl">
            Personalize your money plan. <br />
            <span className="italic text-[#928b5b]">Make Pennywise yours.</span>
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm text-[#173b37] md:text-base">
            Answer a few quick questions so your dashboard and recommendations
            feel tailored to you.
          </p>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 rounded-[28px] border border-white/40 bg-white/45 p-4 shadow-[0_20px_60px_rgba(1,40,37,0.12)] backdrop-blur-xl md:p-6">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
