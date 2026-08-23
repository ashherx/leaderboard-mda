"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Shown on the success page when a listing's payment hasn't been confirmed
 * by the Lemon Squeezy webhook yet - Lemon Squeezy usually redirects the
 * browser here within a second or two of the webhook firing, but there's no
 * hard guarantee of ordering. Polls until the payment is confirmed, then
 * re-renders the success page with the real rank.
 *
 * `token` is omitted when this checkout turned into a top-up of a listing
 * the submitter doesn't control (a duplicate-URL top-up, see
 * submitListingAndCheckout) - in that case there's no manage-scoped status
 * route to poll, so this falls back to the token-less /api/payments one.
 */
export function PendingPaymentNotice({ token, payment }: { token?: string; payment: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const url = token
      ? `/api/manage/${token}/status?payment=${encodeURIComponent(payment)}`
      : `/api/payments/${payment}/status`;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled && data.ok && data.published) {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        /* transient - the next tick will retry */
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, payment, router]);

  return (
    <div className="rounded-xl border border-border bg-white p-6 text-center">
      <p className="text-sm font-medium text-ink">Confirming your payment…</p>
      <p className="mt-1 text-slate">This usually takes a few seconds. This page will update on its own.</p>
    </div>
  );
}
