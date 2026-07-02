import { ImageResponse } from "next/og";
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

export const alt = "Svay Channel Analysis";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

function formatNumber(num) {
  if (!num) return "0";
  const parsed = parseInt(num, 10);
  if (isNaN(parsed)) return "0";
  if (parsed >= 1000000000) return (parsed / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
  if (parsed >= 1000000) return (parsed / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (parsed >= 1000) return (parsed / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return parsed.toString();
}

export default async function Image({ params }) {
  const { id } = await params;

  let fontData = null;
  try {
    const fontPath = join(process.cwd(), "src/app/fonts/typogama-ahsing.otf");
    fontData = readFileSync(fontPath);
  } catch (err) {
    console.error("[OG Image] Failed to load brand font:", err);
  }

  let channel = null;
  try {
    const rs = await client.execute({
      sql: "SELECT * FROM channels WHERE id = ?",
      args: [id],
    });
    if (rs.rows.length > 0) {
      const row = rs.rows[0];
      channel = {
        ...row,
        statistics: JSON.parse(row.statistics),
      };
    }
  } catch (err) {
    console.error("[OG Image] Failed to fetch channel details:", err);
  }

  const title = channel?.title || "YouTube Creator";
  const customUrl = channel?.custom_url || "";
  const subscribers = channel?.statistics?.subscriberCount || 0;
  const views = channel?.statistics?.viewCount || 0;
  const videos = channel?.statistics?.videoCount || 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#050505",
          padding: "60px 80px",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background Decorative Glow */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            backgroundColor: "rgba(0, 112, 243, 0.12)",
            borderRadius: "50%",
            filter: "blur(80px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            borderRadius: "50%",
            filter: "blur(80px)",
            display: "flex",
          }}
        />

        {/* Top Header */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "linear-gradient(45deg, #0070f3, #00f0ff)",
                marginRight: "12px",
                display: "flex",
              }}
            />
            <span
              style={{
                fontFamily: "Ahsing",
                fontSize: "28px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              SVAY
            </span>
          </div>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#00f0ff",
            }}
          >
            Channel Report
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          {/* Left Side: Channel Profile */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              flex: "1",
              marginRight: "40px",
            }}
          >
            {channel?.thumbnail ? (
              <img
                src={channel.thumbnail}
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  marginRight: "24px",
                  border: "3px solid #00f0ff",
                  display: "flex",
                }}
                alt=""
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="80"
                height="80"
                fill="#FF0000"
                style={{ marginRight: "24px", display: "flex" }}
              >
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.002 3.002 0 0 0-2.11 2.107C0 8.053 0 12 0 12s0 3.948.502 5.837a3.003 3.003 0 0 0 2.11 2.107c1.883.51 9.388.51 9.388.51s7.505 0 9.388-.51a3.003 3.003 0 0 0 2.11-2.107C24 15.948 24 12 24 12s0-3.948-.502-5.837z" />
                <path fill="#FFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <h1
                style={{
                  fontSize: title.length > 18 ? "38px" : "48px",
                  fontWeight: "900",
                  lineHeight: "1.1",
                  margin: 0,
                  color: "#FFFFFF",
                  letterSpacing: "-0.02em",
                  marginBottom: "8px",
                  display: "flex",
                }}
              >
                {title}
              </h1>
              {customUrl && (
                <span
                  style={{
                    fontSize: "16px",
                    color: "#888888",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    display: "flex",
                  }}
                >
                  {customUrl}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Statistics Grid */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "480px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: "24px",
              padding: "30px 40px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#666", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>Subs</span>
              <span style={{ fontSize: "36px", fontWeight: "bold", color: "#FFFFFF", marginTop: "6px" }}>{formatNumber(subscribers)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#666", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>Views</span>
              <span style={{ fontSize: "36px", fontWeight: "bold", color: "#00dfd8", marginTop: "6px" }}>{formatNumber(views)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#666", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.1em" }}>Videos</span>
              <span style={{ fontSize: "36px", fontWeight: "bold", color: "#00ff66", marginTop: "6px" }}>{formatNumber(videos)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Info */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            paddingTop: "24px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#555", fontWeight: "bold", uppercase: true, letterSpacing: "0.05em" }}>
            CREATOR INSIGHTS & PERFORMANCE ANALYSIS
          </span>
          <span style={{ fontSize: "14px", color: "#0070f3", fontWeight: "bold" }}>
            svay.space
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [
        {
          name: "Ahsing",
          data: fontData,
          style: "normal",
        }
      ] : undefined,
    }
  );
}
