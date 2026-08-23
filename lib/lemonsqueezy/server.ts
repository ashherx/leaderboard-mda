import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

// lemonSqueezySetup mutates module-level SDK config rather than returning a
// client instance - guard so repeat calls within the same server process
// don't redo it needlessly.
let configured = false;

export function ensureLemonSqueezyConfigured(): void {
  if (configured) return;

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY is not set - see .env.local.example.");
  }

  lemonSqueezySetup({ apiKey });
  configured = true;
}
