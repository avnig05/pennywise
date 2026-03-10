import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LandingFinalCTA() {
  return (
    /* Background matches the feature section's transition wave color */
    <section className="relative w-full pt-32 pb-48 bg-[#f6eee3] overflow-hidden">
      
      {/* Centered Content Area */}
      <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
        
        {/* Serif heading matching hero style */}
        <h2 className="font-serif text-5xl md:text-6xl font-serif text-[#1A302B] mb-6">
          Ready to take control?
        </h2>
        
        <p className="font-sans text-[#4B5E5A] text-lg md:text-xl mb-12 opacity-90">
          Join thousands of students building their financial future.
        </p>

        {/* The soft-glow 'Get Started' button */}
        <Link
          href="/signup"
          className="font-sans inline-block bg-[#a2c7bf] hover:bg-[#7D9A91] text-white px-10 py-5 rounded-full font-bold text-lg shadow-xl shadow-[#8EABA2]/20 transition-all hover:scale-105 active:scale-95"
        >
          Get Started
        </Link>
      </div>

      {/* Little Sparkle Accent positioned as seen in the design */}
      <div className="absolute bottom-24 right-[10%] text-[#A18A5E] opacity-40 hidden md:block">
        <Sparkles size={48} />
      </div>

    </section>
  );
}