import { countRecentVisitors, countTotalVisitors } from "@/lib/db/site-visits";

export async function StatsPill() {
  const [online, total] = await Promise.all([countRecentVisitors(), countTotalVisitors()]);

  return (
    <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-sm text-slate">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green" />
        <span className="font-medium text-ink">{online}</span> online
      </span>
      <span className="text-border">·</span>
      <span>
        <span className="font-medium text-ink">{total.toLocaleString()}</span> visitors since launch
      </span>
    </div>
  );
}
