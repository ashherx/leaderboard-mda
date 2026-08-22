import { randomBytes, createHash, createCipheriv, createDecipheriv, timingSafeEqual } from "crypto";

/**
 * The "manage my listing" link is the only auth in this system, so it has to
 * be unguessable and safe even if the database leaks. We generate a random
 * token, hand the raw value to the provider exactly once (in the URL /
 * email), and store only its SHA-256 hash (`listings.manage_token_hash`).
 * Looking a token up means hashing the incoming value and matching the hash
 * - the raw token is never persisted anywhere in recoverable form... except
 * for one deliberate, explicitly-chosen exception: an admin "copy the
 * current live link" support feature also stores a *reversibly encrypted*
 * copy (`listings.manage_token_encrypted`, see encryptManageToken below). A
 * database leak alone still isn't enough to recover it - MANAGE_TOKEN_ENCRYPTION_KEY
 * lives in an env var, not the database - but this is a strictly weaker
 * guarantee than the hash, which can never be reversed by anyone under any
 * circumstances. Both are stored on every new/regenerated token.
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

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit, the recommended nonce size for GCM

function getEncryptionKey(): Buffer {
  const hex = process.env.MANAGE_TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error("Set MANAGE_TOKEN_ENCRYPTION_KEY in .env.local (32 random bytes, hex-encoded) to use this.");
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("MANAGE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

/** Reversible, unlike hashManageToken - see the file-level comment for why this exists and its tradeoff. Packs iv + authTag + ciphertext into one base64url string. */
export function encryptManageToken(rawToken: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(rawToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]).toString("base64url");
}

export function decryptManageToken(encrypted: string): string {
  const packed = Buffer.from(encrypted, "base64url");
  const iv = packed.subarray(0, IV_BYTES);
  const authTag = packed.subarray(IV_BYTES, IV_BYTES + 16);
  const ciphertext = packed.subarray(IV_BYTES + 16);

  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
