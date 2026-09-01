import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Location } from "@/lib/db/types";

/**
 * Only "state" rows are exposed today - the `locations` table is
 * hierarchical (country -> state -> city) for future city-level boards, but
 * nothing in the app resolves a location by kind other than "state" yet.
 * Slugs are unique within a parent (see migration 0016), and since every
 * state shares the same US parent, a bare slug lookup is unambiguous here.
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

/** Unfiltered by is_active - used for internal lookups (e.g. success page) where a since-hidden state should still resolve. */
export async function getStateById(id: string): Promise<Location | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .eq("kind", "state")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getStateBySlug(slug: string): Promise<Location | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("slug", slug)
    .eq("kind", "state")
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}
