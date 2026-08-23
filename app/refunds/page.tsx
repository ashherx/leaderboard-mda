import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `How refunds work for ${SITE_NAME} purchases.`,
};

const LAST_UPDATED = "August 23, 2026";

export default function RefundsPage() {
  return (
    <>
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate hover:text-green">
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Leaderboard
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Refund Policy</h1>
        <p className="mt-2 text-slate">Last updated {LAST_UPDATED}.</p>

        <div className="mt-8 flex flex-col gap-8">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Purchases are final</h2>
            <p className="mt-2 text-slate">
              Claiming or re-bidding a rank on {SITE_NAME} takes effect the instant payment completes - your
              listing is published live, at the rank your bid earns at that moment. Because the product is
              delivered immediately, purchases are non-refundable except as described below.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">When we will refund</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-slate">
              <li>Payment completed but your listing never went live due to a technical error on our end.</li>
              <li>You were charged more than once for the same claim.</li>
              <li>Required by applicable consumer protection law.</li>
            </ul>
            <p className="mt-2 text-slate">
              Listings removed for violating the <Link href="/rules" className="text-green hover:underline">Rules</Link>{" "}
              (e.g. illegal or adult services, non-service-provider accounts) are not eligible for a refund.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">How to request one</h2>
            <p className="mt-2 text-slate">
              Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-green hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              with your manage link or the transaction ID from your receipt, and describe the issue. Please contact
              us before opening a payment dispute or chargeback with your bank - we can usually resolve it faster
              directly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Lemon Squeezy as Merchant of Record</h2>
            <p className="mt-2 text-slate">
              All payments are processed by Sold Through Link, LLC (operating as Lemon Squeezy), acting as
              Merchant of Record. Approved refunds are issued back to your original payment method via Lemon
              Squeezy.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
