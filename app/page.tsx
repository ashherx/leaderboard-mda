import { notFound, redirect } from "next/navigation";
import { getDefaultActiveState } from "@/lib/db/locations";

// The real leaderboard now lives at /[state] (see app/[state]/page.tsx) -
// browsing is state-first, category is still a ?category= query param
// within it. Bare "/" redirects to whichever active state sorts first
// (see getDefaultActiveState), preserving any query string (?category=,
// ?page=) so already-shared/indexed "/?category=..." links keep working.
export const dynamic = "force-dynamic";

export default async function RootPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const state = await getDefaultActiveState();
  if (!state) notFound(); // no state active yet - nothing to redirect into

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined) query.set(key, value);
  }
  const qs = query.toString();

  redirect(`/${state.slug}${qs ? `?${qs}` : ""}`);
}
