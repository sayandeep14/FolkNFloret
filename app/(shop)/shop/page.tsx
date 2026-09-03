import type { Metadata } from "next";
import { Breadcrumb, Money, PlaceholderImage } from "@/components/ui";

export const metadata: Metadata = {
  title: "Shop — Folks & Florets",
  description:
    "Aromatics, epicurean provisions and preserved botanicals, given alone or composed into keepsake suites.",
};

/**
 * A hard-coded stand-in until Phase 1 puts a database behind it. The shape is
 * deliberately the shape the real query will return — slug, title, latin,
 * house, priceInPaise — so Phase 2 replaces the array and nothing else.
 */
const preview = [
  { slug: "candle-sylvan-mist", title: "No. 01 Sylvan Mist", latin: "Lumen", house: "Aromatics", priceInPaise: 145000 },
  { slug: "candle-herbal-solace", title: "No. 02 Herbal Solace", latin: "Lumen", house: "Aromatics", priceInPaise: 145000 },
  { slug: "honey-kashmir-acacia", title: "Kashmir White Acacia", latin: "Mensa", house: "Epicurean", priceInPaise: 125000 },
  { slug: "chocolate-slab", title: "Botanical Couverture Slab", latin: "Mensa", house: "Epicurean", priceInPaise: 89000 },
  { slug: "moss-bowl-stone", title: "Preserved Moss Bowl, Stone", latin: "Herbarium", house: "Preserved", priceInPaise: 220000 },
  { slug: "herbarium-frame", title: "Brass Herbarium Frame", latin: "Herbarium", house: "Preserved", priceInPaise: 195000 },
  { slug: "seed-paper-notebook", title: "Heirloom Seed Paper Journal", latin: "Herbarium", house: "Preserved", priceInPaise: 110000 },
  { slug: "suite-botanical-harvest", title: "The Botanical Harvest Suite", latin: "Suite", house: "Suites", priceInPaise: 580000 },
];

export default function ShopPage() {
  return (
    <>
      <header className="shop__head">
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <p className="eyebrow">The Collections</p>
        <h1 className="display display--md">Everything the house keeps</h1>
        <p className="lede">
          Aromatics, epicurean provisions and preserved botanicals — given alone,
          or composed into a suite.
        </p>
      </header>

      <ul className="product-grid">
        {preview.map((item, index) => (
          <li key={item.slug}>
            {/* Not a link yet: product pages arrive in Phase 2. */}
            <article className="product-card">
              <div className="product-card__frame">
                <PlaceholderImage
                  slug={item.slug}
                  alt={`${item.title} — photography to come`}
                  priority={index < 4}
                />
              </div>
              <p className="product-card__latin">{item.latin}</p>
              <h2 className="product-card__title">{item.title}</h2>
              <p className="product-card__meta">
                <span>{item.house}</span>
                <Money paise={item.priceInPaise} />
              </p>
            </article>
          </li>
        ))}
      </ul>

      <p className="shop__note">
        A preview. Real products, prices and photography arrive with phases 1
        to 3 of the marketplace build.
      </p>
    </>
  );
}
