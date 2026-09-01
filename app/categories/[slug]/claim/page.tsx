import { notFound, permanentRedirect } from "next/navigation";
import { listActiveStates } from "@/lib/db/locations";

// The claim flow moved to /claim?state=...&category=... (see
// app/claim/page.tsx). This shell keeps already-shared/indexed
// /categories/[slug]/claim links (and their ?amount=/&link= query params)
// working. These predate states entirely, so there's no way to know which
// state they meant - falls back to whichever active state sorts first (see
// app/page.tsx's root redirect for the same fallback).
export default async function LegacyClaimPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { amount?: string; link?: string };
}) {
  const states = await listActiveStates();
  if (states.length === 0) notFound();

  const query = new URLSearchParams({ state: states[0].slug, category: params.slug });
  if (searchParams.amount) query.set("amount", searchParams.amount);
  if (searchParams.link) query.set("link", searchParams.link);
  permanentRedirect(`/claim?${query.toString()}`);
}
