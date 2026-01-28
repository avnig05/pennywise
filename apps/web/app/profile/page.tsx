import ChatButton from "@/components/ChatButton";
import { UserRound } from "lucide-react";

export default function ProfilePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Your Profile</h1>
        <p className="mt-2 text-sm text-gray-700">Manage your account settings</p>

        <div className="mt-6 rounded-2xl border bg-white p-10">
          <div className="flex flex-col items-center justify-center text-center text-gray-700">
            <div className="mb-4 rounded-full border p-4 text-[var(--color-sage)]">
              <UserRound size={36} />
            </div>
            <h2 className="text-lg font-medium text-gray-900">Profile Coming Soon</h2>
            <p className="mt-2 text-sm">Account settings, preferences, and learning history will be available here</p>
          </div>
        </div>
      </section>
      <ChatButton />
    </main>
  );
}
