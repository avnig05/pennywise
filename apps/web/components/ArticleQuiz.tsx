"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import {
  getArticleQuiz,
  submitQuizAnswers,
  getArticleCompletion,
  regenerateArticleQuiz,
  type Quiz,
  type QuizQuestion,
} from "@/lib/api/quizzes";

type Props = {
  articleId: string;
  onComplete?: () => void;
};

export default function ArticleQuiz({ articleId, onComplete }: Props) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const shouldScrollToResultRef = useRef(false);
  const quizFormRef = useRef<HTMLDivElement>(null);
  const shouldScrollToQuizRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    setLoadError(null);

    async function pollUntilReady() {
      const pollIntervalMs = 1200; // Check every 1.2s so quiz appears soon after ready
      const maxAttempts = 75; // ~90s total
      for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt++) {
        const data = await getArticleQuiz(articleId);
        if (cancelled) return data;
        if (data.status === "ready" && data.quiz_id && data.questions.length > 0) {
          return data;
        }
        await new Promise((r) => {
          pollTimeout = setTimeout(r, pollIntervalMs);
        });
      }
      return null;
    }

    async function load() {
      try {
        const completion = await getArticleCompletion(articleId);
        if (cancelled) return;
        if (completion) {
          const data = await getArticleQuiz(articleId);
          if (cancelled) return;
          setQuiz(data);
          if (completion.user_answers && completion.user_answers.length > 0) {
            setAnswers(completion.user_answers);
          } else {
            setAnswers(new Array(data.questions.length).fill(-1));
          }
          setIsCompleted(true);
          setScore(completion.quiz_score);
          setSubmitted(true);
          setLoading(false);
          return;
        }
        const data = await getArticleQuiz(articleId);
        if (cancelled) return;
        if (data.status === "generating" || (!data.quiz_id && data.questions.length === 0)) {
          setQuiz({ ...data, questions: [] });
          setLoading(false);
          setGenerating(true);
          const ready = await pollUntilReady();
          if (cancelled) return;
          setGenerating(false);
          if (ready) {
            setQuiz(ready);
            setAnswers(new Array(ready.questions.length).fill(-1));
          } else {
            setLoadError("Quiz is taking longer than expected. Please refresh to try again.");
          }
          return;
        }
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(-1));
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to load quiz:", e);
          setLoadError(e instanceof Error ? e.message : "Could not load quiz.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [articleId]);

  // Scroll to result when user just submitted (must run before any early return)
  useEffect(() => {
    if (isCompleted && score !== null && shouldScrollToResultRef.current) {
      shouldScrollToResultRef.current = false;
      resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isCompleted, score]);

  // Scroll to first question when user just regenerated quiz
  useEffect(() => {
    if (!isCompleted && quiz && shouldScrollToQuizRef.current) {
      shouldScrollToQuizRef.current = false;
      quizFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isCompleted, quiz]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (submitted) return;
    const next = [...answers];
    next[questionIndex] = answerIndex;
    setAnswers(next);
  };

  const handleSubmit = async () => {
    if (!quiz || answers.some((a) => a === -1)) {
      alert("Please answer all questions before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      const result = await submitQuizAnswers(articleId, answers);
      setScore(result.score);
      setSubmitted(true);
      setIsCompleted(true);
      shouldScrollToResultRef.current = true;
      onComplete?.();
    } catch (e) {
      console.error("Failed to submit quiz:", e);
      alert("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerateQuiz = async () => {
    try {
      setRegenerating(true);
      const newQuiz = await regenerateArticleQuiz(articleId);
      shouldScrollToQuizRef.current = true;
      setQuiz(newQuiz);
      setAnswers(new Array(newQuiz.questions.length).fill(-1));
      setSubmitted(false);
      setIsCompleted(false);
      setScore(null);
      onComplete?.();
    } catch (e) {
      console.error("Failed to generate new quiz:", e);
      alert("Could not generate a new quiz. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading || generating) {
    return (
      <div className="mt-12 rounded-2xl border bg-white p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-sage)]" />
        <p className="mt-4 text-gray-600">
          {generating ? "Generating your quiz..." : "Loading quiz..."}
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-amber-800">Quiz could not be loaded.</p>
        <p className="mt-2 text-sm text-amber-700">{loadError}</p>
        <p className="mt-2 text-xs text-gray-600">
          Ensure the API is running (e.g. http://localhost:8000) and{" "}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_API_BASE_URL</code> is set in{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code>.
        </p>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return null;
  }

  // Show completed header + full quiz with answers when completed
  if (isCompleted && score !== null && quiz) {
    return (
      <div className="mt-12 space-y-6">
        {/* Completed header - scroll target after submit */}
        <div
          ref={resultSectionRef}
          className="relative rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 shadow-sm"
        >
          <Link
            href="/dashboard"
            className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <div className="text-center">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl ${
                score >= 70
                  ? "bg-green-100"
                  : score >= 50
                  ? "bg-yellow-100"
                  : "bg-red-100"
              }`}
            >
              {score >= 90 ? "🤩" : score >= 65 ? "😊" : score >= 40 ? "😐" : "😢"}
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-green-300 bg-green-100 px-4 py-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-green-800">
                Completed
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">Quiz completed</h2>
            <p className="mt-3 text-lg text-gray-700">
              Your score:{" "}
              <span
                className={`font-bold ${
                  score >= 90
                    ? "text-green-800"
                    : score >= 70
                    ? "text-green-700"
                    : score >= 50
                    ? "text-yellow-700"
                    : "text-red-700"
                }`}
              >
                {score}%
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {score >= 90
                ? "Amazing work, you really mastered this!"
                : score >= 65
                ? "Great job, you understand the material well."
                : score >= 40
                ? "Not bad! Consider reviewing some sections to improve."
                : "Consider reviewing the article to improve your understanding."}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleRegenerateQuiz}
                disabled={regenerating}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-sage)] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {regenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate quiz
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quiz with answers shown */}
        <div className="rounded-2xl border bg-white p-8">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Your answers</h2>

          {quiz.questions.map((question, qIdx) => {
            const userAnswer = answers[qIdx];
            const isCorrect = userAnswer === question.correct_answer_index;
            return (
              <div key={question.id} className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {qIdx + 1}. {question.question_text}
                  </h3>
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                  )}
                </div>
                <div className="space-y-3">
                  {question.options.map((option, optIdx) => {
                    const isSelected = userAnswer === optIdx;
                    const isCorrectAnswer = optIdx === question.correct_answer_index;
                    const isWrongSelected = isSelected && !isCorrectAnswer;

                    return (
                      <div
                        key={optIdx}
                        className={`w-full rounded-lg border-2 p-4 ${
                          isCorrectAnswer
                            ? "border-green-500 bg-green-50"
                            : isWrongSelected
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected
                                ? isCorrectAnswer
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-red-500 bg-red-500 text-white"
                                : isCorrectAnswer
                                ? "border-green-500 bg-green-100 text-green-700"
                                : "border-gray-300 bg-white text-gray-600"
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span
                            className={`${
                              isCorrectAnswer
                                ? "font-medium text-green-900"
                                : isWrongSelected
                                ? "text-red-900"
                                : "text-gray-700"
                            }`}
                          >
                            {option}
                          </span>
                          {isCorrectAnswer && (
                            <span className="ml-auto text-xs font-semibold text-green-700">
                              Correct answer
                            </span>
                          )}
                          {isWrongSelected && (
                            <span className="ml-auto text-xs font-semibold text-red-700">
                              Your answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Regenerate button at the end of the page */}
          <div className="mt-10 border-t border-gray-100 pt-8">
            <p className="mb-4 text-center text-sm text-gray-500">
              Want to practice again with different questions?
            </p>
            <button
              type="button"
              onClick={handleRegenerateQuiz}
              disabled={regenerating}
              className="mx-auto flex w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-[var(--color-sage)] px-6 py-4 text-base font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            >
              {regenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating new quiz...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Generate another quiz
                </>
              )}
            </button>
          </div>
        </div>

        {/* Back to dashboard at the end of the quiz */}
        <div className="mt-4 flex justify-start">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={quizFormRef} className="mt-12 rounded-2xl border bg-white p-8">
      <h2 className="mb-6 text-2xl font-semibold text-gray-900">Test your understanding</h2>

      {quiz.questions.map((question, qIdx) => (
        <div key={question.id} className="mb-8">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            {qIdx + 1}. {question.question_text}
          </h3>
          <div className="space-y-3">
            {question.options.map((option, optIdx) => {
              const isSelected = answers[qIdx] === optIdx;
              const isCorrect = submitted && optIdx === question.correct_answer_index;
              const isWrong = submitted && isSelected && optIdx !== question.correct_answer_index;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleAnswerSelect(qIdx, optIdx)}
                  disabled={submitted}
                  className={`w-full rounded-lg border-2 p-4 text-left transition ${
                    isSelected
                      ? "border-[var(--color-sage)] bg-[var(--color-sage)]/10"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    isCorrect ? "border-green-500 bg-green-50" : ""
                  } ${isWrong ? "border-red-500 bg-red-50" : ""} ${
                    submitted ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                        isSelected ? "border-[var(--color-sage)] bg-[var(--color-sage)] text-white" : "border-gray-300"
                      } ${isCorrect ? "border-green-500 bg-green-500" : ""} ${
                        isWrong ? "border-red-500 bg-red-500" : ""
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-gray-700">{option}</span>
                    {submitted && isCorrect && (
                      <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-green-500" />
                    )}
                    {submitted && isWrong && (
                      <XCircle className="ml-auto h-5 w-5 shrink-0 text-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || answers.some((a) => a === -1)}
          className="w-full rounded-lg bg-[var(--color-sage)] px-6 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </span>
          ) : (
            "Submit quiz"
          )}
        </button>
      )}

      {submitted && score !== null && (
        <div className="mt-6 rounded-lg bg-gray-50 p-6 text-center">
          <p className="text-lg font-semibold text-gray-900">Score: {score}%</p>
          <p className="mt-2 text-sm text-gray-600">
            {score >= 70
              ? "Great job — you understand the material well."
              : "Consider reviewing the article to improve your understanding."}
          </p>
        </div>
      )}

      {/* Back to dashboard at the end of the quiz */}
      <div className="mt-8 flex justify-start">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to dashboard</span>
        </Link>
      </div>
    </div>
  );
}
