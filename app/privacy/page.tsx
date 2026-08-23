import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: `What ${SITE_NAME} collects, why, and who it's shared with.`,
};

const LAST_UPDATED = "August 23, 2026";

export default function PrivacyPage() {
  return (
    <>
      <VisitTracker />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate hover:text-green">
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Leaderboard
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Privacy Notice</h1>
        <p className="mt-2 text-slate">Last updated {LAST_UPDATED}.</p>

        <div className="mt-8 flex flex-col gap-8">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">What we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-slate">
              <li>
                <strong className="text-ink">Listing information you submit</strong> - provider/company name, a
                one-line pitch, your destination link, and an optional logo. This is published on the leaderboard.
              </li>
              <li>
                <strong className="text-ink">Payment information</strong> - handled entirely by Lemon Squeezy, our
                payment processor and Merchant of Record. We never see or store your card details; we receive an
                order ID, amount, and payment status from Lemon Squeezy to activate your listing.
              </li>
              <li>
                <strong className="text-ink">An anonymous visit cookie</strong> - a random ID (no personal
                information) set to power the &quot;online now&quot; and &quot;visitors since launch&quot; counters
                shown on the site.
              </li>
              <li>
                <strong className="text-ink">Click data</strong> - when a listing&apos;s link is clicked, we log
                that a click happened (which listing, when) to power the &quot;trending&quot; and click-count
                figures. This isn&apos;t tied to who clicked.
              </li>
              <li>
                <strong className="text-ink">Aggregate page-view analytics</strong> - via Vercel Web Analytics,
                which reports traffic in aggregate and doesn&apos;t use cookies to track individuals across sites.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">How we use it</h2>
            <p className="mt-2 text-slate">
              To run the leaderboard itself: publish listings, compute rank, show live activity/trending panels,
              and let you manage or re-bid your own listing via your private manage link. We don&apos;t sell your
              information or use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Who we share it with</h2>
            <p className="mt-2 text-slate">
              Service providers we use to run {SITE_NAME}: Lemon Squeezy (payment processing), Supabase (database
              hosting), and Vercel (site hosting and analytics). Each processes data on our behalf under their own
              privacy and security terms; we don&apos;t sell data to anyone else.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Retention</h2>
            <p className="mt-2 text-slate">
              Listing information is kept as long as needed to operate the leaderboard, or until you ask us to
              remove it. The visit cookie expires after a year. Click logs are kept in aggregate for the trending
              and click-count features.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Your choices</h2>
            <p className="mt-2 text-slate">
              To have your listing or any personal data removed, email us with your listing&apos;s manage link or
              destination URL and we&apos;ll take it down. You can also block or clear cookies in your browser at
              any time - the site works without them, just without the live visitor counters.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Children</h2>
            <p className="mt-2 text-slate">{SITE_NAME} isn&apos;t directed at children and we don&apos;t knowingly collect data from anyone under 16.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Changes to this notice</h2>
            <p className="mt-2 text-slate">
              We may update this notice from time to time; the &quot;last updated&quot; date above will change
              when we do.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
            <p className="mt-2 text-slate">
              Questions or data requests can be sent to{" "}
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
