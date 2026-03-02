"use client";

import { useEffect, useState } from "react";
import { BookOpen, HelpCircle, Flame, Trophy } from "lucide-react";
import ChatButton from "@/components/ChatButton";
import { getProfile } from "@/lib/api/profile";
import type { LearningMetadata } from "@/types/profile";

const DEFAULT_META: LearningMetadata = {
  articles_read: 0,
  quizzes_completed: 0,
  current_streak: 0,
  longest_streak: 0,
  last_active_date: null,
  badges: {},
};

const articleMilestones = [
  { target: 1, label: "Article" },
  { target: 5, label: "Articles" },
  { target: 10, label: "Articles" },
  { target: 25, label: "Articles" },
];

const quizMilestones = [
  { target: 1, label: "Quiz" },
  { target: 5, label: "Quizzes" },
  { target: 10, label: "Quizzes" },
  { target: 25, label: "Quizzes" },
];

interface BadgeDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

const BADGE_DEFS: BadgeDef[] = [
  { id: "first_article", title: "First Article", description: "Read your first article", emoji: "📖" },
  { id: "5_articles", title: "5 Articles", description: "Read 5 articles", emoji: "📚" },
  { id: "10_articles", title: "10 Articles", description: "Read 10 articles", emoji: "🧁" },
  { id: "25_articles", title: "25 Articles", description: "Read 25 articles", emoji: "🏅" },
  { id: "first_quiz", title: "First Quiz", description: "Complete your first quiz", emoji: "📝" },
  { id: "5_quizzes", title: "5 Quizzes", description: "Complete 5 quizzes", emoji: "🎯" },
  { id: "10_quizzes", title: "10 Quizzes", description: "Complete 10 quizzes", emoji: "🏆" },
  { id: "25_quizzes", title: "25 Quizzes", description: "Complete 25 quizzes", emoji: "💎" },
  { id: "streak_3", title: "3 Day Streak", description: "Learn for 3 days in a row", emoji: "🔥" },
  { id: "streak_7", title: "7 Day Streak", description: "Learn for 7 days in a row", emoji: "⭐" },
  { id: "streak_14", title: "14 Day Streak", description: "Learn for 14 days in a row", emoji: "🌟" },
  { id: "streak_30", title: "30 Day Streak", description: "Learn for 30 days in a row", emoji: "👑" },
];

function formatBadgeDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function JourneyProgress({ milestones, current, icon }: {
  milestones: { target: number; label: string }[];
  current: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-0 w-full">
      {milestones.map((m, i) => {
        const reached = current >= m.target;
        const nextReached = i < milestones.length - 1 && current >= milestones[i + 1].target;
        return (
          <div key={m.target} className="flex items-center" style={{ flex: i < milestones.length - 1 ? 1 : "none" }}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  reached
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                    : "bg-gray-100 border-gray-300 text-gray-400"
                }`}
              >
                {reached ? icon : null}
              </div>
              <span className={`mt-2 text-sm font-semibold ${reached ? "text-gray-900" : "text-gray-400"}`}>
                {m.target}
              </span>
              <span className={`text-xs ${reached ? "text-gray-600" : "text-gray-400"}`}>
                {m.label}
              </span>
            </div>
            {i < milestones.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mt-[-1.5rem]">
                <div className={`h-full rounded-full ${nextReached ? "bg-[var(--color-primary)]" : reached ? "bg-[var(--color-primary)]" : "bg-gray-200"}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AchievementsPage() {
  const [meta, setMeta] = useState<LearningMetadata>(DEFAULT_META);

  useEffect(() => {
    getProfile()
      .then((p) => setMeta({ ...DEFAULT_META, ...p.learning_metadata }))
      .catch(() => {});
  }, []);

  const stats = [
    { icon: BookOpen, label: "Articles Read", value: meta.articles_read },
    { icon: HelpCircle, label: "Quizzes Completed", value: meta.quizzes_completed },
    { icon: Flame, label: "Day Streak", value: meta.current_streak },
    { icon: Trophy, label: "Badges Earned", value: Object.keys(meta.badges).length },
  ];

  const streakMessage =
    meta.current_streak > 0
      ? "Keep going! Read one article today to continue your streak."
      : "Complete an article to start your streak!";

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-3xl font-semibold text-gray-900">Milestones & Achievements</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track your learning journey and unlock rewards as you grow.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Streak Card */}
          <div className="rounded-2xl border-2 border-[var(--color-primary)]/30 bg-[#f0f7f2] p-6 relative">
            <div className="absolute top-5 right-5">
              <div className="w-10 h-10 rounded-full bg-[#fde8e0] flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">Learning Streak</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">{meta.current_streak}</span>
              <span className="text-xl font-semibold text-gray-900">Day Streak 🔥</span>
            </div>
            <p className="mt-3 text-sm text-gray-600">{streakMessage}</p>
          </div>

          {/* Your Stats Card */}
          <div className="rounded-2xl border bg-white p-6">
            <h3 className="text-base font-semibold text-gray-900">Your Stats</h3>
            <div className="mt-4 space-y-3">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <s.icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Article Journey */}
        <div className="mt-8 rounded-2xl border bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-8">Article Journey</h3>
          <JourneyProgress
            milestones={articleMilestones}
            current={meta.articles_read}
            icon={<BookOpen className="w-5 h-5" />}
          />
        </div>

        {/* Quiz Journey */}
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-8">Quiz Journey</h3>
          <JourneyProgress
            milestones={quizMilestones}
            current={meta.quizzes_completed}
            icon={<HelpCircle className="w-5 h-5" />}
          />
        </div>

        {/* Achievements Grid */}
        <div className="mt-8 rounded-2xl border bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {BADGE_DEFS.map((b) => {
              const unlockedDate = meta.badges[b.id];
              const unlocked = !!unlockedDate;
              return (
                <div
                  key={b.id}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    unlocked
                      ? "bg-white border-gray-200 shadow-sm"
                      : "bg-gray-50 border-gray-100 opacity-60"
                  }`}
                >
                  <div className="text-3xl mb-2">{b.emoji}</div>
                  <p className={`text-sm font-semibold ${unlocked ? "text-gray-900" : "text-gray-500"}`}>
                    {b.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{b.description}</p>
                  <p className={`text-xs mt-2 ${unlocked ? "text-[var(--color-primary)] font-medium" : "text-gray-400"}`}>
                    {unlocked ? formatBadgeDate(unlockedDate) : "Locked"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <ChatButton />
    </main>
  );
}
