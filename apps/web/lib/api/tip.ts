import { cookies } from "next/headers";

export interface TipResponse {
  tip_text: string;
  tip_timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function getTip(): Promise<TipResponse> {
  // Get auth token from cookies (server-side)
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken.value}`;
  }
  
  const res = await fetch(`${API_BASE_URL}/me/tip`, {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with ${res.status}`);
  }

  return (await res.json()) as TipResponse;
}

