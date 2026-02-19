import { apiFetch } from "./client";

export interface ChatSource {
  title: string;
  source_url: string;
  snippet: string;
}

export interface ChatResponse {
  reply: string;
  sources: ChatSource[];
  chat_id?: string;
}

export interface ChatListItem {
  id: string;
  title: string | null;
  updated_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[] | null;
  created_at: string;
}

export interface ChatDetail {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export async function askChat(message: string, chatId?: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/chat/ask", {
    method: "POST",
    body: JSON.stringify({ message, chat_id: chatId }),
  });
}

export async function listChats(): Promise<ChatListItem[]> {
  return apiFetch<ChatListItem[]>("/chat", { method: "GET" });
}

export async function getChat(chatId: string): Promise<ChatDetail> {
  return apiFetch<ChatDetail>(`/chat/${chatId}`, { method: "GET" });
}

export async function deleteChat(chatId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/chat/${chatId}`, { method: "DELETE" });
}
