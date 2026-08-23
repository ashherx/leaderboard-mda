"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "@phosphor-icons/react";
import { formatCentsAsDollars } from "@/lib/format";
import type { ListingWithRank } from "@/lib/db/types";

const AVAILABILITY_LABELS: Record<string, string> = {
  standard_hours: "Standard business hours",
  same_day: "Same-day service",
  "24_7": "24/7 emergency",
};

const CARD_WIDTH = 288; // px - keep in sync with the w-72 on the card below
// Delay before a mouseleave actually closes the card - long enough to cross
// the gap between the button and the portaled card (they're not DOM
// ancestors of each other) without the card flickering shut mid-move.
const CLOSE_DELAY_MS = 150;

/**
 * Small "Details" pill sitting outside the listing's outbound <a> (see
 * ListingRow) - it must never be nested inside that link, both to keep valid
 * HTML (no interactive-in-interactive) and so a click here can't also fire
 * the row's own navigation. The popover itself is portaled to <body> with
 * fixed positioning rather than absolutely positioned in place, since the
 * row it lives in is overflow-hidden (for the #1-#3 corner ribbon) and would
 * clip anything positioned relative to it.
 */
export function ListingInfoPill({ listing }: { listing: ListingWithRank }) {
  const [open, setOpen] = useState(false);
  // `bottom` (distance up from the viewport's bottom edge), not `top` - the
  // card opens upward from the button, and anchoring from the bottom lets
  // the browser grow it upward by its actual (unknown until rendered)
  // height, rather than us having to measure/guess it to compute a `top`.
  const [position, setPosition] = useState<{ bottom: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimeout() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function openNow() {
    clearCloseTimeout();
    setOpen(true);
  }

  function closeSoon() {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }

  useEffect(() => {
    if (!open) return;

    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(Math.max(8, rect.right - CARD_WIDTH), window.innerWidth - CARD_WIDTH - 8);
      setPosition({ bottom: window.innerHeight - rect.top + 8, left });
    }
    place();

    function onPointerDown(e: MouseEvent) {
      if (buttonRef.current?.contains(e.target as Node) || cardRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Belt-and-suspenders: a pending close timer must never outlive the
  // component (e.g. the listing scrolls out and unmounts mid-hover).
  useEffect(() => clearCloseTimeout, []);

  const hasDetails =
    listing.location ||
    listing.licensed_insured ||
    listing.years_in_business != null ||
    listing.availability ||
    listing.specialty_tags ||
    listing.starting_hourly_rate_cents != null ||
    listing.min_project_cents != null;

  if (!hasDetails) return null;

  const tags = listing.specialty_tags
    ? listing.specialty_tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          // Belt-and-suspenders: this button is a sibling of the row's <a>,
          // never nested in it, but stop propagation anyway so a future
          // refactor can't accidentally wire a click-through here.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        aria-expanded={open}
        aria-label="Provider details"
        className="absolute bottom-3 right-4 z-10 flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-[11px] font-medium text-slate shadow-sm transition-colors hover:border-gold hover:text-ink"
      >
        <Info weight="bold" className="h-3 w-3" />
        Details
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={cardRef}
            style={{ bottom: position.bottom, left: position.left, width: CARD_WIDTH }}
            className="fixed z-50 rounded-xl border border-border bg-white p-4 shadow-lg"
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            <div className="flex items-center gap-3">
              {listing.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.logo_url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full bg-canvas object-contain p-1.5"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-canvas font-display text-base text-slate">
                  {listing.provider_name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold text-ink">{listing.provider_name}</p>
                {listing.location && <p className="text-xs text-slate">{listing.location}</p>}
              </div>
            </div>

            {listing.pitch && <p className="mt-3 text-xs text-slate">{listing.pitch}</p>}

            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              {listing.licensed_insured && (
                <div className="col-span-2 rounded-md bg-green/8 px-2 py-1 font-medium text-green">
                  Licensed &amp; insured
                </div>
              )}
              {listing.availability && (
                <div>
                  <dt className="text-slate">Availability</dt>
                  <dd className="font-medium text-ink">{AVAILABILITY_LABELS[listing.availability]}</dd>
                </div>
              )}
              {listing.years_in_business != null && (
                <div>
                  <dt className="text-slate">Experience</dt>
                  <dd className="font-medium text-ink">{listing.years_in_business} yrs</dd>
                </div>
              )}
              {listing.starting_hourly_rate_cents != null && (
                <div>
                  <dt className="text-slate">Starting rate</dt>
                  <dd className="font-medium text-ink">{formatCentsAsDollars(listing.starting_hourly_rate_cents)}/hr</dd>
                </div>
              )}
              {listing.min_project_cents != null && (
                <div>
                  <dt className="text-slate">Min. project</dt>
                  <dd className="font-medium text-ink">{formatCentsAsDollars(listing.min_project_cents)}</dd>
                </div>
              )}
            </dl>

            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
