"use client";

import { useEffect, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { formatCentsAsDollars } from "@/lib/format";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import type { CategoryPricing } from "@/lib/db/types";

const STEP_DOLLARS = 1;

export function ClaimPanel({
  selectedSlug,
  stateSlug,
  selectedCategoryName,
  pricing,
  categories,
  onSelectCategory,
}: {
  selectedSlug: string;
  stateSlug: string;
  selectedCategoryName: string;
  pricing: CategoryPricing;
  categories: { slug: string; name: string }[];
  onSelectCategory: (slug: string) => void;
}) {
  const minDollars = pricing.minBidCents / 100;
  const currentTopDollars = pricing.currentTopCents === null ? null : pricing.currentTopCents / 100;
  const claimFirstDollars = pricing.claimFirstPriceCents / 100;

  const [bidDollars, setBidDollars] = useState(claimFirstDollars);
  const [previewRank, setPreviewRank] = useState(1);
  const [link, setLink] = useState("");

  // Selected category changed (either via this panel's own dropdown or the
  // CategoryTabs above it, both driving the same shared selection) - rebase
  // the bid onto the new category's claim-first price and reset the preview.
  useEffect(() => {
    setBidDollars(claimFirstDollars);
    setPreviewRank(1);
    // Only re-run when the category itself changes, not on every pricing
    // refresh (e.g. someone else outbidding #1 shouldn't yank your bid back).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug]);

  // If this bid would take #1 outright, the rank is known without a round
  // trip (nothing can currently outrank it). Only ambiguous bids - below
  // the current #1 - need the preview API, and even then debounced.
  useEffect(() => {
    if (currentTopDollars === null || bidDollars > currentTopDollars) {
      setPreviewRank(1);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/states/${stateSlug}/categories/${selectedSlug}/preview-rank?bid=${bidDollars}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.rank) setPreviewRank(data.rank);
        })
        .catch(() => {
          /* aborted or transient - leave last known preview in place */
        });
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [bidDollars, currentTopDollars, selectedSlug, stateSlug]);

  function adjust(delta: number) {
    setBidDollars((current) => Math.max(minDollars, current + delta));
  }

  const claimHref = `/claim?state=${stateSlug}&category=${selectedSlug}&amount=${bidDollars}${link ? `&link=${encodeURIComponent(link)}` : ""}`;

  return (
    <div className="text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-slate">in {selectedCategoryName}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <span className="font-display text-3xl font-bold text-ink sm:text-4xl">Claim #{previewRank} for</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjust(-STEP_DOLLARS)}
            aria-label="Decrease bid"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/12 text-ink transition-colors hover:bg-gold/20"
          >
            <ArrowDownIcon weight="duotone" className="h-4 w-4" />
          </button>
          <span className="font-mono text-3xl font-bold text-gold sm:text-4xl">{formatCentsAsDollars(bidDollars * 100)}</span>
          <button
            type="button"
            onClick={() => adjust(STEP_DOLLARS)}
            aria-label="Increase bid"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/12 text-ink transition-colors hover:bg-gold/20"
          >
            <ArrowUpIcon weight="duotone" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-md text-sm text-slate">
        <span className="font-medium text-ink">New spots start at ${minDollars}.</span> Paying less than the #1
        price still puts you on the board at whatever rank that bid can take.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="claim-destination-link" className="sr-only">
          Your site or portfolio link
        </label>
        <input
          id="claim-destination-link"
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Your site or portfolio link"
          className="flex-1 rounded-md border border-border bg-white px-4 py-2.5 text-ink outline-none focus:border-green"
        />
        <CategoryDropdown categories={categories} selectedSlug={selectedSlug} onSelect={onSelectCategory} className="sm:w-48" />
        {/* flex + items-center + leading-none, not text-align/line-height:
            Bricolage Grotesque's line box reserves more space below the
            glyphs than above, so centering via line-height alone left the
            text sitting visibly high - flex-centering the tightened glyph
            box (leading-none removes the extra reserved leading) actually
            centers it. */}
        <a
          href={claimHref}
          className="flex shrink-0 items-center justify-center rounded-md bg-ink px-6 py-2.5 font-display text-sm font-semibold leading-none text-white transition-colors hover:bg-green"
        >
          Claim #{previewRank}
        </a>
      </div>
    </div>
  );
}
