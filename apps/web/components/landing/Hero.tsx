import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="w-full py-16 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-3">
          Master your money.
        </h1>
        <h1 className="text-5xl md:text-6xl font-bold text-sage-500 mb-6">
          Build your future.
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          Financial education designed for college students and early-career professionals. Simple, personal, and powerful.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center bg-sage-500 hover:bg-sage-600 text-white px-8 py-6 text-base rounded-full font-medium"
        >
          Start Learning Free
          <ArrowRight className="ml-2" size={18} />
        </Link>
      </div>
    </section>
  );
}
