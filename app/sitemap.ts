import type { MetadataRoute } from "next";
import { listActiveCategories } from "@/lib/db/categories";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await listActiveCategories();

  return [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 },
    ...categories.map((category) => ({
      url: absoluteUrl(`/categories/${category.slug}`),
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/rules"), changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.1 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.1 },
    { url: absoluteUrl("/refunds"), changeFrequency: "yearly", priority: 0.1 },
  ];
}
