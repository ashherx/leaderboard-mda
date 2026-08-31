import { NextResponse } from "next/server";
import { getPublishedListingById, incrementClickCount } from "@/lib/db/listings";
import { recordClickEvent } from "@/lib/db/activity";
import { withUtmSource } from "@/lib/link-policy";

/**
 * Click-through redirect: every listing's outbound link on the leaderboard
 * points here instead of straight at destination_link, so a click can be
 * counted before the visitor leaves. 302 (not 301) since the destination
 * isn't a permanent fact about this URL - a listing's link can change.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const listing = await getPublishedListingById(params.id);

  if (!listing) {
    return NextResponse.redirect(new URL("/", _request.url));
  }

  // Only ever forward http(s) links - the destination is provider-supplied,
  // so this guards against it having been stored as a javascript:/data: URI.
  let target: URL;
  try {
    target = new URL(listing.destination_link);
  } catch {
    return NextResponse.redirect(new URL("/", _request.url));
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.redirect(new URL("/", _request.url));
  }

  await Promise.all([
    incrementClickCount(listing.id),
    recordClickEvent(listing.id, listing.category_id, listing.location_id),
  ]);

  return NextResponse.redirect(withUtmSource(target.toString()), { status: 302 });
}
