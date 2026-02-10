export default function RecommendedSkeleton() {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-1 lg:grid-cols-2" aria-hidden>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border bg-white p-6"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="h-4 w-1/3 rounded bg-gray-200" />
          <div className="mt-3 h-3 w-full rounded bg-gray-100" />
          <div className="mt-2 h-3 w-3/4 rounded bg-gray-100" />
          <div className="mt-4 flex gap-2">
            <div className="h-5 w-16 rounded-full bg-gray-100" />
            <div className="h-5 w-20 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
