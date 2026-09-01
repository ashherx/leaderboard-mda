"use client";

import { useRouter } from "next/navigation";
import { CategoryDropdown } from "@/components/CategoryDropdown";

/**
 * Header-level state switcher - only rendered by SiteHeader when 2+ states
 * are active (see its comment). Preserves the current category across the
 * switch when there is one (categories are global, not per-state), so
 * switching state from a category page lands on the same category in the
 * new state rather than dropping back to its "All" board.
 */
export function StateSwitcher({
  states,
  currentSlug,
  currentCategorySlug,
}: {
  states: { slug: string; name: string }[];
  currentSlug?: string;
  currentCategorySlug?: string;
}) {
  const router = useRouter();

  return (
    <CategoryDropdown
      categories={states}
      selectedSlug={currentSlug}
      onSelect={(slug) => router.push(currentCategorySlug ? `/${slug}/${currentCategorySlug}` : `/${slug}`)}
      placeholder="Choose a state"
      className="w-32"
      buttonClassName="px-3 py-1.5 text-sm"
    />
  );
}
