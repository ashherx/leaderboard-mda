"use client";

import { useState } from "react";
import { formatCentsAsDollars } from "@/lib/format";
import { getPaddleInstance } from "@/lib/paddle/client";
import { PaymentDisclaimer } from "@/components/PaymentDisclaimer";

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
  // How much *more* $1 is needed to claim #1 right now, if it's more than
  // the $1 floor — this is a top-up amount, added to what's already paid,
  // never a new total (that ambiguity is what caused a provider to type "13"
  // meaning "$13 more" and get charged for a $13 total instead).
  const suggestedTopUpDollars = Math.max(1, Math.ceil(claimFirstPriceCents / 100) - currentBidDollars);
  const [additionalBidDollars, setAdditionalBidDollars] = useState(String(suggestedTopUpDollars));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const additionalDollarsNumber = Number(additionalBidDollars) || 0;
  const newTotalDollars = currentBidDollars + additionalDollarsNumber;
  const isClaimFirstSelected = additionalDollarsNumber === suggestedTopUpDollars;

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
          You've already paid {formatCentsAsDollars(currentBidDollars * 100)} for this listing — a re-bid only
          charges a top-up on top of that.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setAdditionalBidDollars(String(suggestedTopUpDollars))}
        className={`rounded-md border px-4 py-2.5 text-left text-sm transition-colors ${
          isClaimFirstSelected
            ? "border-green bg-green/8 text-ink"
            : "border-border bg-white text-ink hover:border-green"
        }`}
      >
        <span className="font-display font-semibold">Claim #1</span> — add {formatCentsAsDollars(suggestedTopUpDollars * 100)}{" "}
        <span className="text-slate">(total {formatCentsAsDollars(claimFirstPriceCents)})</span>
      </button>

      <div>
        <label htmlFor="additionalBidDollars" className="block text-xs font-medium text-slate">
          Or add a custom amount
        </label>
        <div className="mt-1 flex items-center rounded-md border border-border bg-white px-3 py-2 focus-within:border-green">
          <span className="font-mono text-ink">+$</span>
          <input
            id="additionalBidDollars"
            name="additionalBidDollars"
            type="number"
            min={1}
            step={1}
            value={additionalBidDollars}
            onChange={(e) => setAdditionalBidDollars(e.target.value)}
            className="w-full bg-transparent font-mono text-ink outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-slate">
          New total bid: ${newTotalDollars}
          {newTotalDollars < minBidDollars && ` (must be at least $${minBidDollars})`}
        </p>
      </div>

      {error && <p className="rounded-md border border-border px-3 py-2 text-sm text-red-600">{error}</p>}

      <PaymentDisclaimer />

      <button
        type="submit"
        disabled={submitting || additionalDollarsNumber <= 0}
        className="self-start rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
      >
        {submitting ? "Submitting…" : `Re-bid — pay ${formatCentsAsDollars(additionalDollarsNumber * 100)}`}
      </button>
    </form>
  );
}
