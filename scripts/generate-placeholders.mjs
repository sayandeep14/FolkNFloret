/**
 * Generates stand-in product images until real photography lands (roadmap
 * Phase 3). They are deliberately not grey boxes: each is drawn in the house
 * palette with a pressed-stem glyph, so a catalogue page built against them
 * still reads as the brand rather than as a wireframe.
 *
 * Deterministic — the same slug always draws the same stem, so screenshots and
 * diffs stay stable. Run: node scripts/generate-placeholders.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "placeholders");

const W = 800;
const H = 1000;

/* House palette, warm side. The shop sits on alabaster, not on the near-black
   of the journey, so these are the light-ground values. */
const ALABASTER = "#f4ede2";
const LINEN = "#e6dbcb";
const TAUPE = "#8d8074";
const MOSS = "#4a5d46";
const GOLD = "#c9a24a";
const INK = "#2a1b24";

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(slug) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A pressed specimen: one stem, leaves alternating either side, a bud on top. */
function stem(rng) {
  const cx = W / 2;
  const baseY = H * 0.66;
  const topY = H * 0.24 + rng() * H * 0.04;
  // A gentle S so the stem never reads as a ruler.
  const bend = (rng() - 0.5) * 90;
  const path = `M ${cx} ${baseY} C ${cx + bend} ${baseY - 120}, ${cx - bend} ${topY + 120}, ${cx} ${topY}`;

  const parts = [`<path d="${path}" fill="none" stroke="${MOSS}" stroke-opacity="0.5" stroke-width="2.4" stroke-linecap="round"/>`];

  const leaves = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < leaves; i += 1) {
    const t = 0.12 + (i / leaves) * 0.78;
    // Point on the stem, approximated on the chord — close enough at this bend.
    const y = baseY + (topY - baseY) * t;
    const x = cx + bend * Math.sin(Math.PI * t) * 0.55;
    const side = i % 2 === 0 ? 1 : -1;
    const len = (150 - t * 78) * (0.82 + rng() * 0.36);
    const lift = 34 + rng() * 30;
    const tipX = x + side * len;
    const tipY = y - lift;
    parts.push(
      `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x + side * len * 0.5).toFixed(1)} ${(y - lift - 34).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${(x + side * len * 0.5).toFixed(1)} ${(y - lift + 26).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} Z" fill="${MOSS}" fill-opacity="${(0.1 + rng() * 0.1).toFixed(3)}" stroke="${MOSS}" stroke-opacity="0.4" stroke-width="1.4"/>`,
    );
  }

  // The floret at the tip: a small phyllotaxis rosette, echoing the artifact.
  const petals = 7;
  for (let i = 0; i < petals; i += 1) {
    const a = (i / petals) * Math.PI * 2 + rng() * 0.2;
    const rx = 15 + rng() * 7;
    const ry = 30 + rng() * 10;
    parts.push(
      `<ellipse cx="${cx}" cy="${(topY - ry * 0.72).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${GOLD}" fill-opacity="0.16" stroke="${TAUPE}" stroke-opacity="0.42" stroke-width="1.2" transform="rotate(${((a * 180) / Math.PI).toFixed(1)} ${cx} ${topY})"/>`,
    );
  }

  return parts.join("\n    ");
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svg(slug, label) {
  const rng = mulberry32(seedOf(slug));
  const caps = label.toUpperCase();
  // Rough width guard: the label is letterspaced caps and must not run out of
  // the frame on the longest names.
  const size = caps.length > 26 ? 27 : caps.length > 18 ? 31 : 36;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)} — photography to come">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${ALABASTER}"/>
      <stop offset="1" stop-color="${LINEN}"/>
    </linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.42" r="0.72">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="${INK}" stop-opacity="0.07"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <g>
    ${stem(rng)}
  </g>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="1"/>

  <text x="${W / 2}" y="${H * 0.82}" text-anchor="middle" font-family="Cormorant Garamond, Didot, Georgia, serif" font-size="${size}" letter-spacing="6" fill="${INK}" fill-opacity="0.78">${esc(caps)}</text>
  <text x="${W / 2}" y="${H * 0.86}" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" letter-spacing="4.5" fill="${TAUPE}">PHOTOGRAPHY TO COME</text>
</svg>
`;
}

/* Drawn from fnf.md so Phase 2 has an image waiting for every SKU it seeds. */
const items = [
  ["default", "Folks & Florets"],
  ["candle-sylvan-mist", "No. 01 Sylvan Mist"],
  ["candle-herbal-solace", "No. 02 Herbal Solace"],
  ["candle-sunlit-grove", "No. 03 Sunlit Grove"],
  ["honey-kashmir-acacia", "Kashmir White Acacia"],
  ["honey-himalayan-forest", "Himalayan Wild Forest"],
  ["honey-raw-sidr", "Raw Sidr"],
  ["tisane-caddy", "Whole-Flower Tisane"],
  ["mineral-soak", "Himalayan Mineral Soak"],
  ["chocolate-slab", "Botanical Couverture Slab"],
  ["truffle-assortment", "Gilded Truffle Assortment"],
  ["glazed-nuts", "Glazed Botanical Nuts"],
  ["seed-paper-notebook", "Heirloom Seed Paper Journal"],
  ["moss-bowl-walnut", "Preserved Moss Bowl, Walnut"],
  ["moss-bowl-stone", "Preserved Moss Bowl, Stone"],
  ["herbarium-frame", "Brass Herbarium Frame"],
  ["brass-candle-care", "Brass Candle Care Suite"],
  ["pearl-tasting-spoon", "Mother of Pearl Spoon"],
  ["scallop-catchall", "Gilded Scallop Catchall"],
  ["suite-botanical-harvest", "The Botanical Harvest Suite"],
  ["suite-biophilic-sanctuary", "The Biophilic Sanctuary Chest"],
  ["suite-grand-heirloom", "The Grand Heirloom Suite"],
];

await mkdir(OUT, { recursive: true });
await Promise.all(
  items.map(([slug, label]) => writeFile(join(OUT, `${slug}.svg`), svg(slug, label), "utf8")),
);
console.log(`wrote ${items.length} placeholders to public/placeholders/`);
