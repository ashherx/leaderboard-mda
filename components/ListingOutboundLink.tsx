"use client";

import type { ReactNode } from "react";
import { withUtmSource } from "@/lib/link-policy";

/**
 * Wraps a listing's outbound link. `href` still points at the /r/[id]
 * click-logging redirect (see app/r/[id]/route.ts) so keyboard nav,
 * middle-click, and no-JS all still work exactly as before - the row's own
 * click just gets there faster: it fires the logging request without
 * waiting for it, then opens the real destination straight away, instead of
 * making the visitor's new tab sit on our redirect while the click gets
 * written to the DB.
 */
export function ListingOutboundLink({
  listingId,
  destinationLink,
  className,
  children,
}: {
  listingId: string;
  destinationLink: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`/r/${listingId}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => {
        e.preventDefault();

        // Fire-and-forget: `redirect: "manual"` stops fetch from following
        // the redirect itself (which would otherwise hit the destination
        // cross-origin, likely fail on CORS, and burn bandwidth for a
        // response we don't need) - it only needs the click-logging side
        // effect that route already runs before it redirects. `keepalive`
        // lets it finish even though we don't wait around for it.
        fetch(`/r/${listingId}`, { redirect: "manual", keepalive: true }).catch(() => {
          /* best-effort - a dropped click log never blocks the visitor */
        });

        window.open(withUtmSource(destinationLink), "_blank", "noopener,noreferrer");
      }}
    >
      {children}
    </a>
  );
}
