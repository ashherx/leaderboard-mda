import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LemonSqueezyScript } from "@/components/LemonSqueezyScript";
import { OG_IMAGE, OPEN_GRAPH_SITE_DEFAULTS, SITE_NAME } from "@/lib/site";
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
  // openGraph (e.g. app/rules, app/terms, ...) still gets a real preview
  // instead of none. This does NOT apply to app/page.tsx, though: Next only
  // inherits a whole openGraph/twitter object from here when a route
  // doesn't define its own at all, and the homepage's generateMetadata
  // always returns its own (title/description/images vary per category) -
  // that replaces this object rather than merging with it, so
  // OPEN_GRAPH_SITE_DEFAULTS below is spread into its return too (see
  // lib/site.ts and app/page.tsx) rather than relying on inheritance.
  //
  // Facebook, LinkedIn, WhatsApp, Discord, and Slack's link-unfurlers all
  // read this same standard Open Graph block (there's no per-platform tag
  // set to add) - `url`/`locale`/`siteName` and the image's declared
  // width+height+alt are what make FB/LinkedIn's parsers and Discord's
  // embed render confidently instead of falling back to a generic/blank
  // card. Slack and WhatsApp are the least picky (title+description+image
  // is enough for either), so nothing extra is needed for them specifically.
  openGraph: {
    ...OPEN_GRAPH_SITE_DEFAULTS,
    url: "/",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE.url, alt: SITE_NAME }],
  },
  // Discord and Slack both also check twitter:card - without it they fall
  // back to a small thumbnail instead of the large image treatment even
  // though the openGraph tags above are otherwise complete.
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE.url, alt: SITE_NAME }],
  },
  // Explicit allow (belt-and-suspenders alongside robots.ts) - nothing here
  // is paywalled/private, and Google's AI-training crawler (Google-Extended)
  // is covered by robots.ts, not this per-page directive, which only
  // controls indexing/snippets.
  robots: { index: true, follow: true },
};

// themeColor lives here (not in `metadata` above) since Next 14 moved it out
// of the Metadata object into its own export - this is what colors Discord's
// embed accent strip and a mobile browser's own chrome/tab color.
export const viewport: Viewport = {
  themeColor: "#e3a23c", // matches --color-gold in globals.css
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
