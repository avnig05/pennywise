import ChatButton from "@/components/ChatButton";
import ProgressBar from "@/components/ProgressBar";
import ArticleCard from "@/components/ArticleCard";
import { getFeed, feedArticleToArticle } from "@/lib/api/feed";
import type { Article } from "@/types";

export default async function Dashboard() {
  let recommended: Article[] = [];
  try {
    const { articles } = await getFeed(5);
    recommended = articles.map(feedArticleToArticle);
  } catch {
    // API unreachable or error — show empty state below
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold text-gray-900">Welcome back! 👋</h1>
        <p className="mt-2 text-sm text-gray-700">Here&apos;s your daily overview</p>

        <div className="mt-6 rounded-2xl border bg-[#FEF3E2] p-4">
          <div className="flex items-center gap-3 text-[#8B6914]">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border">💡</span>
            <span className="font-medium">Tip of the day</span>
          </div>
          <p className="mt-2 text-sm text-[#8B6914]">Connect to the API to load your personalized tip.</p>
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Your Learning Progress</h2>
          <p className="mt-1 text-sm text-gray-700">Progress will appear once tracking is enabled.</p>
          <div className="mt-6 space-y-5">
            <ProgressBar label="Student Loans" percent={0} />
            <ProgressBar label="Credit Cards" percent={0} />
            <ProgressBar label="Budgeting" percent={0} />
            <ProgressBar label="Building Credit" percent={0} />
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
          {recommended.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {recommended.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border bg-white p-6 text-gray-700">No recommendations available yet.</div>
          )}
        </div>
      </section>
      <ChatButton />
    </main>
  );
}