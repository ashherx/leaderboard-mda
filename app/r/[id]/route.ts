import { NextResponse } from "next/server";
import { getPublishedListingById, incrementClickCount } from "@/lib/db/listings";
import { recordClickEvent } from "@/lib/db/activity";
import { withUtmSource } from "@/lib/link-policy";

const CRAWLER_USER_AGENT =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|ChatGPT-User|OAI-SearchBot|PerplexityBot/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function redirectWithoutIndex(target: URL | string, status: 302 | 307 = 307) {
  const response = NextResponse.redirect(target, { status });
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

/**
 * Click-through redirect: every listing's outbound link on the leaderboard
 * points here instead of straight at destination_link, so a click can be
 * counted before the visitor leaves. 302 (not 301) since the destination
 * isn't a permanent fact about this URL - a listing's link can change.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  // Supabase's UUID columns reject malformed input before returning an empty
  // result. Treat arbitrary crawl/user input as a missing redirect instead.
  if (!UUID_PATTERN.test(params.id)) {
    return redirectWithoutIndex(new URL("/", _request.url));
  }

  const listing = await getPublishedListingById(params.id);

  if (!listing) {
    return redirectWithoutIndex(new URL("/", _request.url));
  }

  // Only ever forward http(s) links - the destination is provider-supplied,
  // so this guards against it having been stored as a javascript:/data: URI.
  let target: URL;
  try {
    target = new URL(listing.destination_link);
  } catch {
    return redirectWithoutIndex(new URL("/", _request.url));
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return redirectWithoutIndex(new URL("/", _request.url));
  }

  const userAgent = _request.headers.get("user-agent") ?? "";
  if (!CRAWLER_USER_AGENT.test(userAgent)) {
    await Promise.all([incrementClickCount(listing.id), recordClickEvent(listing.id, listing.category_id)]);
  }

  return redirectWithoutIndex(withUtmSource(target.toString()), 302);
}
