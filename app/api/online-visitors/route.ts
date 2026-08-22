import { NextResponse } from "next/server";
import { getOnlineVisitorCount } from "@/lib/online-visitors";

// Polled client-side every 5s by StatsPill to keep the "online now" count
// live. The Vercel Analytics call this wraps is itself cached for 30s, so
// this endpoint is cheap to hit at that frequency.
export async function GET() {
  const online = await getOnlineVisitorCount();
  return NextResponse.json({ online });
}
