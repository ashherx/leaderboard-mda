import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/admin-auth";
import { getCurrentManageToken, regenerateManageToken } from "@/lib/db/admin";

function buildManageUrl(request: Request, rawToken: string): string {
  const host = request.headers.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}/manage/${rawToken}`;
}

/** Decrypts the listing's current live manage-token, if a decryptable copy exists — no mutation, nothing invalidated. */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!hasValidAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawToken = await getCurrentManageToken(params.id);
  if (!rawToken) {
    return NextResponse.json(
      { error: "No decryptable link on file for this listing — it predates this feature. Generate a new one instead." },
      { status: 404 }
    );
  }

  return NextResponse.json({ manageUrl: buildManageUrl(request, rawToken) });
}

/**
 * Mints a fresh manage-link for a listing, admin-only. A POST (not a plain
 * Server Action) on purpose: the raw token needs to come back to the admin's
 * screen exactly once to copy/send, and a client-side fetch is the
 * straightforward way to do that without putting a secret in a URL query
 * param or server log.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!hasValidAdminSession()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawToken = await regenerateManageToken(params.id);
  return NextResponse.json({ manageUrl: buildManageUrl(request, rawToken) });
}
