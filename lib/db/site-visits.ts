import { getSupabaseServerClient } from "@/lib/supabase/server";

const RECENT_WINDOW_MINUTES = 15;

export async function recordVisit(sessionId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("site_visits")
    .upsert({ session_id: sessionId, last_seen: new Date().toISOString() });
  if (error) throw error;
}

/** Vanity "people here right now" metric — a time-window count, no real presence/websocket infra needed. */
export async function countRecentVisitors(): Promise<number> {
  const supabase = getSupabaseServerClient();
  const since = new Date(Date.now() - RECENT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("site_visits")
    .select("session_id", { count: "exact", head: true })
    .gt("last_seen", since);
  if (error) throw error;
  return count ?? 0;
}
