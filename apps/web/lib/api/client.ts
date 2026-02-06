// Use || so that empty string from env is replaced (?? only replaces null/undefined)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type ApiFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with ${res.status}`);
  }

  return (await res.json()) as T;
}

