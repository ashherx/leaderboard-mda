import type { MetadataRoute } from "next";

// Same fallback as app/layout.tsx's metadataBase - set NEXT_PUBLIC_SITE_URL
// once there's a real production domain so the sitemap link below (and
// canonical URLs elsewhere) resolve off localhost.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Nothing on this site is private - every page here exists specifically to
 * be found (that's the whole point of a leaderboard). So this stays wide
 * open for every crawler, search engine and AI assistant alike (GPTBot/
 * ChatGPT-User/OAI-SearchBot for ChatGPT, Google-Extended for Gemini,
 * ClaudeBot/anthropic-ai for Claude, PerplexityBot, CCBot, etc.) rather than
 * trying to hand-list every bot's exact name - a bare `*` rule already
 * covers all of them, named entries below are just belt-and-suspenders for
 * bots that check for themselves by name before falling back to `*`.
 *
 * The two disallows exist for a real reason, not indexability noise:
 * - /manage/ URLs embed a secret token *in the path* (see
 *   lib/manage-token.ts) - a crawler following/caching that link would be
 *   the same exposure as it leaking any other way, so it's excluded even
 *   though nothing here requires a login to stop a crawler from reading it.
 * - /admin is gated by its own auth (lib/admin-auth.ts) and has nothing a
 *   public search result should ever point at.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/manage/", "/admin"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
