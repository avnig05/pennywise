"use client";

import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";

type Props = {
  quizRef: React.RefObject<HTMLDivElement | null>;
};

export default function MarkAsCompleteSection({ quizRef }: Props) {
  const handleClick = () => {
    quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mt-12 rounded-xl border bg-gray-50 p-6">
      <h3 className="text-center text-lg font-semibold text-gray-900">
        Finished Reading?
      </h3>
      <p className="mt-2 text-center text-gray-600">
        Click below to mark this article as complete and see a quick summary!
      </p>
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-sage)] px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          <CheckCircle2 size={20} />
          Mark as Complete
        </button>
      </div>
    </div>
  );
}
