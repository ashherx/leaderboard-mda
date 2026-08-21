import { formatCentsAsDollars, formatTimeSince } from "@/lib/format";
import type { Payment, PaymentStatus } from "@/lib/db/types";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  completed: "bg-green/10 text-green",
  pending: "bg-gold/15 text-ink",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-slate/15 text-slate",
};

/** Every payment attempt against this listing — initial claim plus every re-bid, successful or not. An audit trail, not just the current bid. */
export function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-white p-5">
      <h2 className="font-display font-semibold text-ink">Payment history</h2>
      <ul className="mt-3 flex flex-col divide-y divide-border">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div>
              <p className="font-mono font-medium text-ink">{formatCentsAsDollars(payment.amount_cents)}</p>
              <p className="text-xs text-slate">{formatTimeSince(payment.completed_at ?? payment.created_at)}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[payment.status]}`}
            >
              {payment.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
