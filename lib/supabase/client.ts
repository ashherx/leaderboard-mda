import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

/**
 * Browser-safe Supabase client, using the public anon key.
 * Reads only (categories, published listings) - writes to listings/payments
 * always go through server routes, never straight from the client.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseBrowserClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your project's values."
    );
  }

  return createClient<Database>(url, anonKey);
}
