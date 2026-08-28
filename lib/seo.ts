import type { Metadata } from "next";
import { OG_IMAGE, OPEN_GRAPH_SITE_DEFAULTS, SITE_NAME } from "@/lib/site";
import { resolveSiteUrl } from "@/site.config.mjs";

export const SITE_URL = resolveSiteUrl();

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      ...OPEN_GRAPH_SITE_DEFAULTS,
      url,
      title,
      description,
      images: [{ ...OG_IMAGE, alt: `${SITE_NAME} sponsored service provider leaderboards` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ ...OG_IMAGE, alt: `${SITE_NAME} sponsored service provider leaderboards` }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
