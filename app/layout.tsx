import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

export const metadata: Metadata = {
  // No production domain decided yet - set NEXT_PUBLIC_SITE_URL once there is
  // one, so social share images resolve to real absolute URLs.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "The Podium",
    template: "%s - The Podium",
  },
  description:
    "The Podium, by Million Dollar Agency - pay-to-rank leaderboards for service providers, ranked purely by who's paid the most.",
  icons: { icon: "/the-podium-logo-2.svg" },
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
      </body>
    </html>
  );
}
