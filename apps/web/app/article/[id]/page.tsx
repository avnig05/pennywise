import { notFound } from "next/navigation";
import { getArticle } from "@/lib/api/articles";
import ArticlePageHeader from "@/components/ArticlePageHeader";
import ArticlePageBody from "@/components/ArticlePageBody";

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

  const readTimeMin = 5;
  const categoryDisplay =
    typeof article.category === "string"
      ? article.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : String(article.category);

  return (
    <main className="min-h-screen bg-[var(--bg-page)]">
      <article className="mx-auto max-w-3xl px-6 py-8">
        <ArticlePageHeader
          articleId={id}
          category={categoryDisplay}
          readTimeMin={readTimeMin}
          difficulty={article.difficulty}
          title={article.title}
          sourceName={article.source_name}
          sourceUrl={article.source_url}
        />
        <ArticlePageBody
          articleId={id}
          fallbackSummary={article.summary}
        />
      </article>
    </main>
  );
}
