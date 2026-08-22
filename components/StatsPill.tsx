import { countTotalVisitors } from "@/lib/db/site-visits";
import { getOnlineVisitorCount } from "@/lib/online-visitors";
import { OnlineBadge } from "@/components/OnlineBadge";

export async function StatsPill() {
  const [online, total] = await Promise.all([getOnlineVisitorCount(), countTotalVisitors()]);

  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm text-slate">
      <OnlineBadge initialOnline={online} />
      <span className="text-border">·</span>
      <span>
        <span className="font-medium text-ink">{total.toLocaleString()}</span> visitors since launch
      </span>
    </div>
  );
}
