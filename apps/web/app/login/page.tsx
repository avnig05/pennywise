import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-4">
        <Image src="/pennywise-logo.png" alt="Pennywise logo" width={32} height={32} />
        <span className="text-2xl font-semibold text-gray-800">pennywise</span>
      </div>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h1>
        <p className="text-gray-500 text-sm">Continue building your financial knowledge</p>
      </div>
      <LoginForm />
    </div>
  );
}
