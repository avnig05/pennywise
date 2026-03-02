export default function RecommendedSkeleton() {
  return (
    <div className="mt-4 grid gap-5 sm:grid-cols-1 lg:grid-cols-2" aria-hidden>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 rounded-lg bg-gray-100" />
            <div className="h-6 w-16 rounded-lg bg-gray-100" />
            <div className="h-6 w-14 rounded-lg bg-gray-100" />
          </div>
          <div className="mt-4 h-5 w-full rounded bg-gray-200" />
          <div className="mt-2 h-4 w-full rounded bg-gray-100" />
          <div className="mt-2 h-4 w-[85%] rounded bg-gray-100" />
          <div className="mt-5 flex items-center gap-3">
            <div className="h-9 w-24 rounded-xl bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
