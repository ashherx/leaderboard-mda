import { redirect } from "next/navigation";

// Browsing collapsed onto one URL (see app/page.tsx) - category is now a
// ?category= query param, not a route segment. This shell just keeps
// already-shared/indexed /categories/[slug] links working.
export default function LegacyCategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const query = new URLSearchParams({ category: params.slug });
  if (searchParams.page) query.set("page", searchParams.page);
  redirect(`/?${query.toString()}`);
}
