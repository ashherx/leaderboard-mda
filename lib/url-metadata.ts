import { lookup } from "dns/promises";
import { isIP } from "net";
import { uploadFaviconBuffer } from "@/lib/storage";

/**
 * Fetches a provider-supplied URL server-side to prefill the submission form
 * (title → name, meta description → pitch, favicon → logo). Any endpoint
 * that fetches an arbitrary user-supplied URL from the server is an SSRF
 * vector - a submitter could point it at an internal service, localhost, or
 * (on most cloud hosts) the instance metadata endpoint. Everything below
 * exists to close that off: only http(s), only public IPs (checked at every
 * redirect hop, not just the first), bounded redirects, bounded response
 * size, bounded time.
 */

const FETCH_TIMEOUT_MS = 7000;
const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 500_000;
const MAX_FAVICON_BYTES = 1_000_000;
const USER_AGENT = "Mozilla/5.0 (compatible; AgencyBidLeaderboardBot/1.0; +https://example.invalid)";

function isPrivateOrReservedIp(ip: string): boolean {
  const family = isIP(ip);

  if (family === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
  }

  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateOrReservedIp(mapped[1]);
    return false;
  }

  return true; // couldn't parse as an IP - refuse rather than guess
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed.");
  }
  if (url.hostname === "localhost") throw new Error("That host isn't reachable.");

  const { address } = await lookup(url.hostname);
  if (isPrivateOrReservedIp(address)) throw new Error("That host isn't reachable.");
}

/** Follows redirects manually so every hop gets the same public-IP check - `redirect: "follow"` would only validate the first URL. */
async function safeFetch(startUrl: string): Promise<Response> {
  let current = new URL(startUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);

    const res = await fetch(current.toString(), {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Redirect with no destination.");
      current = new URL(location, current);
      continue;
    }

    return res;
  }

  throw new Error("Too many redirects.");
}

async function readBodyCapped(res: Response, maxBytes: number): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) return Buffer.from(await res.arrayBuffer());

  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      chunks.push(Buffer.from(value));
      if (total >= maxBytes) {
        await reader.cancel();
        break;
      }
    }
  }
  return Buffer.concat(chunks);
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()).slice(0, 200) || null : null;
}

function extractMetaContent(html: string, nameOrProperty: string): string | null {
  const attr = "(?:name|property)";
  // Attribute order in a <meta> tag isn't fixed, so try content-before-name and name-before-content separately.
  const patterns = [
    new RegExp(`<meta[^>]*${attr}=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${nameOrProperty}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1].trim()).slice(0, 500) || null;
  }
  return null;
}

function extractFaviconHref(html: string): string | null {
  const linkTags = html.match(/<link\s[^>]*>/gi) ?? [];
  // Prefer apple-touch-icon (usually a larger, cleaner image) over a plain favicon.
  const byRel = (rel: RegExp) =>
    linkTags.find((tag) => rel.test(tag))?.match(/href=["']([^"']*)["']/i)?.[1] ?? null;

  return byRel(/rel=["']apple-touch-icon["']/i) ?? byRel(/rel=["'](?:shortcut )?icon["']/i);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

async function downloadAndStoreFavicon(faviconUrl: string): Promise<string | null> {
  try {
    const res = await safeFetch(faviconUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!contentType.startsWith("image/")) return null;

    const buffer = await readBodyCapped(res, MAX_FAVICON_BYTES);
    if (buffer.byteLength === 0) return null;

    const result = await uploadFaviconBuffer(buffer, contentType);
    return result.ok ? result.url : null;
  } catch {
    return null; // favicon is a nice-to-have - never let it fail the whole prefill
  }
}

export interface UrlMetadata {
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
}

export async function fetchUrlMetadata(rawUrl: string): Promise<UrlMetadata> {
  const res = await safeFetch(rawUrl);
  if (!res.ok) return { title: null, description: null, faviconUrl: null };

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return { title: null, description: null, faviconUrl: null };

  const bodyBuffer = await readBodyCapped(res, MAX_HTML_BYTES);
  const html = bodyBuffer.toString("utf8");
  const finalUrl = new URL(res.url || rawUrl);

  const title = extractTitle(html);
  const description = extractMetaContent(html, "description") ?? extractMetaContent(html, "og:description");
  const faviconHref = extractFaviconHref(html);

  let faviconUrl: string | null = null;
  if (faviconHref) {
    try {
      faviconUrl = await downloadAndStoreFavicon(new URL(faviconHref, finalUrl).toString());
    } catch {
      /* malformed href - fall through to the /favicon.ico guess below */
    }
  }
  if (!faviconUrl) {
    faviconUrl = await downloadAndStoreFavicon(new URL("/favicon.ico", finalUrl).toString());
  }

  return { title, description, faviconUrl };
}
