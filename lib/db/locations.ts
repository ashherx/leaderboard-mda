import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Location } from "@/lib/db/types";

/**
 * Active states, ordered for display - the only location kind the public
 * site currently browses by (see app/[state]/page.tsx). Cities will read
 * the same way once they exist (listActiveCities(parentId)), just filtered
 * to kind: "city" with a state as parent.
 */
export async function listActiveStates(): Promise<Location[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("kind", "state")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data;
}

/** First active state by display_order - where a bare "/" or a legacy link with no state lands (see app/page.tsx, app/claim/page.tsx). */
export async function getDefaultActiveState(): Promise<Location | null> {
  const states = await listActiveStates();
  return states[0] ?? null;
}

export async function getStateBySlug(slug: string): Promise<Location | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("kind", "state")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Unfiltered by is_active - used for internal lookups (e.g. a listing's own location, admin) where a since-hidden location should still resolve. */
export async function getLocationById(id: string): Promise<Location | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("locations").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data;
}
