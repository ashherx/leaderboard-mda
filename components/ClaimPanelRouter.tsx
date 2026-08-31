"use client";

import { useRouter } from "next/navigation";
import { ClaimPanel } from "@/components/ClaimPanel";
import type { Category, CategoryPricing } from "@/lib/db/types";

export function ClaimPanelRouter({
  categories,
  selectedSlug,
  pricing,
}: {
  categories: Category[];
  selectedSlug: string;
  pricing: CategoryPricing;
}) {
  const router = useRouter();

  const selectedCategoryName = categories.find((category) => category.slug === selectedSlug)?.name ?? "";

  return (
    <ClaimPanel
      selectedSlug={selectedSlug}
      selectedCategoryName={selectedCategoryName}
      pricing={pricing}
      categories={categories.map(({ slug, name }) => ({ slug, name }))}
      onSelectCategory={(slug) => router.push(`/categories/${slug}`)}
    />
  );
}
