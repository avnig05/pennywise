import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HeroImage from "@/components/landing/HeroImage";
import Features from "@/components/landing/Features";
import Stats from "@/components/landing/Stats";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="bg-white">
      <Header />
      <Hero />
      <HeroImage />
      <Features />
      <Stats />
      <FinalCTA />
      <Footer />
    </main>
  );
}
