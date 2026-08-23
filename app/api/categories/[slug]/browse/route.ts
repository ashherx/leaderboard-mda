import { NextResponse } from "next/server";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getAllCategoriesBrowseData, getCategoryBrowseData } from "@/lib/db/browse";
import { ALL_CATEGORIES_NAME, ALL_CATEGORIES_SLUG } from "@/lib/all-categories";

/**
 * Powers LeaderboardBrowser's client-side category/page switching - one
 * combined payload (listings, pricing, trending, latest activity) instead
 * of four separate round trips. The initial category on page load skips
 * this route entirely and calls getCategoryBrowseData directly server-side.
 */
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const pageParam = new URL(request.url).searchParams.get("page");
  const page = Math.max(1, Number(pageParam) || 1);

  if (params.slug === ALL_CATEGORIES_SLUG) {
    const data = await getAllCategoriesBrowseData(page);
    return NextResponse.json({
      category: { id: ALL_CATEGORIES_SLUG, slug: ALL_CATEGORIES_SLUG, name: ALL_CATEGORIES_NAME, description: null },
      ...data,
    });
  }

  const category = await getCategoryBySlug(params.slug);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const data = await getCategoryBrowseData(category.id, category.min_bid_cents, page);
  return NextResponse.json({
    category: { id: category.id, slug: category.slug, name: category.name, description: category.description },
    ...data,
  });
}
