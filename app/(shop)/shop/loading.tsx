import { Skeleton } from "@/components/ui";

export default function ShopLoading() {
  return (
    <>
      <header className="shop__head">
        <Skeleton width="10rem" height="0.7rem" />
        <Skeleton width="min(100%, 26rem)" height="3rem" />
        <Skeleton width="min(100%, 34rem)" height="1.2rem" />
      </header>

      <ul className="product-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <div className="product-card">
              <Skeleton height="0" radius="0" />
              <div className="product-card__frame product-card__frame--loading" />
              <Skeleton width="4rem" height="0.7rem" />
              <Skeleton width="70%" height="1.3rem" />
              <Skeleton width="50%" height="0.9rem" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
