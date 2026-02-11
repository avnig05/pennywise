'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, toggleSavedArticle } from "@/lib/api/profile";

type BookmarkContextValue = {
  saved: Set<string>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  list: string[];
  loading: boolean;
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (!cancelled && profile.saved_articles) {
          setSaved(new Set(profile.saved_articles));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSaved(new Set());
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = useCallback((id: string) => {
    toggleSavedArticle(id)
      .then((res) => setSaved(new Set(res.saved_articles)))
      .catch(() => {
        // Keep current state on error (e.g. not logged in or API down)
      });
  }, []);

  const value = useMemo<BookmarkContextValue>(() => {
    const isSaved = (id: string) => saved.has(id);
    const list = Array.from(saved);
    return { saved, toggle, isSaved, list, loading };
  }, [saved, toggle]);

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error("BookmarkProvider missing");
  return ctx;
}
