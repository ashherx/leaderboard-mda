"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PITCH_MAX_LENGTH = 140;

export function ManageEditForm({
  token,
  initialProviderName,
  initialPitch,
  initialDestinationLink,
}: {
  token: string;
  initialProviderName: string;
  initialPitch: string;
  initialDestinationLink: string;
}) {
  const router = useRouter();
  const [pitch, setPitch] = useState(initialPitch);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/manage/${token}/edit`, { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong — try again.");
        setSubmitting(false);
        return;
      }

      setSaved(true);
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
      <h2 className="font-display font-semibold text-ink">Edit listing</h2>

      <div>
        <label htmlFor="providerName" className="block text-sm font-medium text-ink">
          Provider / company name
        </label>
        <input
          id="providerName"
          name="providerName"
          required
          maxLength={80}
          defaultValue={initialProviderName}
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
          defaultValue={initialDestinationLink}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
      </div>

      <div>
        <label htmlFor="logo" className="block text-sm font-medium text-ink">
          Replace logo <span className="text-slate">(optional)</span>
        </label>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="mt-1 w-full text-sm text-slate"
        />
      </div>

      {error && <p className="rounded-md bg-brick/8 px-3 py-2 text-sm text-brick">{error}</p>}
      {saved && <p className="rounded-md bg-green/8 px-3 py-2 text-sm text-green">Saved.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
