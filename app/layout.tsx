import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LemonSqueezyScript } from "@/components/LemonSqueezyScript";
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

const DESCRIPTION =
  "The Podium, by Million Dollar Agency - pay-to-rank leaderboards for service providers, ranked purely by who's paid the most.";

export const metadata: Metadata = {
  // No production domain decided yet - set NEXT_PUBLIC_SITE_URL once there is
  // one, so social share images/canonical URLs resolve to real absolute URLs
  // instead of localhost (this also feeds robots.ts/sitemap.ts).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "The Podium",
    template: "%s - The Podium",
  },
  description: DESCRIPTION,
  icons: { icon: "/the-podium-logo-2.svg" },
  // Site-wide fallback share image - any page that doesn't set its own
  // openGraph.images (e.g. via generateMetadata, as the homepage does per
  // category through /api/og) still gets a real preview instead of none.
  // Next merges metadata top-down, so the homepage's per-category image
  // still wins there; this only fills the gap everywhere else.
  openGraph: {
    type: "website",
    siteName: "The Podium",
    title: "The Podium",
    description: DESCRIPTION,
    images: [{ url: "/open-graph-image.png", width: 1440, height: 1080 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Podium",
    description: DESCRIPTION,
    images: ["/open-graph-image.png"],
  },
  // Explicit allow (belt-and-suspenders alongside robots.ts) - nothing here
  // is paywalled/private, and Google's AI-training crawler (Google-Extended)
  // is covered by robots.ts, not this per-page directive, which only
  // controls indexing/snippets.
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          Belt-and-suspenders: next/font above already self-hosts Bricolage
          Grotesque (no runtime Google dependency), but this is the direct
          Google Fonts <link> approach as a second source for the same
          family - our font stack in globals.css already lists the plain
          "Bricolage Grotesque" name as a fallback, so this link satisfies
          that fallback with zero component changes needed.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${bricolage.variable} ${inter.variable} ${plexMono.variable} antialiased`}>
        {children}
        <Analytics />
        <LemonSqueezyScript />
      </body>
    </html>
  );
}
