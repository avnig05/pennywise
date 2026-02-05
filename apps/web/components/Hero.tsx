'use client';
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useInView } from "framer-motion";

export default function Hero() {
  const fullText = "Smarter money decisions, made simple";
  const [typed, setTyped] = useState("");
  const [headlineDone, setHeadlineDone] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(containerRef, { once: true, margin: "-10% 0px -10% 0px" });

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setTyped(fullText);
      setHeadlineDone(true);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(id);
        setTimeout(() => setHeadlineDone(true), 350);
      }
    }, 26);
    return () => clearInterval(id);
  }, [inView, reduced]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const letterSpacing = reduced ? "0px" : `${Math.max(0, 0.06 * (fullText.length - typed.length))}em`;
  const scrollOpacity = 1;

  return (
    <motion.section
      ref={containerRef}
      className="relative min-h-[90vh] lg:min-h-[100svh] flex items-center justify-center pt-20 pb-16 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-[var(--color-primary-light)] opacity-30 blur-3xl animate-float" />
      <div className="absolute bottom-32 left-20 w-96 h-96 rounded-full bg-[var(--bg-accent)] opacity-40 blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-[var(--color-primary-light)] opacity-20 blur-2xl animate-pulse-slow" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-text)] leading-tight"
          style={{ letterSpacing }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.4 }}
        >
          {typed}
          {!reduced && <span className="caret">|</span>}
        </motion.h1>
        <motion.p
          className="mt-8 max-w-[60ch] mx-auto text-lg md:text-xl text-[var(--color-text-light)] leading-relaxed"
          initial={{ opacity: 0, y: 12 }}
          animate={headlineDone ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Pennywise turns budgeting and financial literacy into clear, personalized guidance you
          can act on today—backed by sources and tailored to your situation.
        </motion.p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={headlineDone && inView ? { opacity: 1, scale: 1 } : undefined}
            transition={{ type: "spring", stiffness: 140, damping: 15, delay: 0.15 }}
          >
            <Link
              href="/signup"
              className="relative overflow-hidden rounded-[8px] bg-[var(--color-primary)] px-8 py-4 text-base font-medium text-white transition-all hover:bg-[var(--color-primary-dark)] hover:scale-[1.05] hover:shadow-lg will-change-transform"
            >
              Get Started Free
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={headlineDone && inView ? { opacity: 1, scale: 1 } : undefined}
            transition={{ type: "spring", stiffness: 140, damping: 15, delay: 0.25 }}
          >
            <Link
              href="/login"
              className="rounded-[8px] border-2 border-[var(--color-primary)] bg-white px-8 py-4 text-base font-medium text-[var(--color-primary)] transition-all hover:bg-[var(--bg-page)] hover:scale-[1.05] will-change-transform"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={headlineDone ? { opacity: scrollY < 100 ? 1 : 0, y: 0 } : undefined}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <span className="text-xs text-[var(--color-text-light)]">Scroll to explore</span>
        <motion.div
          className="w-6 h-10 border-2 border-[var(--color-primary)] rounded-full flex justify-center p-1"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div className="w-1 h-2 bg-[var(--color-primary)] rounded-full" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
