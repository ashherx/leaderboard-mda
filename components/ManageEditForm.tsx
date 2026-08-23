"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Availability } from "@/lib/db/types";

const PITCH_MAX_LENGTH = 140;

export function ManageEditForm({
  token,
  initialProviderName,
  initialPitch,
  initialDestinationLink,
  initialLocation,
  initialLicensedInsured,
  initialYearsInBusiness,
  initialAvailability,
  initialSpecialtyTags,
  initialStartingHourlyRateDollars,
  initialMinProjectDollars,
}: {
  token: string;
  initialProviderName: string;
  initialPitch: string;
  initialDestinationLink: string;
  initialLocation: string;
  initialLicensedInsured: boolean;
  initialYearsInBusiness: number | null;
  initialAvailability: Availability | null;
  initialSpecialtyTags: string;
  initialStartingHourlyRateDollars: number | null;
  initialMinProjectDollars: number | null;
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
        setError(data.error ?? "Something went wrong - try again.");
        setSubmitting(false);
        return;
      }

      setSaved(true);
      setSubmitting(false);
      router.refresh();
    } catch {
      setError("Network error - try again.");
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
        <label htmlFor="location" className="block text-sm font-medium text-ink">
          Location
        </label>
        <input
          id="location"
          name="location"
          required
          maxLength={80}
          defaultValue={initialLocation}
          placeholder="City, State"
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-ink outline-none focus:border-green"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-ink">Licensed &amp; insured?</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="radio" name="licensedInsured" value="yes" required defaultChecked={initialLicensedInsured} />
            Yes
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="radio" name="licensedInsured" value="no" required defaultChecked={!initialLicensedInsured} />
            No
          </label>
        </div>
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
              defaultValue={initialYearsInBusiness ?? ""}
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
              defaultValue={initialAvailability ?? ""}
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
              defaultValue={initialSpecialtyTags}
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
                defaultValue={initialStartingHourlyRateDollars ?? ""}
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
                defaultValue={initialMinProjectDollars ?? ""}
                className="w-full bg-transparent font-mono text-ink outline-none"
              />
            </div>
          </div>
        </div>
      </details>

      {error && <p className="rounded-md border border-border px-3 py-2 text-sm text-red-600">{error}</p>}
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
