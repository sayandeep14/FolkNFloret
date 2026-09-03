import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb, Badge } from "@/components/ui";
import { PurchasePanel } from "@/components/shop/PurchasePanel";
import { ProductCard } from "@/components/shop/ProductCard";
import { getProduct, getProducts, listProducts, safeSlugs } from "@/lib/catalog";
import { formatPaise } from "@/lib/money";

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return safeSlugs(() => getProducts());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};

  const title = product.seoTitle ?? `${product.title} — Folks & Florets`;
  const description =
    product.seoDescription ?? product.description.slice(0, 155);

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Folks & Florets",
    },
  };
}

/** Long-form copy. Rendered as a real section, never as a collapsed accordion. */
function Note({ heading, body }: { heading: string; body: string | null }) {
  if (!body) return null;
  return (
    <section className="pdp__note">
      <h2>{heading}</h2>
      <p>{body}</p>
    </section>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const house = product.collections[0];
  const related = (await listProducts({ collection: house?.slug, sort: "featured" }))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  // Structured data. AggregateOffer when the price varies by variant, a plain
  // Offer when it does not — a range presented as a single price is a
  // rich-result violation and gets the listing dropped.
  const offers =
    product.fromPaise === product.toPaise
      ? {
          "@type": "Offer",
          priceCurrency: "INR",
          price: (product.fromPaise / 100).toFixed(2),
          availability:
            product.available > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        }
      : {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: (product.fromPaise / 100).toFixed(2),
          highPrice: (product.toPaise / 100).toFixed(2),
          offerCount: product.variantCount,
        };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "Folks & Florets" },
    image: product.images.map((i) => i.url),
    offers,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Serialised server-side from our own database, not from user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(house ? [{ label: house.title, href: `/collections/${house.slug}` }] : []),
          { label: product.title },
        ]}
      />

      <div className="pdp">
        <div className="pdp__gallery">
          {product.images.map((image, index) => (
            <figure key={image.url} className="pdp__figure">
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 900px) 100vw, 50vw"
                priority={index === 0}
                unoptimized
              />
            </figure>
          ))}
        </div>

        <div className="pdp__buy">
          {product.latin ? <p className="pdp__latin">{product.latin}</p> : null}
          <h1 className="pdp__title">{product.title}</h1>
          {product.subtitle ? (
            <p className="pdp__sub">{product.subtitle}</p>
          ) : null}

          <div className="pdp__badges">
            {product.collections.map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`}>
                <Badge>{c.title}</Badge>
              </Link>
            ))}
            {product.isBundle ? <Badge tone="gold">Composed suite</Badge> : null}
          </div>

          <PurchasePanel productTitle={product.title} variants={product.variants} />
        </div>
      </div>

      {product.components.length ? (
        <section className="pdp__contents">
          <h2>What is inside</h2>
          <ul>
            {product.components.map((component, index) => (
              <li key={`${component.slug}-${index}`}>
                <Link href={`/products/${component.slug}`}>
                  {component.image ? (
                    <Image
                      src={component.image}
                      alt=""
                      width={800}
                      height={1000}
                      sizes="120px"
                      unoptimized
                    />
                  ) : null}
                  <span className="pdp__contents-name">
                    {component.title}
                    {component.variantName ? (
                      <em>{component.variantName}</em>
                    ) : null}
                  </span>
                  {component.quantity > 1 ? (
                    <span className="pdp__contents-qty">×{component.quantity}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="pdp__notes">
        <Note heading="What it is" body={product.description} />
        {/* The packaging is the differentiator for this house, so it gets a
            heading of its own rather than a line inside the description. */}
        <Note heading="How it is given" body={product.packaging} />
        <Note heading="Materials" body={product.materials} />
        <Note heading="Care" body={product.careNotes} />
        <Note heading="Food information" body={product.foodNotes} />
        <Note
          heading="Delivery"
          body="Dispatched within two working days, nationwide. Fragile pieces travel in cut foam under velvet — nothing is packed loose."
        />
      </div>

      {related.length ? (
        <section className="pdp__related">
          <h2>{house ? `More from ${house.title}` : "More from the house"}</h2>
          <ul className="product-grid">
            {related.map((item) => (
              <li key={item.slug}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="shop__note">
        {product.title} · from {formatPaise(product.fromPaise)}. Photography is
        being shot — the plates you see are stand-ins.
      </p>
    </>
  );
}
