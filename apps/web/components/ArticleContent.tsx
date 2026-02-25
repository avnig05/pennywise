"use client";

import { useEffect, useState } from "react";
import { getStructuredArticle } from "@/lib/api/articles";
import type { StructuredArticle } from "@/lib/api/articles";

/** Placeholder icon for Pennywise - simple P in a circle */
function PennywiseIcon({ className }: { className?: string }) {
  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border bg-gray-100 text-sm font-semibold ${className ?? ""}`}
    >
      P
    </div>
  );
}

type Props = {
  articleId: string;
  fallbackSummary: string | null;
};

export default function ArticleContent({ articleId, fallbackSummary }: Props) {
  const [structured, setStructured] = useState<StructuredArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStructuredArticle(articleId)
      .then((data) => {
        if (!cancelled) setStructured(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load structured content");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [articleId]);

  if (loading) {
    return (
      <div className="mt-8 space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-20 animate-pulse rounded bg-gray-100" />
              <div className="ml-4 h-16 w-4/5 animate-pulse rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !structured) {
    return (
      <div className="mt-8">
        <div className="space-y-4 text-gray-700">
          {fallbackSummary
            ? fallbackSummary
                .split(/\n\n+/)
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i} className={i > 0 ? "mt-3" : ""}>
                    {paragraph.trim()}
                  </p>
                ))
            : "Article content is not available."}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Intro commentary box */}
      {structured.intro_commentary && (
        <div className="rounded-xl border bg-gray-50 p-4">
          <div className="flex gap-3">
            <PennywiseIcon />
            <p className="text-gray-800">{structured.intro_commentary}</p>
          </div>
        </div>
      )}

      {/* Sections with commentary after each */}
      {structured.sections.map((section, i) => (
        <section key={i}>
          <h2 className="text-xl font-semibold text-gray-900">{section.heading}</h2>
          <div className="mt-3 space-y-3 text-gray-700">
            {section.content
              .split(/\n\n+/)
              .filter(Boolean)
              .map((para, j) => (
                <p key={j}>{para.trim()}</p>
              ))}
          </div>
          {section.commentary && (
            <div className="mt-4 rounded-xl border bg-gray-50 p-4">
              <div className="flex gap-3">
                <PennywiseIcon />
                <p className="text-gray-800">{section.commentary}</p>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
