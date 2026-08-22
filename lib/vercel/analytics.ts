const ONLINE_WINDOW_MINUTES = 5;

/**
 * "Online now" sourced from Vercel's Web Analytics API instead of our own
 * site_visits table. This is an approximation, not true presence — Vercel
 * aggregates pageview data rather than pushing it in real time, so this
 * counts distinct visitors seen in the last few minutes (production
 * traffic only; preview/dev deployments aren't tracked).
 *
 * Cached for 30s via Next's fetch cache so a burst of page loads doesn't
 * hammer Vercel's API or its rate limit.
 */
export async function countOnlineVisitorsFromVercel(): Promise<number> {
  const token = process.env.VERCEL_ACCESS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    throw new Error("Missing VERCEL_ACCESS_TOKEN or VERCEL_PROJECT_ID.");
  }

  const since = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000).toISOString();
  const until = new Date().toISOString();
  // The API 400s with "missing required property `until`" if only `since`
  // is sent, despite both being documented as independently optional.
  const params = new URLSearchParams({ projectId, since, until });
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) params.set("teamId", teamId);

  const response = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/count?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Vercel Analytics API error ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as { data: { visitors: number; pageviews: number } };
  return body.data.visitors;
}
