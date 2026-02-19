"use client";

import { useEffect, useState } from "react";
import { getLearningProgress, type ProgressItem } from "@/lib/api/profile";
import ProgressBar from "@/components/ProgressBar";

const DEFAULT_ITEMS: ProgressItem[] = [
  { category: "savings", label: "Savings", percent: 0 },
  { category: "budgeting", label: "Budgeting", percent: 0 },
  { category: "taxes", label: "Taxes", percent: 0 },
  { category: "investing", label: "Investing", percent: 0 },
  { category: "debt_management", label: "Debt Management", percent: 0 },
  { category: "banking", label: "Banking", percent: 0 },
  { category: "student_loans", label: "Student Loans", percent: 0 },
  { category: "credit_cards", label: "Credit Cards", percent: 0 },
  { category: "credit_score", label: "Credit Score", percent: 0 },
];

export default function LearningProgress() {
  const [items, setItems] = useState<ProgressItem[]>(DEFAULT_ITEMS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLearningProgress()
    .then((res) => setItems(res.progress.length ? res.progress : DEFAULT_ITEMS))
      .catch(() => setItems(DEFAULT_ITEMS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mt-8 rounded-2xl border bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Your Learning Progress</h2>
      <p className="mt-1 text-sm text-gray-700">
        {loading ? "Loading..." : "Based on quiz completions in each topic."}
      </p>
      <div className="mt-6 space-y-5">
        {items.map((item) => (
          <ProgressBar key={item.category} label={item.label} percent={item.percent} />
        ))}
      </div>
    </div>
  );
}