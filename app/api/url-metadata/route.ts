import { NextResponse } from "next/server";
import { fetchUrlMetadata } from "@/lib/url-metadata";

/** Best-effort prefill for the submission form — title/description/favicon from a provider-supplied URL. Never throws to the caller; failures just mean an empty prefill, not a broken form. */
export async function GET(request: Request) {
  const rawUrl = new URL(request.url).searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  try {
    const metadata = await fetchUrlMetadata(parsed.toString());
    return NextResponse.json(metadata);
  } catch {
    // Blocked host, timeout, unreachable, etc. — degrade to an empty prefill rather than surfacing an error to the submitter.
    return NextResponse.json({ title: null, description: null, faviconUrl: null });
  }
}
