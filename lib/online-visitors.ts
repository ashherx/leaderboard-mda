import { countRecentVisitors } from "@/lib/db/site-visits";
import { countOnlineVisitorsFromVercel } from "@/lib/vercel/analytics";

/**
 * Prefer Vercel's Web Analytics API for "online now"; fall back to our own
 * site_visits table if the Vercel call fails (missing env vars, API error,
 * rate limit) so this never breaks the page over a vanity metric.
 *
 * Shared by the initial server render (StatsPill) and the polling API
 * route (/api/online-visitors) so both agree on the same logic.
 */
export async function getOnlineVisitorCount(): Promise<number> {
  try {
    return await countOnlineVisitorsFromVercel();
  } catch (error) {
    console.error("Vercel Analytics online count failed, falling back to site_visits:", error);
    return countRecentVisitors();
  }
}
