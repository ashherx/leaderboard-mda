import Link from "next/link";
import { headers } from "next/headers";
import { getListingByManageToken, getListingRank } from "@/lib/db/listings";
import { getCategoryById } from "@/lib/db/categories";
import { formatCentsAsDollars } from "@/lib/format";
import { Footer } from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token;
  const listing = token ? await getListingByManageToken(token) : null;

  if (!listing || !token) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="font-display text-xl font-semibold text-ink">Nothing to show here</p>
          <p className="mt-2 text-slate">This link is missing or invalid.</p>
          <Link href="/" className="mt-6 inline-block text-sm text-green hover:underline">
            ← Back to the leaderboard
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const [category, rank] = await Promise.all([getCategoryById(listing.category_id), getListingRank(listing.id)]);

  const headersList = headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const manageUrl = `${protocol}://${host}/manage/${token}`;

  return (
    <>
    <SiteHeader />
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-xl border border-green bg-green/8 p-6 text-center">
        <p className="text-sm font-medium text-green">You&apos;re live</p>
        <p className="mt-1 font-display text-2xl font-bold text-ink">
          #{rank} in {category?.name ?? "your category"}
        </p>
        <p className="mt-1 text-slate">
          {listing.provider_name} · {formatCentsAsDollars(listing.bid_amount_cents)}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-gold bg-gold/8 p-5">
        <p className="font-display font-semibold text-ink">Save this link — it's the only way back in</p>
        <p className="mt-1 text-sm text-slate">
          There are no accounts. This private link is the only way to edit your listing or re-bid to reclaim a
          better rank later. If you lose it, it can&apos;t be recovered.
        </p>
        <div className="mt-3 break-all rounded-md border border-border bg-white px-3 py-2 font-mono text-sm text-ink">
          {manageUrl}
        </div>
        <a
          href={manageUrl}
          className="mt-3 inline-block rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-green"
        >
          Manage my listing →
        </a>
      </div>

      {category && (
        <Link href={`/categories/${category.slug}`} className="mt-6 inline-block text-sm text-green hover:underline">
          ← View the {category.name} leaderboard
        </Link>
      )}
    </main>
    <Footer />
    </>
  );
}
