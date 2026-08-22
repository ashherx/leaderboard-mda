import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that apply to using ${SITE_NAME}.`,
};

const LAST_UPDATED = "August 23, 2026";

export default function TermsPage() {
  return (
    <>
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate hover:text-green">
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Leaderboard
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Terms of Service</h1>
        <p className="mt-2 text-slate">Last updated {LAST_UPDATED}.</p>

        <div className="mt-8 flex flex-col gap-8">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">What {SITE_NAME} is</h2>
            <p className="mt-2 text-slate">
              {SITE_NAME} is a pay-to-rank leaderboard operated by Million Dollar Agency. Service providers pay to
              claim a rank in a category; rank is determined purely by payment amount, not by review or vote. Full
              details on how ranking works are in the <Link href="/rules" className="text-green hover:underline">Rules</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Payments and Paddle</h2>
            <p className="mt-2 text-slate">
              Payments are processed by our reseller, Paddle.com Market Limited, which acts as the Merchant of
              Record for all purchases made on this site. Paddle handles billing, applicable taxes, and payment
              disputes. Your payment card statement will show a charge from Paddle, not from {SITE_NAME} directly.
            </p>
            <p className="mt-2 text-slate">
              A completed payment claims your listing&apos;s rank immediately, at whatever position your bid amount
              earns at the moment payment completes. See our{" "}
              <Link href="/refunds" className="text-green hover:underline">
                Refund Policy
              </Link>{" "}
              for how refunds are handled.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Listings and acceptable use</h2>
            <p className="mt-2 text-slate">
              You&apos;re responsible for the accuracy of the listing you submit and for the destination link you
              provide. We reserve the right to unpublish any listing that violates the rules laid out on the{" "}
              <Link href="/rules" className="text-green hover:underline">
                Rules
              </Link>{" "}
              page - including listings for illegal services, adult services, or non-service-provider accounts -
              without a refund.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">No accounts</h2>
            <p className="mt-2 text-slate">
              There&apos;s no login system. Payment issues a private manage link that is the sole way to edit your
              listing or re-bid later. You&apos;re responsible for keeping that link safe - we can&apos;t recover
              it if it&apos;s lost, and possession of the link is treated as authorization to manage that listing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">No guarantee of rank</h2>
            <p className="mt-2 text-slate">
              Rank is a live, contested position, not a fixed slot - anyone can outbid you and take your spot at any
              time after purchase. We don&apos;t guarantee any minimum duration at a given rank.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Changes to these terms</h2>
            <p className="mt-2 text-slate">
              We may update these terms from time to time. Continued use of {SITE_NAME} after a change constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
            <p className="mt-2 text-slate">
              Questions about these terms can be sent to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-green hover:underline">
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
