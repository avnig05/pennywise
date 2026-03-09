import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="w-full py-4 px-6" style={{ backgroundColor: '#a2c7bf' }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/pennywise-logo.png"
            alt="Pennywise"
            width={64}
            height={64}
            className="h-16 w-auto brightness-0"
          />
          <span className="text-2xl font-serif font-medium tracking-wide text-dark-teal">Pennywise</span>
        </div>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-white/15 backdrop-blur-md text-[#2d5755] rounded-full font-medium hover:bg-white/25 transition-all border border-white/30 shadow-sm"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
