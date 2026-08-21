"use client";

import { useEffect, useRef, useState } from "react";
import { getPaddleInstance } from "@/lib/paddle/client";
import { PaymentDisclaimer } from "@/components/PaymentDisclaimer";

const PITCH_MAX_LENGTH = 140;

function looksLikeFetchableUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function ListingSubmissionForm({
  categorySlug,
  minBidDollars,
  initialBidDollars,
  initialDestinationLink,
}: {
  categorySlug: string;
  minBidDollars: number;
  initialBidDollars: number;
  initialDestinationLink?: string;
}) {
  const [destinationLink, setDestinationLink] = useState(initialDestinationLink ?? "");
  const [providerName, setProviderName] = useState("");
  const [pitch, setPitch] = useState("");
  const [bidDollars, setBidDollars] = useState(String(initialBidDollars));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [manualPreviewUrl, setManualPreviewUrl] = useState<string | null>(null);
  // Only auto-fill fields the visitor hasn't touched yet, so a fetch that
  // resolves after they've already started typing a real pitch doesn't
  // clobber it.
  const nameTouched = useRef(false);
  const pitchTouched = useRef(false);

  useEffect(() => {
    if (!looksLikeFetchableUrl(destinationLink)) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setFetchingMetadata(true);
      try {
        const res = await fetch(`/api/url-metadata?url=${encodeURIComponent(destinationLink)}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!nameTouched.current && data.title) setProviderName(data.title);
        if (!pitchTouched.current && data.description) setPitch(data.description.slice(0, PITCH_MAX_LENGTH));
        if (data.faviconUrl) setFaviconUrl(data.faviconUrl);
      } catch {
        /* best-effort prefill — a failed fetch just means the form stays blank */
      } finally {
        setFetchingMetadata(false);
      }
    }, 600);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [destinationLink]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("categorySlug", categorySlug);
    // Only carry the auto-fetched favicon through if the visitor hasn't
    // chosen their own file — the file input (if filled) wins server-side
    // regardless, but no need to send both.
    const manualFile = formData.get("logo");
    if (faviconUrl && !(manualFile instanceof File && manualFile.size > 0)) {
      formData.set("logoUrl", faviconUrl);
    }

    try {
      const res = await fetch("/api/listings", { method: "POST", body: formData });
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

      // Paddle redirects the browser to the success page itself once the
      // checkout completes — the listing goes live from the webhook that
      // fires around the same time (see PendingPaymentNotice).
      paddle.Checkout.open({
        transactionId: data.transactionId,
        settings: {
          successUrl: `${window.location.origin}/success?token=${data.manageToken}&txn=${encodeURIComponent(data.transactionId)}`,
        },
      });
      setSubmitting(false);
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-white p-6">
      <div>
        <label htmlFor="destinationLink" className="block text-sm font-medium text-ink">
          Destination link
        </label>
        <input
          id="destinationLink"
          name="destinationLink"
          type="url"
          required
          value={destinationLink}
          onChange={(e) => setDestinationLink(e.target.value)}
          placeholder="https://your-site.com"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
        <p className="mt-1 text-xs text-slate">
          Your site, portfolio, or booking page — no chat/invite links.
          {fetchingMetadata && " Fetching info from this link…"}
        </p>
      </div>

      <div>
        <label htmlFor="providerName" className="block text-sm font-medium text-ink">
          Provider / company name
        </label>
        <input
          id="providerName"
          name="providerName"
          required
          maxLength={80}
          value={providerName}
          onChange={(e) => {
            nameTouched.current = true;
            setProviderName(e.target.value);
          }}
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
          onChange={(e) => {
            pitchTouched.current = true;
            setPitch(e.target.value);
          }}
          placeholder="What you do, in one sentence."
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
      </div>

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-ink">
          Logo <span className="text-slate">(optional — pulled automatically from your link above if we can find one)</span>
        </label>
        <div className="mt-1 flex items-center gap-3">
          {manualPreviewUrl || faviconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={manualPreviewUrl ?? faviconUrl ?? undefined}
              alt=""
              className="h-9 w-9 shrink-0 rounded border border-border object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-border text-xs text-slate">
              —
            </span>
          )}
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setManualPreviewUrl(null);
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setManualPreviewUrl(typeof reader.result === "string" ? reader.result : null);
              reader.readAsDataURL(file);
            }}
            className="w-full text-sm text-slate"
          />
        </div>
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

      {error && <p className="rounded-md border border-border px-3 py-2 text-sm text-red-600">{error}</p>}

      <PaymentDisclaimer />

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-ink px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
      >
        {submitting ? "Submitting…" : `Claim rank for $${bidDollars || minBidDollars}`}
      </button>
    </form>
  );
}
