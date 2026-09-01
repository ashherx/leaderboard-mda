import { notFound, permanentRedirect } from "next/navigation";
import { getCategoryBySlug } from "@/lib/db/categories";
import { listActiveStates } from "@/lib/db/locations";

export const dynamic = "force-dynamic";

/**
 * Pre-state category URLs, indexed before this site became state-scoped
 * (see the states plan) - redirected to their new home under /:state/:slug
 * so search equity and shared links survive. These predate states entirely,
 * so there's no way to know which state they meant - falls back to
 * whichever active state sorts first (see app/page.tsx's root redirect for
 * the same fallback).
 */
export default async function LegacyCategoryRedirect({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const states = await listActiveStates();
  if (states.length === 0) notFound();
  const state = states[0];

  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const page = searchParams.page ? `?page=${searchParams.page}` : "";
  permanentRedirect(`/${state.slug}/${category.slug}${page}`);
}
