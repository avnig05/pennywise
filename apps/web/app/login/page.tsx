import LoginForm from "@/components/auth/LoginForm";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full py-4 px-6 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="text-sage-500" size={24} />
            <span className="text-lg font-semibold text-gray-700">pennywise</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Suspense fallback={<div className="text-sm text-gray-600">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
