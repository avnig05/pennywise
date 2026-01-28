import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const res = await fetch(`${apiBase}/me`, { cache: "no-store" });

  if (res.status === 404) {
    redirect("/onboarding");
  }

  if (!res.ok) {
    throw new Error(`Failed to load profile (HTTP ${res.status})`);
  }

  const profile = await res.json();

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Profile (dev mode)</p>

      <pre className="mt-6 overflow-auto rounded border p-4">{JSON.stringify(profile, null, 2)}</pre>
    </main>
  );
}