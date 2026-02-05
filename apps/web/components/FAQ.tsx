 'use client';
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Tag } from "lucide-react";

const faqs = [
  {
    q: "Is Pennywise free?",
    a: "You can start free. We’re focused on accessible financial education and guidance.",
    emoji: "💸",
    category: "Pricing",
  },
  {
    q: "Do you store my data?",
    a: "We use privacy-conscious patterns. Your data stays yours and is handled securely.",
    emoji: "🔒",
    category: "Privacy",
  },
  {
    q: "Can Pennywise replace a financial advisor?",
    a: "We provide education and practical guidance. For complex situations, an advisor can help.",
    emoji: "🧠",
    category: "Guidance",
  },
  {
    q: "Do you support students or early-career folks?",
    a: "Yes. Our content and guidance are tailored for people building foundations.",
    emoji: "🎓",
    category: "Audience",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const categories = useMemo(() => Array.from(new Set(faqs.map(f => f.category))), []);

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const re = new RegExp(`(${escape(q)})`, "ig");
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part)
        ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
        : <span key={i}>{part}</span>
    );
  };

  const filteredFaqs = faqs.filter(f => {
    const matchesQuery = !query || (f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()));
    const matchesTag = activeTags.length === 0 || activeTags.includes(f.category);
    return matchesQuery && matchesTag;
  });

  const toggleTag = (c: string) => {
    setActiveTags(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  return (
    <section className="snap-start bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text)] mb-6 md:mb-8">FAQ</h2>

        <div className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions"
                className="w-full rounded-md border pl-9 pr-3 py-2 text-sm bg-[var(--bg-page)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                style={{ borderColor: 'var(--input-border)' }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => toggleTag(c)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                    activeTags.includes(c)
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                      : "hover:bg-[var(--bg-page)]"
                  }`}
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <Tag size={12} />
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[8px] border bg-white shadow-sm divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {filteredFaqs.map((f, i) => {
            const active = openIndex === i;
            return (
              <motion.div
                key={f.q}
                onClick={() => setOpenIndex(active ? null : i)}
                initial={false}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenIndex(active ? null : i);
                  }
                }}
                aria-expanded={active}
                className={`group cursor-pointer px-6 py-5 transition relative ${
                  active ? "bg-[var(--bg-accent)]" : "bg-white"
                } ${active ? "border-l-2 border-[var(--color-primary)]" : ""}`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg md:text-xl">{f.emoji}</span>
                    <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)]">
                      {highlight(f.q, query)}
                    </h3>
                  </div>
                  <motion.div
                    animate={{ rotate: active ? 180 : 0, color: active ? "var(--color-primary)" : "#6b7280" }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="mt-0.5"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </motion.div>
                </div>

                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pb-2 text-sm text-[var(--color-text-light)]">
                        {highlight(f.a, query)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)]">Still have questions?</h3>
            <p className="mt-1 text-sm text-[var(--color-text-light)]">Reach out and we’ll help you get clear guidance.</p>
          </div>
          <a href="/signup" className="rounded-[8px] bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-dark)] transition">
            Get Started Free
          </a>
        </div>
      </div>
    </section>
  );
}
