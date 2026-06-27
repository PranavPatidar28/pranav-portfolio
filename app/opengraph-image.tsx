import { ImageResponse } from "next/og";
import { profile } from "@/lib/content";

export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbfbfb",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* clay accent bar + on-air status */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 4, background: "#bd5b3c" }} />
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#6d685f",
            }}
          >
            {`${profile.role} · ON AIR`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 140,
              lineHeight: 1,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: -3,
              color: "#2d2d2d",
            }}
          >
            {profile.name}
            <span style={{ color: "#bd5b3c" }}>.</span>
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: "#55514c",
              maxWidth: 900,
            }}
          >
            {profile.tagline}
          </div>
        </div>

        {/* scanline strip motif, bottom-right */}
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: 0,
            width: 90,
            height: 240,
            background: "#bd5b3c",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
