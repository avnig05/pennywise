"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getStructuredArticle } from "@/lib/api/articles";
import type { StructuredArticle } from "@/lib/api/articles";

/** Pennywise logo in a circle - border and bg from globals (intro: grey, callouts: green/yellow/orange) */
function PennywiseIcon({
  className,
  variant = "intro",
}: {
  className?: string;
  variant?: "intro" | "green" | "yellow" | "orange";
}) {
  const bgVar =
    variant === "intro"
      ? "var(--callout-intro-icon-bg)"
      : variant === "green"
        ? "var(--callout-green-bg)"
        : variant === "yellow"
          ? "var(--callout-yellow-bg)"
          : "var(--callout-orange-bg)";
  const borderVar =
    variant === "intro"
      ? "var(--callout-intro-icon-border)"
      : variant === "green"
        ? "var(--callout-green-border)"
        : variant === "yellow"
          ? "var(--callout-yellow-border)"
          : "var(--callout-orange-border)";
  return (
    <div
      className={`flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border ${className ?? ""}`}
      style={{ backgroundColor: bgVar, borderColor: borderVar }}
      aria-hidden
    >
      <Image
        src="/pennywise-logo.png"
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px] brightness-0"
      />
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
        <div className="h-24 animate-pulse rounded-lg border border-[var(--content-section-border)] bg-[var(--callout-intro-bg)]" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-[var(--content-section-border)] bg-[var(--bg-card)] p-6"
          >
            <div className="h-6 w-2/3 rounded bg-[var(--callout-intro-icon-bg)]" />
            <div className="mt-3 h-20 rounded bg-[var(--callout-intro-icon-bg)]" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !structured) {
    return (
      <div className="mt-8 rounded-lg border border-[var(--content-section-border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
        <div className="article-body space-y-4 text-[var(--text-meta)]">
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
    <div className="mt-8 space-y-6">
      {/* First comment: white container, avatar left, message bubble right */}
      {structured.intro_commentary && (
        <div
          className="flex gap-4 rounded-lg p-4"
          style={{
            backgroundColor: "#6B90800D",
            borderTop: "2px solid #6B908033",
          }}
        >
          <div
            className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--bg-card)]"
            style={{ border: "1px solid #E5E7EB" }}
            aria-hidden
          >
            <Image
              src="/pennywise-logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 brightness-0"
            />
          </div>
          <div
            className="min-w-0 flex-1 rounded-2xl bg-[var(--bg-card)] px-4 py-3"
            style={{
              borderTop: "2px solid #6B908026",
              boxShadow:
                "0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A",
            }}
          >
            <p className="text-sm leading-relaxed text-[var(--callout-intro-text)]">
              {structured.intro_commentary}
            </p>
          </div>
        </div>
      )}

      {/* Sections: white cards + green “Did you know?” callouts (Figma) */}
      {structured.sections.map((section, i) => (
        <div key={i} className="space-y-4">
          <section
            className="rounded-lg p-6 shadow-[var(--shadow-sm)]"
            style={{
              backgroundColor: "#FFFFFF99",
              borderTop: "2px solid #6B908013",
            }}
          >
            <h2 className="text-xl font-semibold text-[var(--text-title)]">
              {section.heading}
            </h2>
            <div className="article-body mt-3 space-y-3 text-[var(--text-meta)]">
              {section.content
                .split(/\n\n+/)
                .filter(Boolean)
                .map((para, j) => (
                  <p key={j}>{para.trim()}</p>
                ))}
            </div>
          </section>
          {section.commentary && (
            <div className="flex gap-4 items-start">
              <div
                className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-card)]"
                style={{ border: "1px solid #6B908033" }}
                aria-hidden
              >
                <Image
                  src="/pennywise-logo.png"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 brightness-0"
                />
              </div>
              <div
                className="min-w-0 flex-1 rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: "#6B90801A",
                  borderTop: "2px solid #6B908033",
                }}
              >
                <p
                  className="italic"
                  style={{
                    fontFamily: "var(--font-inter), Inter, sans-serif",
                    fontWeight: 400,
                    fontSize: "14px",
                    lineHeight: "20px",
                    letterSpacing: "-0.15px",
                    color: "#3D4451CC",
                  }}
                >
                  {section.commentary}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
