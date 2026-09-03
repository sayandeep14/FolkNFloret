import Link from "next/link";
import { SORTS, type CollectionView, type SortKey } from "@/lib/catalog-types";

/**
 * Filter and sort as links rather than a form. They work with JavaScript
 * disabled, each state has its own URL to share or bookmark, and a crawler can
 * reach every collection without executing anything.
 */
export function CatalogControls({
  collections,
  activeCollection,
  activeSort,
  basePath = "/shop",
}: {
  collections: CollectionView[];
  activeCollection?: string;
  activeSort: SortKey;
  /** Collection pages keep their own path and only vary the sort. */
  basePath?: string;
}) {
  const href = (next: { collection?: string; sort?: SortKey }) => {
    const params = new URLSearchParams();
    const collection = "collection" in next ? next.collection : activeCollection;
    const sort = next.sort ?? activeSort;
    if (basePath === "/shop" && collection) params.set("collection", collection);
    if (sort !== "featured") params.set("sort", sort);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="catalog-controls">
      {basePath === "/shop" ? (
        <nav className="catalog-controls__group" aria-label="Filter by collection">
          <Link
            href={href({ collection: undefined })}
            aria-current={!activeCollection ? "page" : undefined}
          >
            Everything
          </Link>
          {collections.map((collection) => (
            <Link
              key={collection.slug}
              href={href({ collection: collection.slug })}
              aria-current={activeCollection === collection.slug ? "page" : undefined}
            >
              {collection.title}
            </Link>
          ))}
        </nav>
      ) : (
        <span />
      )}

      <nav className="catalog-controls__group catalog-controls__group--sort" aria-label="Sort">
        {SORTS.map((sort) => (
          <Link
            key={sort.key}
            href={href({ sort: sort.key })}
            aria-current={activeSort === sort.key ? "page" : undefined}
          >
            {sort.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
