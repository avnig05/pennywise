type HealthResponse = { status: string };

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  let data: HealthResponse | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${baseUrl}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = (await res.json()) as HealthResponse;
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Pennywise</h1>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-xl font-semibold">API Health Check</h2>
        <p className="mt-2">
          <span className="font-medium">Endpoint:</span> {baseUrl}/health
        </p>

        {error ? (
          <p className="mt-2 text-red-600">
            <span className="font-medium">Error:</span> {error}
          </p>
        ) : (
          <p className="mt-2">
            <span className="font-medium">Status:</span> {data?.status ?? "loading..."}
          </p>
        )}
      </div>
    </main>
  );
}

