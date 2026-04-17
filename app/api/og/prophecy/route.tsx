import { ImageResponse } from "@vercel/og";
import { getMarketById } from "@/lib/services/markets";
import { COPY } from "@/lib/config/copy";

export const runtime = "nodejs";

const WIDTH = 640;
const HEIGHT = 480;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const marketId = url.searchParams.get("marketId") ?? "";
  const side = url.searchParams.get("side");
  const username = url.searchParams.get("username") ?? "anon_oracle";
  const won = url.searchParams.get("won") === "1";
  const amount = url.searchParams.get("amount");

  const market = marketId ? await getMarketById(marketId) : null;
  const question = market?.question ?? COPY.app.tagline;

  const sideLabel =
    side === "yes"
      ? COPY.share.iSayYes
      : side === "no"
        ? COPY.share.iSayNo
        : COPY.app.name;
  const sideSymbol = side === "yes" ? "+" : side === "no" ? "-" : "*";

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 40,
          backgroundImage:
            "linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 60%, #0a0a0f 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            color: "#9d5cf0",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {"\u2726"} {COPY.app.name} {"\u2726"}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundImage:
                "radial-gradient(circle at center, #9d5cf0 0%, #7c3aed 50%, transparent 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 60,
            }}
          >
            {"\u2726"}
          </div>

          <div
            style={{
              fontSize: 32,
              textAlign: "center",
              maxWidth: 560,
              color: "#f8fafc",
              display: "flex",
            }}
          >
            {question}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 24px",
              borderRadius: 999,
              border: `2px solid ${side === "yes" ? "#10b981" : side === "no" ? "#ef4444" : "#7c3aed"}`,
              color: side === "yes" ? "#34d399" : side === "no" ? "#f87171" : "#9d5cf0",
              fontSize: 24,
            }}
          >
            {sideSymbol} {sideLabel}
          </div>

          <div
            style={{
              fontSize: 20,
              color: "#94a3b8",
              display: "flex",
            }}
          >
            {`\u2014 @${username}`}
          </div>

          {won && amount && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 20px",
                borderRadius: 12,
                backgroundColor: "#f59e0b",
                color: "#0a0a0f",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {COPY.share.won} ${amount}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 18, color: "#a855f7", display: "flex" }}>
            {COPY.app.domain}
          </div>
          <div style={{ fontSize: 14, color: "#475569", display: "flex" }}>
            {COPY.share.willYouDare}
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
