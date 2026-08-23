/**
 * Rejects destination links that are direct chat/invite links rather than a
 * genuine portfolio/website/booking page - the same rule outbid.lol used to
 * keep listings from becoming a spam funnel. Calendly, X/Twitter profiles,
 * and ordinary websites are all fine; a Discord invite or WhatsApp
 * click-to-chat link is not.
 */
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /(^|\.)discord\.gg$/i,
  /(^|\.)discord\.com$/i, // covers discord.com/invite/*
  /(^|\.)t\.me$/i,
  /(^|\.)telegram\.me$/i,
  /(^|\.)wa\.me$/i,
  /(^|\.)chat\.whatsapp\.com$/i,
  /(^|\.)m\.me$/i, // Messenger
];

export function validateDestinationLink(rawUrl: string): { ok: true; url: string } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Enter a valid URL, including https://" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Link must start with http:// or https://" };
  }

  // discord.com hosts plenty of legitimate content; only /invite/* links are disallowed.
  const isNonInviteDiscordPage = parsed.hostname === "discord.com" && !parsed.pathname.startsWith("/invite/");
  const isBlocked = !isNonInviteDiscordPage && BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname));

  if (isBlocked) {
    return {
      ok: false,
      error: "Direct chat/invite links aren't allowed - link to your site, portfolio, or booking page instead.",
    };
  }

  return { ok: true, url: parsed.toString() };
}

/**
 * Normalizes a destination URL for duplicate detection - not for display or
 * storage of the link itself (that stays exactly what the provider entered).
 * Lowercases the host, drops a leading "www.", and ignores trailing
 * slash/querystring/fragment, so "example.com", "www.example.com/", and
 * "https://example.com?ref=x" are all treated as the same listing.
 */
export function normalizeUrlKey(url: string): string {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const path = parsed.pathname.replace(/\/+$/, "");
  return `${host}${path}`.toLowerCase();
}

/**
 * Tags an outbound destination link with utm_source=podium so a provider's
 * own analytics can attribute the visit back to us - applied at the moment a
 * listing is actually sent out (see app/r/[id]/route.ts and
 * ListingOutboundLink), never on the stored destination_link itself, so the
 * provider's saved URL stays exactly what they entered. Only ever set if the
 * provider's link doesn't already carry a utm_source of its own - we
 * shouldn't override one they've deliberately chosen (e.g. if they've pasted
 * a link that's itself tagged for a different campaign).
 */
export function withUtmSource(url: string): string {
  const parsed = new URL(url);
  if (!parsed.searchParams.has("utm_source")) {
    parsed.searchParams.set("utm_source", "podium");
  }
  return parsed.toString();
}
