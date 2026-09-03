import Image from "next/image";
import { placeholderFor } from "@/lib/placeholders";

/**
 * Stand-in product imagery until real photography lands (roadmap Phase 3).
 * Swapping it out should be a change of `src`, nothing more — so this already
 * sets the aspect ratio, sizes and alt text a real photograph will need.
 *
 * `unoptimized` because the placeholders are SVG: Next's optimiser refuses SVG
 * without `dangerouslyAllowSVG`, and enabling that globally to serve our own
 * generated files is not a trade worth making.
 */
export function PlaceholderImage({
  slug,
  alt,
  sizes = "(max-width: 720px) 90vw, (max-width: 1100px) 45vw, 30vw",
  priority,
}: {
  slug: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <Image
      className="ui-product-image"
      src={placeholderFor(slug)}
      alt={alt}
      width={800}
      height={1000}
      sizes={sizes}
      priority={priority}
      unoptimized
    />
  );
}
