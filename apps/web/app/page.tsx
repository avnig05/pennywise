import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";

export default function Home() {
  return (
    <main className="min-h-screen snap-y snap-mandatory">
      <Hero />
      <div id="below-hero" className="scroll-mt-24" />
      <Features />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
    </main>
  );
}
