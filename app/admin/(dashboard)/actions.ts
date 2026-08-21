"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { createCategory, setListingVerified, unpublishListing, updateCategory } from "@/lib/db/admin";

/** Every action re-checks the session itself — defense in depth beyond the layout's redirect, since Server Actions can be invoked directly. */
function requireAdmin() {
  if (!hasValidAdminSession()) redirect("/admin/login");
}

export async function unpublishListingAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id"));
  await unpublishListing(id);
  revalidatePath("/admin/listings");
}

export async function setVerifiedAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id"));
  const verified = formData.get("verified") === "true";
  await setListingVerified(id, verified);
  revalidatePath("/admin/listings");
}

export async function createCategoryAction(formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const minBidDollars = Number(formData.get("minBidDollars"));
  if (!name || !Number.isFinite(minBidDollars) || minBidDollars <= 0) return;

  await createCategory(name, Math.round(minBidDollars) * 100);
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const minBidDollars = Number(formData.get("minBidDollars"));
  const displayOrder = Number(formData.get("displayOrder"));

  await updateCategory(id, {
    name: name || undefined,
    minBidCents: Number.isFinite(minBidDollars) && minBidDollars > 0 ? Math.round(minBidDollars) * 100 : undefined,
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : undefined,
    // Only the toggle button includes this field (see categories/page.tsx) —
    // the plain "Save" button doesn't, so saving details never silently
    // flips a category's visibility.
    isActive: formData.has("isActive") ? formData.get("isActive") === "true" : undefined,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/"); // category visibility affects the public homepage too
}
