"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCentsAsDollars } from "@/lib/format";

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
  const router = useRouter();
  const [bidDollars, setBidDollars] = useState(String(Math.max(currentBidDollars, claimFirstPriceCents / 100)));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRank, setNewRank] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNewRank(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/manage/${token}/rebid`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong — try again.");
        setSubmitting(false);
        return;
      }

      setNewRank(data.rank);
      setSubmitting(false);
      router.refresh();
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
          Claiming #1 right now costs {formatCentsAsDollars(claimFirstPriceCents)}. Payment is stubbed for now —
          submitting takes effect immediately.
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

      {error && <p className="rounded-md bg-brick/8 px-3 py-2 text-sm text-brick">{error}</p>}
      {newRank !== null && (
        <p className="rounded-md bg-green/8 px-3 py-2 text-sm text-green">Now ranked #{newRank}.</p>
      )}

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
