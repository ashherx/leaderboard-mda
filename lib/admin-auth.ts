import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSigningSecret(): string {
  // A dedicated secret is preferred, but fall back to deriving one from the
  // admin password so a single env var is enough to get started - either
  // way this never becomes part of the cookie itself, only its signature.
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("Set ADMIN_PASSWORD (and ideally ADMIN_SESSION_SECRET) in .env.local to use the admin area.");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

export function createAdminSessionCookieValue(): string {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `admin:${expiresAt}`;
  return `${expiresAt}.${sign(payload)}`;
}

export function isValidAdminSessionCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  const [expiresAtStr, signature] = value.split(".");
  if (!expiresAtStr || !signature) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = sign(`admin:${expiresAt}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkAdminPassword(candidate: string): boolean {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_TTL_SECONDS;

/** Server-only check for use in Server Components/Actions - does not redirect, just reports true/false. */
export function hasValidAdminSession(): boolean {
  return isValidAdminSessionCookieValue(cookies().get(ADMIN_SESSION_COOKIE)?.value);
}
