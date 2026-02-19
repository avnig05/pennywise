import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingFinalCTA() {
  return (
    <section className="w-full py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Ready to take control?
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Join thousands of students building their financial future.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center bg-sage-500 hover:bg-sage-600 text-white px-8 py-6 text-base rounded-full font-medium"
        >
          Get Started
          <ArrowRight className="ml-2" size={18} />
        </Link>
      </div>
    </section>
  );
}
