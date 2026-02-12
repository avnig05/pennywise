import { apiFetch } from "./client";

export interface ChatSource {
  title: string;
  source_url: string;
  snippet: string;
}

export interface ChatResponse {
  reply: string;
  sources: ChatSource[];
}

export async function askChat(message: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat/ask", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
