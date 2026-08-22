import { redirect, notFound } from "next/navigation";
import { listActiveCategories } from "@/lib/db/categories";

// No separate homepage grid - the category page (with the pill nav to
// switch between categories) is the canonical page type. "/" just picks a
// default: the first category by display_order.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await listActiveCategories();
  if (categories.length === 0) notFound();

  redirect(`/categories/${categories[0].slug}`);
}
