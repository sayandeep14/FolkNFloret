/**
 * Shapes and constants shared by the server queries and the client components
 * that render them.
 *
 * Kept apart from lib/catalog.ts on purpose. That module imports lib/db, which
 * imports the pg driver; a client component reaching in here for a type would
 * otherwise pull all of Postgres into the browser bundle. Nothing in this file
 * may import anything with a runtime dependency.
 */

/** Anything that changes the catalogue must revalidate this. */
export const CATALOG_TAG = "catalog";

/** Below this, say so on the card. Gifting buyers plan ahead. */
export const LOW_STOCK_AT = 5;

export type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price, low" },
  { key: "price-desc", label: "Price, high" },
  { key: "newest", label: "Newest" },
];

export function parseSort(value: string | undefined): SortKey {
  return SORTS.some((s) => s.key === value) ? (value as SortKey) : "featured";
}

export type VariantView = {
  id: string;
  sku: string;
  name: string | null;
  priceInPaise: number;
  comparePaise: number | null;
  weightGrams: number;
  /** Units a customer could actually buy right now. */
  available: number;
};

export type ProductCardView = {
  slug: string;
  title: string;
  latin: string | null;
  subtitle: string | null;
  isBundle: boolean;
  collections: { slug: string; title: string }[];
  image: { url: string; alt: string } | null;
  fromPaise: number;
  toPaise: number;
  available: number;
  variantCount: number;
};

export type ProductDetailView = ProductCardView & {
  description: string;
  packaging: string | null;
  materials: string | null;
  careNotes: string | null;
  foodNotes: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { url: string; alt: string; width: number; height: number }[];
  variants: VariantView[];
  /** Populated for bundles: what is inside, and where to read about it. */
  components: {
    slug: string;
    title: string;
    variantName: string | null;
    quantity: number;
    image: string | null;
  }[];
};

export type CollectionView = {
  slug: string;
  title: string;
  description: string | null;
};
