import { getSupabaseServerClient } from "@/lib/supabase/server";

const VALID_REASONS = new Set([
  "Not a real service provider",
  "Broken or suspicious link",
  "Inappropriate or illegal content",
  "Chat/invite link as destination",
  "Other",
]);

export async function createReport(listingId: string, reason: string, details?: string): Promise<void> {
  if (!VALID_REASONS.has(reason)) throw new Error("Invalid report reason.");

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("reports").insert({
    listing_id: listingId,
    reason,
    details: details?.trim() || null,
  });
  if (error) throw error;
}

export { VALID_REASONS };
