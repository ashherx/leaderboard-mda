import { countRecentVisitors, countTotalVisitors } from "@/lib/db/site-visits";
import { countOnlineVisitorsFromVercel } from "@/lib/vercel/analytics";

// Prefer Vercel's Web Analytics API for "online now"; fall back to our own
// site_visits table if the Vercel call fails (missing env vars, API error,
// rate limit) so the pill never breaks the page over a vanity metric.
async function getOnlineCount(): Promise<number> {
  try {
    return await countOnlineVisitorsFromVercel();
  } catch (error) {
    console.error("Vercel Analytics online count failed, falling back to site_visits:", error);
    return countRecentVisitors();
  }
}

export async function StatsPill() {
  const [online, total] = await Promise.all([getOnlineCount(), countTotalVisitors()]);

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
