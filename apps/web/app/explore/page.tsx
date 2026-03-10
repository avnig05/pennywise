'use client';
import ArticleCard from "@/components/ArticleCard";
import CategoryBadge from "@/components/CategoryBadge";
import { listArticles, listArticleToArticle } from "@/lib/api/articles";
import type { Article } from "@/types";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const ARTICLES_PER_PAGE = 8;

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "savings", label: "Savings" },
  { value: "budgeting", label: "Budgeting" },
  { value: "taxes", label: "Taxes" },
  { value: "investing", label: "Investing" },
  { value: "debt_management", label: "Debt Management" },
  { value: "banking", label: "Banking" },
  { value: "student_loans", label: "Student Loans" },
  { value: "credit_cards", label: "Credit Cards" },
  { value: "credit_score", label: "Credit Score" },
];

const DIFFICULTY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function ExplorePage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>("");
  const [query, setQuery] = useState("");

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const toggle = (c: string) => {
    setSelectedCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const categoryParam = selectedCategories.length === 1 ? selectedCategories[0] : undefined;
  const difficultyParam = difficulty || undefined;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listArticles({ category: categoryParam, difficulty: difficultyParam, limit: 200 })
      .then((rows) => {
        if (!cancelled) {
          setArticles(rows.map(listArticleToArticle));
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setArticles([]);
          setError(e instanceof Error ? e.message : "Failed to load articles.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categoryParam, difficultyParam]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasCategoryFilter = selectedCategories.length > 0;
    const norm = (s: string) => String(s).toLowerCase().replace(/\s+/g, "_").trim();

    return articles.filter((a) => {
      const articleCat = norm(a.category ?? "");
      const matchesCategories =
        !hasCategoryFilter || selectedCategories.some((c) => norm(c) === articleCat);
      if (!matchesCategories) return false;

      if (!q) return true;
      const haystack = `${a.title}\n${a.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [articles, query, selectedCategories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ARTICLES_PER_PAGE));
  const paginatedArticles = useMemo(() => {
    const start = (page - 1) * ARTICLES_PER_PAGE;
    return filtered.slice(start, start + ARTICLES_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [categoryParam, difficultyParam, query]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setDifficulty("");
    setQuery("");
  };

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Explore</h1>
            <p className="mt-1 text-sm text-gray-700">Browse summaries and find something worth reading.</p>
          </div>
          <div className="text-sm text-gray-600">{loading ? "Loading…" : `${filtered.length} article${filtered.length === 1 ? "" : "s"}`}</div>
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title or summary…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-(--color-sage)"
              />
            </div>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-(--color-sage)"
              aria-label="Filter by difficulty"
            >
              <option value="">All difficulty</option>
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {CATEGORY_OPTIONS.map((c) => (
              <CategoryBadge
                key={c.value}
                label={c.label}
                active={selectedCategories.includes(c.value)}
                onClick={() => toggle(c.value)}
              />
            ))}
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">Loading articles…</div>
          ) : error ? (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">No matching articles.</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {paginatedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
