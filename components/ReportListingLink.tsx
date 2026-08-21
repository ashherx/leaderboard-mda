"use client";

import { useState } from "react";

const REASONS = [
  "Not a real service provider",
  "Broken or suspicious link",
  "Inappropriate or illegal content",
  "Chat/invite link as destination",
  "Other",
];

export function ReportListingLink({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return <span className="text-xs text-slate">Thanks — we&apos;ll take a look.</span>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-slate underline hover:text-brick">
        Report this listing
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, details }),
      });
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-border bg-canvas p-3 text-sm">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="rounded border border-border px-2 py-1">
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Anything else worth knowing? (optional)"
        maxLength={500}
        rows={2}
        className="rounded border border-border px-2 py-1"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-brick px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Submit report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate">
          Cancel
        </button>
      </div>
    </form>
  );
}
