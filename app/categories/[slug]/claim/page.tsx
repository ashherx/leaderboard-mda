import { redirect } from "next/navigation";

// The claim flow moved to /claim?category=... (see app/claim/page.tsx).
// This shell keeps already-shared/indexed /categories/[slug]/claim links
// (and their ?amount=/&link= query params) working.
export default function LegacyClaimPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { amount?: string; link?: string };
}) {
  const query = new URLSearchParams({ category: params.slug });
  if (searchParams.amount) query.set("amount", searchParams.amount);
  if (searchParams.link) query.set("link", searchParams.link);
  redirect(`/claim?${query.toString()}`);
}
