import { headers } from "next/headers";

/**
 * Request origin, server-only (Route Handlers/Server Components - never
 * import this from a client component, next/headers can't bundle there).
 * Lemon Squeezy needs a post-purchase redirect URL set at checkout-creation
 * time, unlike Paddle's client-side `settings.successUrl` - this builds that
 * absolute URL the same way app/success/page.tsx builds its manage-link.
 */
export function getRequestOrigin(): string {
  const host = headers().get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
