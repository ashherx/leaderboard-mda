import { randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * The "manage my listing" link is the only auth in this system, so it has to
 * be unguessable and safe even if the database leaks. We generate a random
 * token, hand the raw value to the provider exactly once (in the URL /
 * email), and store only its SHA-256 hash (`listings.manage_token_hash`).
 * Looking a token up means hashing the incoming value and matching the hash
 * — the raw token is never persisted anywhere.
 */

const TOKEN_BYTES = 32; // 256 bits, URL-safe base64 encoded

export function generateManageToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashManageToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/** Constant-time comparison, to avoid leaking hash contents via timing. */
export function manageTokenHashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
