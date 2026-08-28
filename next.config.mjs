import { PRODUCTION_SITE_URL } from "./site.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "leaderboard-mda.vercel.app" }],
        destination: `${PRODUCTION_SITE_URL}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    const noIndexHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];

    return [
      { source: "/manage/:path*", headers: noIndexHeaders },
      { source: "/r/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/success", headers: noIndexHeaders },
      { source: "/claim", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
