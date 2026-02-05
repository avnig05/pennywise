'use client';
import ChatButton from "@/components/ChatButton";
import { useBookmarks } from "@/lib/bookmarks";

export default function SavedPage() {
  const { list } = useBookmarks();

  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Saved Articles</h1>
        <p className="mt-2 text-sm text-gray-700">Your bookmarked content</p>

        <div className="mt-6">
          {list.length ? (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">
              Saved IDs: {list.join(", ")}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-6 text-gray-700">You have no saved articles yet.</div>
          )}
        </div>
      </section>
      <ChatButton />
    </main>
  );
}
