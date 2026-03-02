import SignUpForm from "@/components/auth/SignUpForm";
import Image from "next/image";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full py-4 px-6 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/pennywise-logo.png"
              alt="Pennywise"
              width={28}
              height={28}
              className="h-7 w-auto brightness-0"
            />
            <span className="text-lg font-semibold text-gray-700">pennywise</span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <SignUpForm />
      </div>
    </div>
  );
}
