import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { VisitTracker } from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: "Rules — Agency Bid Leaderboard",
  description: "How ranking works, what's allowed, and what claims a spot.",
};

export default function RulesPage() {
  return (
    <>
      <VisitTracker />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="text-sm text-slate hover:text-green">
          ← All categories
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Rules</h1>
        <p className="mt-2 text-slate">Short version: highest payment wins. Here's the rest.</p>

        <div className="mt-8 flex flex-col gap-8">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">How ranking works</h2>
            <p className="mt-2 text-slate">
              Every category is its own leaderboard. Whoever has paid the most is #1. Pay less than #1 and you still
              get a spot — whatever rank your amount can currently buy among that category's listings. There's no
              review, no vote, no algorithm deciding who ranks where. Just dollars.
            </p>
            <p className="mt-2 text-slate">
              Rank isn't permanent. Someone can outbid you and take your spot at any time. Come back and re-bid
              through your manage link to reclaim it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">A completed payment claims the rank</h2>
            <p className="mt-2 text-slate">
              Your listing goes live the moment payment completes, at whatever rank your amount earns at that
              exact moment — not necessarily the rank you saw when you opened the form, since someone else may have
              bid in the meantime. No payment, no listing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">What can be listed</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate">
              <li>Real service providers only — agencies, freelancers, consultants. No SaaS products, no novelty accounts.</li>
              <li>Your destination link goes to your site, portfolio, or booking page — not a chat or invite link.</li>
              <li>No illegal services. No adult services.</li>
            </ul>
            <p className="mt-2 text-slate">
              Break these and your listing gets unpublished, no refund. Use the &quot;Report this listing&quot; link
              on any listing if you spot one that shouldn&apos;t be here.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">No accounts</h2>
            <p className="mt-2 text-slate">
              There's no login. Payment issues a private manage link that lets you edit your listing or re-bid
              later — that link is the only way back in, and it can&apos;t be recovered if you lose it. Save it
              somewhere.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
