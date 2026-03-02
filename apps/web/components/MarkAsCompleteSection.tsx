"use client";

import { useRef } from "react";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

type Props = {
  quizRef: React.RefObject<HTMLDivElement | null>;
};

function PennywiseIcon() {
  return (
    <div
      className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border"
      style={{
        backgroundColor: "#fff",
        borderColor: "#6B908033",
      }}
      aria-hidden
    >
      <Image
        src="/pennywise-logo.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 brightness-0"
      />
    </div>
  );
}

export default function MarkAsCompleteSection({ quizRef }: Props) {
  const handleClick = () => {
    quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className="mt-12 rounded-2xl p-8"
      style={{
        background: "linear-gradient(135deg, rgba(107, 144, 128, 0.05) 0%, rgba(107, 144, 128, 0.1) 100%)",
        border: "2px solid #6B90804D",
        boxShadow: "0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A",
      }}
    >
      <div className="flex flex-col items-center text-center">
        <PennywiseIcon />
        <h3
          className="mt-5 text-xl font-semibold"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            color: "#3D4451",
          }}
        >
          Finished Reading?
        </h3>
        <p
          className="mt-3 text-[15px] leading-relaxed"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontWeight: 400,
            color: "#6B7280",
          }}
        >
          Click below to mark this article as complete and see a quick summary!
        </p>
        <button
          onClick={handleClick}
          className="mt-8 inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 font-medium text-white shadow-sm transition hover:opacity-90 hover:shadow-md"
          style={{
            backgroundColor: "#6B9080",
            fontFamily: "var(--font-inter), Inter, sans-serif",
          }}
        >
          <CheckCircle size={20} strokeWidth={2} />
          Mark as Complete
        </button>
      </div>
    </div>
  );
}
