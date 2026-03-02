"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
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

export default function LearningStats() {
  const [meta, setMeta] = useState<LearningMetadata>(DEFAULT_META);

  useEffect(() => {
    getProfile()
      .then((p) => setMeta({ ...DEFAULT_META, ...p.learning_metadata }))
      .catch(() => {});
  }, []);

  const stats = [
    { label: "Articles Read", value: meta.articles_read },
    { label: "Quizzes Done", value: meta.quizzes_completed },
    { label: "Day Streak", value: meta.current_streak, emoji: "🔥" },
    { label: "Badges Earned", value: Object.keys(meta.badges).length },
  ];

  return (
    <Link href="/achievements" className="block mt-8">
      <div className="rounded-2xl border-2 border-[var(--color-primary)]/20 bg-[#f8faf8] p-5 cursor-pointer transition-all hover:border-[var(--color-primary)]/40 hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Your Learning Stats</h2>
            <p className="text-xs text-gray-500">Click to view detailed achievements</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#e8f0e8] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white border border-gray-100 py-3 px-2 text-center"
            >
              <p className="text-2xl font-bold text-[var(--color-primary)]">
                {s.value}
                {s.emoji && <span className="ml-0.5 text-lg">{s.emoji}</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
