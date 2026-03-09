"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, User2, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User2 }
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-cream)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-cream)]/80 border-b">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-gray-700 font-semibold text-xl">pennywise</span>
        </Link>
        <nav className="flex items-center gap-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-2 rounded-lg transition-colors ${
                  active ? "bg-[#e8f0ed]" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex items-center gap-2 ${
                    active ? "text-[#5a7d6e] font-medium" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => logout()}
          className="rounded-full border p-2 text-gray-700 hover:bg-gray-100 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
