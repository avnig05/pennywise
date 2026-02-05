'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 backdrop-blur-md border-b transition-shadow ${scrolled ? 'shadow-sm' : ''}`}
      style={{ backgroundColor: '#ffffff', borderColor: 'var(--border-color)' }}
    >
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-semibold text-[var(--color-primary)] transition-transform hover:scale-[1.02]">
          pennywise
        </Link>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="/features" className="transition hover:text-[var(--color-primary)]">Features</Link>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-[8px] border border-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-primary)] transition hover:bg-[var(--bg-page)]">Sign In</Link>
          <Link href="/signup" className="rounded-[8px] bg-[var(--color-primary)] px-4 py-2 text-sm text-white transition hover:bg-[var(--color-primary-dark)]">
            Get Started Free
          </Link>
          <button className="md:hidden ml-2 rounded-md border px-2 py-2" onClick={() => setOpen(v => !v)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      <motion.div
        initial={false}
        animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`md:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <div className="mx-6 mb-4 rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col p-4">
            <Link href="/features" className="rounded-md px-3 py-2 text-sm hover:bg-[var(--bg-page)]">Features</Link>
            <Link href="/login" className="mt-2 rounded-md px-3 py-2 text-sm hover:bg-[var(--bg-page)]">Sign In</Link>
            <Link href="/signup" className="mt-2 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm text-white">Get Started Free</Link>
          </div>
        </div>
      </motion.div>
    </motion.header>
  );
}
