"use client";

import { useState } from "react";

export function ManageLinkButton({ listingId }: { listingId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState<"current" | "new" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetCurrent() {
    setLoading("current");
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/manage-link`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to fetch link.");
        return;
      }
      setLink(data.manageUrl);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  async function handleGetNew() {
    if (
      !confirm(
        "This mints a brand-new manage link and invalidates whatever link the provider currently has. Continue?"
      )
    ) {
      return;
    }

    setLoading("new");
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/manage-link`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate link.");
        return;
      }
      setLink(data.manageUrl);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!link) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <button
            type="button"
            onClick={handleGetCurrent}
            disabled={loading !== null}
            className="whitespace-nowrap text-xs text-green underline disabled:opacity-60"
          >
            {loading === "current" ? "Fetching…" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={handleGetNew}
            disabled={loading !== null}
            className="whitespace-nowrap text-xs text-green underline disabled:opacity-60"
          >
            {loading === "new" ? "Generating…" : "New link"}
          </button>
        </div>
        {error && <p className="text-xs text-brick">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="w-0 min-w-0 flex-1 truncate rounded-md border border-border px-1.5 py-0.5 text-[10px] text-slate"
      />
      <button type="button" onClick={handleCopy} className="shrink-0 whitespace-nowrap text-xs text-green underline">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
