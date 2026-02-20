import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="w-full py-4 px-6 bg-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/pennywise-logo.png" alt="Pennywise logo" width={52} height={52} />
          <span className="text-xl font-semibold text-gray-700">pennywise</span>
        </div>
        <Link href="/login">
          <Button className="px-6">Login</Button>
        </Link>
      </div>
    </header>
  );
}
