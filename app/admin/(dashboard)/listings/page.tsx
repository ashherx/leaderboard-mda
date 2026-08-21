import { listAllListingsForAdmin, listAllCategoriesForAdmin } from "@/lib/db/admin";
import { formatCentsAsDollars } from "@/lib/format";
import { setVerifiedAction, unpublishListingAction } from "../actions";
import type { Listing } from "@/lib/db/types";

export const dynamic = "force-dynamic";

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
      <h1 className="text-xl font-semibold">Listings</h1>

      <form method="get" className="mt-4 flex flex-wrap gap-3 text-sm">
        <select name="category" defaultValue={searchParams.category ?? ""} className="rounded border border-gray-300 px-2 py-1">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={searchParams.status ?? ""} className="rounded border border-gray-300 px-2 py-1">
          <option value="">All statuses</option>
          <option value="pending_payment">Pending payment</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <button type="submit" className="rounded bg-gray-900 px-3 py-1 text-white">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Provider</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Bid / Rank</th>
              <th className="px-3 py-2">Clicks</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 font-medium">{listing.provider_name}</td>
                <td className="px-3 py-2">{listing.categoryName}</td>
                <td className="px-3 py-2 font-mono">
                  {formatCentsAsDollars(listing.bid_amount_cents)}
                  {listing.rank !== null && ` · #${listing.rank}`}
                </td>
                <td className="px-3 py-2 font-mono">{listing.click_count}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={listing.status} />
                </td>
                <td className="px-3 py-2 text-gray-600">{listing.latestPaymentStatus ?? "—"}</td>
                <td className="px-3 py-2">
                  <form action={setVerifiedAction}>
                    <input type="hidden" name="id" value={listing.id} />
                    <input type="hidden" name="verified" value={String(!listing.is_verified)} />
                    <button
                      type="submit"
                      className={listing.is_verified ? "text-green-700 underline" : "text-gray-400 underline"}
                    >
                      {listing.is_verified ? "Verified" : "Not verified"}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  {listing.status !== "unpublished" && (
                    <form action={unpublishListingAction}>
                      <input type="hidden" name="id" value={listing.id} />
                      <button type="submit" className="text-red-600 underline">
                        Unpublish
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-400">
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
    published: "bg-green-100 text-green-800",
    pending_payment: "bg-yellow-100 text-yellow-800",
    unpublished: "bg-gray-200 text-gray-600",
  };
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{status.replace("_", " ")}</span>;
}
