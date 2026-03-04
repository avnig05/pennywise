"use client";

import { useRef } from "react";
import ArticleContent from "@/components/ArticleContent";
import MarkAsCompleteSection from "@/components/MarkAsCompleteSection";
import ArticleQuiz from "@/components/ArticleQuiz";

type Props = {
  articleId: string;
  fallbackSummary: string | null;
};

export default function ArticlePageBody({ articleId, fallbackSummary }: Props) {
  const quizRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-6">
      <ArticleContent articleId={articleId} fallbackSummary={fallbackSummary} />
      <MarkAsCompleteSection articleId={articleId} quizRef={quizRef} />
      <div ref={quizRef} className="mt-12">
        <ArticleQuiz articleId={articleId} />
      </div>
    </div>
  );
}
