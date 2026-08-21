"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown on the success page when a listing's payment hasn't been confirmed
 * by the Paddle webhook yet — Paddle usually redirects the browser here
 * within a second or two of the webhook firing, but there's no hard
 * guarantee of ordering. Polls until the listing is published, then
 * re-renders the (server-component) success page with the real rank.
 */
export function PendingPaymentNotice({ token }: { token: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/manage/${token}/status`);
        const data = await res.json();
        if (!cancelled && data.ok && data.published) {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        /* transient — the next tick will retry */
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, router]);

  return (
    <div className="rounded-xl border border-border bg-white p-6 text-center">
      <p className="text-sm font-medium text-ink">Confirming your payment…</p>
      <p className="mt-1 text-slate">This usually takes a few seconds. This page will update on its own.</p>
    </div>
  );
}
