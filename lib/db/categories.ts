import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/db/types";

export async function listActiveCategories(): Promise<Category[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;
  return data;
}

/** Unfiltered by is_active - used for internal lookups (e.g. success page) where a since-hidden category should still resolve. */
export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}
