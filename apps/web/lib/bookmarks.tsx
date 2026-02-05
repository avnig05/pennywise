'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type BookmarkContextValue = {
  saved: Set<string>;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
  list: string[];
};

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("pw_bookmarks");
      if (raw) {
        try {
          const ids = JSON.parse(raw) as string[];
          return new Set(ids);
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pw_bookmarks", JSON.stringify(Array.from(saved)));
    }
  }, [saved]);

  const value = useMemo<BookmarkContextValue>(() => {
    const toggle = (id: string) => {
      setSaved(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    };
    const isSaved = (id: string) => saved.has(id);
    const list = Array.from(saved);
    return { saved, toggle, isSaved, list };
  }, [saved]);

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error("BookmarkProvider missing");
  return ctx;
}
