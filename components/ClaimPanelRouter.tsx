"use client";

import { useRouter } from "next/navigation";
import { ClaimPanel } from "@/components/ClaimPanel";
import type { Category, CategoryPricing } from "@/lib/db/types";

export function ClaimPanelRouter({
  categories,
  stateSlug,
  stateName,
  selectedSlug,
  pricing,
}: {
  categories: Category[];
  stateSlug: string;
  stateName: string;
  selectedSlug: string;
  pricing: CategoryPricing;
}) {
  const router = useRouter();

  const selectedCategoryName = categories.find((category) => category.slug === selectedSlug)?.name ?? "";

  return (
    <ClaimPanel
      selectedSlug={selectedSlug}
      stateSlug={stateSlug}
      stateName={stateName}
      selectedCategoryName={selectedCategoryName}
      pricing={pricing}
      categories={categories.map(({ slug, name }) => ({ slug, name }))}
      onSelectCategory={(slug) => router.push(`/${stateSlug}/${slug}`)}
    />
  );
}
