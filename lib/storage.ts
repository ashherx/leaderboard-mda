import { randomUUID } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "listing-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
// Favicons commonly arrive as .ico (two different MIME types in the wild) alongside the standard web image types.
const ALLOWED_FAVICON_TYPES = new Set([
  ...Array.from(ALLOWED_LOGO_TYPES),
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

async function uploadToBucket(
  body: File | Buffer,
  contentType: string,
  extension: string
): Promise<UploadResult> {
  const supabase = getSupabaseServerClient();
  const path = `${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType,
    upsert: false,
  });

  if (error) return { ok: false, error: "Upload failed — try again." };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export async function uploadListingLogo(file: File): Promise<UploadResult> {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    return { ok: false, error: "Logo must be a PNG, JPEG, WebP, or SVG image." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: "Logo must be under 2MB." };
  }

  const extension = EXTENSION_BY_TYPE[file.type] ?? file.name.split(".").pop() ?? "png";
  return uploadToBucket(file, file.type, extension);
}

/** Same bucket, used by the URL-metadata prefill (lib/url-metadata.ts) to persist a fetched favicon rather than hotlinking the source site forever. */
export async function uploadFaviconBuffer(buffer: Buffer, contentType: string): Promise<UploadResult> {
  if (!ALLOWED_FAVICON_TYPES.has(contentType)) {
    return { ok: false, error: "Unsupported favicon type." };
  }
  if (buffer.byteLength > MAX_LOGO_BYTES) {
    return { ok: false, error: "Favicon too large." };
  }

  const extension = EXTENSION_BY_TYPE[contentType] ?? "png";
  return uploadToBucket(buffer, contentType, extension);
}

/**
 * The submission form can pass a `logoUrl` string field (the favicon
 * auto-fetch already uploaded it, so there's nothing left to upload) instead
 * of a file. Since that field arrives as ordinary client-controlled form
 * data, verify it actually points at our own bucket before trusting it as a
 * listing's logo — otherwise anyone could POST directly to the API with an
 * arbitrary external image URL and skip every type/size check above.
 */
export function isOwnStorageUrl(url: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) return false;
  return url.startsWith(`${supabaseUrl}/storage/v1/object/public/${BUCKET}/`);
}
