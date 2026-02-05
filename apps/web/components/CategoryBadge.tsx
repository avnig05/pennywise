'use client';
import React from "react";

type Props = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export default function CategoryBadge({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-[var(--color-sage)] bg-[var(--color-sage)/10] text-[var(--color-sage)]"
          : "border-gray-300 text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
