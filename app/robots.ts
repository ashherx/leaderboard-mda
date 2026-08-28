import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const NON_CONTENT_PATHS = ["/manage/", "/api/", "/r/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot"],
        allow: "/",
        disallow: NON_CONTENT_PATHS,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: NON_CONTENT_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
