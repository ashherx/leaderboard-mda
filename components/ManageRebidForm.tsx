"use client";

import { useState } from "react";
import { formatCentsAsDollars } from "@/lib/format";
import { getPaddleInstance } from "@/lib/paddle/client";

export function ManageRebidForm({
  token,
  minBidDollars,
  claimFirstPriceCents,
  currentBidDollars,
}: {
  token: string;
  minBidDollars: number;
  claimFirstPriceCents: number;
  currentBidDollars: number;
}) {
  const [bidDollars, setBidDollars] = useState(String(Math.max(currentBidDollars, claimFirstPriceCents / 100)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/manage/${token}/rebid`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong — try again.");
        setSubmitting(false);
        return;
      }

      const paddle = await getPaddleInstance();
      if (!paddle) {
        setError("Payments aren't configured yet — contact the site owner.");
        setSubmitting(false);
        return;
      }

      // The new rank only takes effect once Paddle confirms the payment —
      // the success page polls for that and shows the result there.
      paddle.Checkout.open({
        transactionId: data.transactionId,
        settings: { successUrl: `${window.location.origin}/success?token=${token}` },
      });
      setSubmitting(false);
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-gold bg-gold/8 p-5">
      <div>
        <h2 className="font-display font-semibold text-ink">Re-bid to reclaim a rank</h2>
        <p className="mt-1 text-sm text-slate">
          Claiming #1 right now costs {formatCentsAsDollars(claimFirstPriceCents)}. Submitting opens checkout — your
          new rank takes effect once payment completes.
        </p>
      </div>

      <div className="flex items-center rounded-md border border-border bg-white px-3 py-2 focus-within:border-green">
        <span className="font-mono text-ink">$</span>
        <input
          name="bidDollars"
          type="number"
          min={minBidDollars}
          step={1}
          value={bidDollars}
          onChange={(e) => setBidDollars(e.target.value)}
          className="w-full bg-transparent font-mono text-ink outline-none"
        />
      </div>

      {error && <p className="rounded-md border border-border px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
      >
        {submitting ? "Submitting…" : `Re-bid $${bidDollars || minBidDollars}`}
      </button>
    </form>
  );
}
