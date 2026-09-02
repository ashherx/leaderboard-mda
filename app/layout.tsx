import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {
  OG_IMAGE,
  OPEN_GRAPH_SITE_DEFAULTS,
  SITE_NAME,
  SOCIAL_DESCRIPTION,
  SOCIAL_IMAGE_ALT,
  SOCIAL_TITLE,
} from "@/lib/site";
import { absoluteUrl, serializeJsonLd, SITE_URL } from "@/lib/seo";
import { LeaderboardNavigationProvider } from "@/components/LeaderboardNavigation";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const TITLE = "The Podium | Sponsored Service Provider Leaderboards";
const DESCRIPTION =
  "Browse sponsored service provider leaderboards by category, or claim a position for your business. Rankings reflect paid bids, not reviews or endorsements.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | The Podium",
  },
  description: DESCRIPTION,
  openGraph: {
    ...OPEN_GRAPH_SITE_DEFAULTS,
    url: SITE_URL,
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [{ ...OG_IMAGE, alt: SOCIAL_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [{ ...OG_IMAGE, alt: SOCIAL_IMAGE_ALT }],
  },
};

export const viewport: Viewport = {
  themeColor: "#e3a23c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#website`,
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: "Million Dollar Agency",
      url: "https://milliondollar.agency/",
    },
  };

  return (
    <html lang="en">
      <head>
        <link rel="describedby" href="/llms.txt" />
      </head>
      <body className={`${bricolage.variable} ${inter.variable} ${plexMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
        <LeaderboardNavigationProvider>{children}</LeaderboardNavigationProvider>
        <Analytics />
      </body>
    </html>
  );
}
