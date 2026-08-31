/**
 * The sole public origin for indexable pages. This plain ESM module is
 * shared by Next's build-time config and application metadata code so host
 * redirects, canonicals, robots, sitemaps, and AI discovery cannot drift.
 */
export const PRODUCTION_SITE_URL = "https://podium.milliondollar.agency";
export const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * @param {Record<string, string | undefined>} env
 */
export function resolveSiteUrl(env = process.env) {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProduction = env.NODE_ENV === "production" || env.VERCEL_ENV === "production";

  if (!configured) {
    if (isProduction) {
      throw new Error("NEXT_PUBLIC_SITE_URL must be set for production metadata.");
    }
    return LOCAL_SITE_URL;
  }

  const parsed = new URL(configured);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }
  if (parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an origin without credentials, a path, query, or fragment.");
  }
  if (isProduction && parsed.origin !== PRODUCTION_SITE_URL) {
    throw new Error(`Production metadata must use ${PRODUCTION_SITE_URL}.`);
  }

  return parsed.origin;
}
