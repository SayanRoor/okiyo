import Image from "next/image";
import Link from "next/link";

import { formatPrice, mediaAlt, mediaUrl } from "@/lib/format";

type Product = {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  shortDescription?: string | null;
  mainImage?: unknown;
  inStock?: boolean | null;
};

export function ProductCard({ product }: { product: Product }) {
  const img = mediaUrl(product.mainImage, "card");
  const alt = mediaAlt(product.mainImage) || product.title;
  return (
    <Link
      href={`/catalog/${product.slug}`}
      className="group flex flex-col bg-(--card) rounded-xl border border-(--border) overflow-hidden hover:shadow-lg transition"
    >
      <div className="relative aspect-square bg-(--border)/30">
        {img ? (
          <Image
            src={img}
            alt={alt}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : null}
        {product.oldPrice && product.oldPrice > product.price ? (
          <div className="absolute top-3 left-3 bg-(--accent) text-white text-xs font-medium px-2 py-1 rounded">
            −
            {Math.round(
              (1 - product.price / product.oldPrice) * 100,
            )}
            %
          </div>
        ) : null}
        {product.inStock === false ? (
          <div className="absolute top-3 right-3 bg-(--primary) text-white text-xs px-2 py-1 rounded">
            Нет в наличии
          </div>
        ) : null}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-base font-medium text-(--primary) line-clamp-2 group-hover:text-(--accent) transition">
          {product.title}
        </div>
        {product.shortDescription ? (
          <div className="mt-1 text-sm text-(--muted) line-clamp-2">
            {product.shortDescription}
          </div>
        ) : null}
        <div className="mt-auto pt-3 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-(--primary)">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice && product.oldPrice > product.price ? (
            <span className="text-sm text-(--muted) line-through">
              {formatPrice(product.oldPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
