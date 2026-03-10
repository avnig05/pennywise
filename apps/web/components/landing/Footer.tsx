import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-[#a2c7bf] py-8 px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-darktext">
        <div className="flex items-center gap-3">
          <Image
            src="/pennywise-logo.png"
            alt="Pennywise"
            width={24}
            height={24}
            className="brightness-0 opacity-70"
          />
          <span className="font-sans opacity-70">© 2026 Pennywise</span>
        </div>
        <div className="font-sans flex gap-6 font-medium opacity-70">
          <Link href="/about" className="hover:opacity-100 transition-opacity">About</Link>
          <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</Link>
          <Link href="/terms" className="hover:opacity-100 transition-opacity">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
