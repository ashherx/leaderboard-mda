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
      <h1 className="font-display text-xl font-bold text-ink">Overview</h1>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Revenue (completed)" value={formatCentsAsDollars(revenueCents)} />
        <Stat label="Published listings" value={String(published)} />
        <Stat label="Pending payment" value={String(pending)} />
        <Stat label="Categories" value={String(categories.length)} />
      </div>
      <p className="mt-6 text-sm text-slate">
        Revenue is summed from `payments` where status = completed — should match whatever your payment provider
        reports once that's wired up.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xs text-slate">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-ink">{value}</p>
    </div>
  );
}
