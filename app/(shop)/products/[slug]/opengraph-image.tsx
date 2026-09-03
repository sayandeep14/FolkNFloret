import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/catalog";
import { formatPaise } from "@/lib/money";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Folks & Florets";

/**
 * Share card — the brand's face in every WhatsApp forward, so it is set in the
 * house serif rather than whatever ImageResponse falls back to.
 *
 * The typeface is vendored as a .ttf (OFL, redistributable) instead of fetched
 * from Google Fonts, because ImageResponse wants bytes and a build that
 * depends on the network is a build that fails offline. Read once per module,
 * not per request.
 */
const cormorant = readFile(
  join(process.cwd(), "assets/fonts/CormorantGaramond-Light.ttf"),
);
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [product, font] = await Promise.all([
    getProduct((await params).slug),
    cormorant,
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(160deg, #f4ede2 0%, #e6dbcb 100%)",
          color: "#221822",
          fontFamily: "Cormorant",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 6, textTransform: "uppercase", fontFamily: "sans-serif" }}>
          <span>Folks &amp; Florets</span>
          <span style={{ color: "#8d8074" }}>{product?.collections[0]?.title ?? "The House"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {product?.latin ? (
            <span style={{ fontSize: 30, fontStyle: "italic", color: "#c9a24a" }}>
              {product.latin}
            </span>
          ) : null}
          <span style={{ fontSize: 76, lineHeight: 1.05, maxWidth: 900 }}>
            {product?.title ?? "The Art of Keeping"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 26 }}>
          <span style={{ color: "#8d8074" }}>{product?.subtitle ?? ""}</span>
          {product ? (
            <span>
              {product.fromPaise === product.toPaise ? "" : "From "}
              {formatPaise(product.fromPaise)}
            </span>
          ) : null}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Cormorant", data: font, style: "normal", weight: 300 }],
    },
  );
}
