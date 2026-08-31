"use client";

import { useEffect, useRef, useState } from "react";
import { PaymentDisclaimer } from "@/components/PaymentDisclaimer";
import { SUPPORT_EMAIL } from "@/lib/site";
import { LicensedInsuredToggle } from "@/components/LicensedInsuredToggle";

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
  stateSlug,
  minBidDollars,
  initialBidDollars,
  initialDestinationLink,
}: {
  categorySlug: string;
  /** Which state's board this claims a spot on - implied by the page the visitor arrived from (see app/claim/page.tsx), not a field they pick here. */
  stateSlug: string;
  minBidDollars: number;
  initialBidDollars: number;
  initialDestinationLink?: string;
}) {
  const [destinationLink, setDestinationLink] = useState(initialDestinationLink ?? "");
  const [providerName, setProviderName] = useState("");
  const [pitch, setPitch] = useState("");
  const [bidDollars, setBidDollars] = useState(String(initialBidDollars));
  const [location, setLocation] = useState("");
  const [licensedInsured, setLicensedInsured] = useState<boolean | null>(null);
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
        /* best-effort prefill - a failed fetch just means the form stays blank */
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
    formData.set("stateSlug", stateSlug);
    // Only carry the auto-fetched favicon through if the visitor hasn't
    // chosen their own file - the file input (if filled) wins server-side
    // regardless, but no need to send both.
    const manualFile = formData.get("logo");
    if (faviconUrl && !(manualFile instanceof File && manualFile.size > 0)) {
      formData.set("logoUrl", faviconUrl);
    }

    try {
      const res = await fetch("/api/listings", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong - try again.");
        setSubmitting(false);
        return;
      }

      // Lemon Squeezy redirects the browser to the success page itself once
      // the checkout completes (redirectUrl was set server-side when the
      // checkout was created) - the listing goes live from the webhook that
      // fires around the same time (see PendingPaymentNotice). Prefer the
      // Lemon.js overlay; fall back to a full-page redirect if the script
      // hasn't finished loading yet, so a slow script load never blocks checkout.
      if (typeof window.LemonSqueezy?.Url?.Open === "function") {
        window.LemonSqueezy.Url.Open(data.checkoutUrl);
      } else {
        window.location.href = data.checkoutUrl;
      }
      setSubmitting(false);
    } catch {
      setError("Network error - try again.");
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
          Your site, portfolio, or booking page - no chat/invite links.
          {fetchingMetadata && " Fetching info from this link…"}
        </p>
        {/* This is the one moment the destination link is ever set - it's
            locked once the listing is live (see ManageEditForm /
            editListingViaToken's comment for why), so make that clear
            up front rather than surprising them later. */}
        <p className="mt-1 text-xs text-slate">
          Choose carefully - this can&apos;t be changed once your listing is live. Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-ink">
            {SUPPORT_EMAIL}
          </a>{" "}
          if it ever needs to move.
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
          placeholder={fetchingMetadata ? "Fetching info from this link…" : undefined}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="pitch" className="block text-sm font-medium text-ink">
            One-line pitch <span className="font-normal text-slate">(optional)</span>
          </label>
          <span className="font-mono text-xs text-slate">
            {pitch.length}/{PITCH_MAX_LENGTH}
          </span>
        </div>
        <input
          id="pitch"
          name="pitch"
          maxLength={PITCH_MAX_LENGTH}
          value={pitch}
          onChange={(e) => {
            pitchTouched.current = true;
            setPitch(e.target.value);
          }}
          placeholder={fetchingMetadata ? "Fetching info from this link…" : "What you do, in one sentence."}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-ink">
          Location <span className="font-normal text-slate">(optional)</span>
        </label>
        <input
          id="location"
          name="location"
          maxLength={80}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City, State"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
        <p className="mt-1 text-xs text-slate">Blue-collar work is local - shown on your card so nearby buyers know it's you.</p>
      </div>

      <LicensedInsuredToggle value={licensedInsured} onChange={setLicensedInsured} />

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-ink">
          Logo <span className="text-slate">(optional - pulled automatically from your link above if we can find one)</span>
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
              -
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

      <details open className="rounded-md border border-border px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium text-ink">More details (optional)</summary>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <label htmlFor="yearsInBusiness" className="block text-sm font-medium text-ink">
              Years in business
            </label>
            <input
              id="yearsInBusiness"
              name="yearsInBusiness"
              type="number"
              min={0}
              max={150}
              step={1}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
            />
          </div>

          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-ink">
              Availability
            </label>
            <select
              id="availability"
              name="availability"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
            >
              <option value="">Not specified</option>
              <option value="standard_hours">Standard business hours</option>
              <option value="same_day">Same-day service</option>
              <option value="24_7">24/7 emergency</option>
            </select>
          </div>

          <div>
            <label htmlFor="specialtyTags" className="block text-sm font-medium text-ink">
              Specialties <span className="text-slate">(comma-separated)</span>
            </label>
            <input
              id="specialtyTags"
              name="specialtyTags"
              maxLength={140}
              placeholder="EV chargers, panel upgrades"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
            />
          </div>

          <div>
            <label htmlFor="startingHourlyRateDollars" className="block text-sm font-medium text-ink">
              Starting hourly rate
            </label>
            <div className="mt-1 flex items-center rounded-md border border-border px-3 py-2 focus-within:border-green">
              <span className="font-mono text-ink">$</span>
              <input
                id="startingHourlyRateDollars"
                name="startingHourlyRateDollars"
                type="number"
                min={1}
                step={1}
                className="w-full bg-transparent font-mono text-ink outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate">Directional only, not a locked quote - shown as "starting at."</p>
          </div>

          <div>
            <label htmlFor="minProjectDollars" className="block text-sm font-medium text-ink">
              Minimum project size
            </label>
            <div className="mt-1 flex items-center rounded-md border border-border px-3 py-2 focus-within:border-green">
              <span className="font-mono text-ink">$</span>
              <input
                id="minProjectDollars"
                name="minProjectDollars"
                type="number"
                min={1}
                step={1}
                className="w-full bg-transparent font-mono text-ink outline-none"
              />
            </div>
          </div>
        </div>
      </details>

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
