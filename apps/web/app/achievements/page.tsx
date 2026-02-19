"use client";

import { BookOpen, HelpCircle, Globe, Clock, Flame, Trophy } from "lucide-react";
import ChatButton from "@/components/ChatButton";

const stats = [
  { icon: BookOpen, label: "Articles Read", value: 12 },
  { icon: HelpCircle, label: "Quizzes Completed", value: 4 },
  { icon: Globe, label: "Topics Explored", value: 3 },
  { icon: Clock, label: "Total Learning Time", value: "2h 45m" },
];

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

const ARTICLES_READ = 12;
const QUIZZES_DONE = 4;

interface Achievement {
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  date?: string;
}

const achievements: Achievement[] = [
  { title: "First Article", description: "Read your first article", emoji: "📖", unlocked: true, date: "February 10" },
  { title: "5 Articles", description: "Read 5 articles", emoji: "📚", unlocked: true, date: "February 25" },
  { title: "10 Articles", description: "Read 10 articles", emoji: "🧁", unlocked: true, date: "March 12" },
  { title: "First Quiz", description: "Complete your first quiz", emoji: "📝", unlocked: true, date: "February 12" },
  { title: "5 Quizzes", description: "Complete 5 quizzes", emoji: "🎯", unlocked: false },
  { title: "10 Quizzes", description: "Complete 10 quizzes", emoji: "🏆", unlocked: false },
  { title: "3 Day Streak", description: "Learn for 3 days in a row", emoji: "🔥", unlocked: true, date: "March 15" },
  { title: "7 Day Streak", description: "Learn for 7 days in a row", emoji: "⭐", unlocked: false },
];

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
              <span className="text-4xl font-bold text-gray-900">3</span>
              <span className="text-xl font-semibold text-gray-900">Day Streak 🔥</span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Keep going! Read one article today to continue your streak.
            </p>
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
            current={ARTICLES_READ}
            icon={<BookOpen className="w-5 h-5" />}
          />
        </div>

        {/* Quiz Journey */}
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-8">Quiz Journey</h3>
          <JourneyProgress
            milestones={quizMilestones}
            current={QUIZZES_DONE}
            icon={<HelpCircle className="w-5 h-5" />}
          />
        </div>

        {/* Achievements Grid */}
        <div className="mt-8 rounded-2xl border bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-6">Achievements</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {achievements.map((a) => (
              <div
                key={a.title}
                className={`rounded-xl border p-4 text-center transition-all ${
                  a.unlocked
                    ? "bg-white border-gray-200 shadow-sm"
                    : "bg-gray-50 border-gray-100 opacity-60"
                }`}
              >
                <div className="text-3xl mb-2">{a.emoji}</div>
                <p className={`text-sm font-semibold ${a.unlocked ? "text-gray-900" : "text-gray-500"}`}>
                  {a.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{a.description}</p>
                <p className={`text-xs mt-2 ${a.unlocked ? "text-[var(--color-primary)] font-medium" : "text-gray-400"}`}>
                  {a.unlocked ? a.date : "Locked"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ChatButton />
    </main>
  );
}
