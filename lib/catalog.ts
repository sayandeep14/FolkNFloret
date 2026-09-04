import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { CATALOG_TAG } from "@/lib/catalog-types";
import type {
  CollectionView,
  ProductCardView,
  ProductDetailView,
  SortKey,
  VariantView,
} from "@/lib/catalog-types";

/**
 * Read side of the catalogue. Everything the shop renders comes through here,
 * as plain serialisable shapes rather than Prisma rows — the cache below is
 * JSON, so a Date or a Decimal crossing it would come back as something else,
 * and a DTO keeps columns we have not chosen to publish out of the client.
 *
 * Types and constants live in lib/catalog-types.ts so client components can
 * import them without dragging the database driver along.
 */

export * from "@/lib/catalog-types";

/**
 * A bundle is limited by whatever runs out first — the assembled chests on the
 * shelf, or any one component. Showing the bundle's own count alone would
 * promise suites we cannot actually pack.
 */
function bundleAvailability(
  own: number,
  components: { quantity: number; available: number }[],
): number {
  return components.reduce(
    (limit, c) => Math.min(limit, Math.floor(c.available / c.quantity)),
    own,
  );
}

const productInclude = {
  images: { orderBy: { position: "asc" } },
  collections: { include: { collection: true }, orderBy: { position: "asc" } },
  variants: {
    orderBy: { position: "asc" },
    include: {
      components: {
        orderBy: { position: "asc" },
        include: {
          componentVariant: {
            include: { product: { include: { images: { take: 1, orderBy: { position: "asc" } } } } },
          },
        },
      },
    },
  },
} as const;

type ProductRow = Awaited<
  ReturnType<typeof db.product.findFirstOrThrow<{ include: typeof productInclude }>>
>;

function toVariantViews(product: ProductRow): VariantView[] {
  return product.variants.map((variant) => {
    const own = Math.max(0, variant.stockOnHand - variant.stockReserved);
    const available = product.isBundle
      ? bundleAvailability(
          own,
          variant.components.map((c) => ({
            quantity: c.quantity,
            available: Math.max(
              0,
              c.componentVariant.stockOnHand - c.componentVariant.stockReserved,
            ),
          })),
        )
      : own;

    return {
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      priceInPaise: variant.priceInPaise,
      comparePaise: variant.comparePaise,
      weightGrams: variant.weightGrams,
      available,
    };
  });
}

function toCard(product: ProductRow): ProductCardView {
  const variants = toVariantViews(product);
  const prices = variants.map((v) => v.priceInPaise);

  return {
    slug: product.slug,
    title: product.title,
    latin: product.latin,
    subtitle: product.subtitle,
    isBundle: product.isBundle,
    collections: product.collections.map((c) => ({
      slug: c.collection.slug,
      title: c.collection.title,
    })),
    image: product.images[0]
      ? { url: product.images[0].url, alt: product.images[0].alt }
      : null,
    fromPaise: Math.min(...prices),
    toPaise: Math.max(...prices),
    available: variants.reduce((sum, v) => sum + v.available, 0),
    variantCount: variants.length,
  };
}

function sortCards(cards: ProductCardView[], sort: SortKey, order: string[]) {
  const copy = [...cards];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.fromPaise - b.fromPaise);
    case "price-desc":
      return copy.sort((a, b) => b.fromPaise - a.fromPaise);
    case "newest":
      return copy; // already createdAt desc from the query
    default:
      // "Featured" is the order the house tells its own story in: collection
      // position first, then position within it. Not an engagement metric.
      return copy.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
  }
}

export const getCollections = unstable_cache(
  async (): Promise<CollectionView[]> => {
    const rows = await db.collection.findMany({ orderBy: { position: "asc" } });
    return rows.map((c) => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
    }));
  },
  ["collections"],
  { tags: [CATALOG_TAG] },
);

export const getProducts = unstable_cache(
  async (collectionSlug?: string): Promise<ProductCardView[]> => {
    const products = await db.product.findMany({
      where: {
        status: "ACTIVE",
        ...(collectionSlug
          ? { collections: { some: { collection: { slug: collectionSlug } } } }
          : {}),
      },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });
    return products.map(toCard);
  },
  ["products"],
  { tags: [CATALOG_TAG] },
);

/** The house's own running order, used by the "featured" sort. */
export const getFeaturedOrder = unstable_cache(
  async (): Promise<string[]> => {
    const rows = await db.productCollection.findMany({
      include: { collection: true, product: true },
      orderBy: [{ collection: { position: "asc" } }, { position: "asc" }],
    });
    return [...new Set(rows.map((r) => r.product.slug))];
  },
  ["featured-order"],
  { tags: [CATALOG_TAG] },
);

export async function listProducts(options: {
  collection?: string;
  sort?: SortKey;
}): Promise<ProductCardView[]> {
  const [cards, order] = await Promise.all([
    getProducts(options.collection),
    getFeaturedOrder(),
  ]);
  return sortCards(cards, options.sort ?? "featured", order);
}

export const getProduct = unstable_cache(
  async (slug: string): Promise<ProductDetailView | null> => {
    const product = await db.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: productInclude,
    });
    if (!product) return null;

    const variants = toVariantViews(product);

    // Components are listed once for the product, not per variant: every
    // bundle here has a single variant, and a per-variant list would read as
    // repetition rather than as information.
    const components = product.variants.flatMap((variant) =>
      variant.components.map((c) => ({
        slug: c.componentVariant.product.slug,
        title: c.componentVariant.product.title,
        variantName: c.componentVariant.name,
        quantity: c.quantity,
        image: c.componentVariant.product.images[0]?.url ?? null,
      })),
    );

    return {
      ...toCard(product),
      description: product.description,
      packaging: product.packaging,
      materials: product.materials,
      careNotes: product.careNotes,
      foodNotes: product.foodNotes,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      images: product.images.map((i) => ({
        url: i.url,
        alt: i.alt,
        width: i.width,
        height: i.height,
      })),
      variants,
      components,
    };
  },
  ["product"],
  { tags: [CATALOG_TAG] },
);

/**
 * Static params for the build. Deliberately forgiving: if the database is
 * unreachable the build still succeeds and every page renders on demand,
 * rather than a transient network fault failing a deploy.
 */
export async function safeSlugs<T extends { slug: string }>(
  load: () => Promise<T[]>,
): Promise<{ slug: string }[]> {
  try {
    return (await load()).map(({ slug }) => ({ slug }));
  } catch (error) {
    // Loud on purpose. A build with no reachable database still succeeds — it
    // just prerenders nothing — and a silently un-prerendered catalogue is a
    // trap worth shouting about, because the site will look fine and be slow.
    console.error(
      "\n[catalog] Could not reach the database during the build.\n" +
        "[catalog] No product pages were prerendered; they will render on demand.\n" +
        "[catalog] If this is a deploy, check DATABASE_URL is set for this environment.\n",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
