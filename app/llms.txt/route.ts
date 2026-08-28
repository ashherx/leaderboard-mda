import { listActiveCategories } from "@/lib/db/categories";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await listActiveCategories();
  const categoryLinks = categories
    .map(
      (category) =>
        `- [${category.name} service provider leaderboard](${absoluteUrl(`/categories/${category.slug}`)}): Sponsored listings ranked by paid bid within ${category.name}.`
    )
    .join("\n");

  const body = `# The Podium

> The Podium is a public collection of sponsored service provider leaderboards operated by Million Dollar Agency. Providers pay to claim positions, and higher paid bids rank above lower bids within each category.

Important interpretation notes:
- A rank reflects payment amount only. It is not a review, quality score, vetting result, or endorsement.
- Categories are independent; bids are never compared across different service categories.
- Listing content is submitted by providers and may change.

## Leaderboards

- [All service provider leaderboards](${absoluteUrl("/")}): Browse every active category and sponsored listing.
${categoryLinks}

## How it works

- [Leaderboard rules](${absoluteUrl("/rules")}): Ranking mechanics, listing eligibility, payment behavior, and account-free management links.

## Policies

- [Terms of Service](${absoluteUrl("/terms")}): Terms for visitors and providers purchasing a rank.
- [Privacy Notice](${absoluteUrl("/privacy")}): Data collection, processing, retention, and user choices.
- [Refund Policy](${absoluteUrl("/refunds")}): When purchases are final and the limited refund cases.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
