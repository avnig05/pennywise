 'use client';
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ClipboardCheck, LineChart, BookOpen, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Tell us your basics",
    desc: "Income, priorities, and a few details to personalize guidance.",
    color: "var(--color-primary-600)",
  },
  {
    icon: LineChart,
    title: "Get actionable steps",
    desc: "Clear next actions with trade-offs and the why behind each suggestion.",
    color: "var(--color-sage)",
  },
  {
    icon: BookOpen,
    title: "Learn as you go",
    desc: "Short lessons with sources to build durable financial literacy.",
    color: "var(--color-accent-600)",
  },
];

function StepCard({ idx, icon: Icon, title, desc, color, delay }: { idx: number; icon: React.ElementType; title: string; desc: string; color: string; delay: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px -20% 0px" });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const target = idx;
    const id = setInterval(() => {
      i += 1;
      if (i > target) {
        clearInterval(id);
      } else {
        setCount(i);
      }
    }, 120);
    return () => clearInterval(id);
  }, [inView, idx]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay }}
      className="h-full rounded-[12px] border bg-white p-6 shadow-sm relative overflow-hidden group"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-white font-semibold text-sm">{count}</div>
        <motion.div
          initial={idx === 1 ? { x: -16, opacity: 0 } : idx === 2 ? { scale: 0.85, opacity: 0 } : { rotate: -8, opacity: 0 }}
          animate={inView ? { x: 0, scale: 1, rotate: 0, opacity: 1 } : undefined}
          transition={{ type: "spring", stiffness: 140, damping: 14, delay: delay + 0.1 }}
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 50%, var(--color-primary-light), transparent 60%)",
            color: "var(--color-primary)",
          }}
        >
          <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3" />
        </motion.div>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900 relative">
        {title}
        <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-[var(--color-primary-600)] transition-[width] duration-300 ease-in-out group-hover:w-full" />
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-light)] transition-all duration-300 group-hover:translate-y-[-2px]">{desc}</p>
      <div className="mt-4 flex items-center gap-2 text-[var(--color-sage)] opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
        <span className="text-xs">Learn more</span>
        <ArrowRight size={14} />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 0.12 } : undefined}
        transition={{ duration: 0.6, delay }}
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(600px circle at 10% -10%, ${color}22, transparent 60%)`,
        }}
      />
    </motion.div>
  );
}

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerInView = useInView(containerRef, { once: true, amount: 0.3, margin: "-20% 0px -20% 0px" });

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text)] mb-8 md:mb-10">How it works</h2>
        <div ref={containerRef} className="relative">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
            <StepCard idx={1} icon={ClipboardCheck} title={steps[0].title} desc={steps[0].desc} color={steps[0].color} delay={0.0} />
            <StepCard idx={2} icon={LineChart} title={steps[1].title} desc={steps[1].desc} color={steps[1].color} delay={0.6} />
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-1">
            <StepCard idx={3} icon={BookOpen} title={steps[2].title} desc={steps[2].desc} color={steps[2].color} delay={1.2} />
          </div>

          <div className="hidden" />
        </div>
      </div>
    </section>
  );
}
