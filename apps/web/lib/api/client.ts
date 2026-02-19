// Use || so that empty string from env is replaced (?? only replaces null/undefined)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

/**
 * Get the Supabase auth token from cookies
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  
  // Check for Supabase access token in cookies
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "sb-access-token") {
      return value;
    }
  }
  
  return null;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const authToken = getAuthToken();
  
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include", // Include cookies in the request
    headers: {
      "Content-Type": "application/json",
      // Add Authorization header if we have a token
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with ${res.status}`);
  }

  return (await res.json()) as T;
}

