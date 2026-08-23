/**
 * The synthetic "All" tab - not a row in the categories table, just a
 * reserved slug the browse UI and its API route special-case to mean
 * "every active category's published listings, merged into one feed."
 * Kept in its own tiny module (no Supabase import) so both server code and
 * client components (CategoryTabs/LeaderboardBrowser) can import the
 * constant without pulling in server-only dependencies.
 *
 * Each listing keeps its own real per-category rank in this merged view -
 * there's still no such thing as a cross-category rank (see
 * components/CategoryTabs.tsx's comment on why bids never get compared
 * across categories), "All" just interleaves everyone's own category
 * ranking into one scrollable list, sorted the same way each category's
 * board already sorts.
 */
export const ALL_CATEGORIES_SLUG = "all";
export const ALL_CATEGORIES_NAME = "All";
