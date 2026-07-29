/**
 * The refraction behind the "liquid glass" navbar.
 *
 * backdrop-filter: blur() only scatters what is behind the panel — it frosts.
 * Bending the content the way real glass does needs a displacement map, which
 * CSS has no primitive for, so it comes from an SVG filter referenced by
 * `backdrop-filter: url(#liquid-glass)`.
 *
 * Two passes rather than one. A single map would have to encode both axes in
 * different channels of one image, which cannot be authored with plain
 * gradients; chaining lets each map be a single-axis ramp. In each pass the
 * unused axis reads the blue channel, held flat at 128 — the value
 * feDisplacementMap treats as zero offset.
 *
 * Each ramp is flat through the middle and bends only near the edges, which is
 * where a real lens bends light most.
 */

/** 128 in a channel means "no displacement", so #808080 is the neutral field. */
function ramp(direction: "x" | "y", from: string, to: string, inset: number) {
  const vertical = direction === "y";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80" preserveAspectRatio="none">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">` +
    `<stop offset="0" stop-color="${from}"/>` +
    `<stop offset="${inset}" stop-color="#808080"/>` +
    `<stop offset="${1 - inset}" stop-color="#808080"/>` +
    `<stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="80" fill="url(#g)"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * The bands are narrow on purpose. At 10% of the bar's width the bend spanned
 * ~100px and read as a smear; a real lens deflects hard within a few pixels of
 * its rim and is optically flat through the middle.
 */
const MAP_X = ramp("x", "#008080", "#ff8080", 0.05);
/** The bar is short, so its vertical rim is a larger fraction of its height. */
const MAP_Y = ramp("y", "#800080", "#80ff80", 0.3);

export function GlassFilter() {
  return (
    <svg
      className="glass-filter"
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        <filter
          id="liquid-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feImage href={MAP_X} result="mapX" preserveAspectRatio="none" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="mapX"
            scale="86"
            xChannelSelector="R"
            yChannelSelector="B"
            result="bentX"
          />
          <feImage href={MAP_Y} result="mapY" preserveAspectRatio="none" />
          <feDisplacementMap
            in="bentX"
            in2="mapY"
            scale="30"
            xChannelSelector="B"
            yChannelSelector="G"
            result="bent"
          />
          {/* Half a pixel, purely to take the stair-stepping off the
              displaced edge without frosting the glass. */}
          <feGaussianBlur in="bent" stdDeviation="0.6" />
        </filter>
      </defs>
    </svg>
  );
}
