import { ImageResponse } from "next/og";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getCategoryPricing } from "@/lib/db/listings";

// Not edge: this pulls in lib/db/listings.ts, which transitively imports
// Node's `crypto` module (for manage-token hashing elsewhere in that file)
// — not resolvable in the edge runtime.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0e0f0c";
const CANVAS = "#faf9f5";
const GOLD = "#e3a23c";
const SLATE = "#565349";
const BORDER = "#e4e1d8";

export default async function CategoryOgImage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug);
  const pricing = category ? await getCategoryPricing(category.id, category.min_bid_cents) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CANVAS,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, background: GOLD, display: "flex" }} />
          <span style={{ fontSize: 28, color: SLATE, letterSpacing: 1 }}>AGENCY BID LEADERBOARD</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 72, fontWeight: 700, color: INK, lineHeight: 1.1 }}>
            {category?.name ?? "Category"}
          </span>
          <span style={{ fontSize: 32, color: SLATE, marginTop: 16 }}>
            Ranked purely by who&apos;s paid the most
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            borderTop: `2px solid ${BORDER}`,
            paddingTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: `${GOLD}20`,
              border: `2px solid ${GOLD}`,
              borderRadius: 16,
              padding: "20px 28px",
            }}
          >
            <span style={{ fontSize: 20, color: SLATE }}>Claim #1 for</span>
            <span style={{ fontSize: 40, fontWeight: 700, color: INK }}>
              ${pricing ? pricing.claimFirstPriceCents / 100 : "—"}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
