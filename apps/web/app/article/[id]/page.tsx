import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getArticle } from "@/lib/api/articles";
import ChatButton from "@/components/ChatButton";
import ArticleQuiz from "@/components/ArticleQuiz";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  let article;
  try {
    article = await getArticle(id);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <article className="mx-auto max-w-3xl px-6 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <header className="mt-6 border-b border-gray-200 pb-6">
          <span className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700">
            {article.category}
          </span>
          <h1 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">{article.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="rounded-full border px-2 py-1 text-xs capitalize">{article.difficulty}</span>
            {article.source_name && <span>{article.source_name}</span>}
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-sage)] underline hover:no-underline"
              >
                View original
              </a>
            )}
          </div>
          {article.summary && (
            <p className="mt-4 text-gray-700">{article.summary}</p>
          )}
        </header>

        <div className="prose prose-gray mt-8 max-w-none">
          {article.original_content ? (
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {article.original_content}
            </div>
          ) : (
            <p className="text-gray-500">No content available for this article.</p>
          )}
        </div>

        <ArticleQuiz articleId={id} />
      </article>
      <ChatButton />
    </main>
  );
}
