import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0e0f0c";
const CANVAS = "#faf9f5";
const GOLD = "#e3a23c";
const SLATE = "#565349";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: CANVAS,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 20, height: 20, borderRadius: 999, background: GOLD, display: "flex" }} />
          <span style={{ fontSize: 28, color: SLATE, letterSpacing: 2 }}>AGENCY BID LEADERBOARD</span>
        </div>
        <span style={{ fontSize: 68, fontWeight: 700, color: INK, textAlign: "center" }}>
          Ranked purely by who&apos;s paid the most
        </span>
        <span style={{ fontSize: 30, color: SLATE, marginTop: 20 }}>No portfolios. No algorithm. Just #1.</span>
      </div>
    ),
    { ...size }
  );
}
