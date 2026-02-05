import React from "react";

type Props = {
  label: string;
  percent: number;
};

export default function ProgressBar({ label, percent }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-800">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200">
        <div
          className="h-3 rounded-full bg-[var(--color-sage)] transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
