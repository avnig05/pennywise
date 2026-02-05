'use client';
import CategoryBadge from "@/components/CategoryBadge";
import ChatButton from "@/components/ChatButton";
import React, { useState } from "react";

const categories = ["Student Loans", "Credit Cards", "Budgeting", "Building Credit", "Investing", "Taxes"];

export default function ExplorePage() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (c: string) => {
    setSelected(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  };

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Your Interests</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          {categories.map(c => (
            <CategoryBadge key={c} label={c} active={selected.includes(c)} onClick={() => toggle(c)} />
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Explore by Topic</h2>
          <div className="mt-4 rounded-2xl border bg-white p-6 text-gray-700">No articles available yet.</div>
        </div>
      </section>
      <ChatButton />
    </main>
  );
}
