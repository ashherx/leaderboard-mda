import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

/**
 * Server-only Supabase client, using the service role key.
 *
 * This bypasses row-level security and must never be imported from a
 * client component or exposed to the browser. Use it from Server
 * Components, Server Actions, and Route Handlers only - anywhere that
 * needs to write payments/listings or read data regardless of RLS
 * (e.g. resolving a manage-token, which isn't a Postgres-level identity).
 */
let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill in your project's values."
    );
  }

  cachedClient = createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
    // Next.js patches global fetch to cache by default, even for
    // third-party libraries and even on routes marked force-dynamic. Every
    // query here is either bid-state (changes on every payment) or an
    // auth-equivalent lookup (manage-token) - never safe to let Next's Data
    // Cache serve a stale copy.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });

  return cachedClient;
}
