import { NextResponse } from "next/server";
import { createReport } from "@/lib/db/reports";
import { getListingById } from "@/lib/db/listings";

export async function POST(request: Request) {
  const body = await request.json();
  const listingId = String(body.listingId ?? "");
  const reason = String(body.reason ?? "");
  const details = typeof body.details === "string" ? body.details : undefined;

  const listing = await getListingById(listingId);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Listing not found." }, { status: 404 });
  }

  try {
    await createReport(listingId, reason, details);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid report." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
