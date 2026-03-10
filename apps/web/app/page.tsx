import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import UseCases from "@/components/landing/UseCases";
import ScrollingFeatures from "@/components/landing/ScrollingFeatures";
import LandingFeatures from "@/components/landing/LandingFeatures";

import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="bg-white">
      <Header />
      <Hero />
      <UseCases />
      <ScrollingFeatures />
      <LandingFeatures />
      <FinalCTA />
      <Footer />
    </main>
  );
}
