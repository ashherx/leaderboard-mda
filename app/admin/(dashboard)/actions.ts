"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import {
  createCategory,
  createState,
  setListingVerified,
  unpublishListing,
  updateCategory,
  updateListingDetails,
  updateState,
} from "@/lib/db/admin";

/** Every action re-checks the session itself - defense in depth beyond the layout's redirect, since Server Actions can be invoked directly. */
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

export async function updateListingDetailsAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id"));
  const providerName = String(formData.get("providerName") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const stateId = String(formData.get("stateId") ?? "");
  if (!id || !providerName || providerName.length > 80 || !categoryId || !stateId) return;

  await updateListingDetails(id, { providerName, categoryId, stateId });
  revalidatePath("/admin/listings");
}

export async function createCategoryAction(formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const minBidDollars = Number(formData.get("minBidDollars"));
  if (!name || !Number.isFinite(minBidDollars) || minBidDollars <= 0) return;

  const displayOrderRaw = formData.get("displayOrder");
  const displayOrder = displayOrderRaw ? Number(displayOrderRaw) : undefined;

  await createCategory(
    name,
    Math.round(minBidDollars) * 100,
    displayOrder !== undefined && Number.isFinite(displayOrder) ? displayOrder : undefined
  );
  revalidatePath("/admin/categories");
  revalidatePath("/"); // display order affects the public category tabs too
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
    // Only the toggle button includes this field (see categories/page.tsx) -
    // the plain "Save" button doesn't, so saving details never silently
    // flips a category's visibility.
    isActive: formData.has("isActive") ? formData.get("isActive") === "true" : undefined,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/"); // category visibility affects the public homepage too
}

export async function createStateAction(formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const displayOrderRaw = formData.get("displayOrder");
  const displayOrder = displayOrderRaw ? Number(displayOrderRaw) : undefined;

  await createState(name, displayOrder !== undefined && Number.isFinite(displayOrder) ? displayOrder : undefined);
  revalidatePath("/admin/locations");
  revalidatePath("/"); // active states affect the root redirect too
}

export async function updateStateAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const displayOrder = Number(formData.get("displayOrder"));

  await updateState(id, {
    name: name || undefined,
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : undefined,
    // Only the toggle button includes this field (see locations/page.tsx) -
    // the plain "Save" button doesn't, so saving details never silently
    // flips a state's visibility.
    isActive: formData.has("isActive") ? formData.get("isActive") === "true" : undefined,
  });
  revalidatePath("/admin/locations");
  revalidatePath("/"); // state visibility affects the root redirect too
}
