/**
 * Idempotent. Upserts by slug and SKU, so running it twice does not duplicate
 * the catalogue and does not stamp on stock counts that have moved since.
 *
 *   npx prisma db seed
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/index.js";
import { collections, imageSlugForVariant, products } from "./seed-data.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const collectionIds = new Map<string, string>();
  for (const collection of collections) {
    const row = await db.collection.upsert({
      where: { slug: collection.slug },
      create: collection,
      update: collection,
    });
    collectionIds.set(collection.slug, row.id);
  }
  console.log(`collections: ${collectionIds.size}`);

  // Two passes. Bundles reference component SKUs, and a component may be
  // defined after the bundle that uses it, so every variant has to exist
  // before any BundleComponent row can be written.
  const variantIds = new Map<string, string>();
  let variantCount = 0;

  for (const product of products) {
    const { variants, collections: slugs, ...fields } = product;

    const row = await db.product.upsert({
      where: { slug: product.slug },
      create: { ...fields, status: "ACTIVE" },
      // Status is left alone on update: unpublishing something in the admin
      // must not be undone by a re-seed.
      update: fields,
    });

    await db.productCollection.deleteMany({ where: { productId: row.id } });
    await db.productCollection.createMany({
      data: slugs.map((slug, position) => ({
        productId: row.id,
        collectionId: collectionIds.get(slug)!,
        position,
      })),
    });

    for (const [position, variant] of variants.entries()) {
      // Components are written in the second pass, once every SKU exists.
      const variantFields = {
        sku: variant.sku,
        name: variant.name,
        priceInPaise: variant.priceInPaise,
        weightGrams: variant.weightGrams,
        stockOnHand: variant.stockOnHand,
      };
      const image = imageSlugForVariant[variant.sku];

      const created = await db.productVariant.upsert({
        where: { sku: variant.sku },
        create: {
          ...variantFields,
          productId: row.id,
          position,
          taxRateBps: product.taxRateBps,
          hsnCode: product.hsnCode,
        },
        // stockOnHand is deliberately not updated — the seed sets an opening
        // balance, and after that inventory is the admin's to move.
        update: {
          name: variantFields.name,
          priceInPaise: variantFields.priceInPaise,
          weightGrams: variantFields.weightGrams,
          position,
          taxRateBps: product.taxRateBps,
          hsnCode: product.hsnCode,
        },
      });

      variantIds.set(variant.sku, created.id);
      variantCount += 1;

      if (image) {
        const url = `/placeholders/${image}.svg`;
        const existing = await db.productImage.findFirst({
          where: { productId: row.id, url },
        });
        if (!existing) {
          await db.productImage.create({
            data: {
              productId: row.id,
              url,
              alt: `${product.title} — photography to come`,
              width: 800,
              height: 1000,
              position,
            },
          });
        }
      }
    }
  }
  console.log(`products: ${products.length}, variants: ${variantCount}`);

  let componentCount = 0;
  for (const product of products) {
    for (const variant of product.variants) {
      if (!variant.components) continue;
      const bundleVariantId = variantIds.get(variant.sku)!;
      await db.bundleComponent.deleteMany({ where: { bundleVariantId } });
      await db.bundleComponent.createMany({
        data: variant.components.map((component, position) => ({
          bundleVariantId,
          componentVariantId: variantIds.get(component.sku)!,
          quantity: component.quantity,
          position,
        })),
      });
      componentCount += variant.components.length;
    }
  }
  console.log(`bundle components: ${componentCount}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
