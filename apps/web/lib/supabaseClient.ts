import { createClient } from "@supabase/supabase-js";

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !anon) {
    throw new Error("Missing Supabase env");
  }
  return createClient(url, anon);
}
