export default async function DashboardPage() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    const res = await fetch(`${apiBase}/me`, { cache: "no-store" });
    const profile = await res.json();
  
    return (
      <main className="min-h-screen p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">Profile (dev mode)</p>
  
        <pre className="mt-6 rounded border p-4 overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </main>
    );
  }
  