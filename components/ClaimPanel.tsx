"use client";

import { useEffect, useState } from "react";
import { formatCentsAsDollars } from "@/lib/format";

export function ClaimPanel({
  slug,
  minBidCents,
  claimFirstPriceCents,
}: {
  slug: string;
  minBidCents: number;
  claimFirstPriceCents: number;
}) {
  const minDollars = minBidCents / 100;
  const claimFirstDollars = claimFirstPriceCents / 100;

  const [customBid, setCustomBid] = useState(String(claimFirstDollars));
  const [previewRank, setPreviewRank] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const bidDollars = Number(customBid);
    if (!Number.isFinite(bidDollars) || !Number.isInteger(bidDollars) || bidDollars < minDollars) {
      setPreviewRank(null);
      setPreviewError(bidDollars > 0 ? `Minimum bid is $${minDollars}` : null);
      return;
    }

    setPreviewError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/categories/${slug}/preview-rank?bid=${bidDollars}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          if (data.rank) setPreviewRank(data.rank);
        })
        .catch(() => {
          /* aborted or transient — leave last known preview in place */
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [customBid, slug, minDollars]);

  const bidDollarsForLink = Math.max(minDollars, Math.floor(Number(customBid) || 0));

  return (
    <div className="rounded-xl border border-gold bg-gold/8 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate">Claim the #1 spot in this category</p>
          <p className="font-mono text-3xl font-bold text-ink">{formatCentsAsDollars(claimFirstPriceCents)}</p>
        </div>
        <a
          href={`/categories/${slug}/claim?amount=${claimFirstDollars}`}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green"
        >
          Claim #1 for {formatCentsAsDollars(claimFirstPriceCents)}
        </a>
      </div>

      <div className="mt-4 border-t border-gold/40 pt-4">
        <label htmlFor="custom-bid" className="text-sm text-slate">
          Or try a lower bid to see what rank it claims right now
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border border-border bg-white px-3 py-1.5">
            <span className="font-mono text-ink">$</span>
            <input
              id="custom-bid"
              type="number"
              min={minDollars}
              step={1}
              value={customBid}
              onChange={(e) => setCustomBid(e.target.value)}
              className="w-24 bg-transparent font-mono text-ink outline-none"
            />
          </div>
          {previewError && <span className="text-sm text-brick">{previewError}</span>}
          {!previewError && previewRank !== null && (
            <span className="text-sm text-slate">
              Would currently rank{" "}
              <span className="font-mono font-semibold text-ink">
                #{previewRank}
              </span>
            </span>
          )}
          <a
            href={`/categories/${slug}/claim?amount=${bidDollarsForLink}`}
            className="ml-auto rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-green hover:text-green"
          >
            Claim at this bid
          </a>
        </div>
      </div>
    </div>
  );
}
