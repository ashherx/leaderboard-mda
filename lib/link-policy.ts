/**
 * Rejects destination links that are direct chat/invite links rather than a
 * genuine portfolio/website/booking page — the same rule outbid.lol used to
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
      error: "Direct chat/invite links aren't allowed — link to your site, portfolio, or booking page instead.",
    };
  }

  return { ok: true, url: parsed.toString() };
}
