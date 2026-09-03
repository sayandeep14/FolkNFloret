/**
 * Asserts the seed data holds together, without needing a database. Cheap
 * enough to run in CI, and it catches the mistakes that are expensive to find
 * once rows exist: a bundle pointing at a SKU nobody defined, a duplicate SKU
 * silently overwriting another on upsert, a price of zero.
 *
 *   node scripts/check-catalog.mjs
 */
import { collections, imageSlugForVariant, products } from "../prisma/seed-data.ts";
import { placeholderSlugs } from "../lib/placeholders.ts";

const problems = [];
const fail = (message) => problems.push(message);

const collectionSlugs = new Set(collections.map((c) => c.slug));
const skus = new Map();
const productSlugs = new Set();

for (const product of products) {
  if (productSlugs.has(product.slug)) fail(`duplicate product slug ${product.slug}`);
  productSlugs.add(product.slug);

  if (!product.variants.length) fail(`${product.slug} has no variants`);

  for (const slug of product.collections) {
    if (!collectionSlugs.has(slug)) fail(`${product.slug} references unknown collection ${slug}`);
  }

  const bundle = product.isBundle === true;

  for (const variant of product.variants) {
    if (skus.has(variant.sku)) fail(`duplicate SKU ${variant.sku}`);
    skus.set(variant.sku, { variant, product });

    if (!Number.isInteger(variant.priceInPaise) || variant.priceInPaise <= 0) {
      fail(`${variant.sku} price must be a positive integer of paise`);
    }
    // A price ending in anything but 00 is nearly always a rupee figure that
    // was written into a paise column.
    if (variant.priceInPaise % 100 !== 0) {
      fail(`${variant.sku} price ${variant.priceInPaise} is not a whole rupee — check the unit`);
    }
    if (!Number.isInteger(variant.weightGrams) || variant.weightGrams <= 0) {
      fail(`${variant.sku} needs a positive shipping weight`);
    }
    if (bundle !== Boolean(variant.components)) {
      fail(`${variant.sku}: isBundle is ${bundle} but components are ${variant.components ? "present" : "absent"}`);
    }
    if (!imageSlugForVariant[variant.sku]) fail(`${variant.sku} has no image mapping`);
  }

  if (product.taxRateBps < 0 || product.taxRateBps > 5000) {
    fail(`${product.slug} tax rate ${product.taxRateBps}bps looks wrong`);
  }
}

for (const [sku, image] of Object.entries(imageSlugForVariant)) {
  if (!skus.has(sku)) fail(`image mapping for unknown SKU ${sku}`);
  if (!placeholderSlugs.includes(image)) fail(`${sku} maps to missing placeholder ${image}`);
}

// Bundles: every component must exist, and none may be a bundle itself —
// nesting would make stock reservation recursive for no commercial reason.
for (const { variant } of skus.values()) {
  for (const component of variant.components ?? []) {
    const target = skus.get(component.sku);
    if (!target) {
      fail(`${variant.sku} references unknown component ${component.sku}`);
      continue;
    }
    if (target.product.isBundle) fail(`${variant.sku} nests bundle ${component.sku}`);
    if (!Number.isInteger(component.quantity) || component.quantity < 1) {
      fail(`${variant.sku} → ${component.sku} has a bad quantity`);
    }
  }
}

const rupees = (paise) => `₹${(paise / 100).toLocaleString("en-IN")}`;

console.log(`${collections.length} collections, ${products.length} products, ${skus.size} variants`);
for (const { variant, product } of skus.values()) {
  if (!variant.components) continue;
  const parts = variant.components.reduce(
    (sum, c) => sum + skus.get(c.sku).variant.priceInPaise * c.quantity,
    0,
  );
  const delta = ((variant.priceInPaise - parts) / parts) * 100;
  // Not an error: a hamper discount is a legitimate thing to offer. But a
  // bundle that costs less than the sum of its parts is arbitrage against
  // yourself if it was not deliberate, so say so every run.
  const flag = delta < 0 ? "  ⚠ under parts" : "";
  console.log(
    `  ${product.slug}: ${rupees(variant.priceInPaise)} vs ${rupees(parts)} of parts (${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%)${flag}`,
  );
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("\ncatalogue OK");
