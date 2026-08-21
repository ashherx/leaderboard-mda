import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/db/site-visits";

const COOKIE_NAME = "vid";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  const existing = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  const sessionId = existing || randomUUID();
  await recordVisit(sessionId);

  const response = NextResponse.json({ ok: true });
  if (!existing) {
    response.cookies.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_SECONDS,
    });
  }
  return response;
}
