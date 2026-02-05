import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasAccess = !!(cookieStore.get("sb-access-token") || cookieStore.get("sb:token") || cookieStore.get("supabase-auth-token"));
  if (!hasAccess) {
    redirect("/login");
  }
  const onboarding = cookieStore.get("onboarding-complete")?.value;
  if (onboarding !== "true") {
    redirect("/onboarding");
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  let profile: unknown = null;
  let apiError: string | null = null;
  try {
    const res = await fetch(`${apiBase}/me`, { cache: "no-store" });
    if (!res.ok) {
      apiError = `API responded ${res.status}`;
    } else {
      profile = await res.json();
    }
  } catch {
    apiError = "API unreachable";
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Profile (dev mode)</p>
      {apiError ? (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {apiError}. Start the API or set NEXT_PUBLIC_API_BASE_URL.
        </div>
      ) : (
        <pre className="mt-6 rounded border p-4 overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
      )}
    </main>
  );
}
