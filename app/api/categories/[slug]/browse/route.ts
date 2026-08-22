import { NextResponse } from "next/server";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getCategoryBrowseData } from "@/lib/db/browse";

/**
 * Powers LeaderboardBrowser's client-side category/page switching - one
 * combined payload (listings, pricing, trending, latest activity) instead
 * of four separate round trips. The initial category on page load skips
 * this route entirely and calls getCategoryBrowseData directly server-side.
 */
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const pageParam = new URL(request.url).searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);

  const data = await getCategoryBrowseData(category.id, category.min_bid_cents, page);
  return NextResponse.json({
    category: { id: category.id, slug: category.slug, name: category.name, description: category.description },
    ...data,
  });
}
