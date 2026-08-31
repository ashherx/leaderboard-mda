"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";
import {
  createCategory,
  createLocation,
  setListingVerified,
  unpublishListing,
  updateCategory,
  updateListingDetails,
  updateLocation,
} from "@/lib/db/admin";
import type { Location } from "@/lib/db/types";

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
  const locationId = String(formData.get("locationId") ?? "");
  if (!id || !providerName || providerName.length > 80 || !categoryId || !locationId) return;

  await updateListingDetails(id, { providerName, categoryId, locationId });
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

const LOCATION_KINDS: Location["kind"][] = ["country", "state", "city"];

export async function createLocationAction(formData: FormData) {
  requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as Location["kind"];
  const parentIdRaw = String(formData.get("parentId") ?? "");
  if (!name || !LOCATION_KINDS.includes(kind)) return;
  // Only a country can have no parent - see migration 0016's kind/parent check.
  if (kind !== "country" && !parentIdRaw) return;

  const displayOrderRaw = formData.get("displayOrder");
  const displayOrder = displayOrderRaw ? Number(displayOrderRaw) : undefined;

  await createLocation({
    parentId: kind === "country" ? null : parentIdRaw,
    kind,
    name,
    displayOrder: displayOrder !== undefined && Number.isFinite(displayOrder) ? displayOrder : undefined,
  });
  revalidatePath("/admin/locations");
  revalidatePath("/"); // new/active locations affect the public state switcher too
}

export async function updateLocationAction(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const displayOrder = Number(formData.get("displayOrder"));

  await updateLocation(id, {
    name: name || undefined,
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : undefined,
    // Only the toggle button includes this field (see locations/page.tsx) -
    // the plain "Save" button doesn't, so saving details never silently
    // flips a location's visibility. This is the on/off switch the whole
    // state-by-state rollout leans on (see migration 0016).
    isActive: formData.has("isActive") ? formData.get("isActive") === "true" : undefined,
  });
  revalidatePath("/admin/locations");
  revalidatePath("/"); // location visibility affects the public state switcher/routes too
}
