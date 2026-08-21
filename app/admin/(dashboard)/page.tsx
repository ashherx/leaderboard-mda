import { sumCompletedPaymentsCents } from "@/lib/db/payments";
import { listAllListingsForAdmin, listAllCategoriesForAdmin } from "@/lib/db/admin";
import { formatCentsAsDollars } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [revenueCents, listings, categories] = await Promise.all([
    sumCompletedPaymentsCents(),
    listAllListingsForAdmin(),
    listAllCategoriesForAdmin(),
  ]);

  const published = listings.filter((l) => l.status === "published").length;
  const pending = listings.filter((l) => l.status === "pending_payment").length;

  return (
    <div>
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Revenue (completed)" value={formatCentsAsDollars(revenueCents)} />
        <Stat label="Published listings" value={String(published)} />
        <Stat label="Pending payment" value={String(pending)} />
        <Stat label="Categories" value={String(categories.length)} />
      </div>
      <p className="mt-6 text-sm text-gray-500">
        Revenue is summed from `payments` where status = completed — should match whatever your payment provider
        reports once that's wired up.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
