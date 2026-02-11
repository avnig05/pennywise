 'use client';
import { motion } from "framer-motion";
import { Wallet, BarChart3, Brain, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: Wallet,
    title: "Budget without friction",
    desc: "Track inflows, outflows, and priorities in one place. No spreadsheets required.",
  },
  {
    icon: BarChart3,
    title: "Actionable insights",
    desc: "Personalized nudges with context, plus clear trade-offs you can understand.",
  },
  {
    icon: Brain,
    title: "Learn as you go",
    desc: "Bite-sized lessons on money topics with cited sources and practical examples.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    desc: "Your data stays yours. Local-first patterns and secure APIs protect your info.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative snap-start bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 mb-8 md:mb-10">
          What makes Pennywise different
        </h2>
        <div className="mt-0 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="card h-full"
              >
                <div className="icon-container"><Icon /></div>
                <h3 className="mt-4 text-[18px] font-semibold text-[var(--color-text)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] text-[var(--color-text-light)]">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
