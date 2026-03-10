import { Suspense } from "react";
import LearningStats from "@/components/LearningStats";
import RecommendedArticles from "./RecommendedArticles";
import TipOfTheDay from "./TipOfTheDay";

export default function Dashboard() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold text-gray-900">Welcome back! 👋</h1>
        <p className="mt-2 text-sm text-gray-700">Here&apos;s your daily overview</p>

        <Suspense fallback={
          <div className="mt-6 rounded-2xl border bg-[#FEF3E2] p-4">
            <div className="flex items-center gap-3 text-[#8B6914]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border">💡</span>
              <span className="font-medium">Tip of the day</span>
            </div>
            <p className="mt-2 text-sm text-[#8B6914]">Loading your personalized tip...</p>
          </div>
        }>
          <TipOfTheDay />
        </Suspense>

        <LearningStats />

        <div className="mt-10">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Recommended for You
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Articles tailored to your learning goals
          </p>
          <RecommendedArticles />
        </div>
      </section>
    </main>
  );
}