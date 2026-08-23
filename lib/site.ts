/** Shared site identity - used in payment disclaimers, the footer, and anywhere else a canonical name/contact is needed. */
export const SITE_NAME = "The Podium";
export const SUPPORT_EMAIL = "ashher@milliondollar.agency";

/**
 * Fields every page's `openGraph` object should carry, spread into each
 * route's own `generateMetadata` return (see app/page.tsx) - Next only
 * inherits a *whole* `openGraph`/`twitter` object from a parent layout when
 * a route doesn't define its own at all. app/page.tsx always defines its
 * own (title/description/images vary per category), which fully replaces
 * app/layout.tsx's openGraph rather than merging with it - so without
 * spreading this in, every actual category page would be missing
 * site_name/locale/type/url, even though the root layout "sets" them.
 */
export const OPEN_GRAPH_SITE_DEFAULTS = {
  type: "website" as const,
  siteName: SITE_NAME,
  locale: "en_US",
};

/**
 * The static share image used wherever there's no per-page dynamic one
 * (see app/layout.tsx and app/page.tsx's "All" tab) - kept in one place so
 * swapping the file means changing dimensions once, not hunting down every
 * `images: [...]` that references it. ~1.91:1, the standard OG/Twitter
 * large-image ratio (1200x630) - Facebook/LinkedIn/Discord render it at
 * full size instead of cropping or letterboxing.
 */
export const OG_IMAGE = { url: "/og_image_3.png", width: 2064, height: 1080 };
