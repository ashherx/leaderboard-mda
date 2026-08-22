import { NextResponse } from "next/server";
import { countRecentVisitors } from "@/lib/db/site-visits";

// Polled client-side every 5s by StatsPill to keep the "online now" count live.
// Reads live DB state on every request - must not be statically prerendered.
export const dynamic = "force-dynamic";

export async function GET() {
  const online = await countRecentVisitors();
  return NextResponse.json({ online });
}
