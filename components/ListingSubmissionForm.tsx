"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PITCH_MAX_LENGTH = 140;

export function ListingSubmissionForm({
  categorySlug,
  minBidDollars,
  initialBidDollars,
}: {
  categorySlug: string;
  minBidDollars: number;
  initialBidDollars: number;
}) {
  const router = useRouter();
  const [pitch, setPitch] = useState("");
  const [bidDollars, setBidDollars] = useState(String(initialBidDollars));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("categorySlug", categorySlug);

    try {
      const res = await fetch("/api/listings", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong — try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/success?token=${data.manageToken}`);
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-white p-6">
      <div>
        <label htmlFor="providerName" className="block text-sm font-medium text-ink">
          Provider / company name
        </label>
        <input
          id="providerName"
          name="providerName"
          required
          maxLength={80}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="pitch" className="block text-sm font-medium text-ink">
            One-line pitch
          </label>
          <span className="font-mono text-xs text-slate">
            {pitch.length}/{PITCH_MAX_LENGTH}
          </span>
        </div>
        <input
          id="pitch"
          name="pitch"
          required
          maxLength={PITCH_MAX_LENGTH}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="What you do, in one sentence."
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
      </div>

      <div>
        <label htmlFor="destinationLink" className="block text-sm font-medium text-ink">
          Destination link
        </label>
        <input
          id="destinationLink"
          name="destinationLink"
          type="url"
          required
          placeholder="https://your-site.com"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
        <p className="mt-1 text-xs text-slate">Your site, portfolio, or booking page — no chat/invite links.</p>
      </div>

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-ink">
          Logo <span className="text-slate">(optional)</span>
        </label>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="mt-1 w-full text-sm text-slate"
        />
      </div>

      <div>
        <label htmlFor="bidDollars" className="block text-sm font-medium text-ink">
          Your bid
        </label>
        <div className="mt-1 flex items-center rounded-md border border-border px-3 py-2 focus-within:border-green">
          <span className="font-mono text-ink">$</span>
          <input
            id="bidDollars"
            name="bidDollars"
            type="number"
            required
            min={minBidDollars}
            step={1}
            value={bidDollars}
            onChange={(e) => setBidDollars(e.target.value)}
            className="w-full bg-transparent font-mono text-ink outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-slate">${minBidDollars} minimum. Whole dollars only.</p>
      </div>

      {error && <p className="rounded-md bg-brick/8 px-3 py-2 text-sm text-brick">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
      >
        {submitting ? "Submitting…" : `Claim rank for $${bidDollars || minBidDollars}`}
      </button>
    </form>
  );
}
