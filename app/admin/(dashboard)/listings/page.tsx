import { listAllListingsForAdmin, listAllCategoriesForAdmin } from "@/lib/db/admin";
import { formatCentsAsDollars } from "@/lib/format";
import { setVerifiedAction, unpublishListingAction, updateListingDetailsAction } from "../actions";
import { ManageLinkButton } from "@/components/admin/ManageLinkButton";
import type { Listing } from "@/lib/db/types";

export const dynamic = "force-dynamic";

// Fixed column widths (via <colgroup>) keep every row the same shape -
// otherwise a `<select>`'s width tracks its own option text, so "Category"
// (and everything after it) drifts row to row. table-fixed + explicit
// widths make the grid rigid instead; the outer wrapper still scrolls
// horizontally on narrow screens rather than squeezing everything down.
const COLUMN_WIDTHS = ["14rem", "11rem", "6rem", "4.5rem", "7rem", "6.5rem", "6.5rem", "13rem", "8rem"];

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string };
}) {
  const categories = await listAllCategoriesForAdmin();
  const listings = await listAllListingsForAdmin({
    categoryId: searchParams.category || undefined,
    status: (searchParams.status as Listing["status"]) || undefined,
  });

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Listings</h1>

      <form method="get" className="mt-4 flex flex-wrap gap-3 text-sm">
        <select
          name="category"
          defaultValue={searchParams.category ?? ""}
          className="rounded-md border border-border px-2 py-1 text-ink outline-none focus:border-gold"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-md border border-border px-2 py-1 text-ink outline-none focus:border-gold"
        >
          <option value="">All statuses</option>
          <option value="pending_payment">Pending payment</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-ink px-3 py-1 font-medium text-white transition-colors hover:bg-green"
        >
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            {COLUMN_WIDTHS.map((width, i) => (
              <col key={i} style={{ width }} />
            ))}
          </colgroup>
          <thead className="border-b border-border bg-canvas text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Category</th>
              <th className="whitespace-nowrap px-3 py-2">Bid / Rank</th>
              <th className="px-3 py-2">Clicks</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2">Manage link</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => {
              // Provider name + category are two separate cells for layout
              // purposes, but still one save action - each control points
              // at this row's form by id (the `form` attribute) instead of
              // being nested inside it, so the columns can line up cleanly.
              const formId = `listing-${listing.id}`;
              return (
                <tr key={listing.id} className="border-b border-border align-middle last:border-0">
                  <td className="px-3 py-2">
                    <form id={formId} action={updateListingDetailsAction} className="hidden" />
                    <input form={formId} type="hidden" name="id" value={listing.id} />
                    <input
                      form={formId}
                      name="providerName"
                      defaultValue={listing.provider_name}
                      maxLength={80}
                      className="w-full rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      form={formId}
                      name="categoryId"
                      defaultValue={listing.category_id}
                      className="w-full rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono">
                    {formatCentsAsDollars(listing.bid_amount_cents)}
                    {listing.rank !== null && ` · #${listing.rank}`}
                  </td>
                  <td className="px-3 py-2 font-mono">{listing.click_count}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-3 py-2 text-slate">{listing.latestPaymentStatus ?? "-"}</td>
                  <td className="px-3 py-2">
                    <form action={setVerifiedAction}>
                      <input type="hidden" name="id" value={listing.id} />
                      <input type="hidden" name="verified" value={String(!listing.is_verified)} />
                      <button
                        type="submit"
                        className={`whitespace-nowrap ${listing.is_verified ? "text-green underline" : "text-slate underline"}`}
                      >
                        {listing.is_verified ? "Verified" : "Not verified"}
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <ManageLinkButton listingId={listing.id} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-3 whitespace-nowrap">
                      <button
                        form={formId}
                        type="submit"
                        className="rounded-md bg-ink px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-green"
                      >
                        Save
                      </button>
                      {listing.status !== "unpublished" && (
                        <form action={unpublishListingAction}>
                          <input type="hidden" name="id" value={listing.id} />
                          <button type="submit" className="text-xs text-brick underline">
                            Unpublish
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {listings.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate">
                  No listings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Listing["status"] }) {
  const styles: Record<Listing["status"], string> = {
    published: "bg-green/8 text-green",
    pending_payment: "bg-gold/12 text-gold",
    unpublished: "bg-slate/12 text-slate",
  };
  return (
    <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
