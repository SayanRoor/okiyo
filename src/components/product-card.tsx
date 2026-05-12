import Image from "next/image";
import Link from "next/link";

import { formatPrice, mediaAlt, mediaUrl } from "@/lib/format";

type Color = { hex: string; name?: string | null };

type Product = {
  id: string | number;
  slug?: string | null;
  title: string;
  subtitle?: string | null;
  price: number;
  oldPrice?: number | null;
  badge?: string | null;
  colors?: Color[] | null;
  mainImage?: unknown;
  inStock?: boolean | null;
};

const BADGE_LABEL: Record<string, string> = {
  new: "NEW IN",
  bestseller: "BESTSELLER",
  limited: "LIMITED",
};

export function ProductCard({ product }: { product: Product }) {
  const img = mediaUrl(product.mainImage, "card");
  const alt = mediaAlt(product.mainImage) || product.title;
  const badgeLabel =
    product.badge && product.badge !== "none"
      ? BADGE_LABEL[product.badge] ?? product.badge
      : null;
  const colors = (product.colors ?? []).filter((c): c is Color =>
    Boolean(c && typeof c.hex === "string"),
  );

  // Защита от старых записей без slug — не строим битую ссылку.
  const href = product.slug ? `/catalog/${product.slug}` : "/catalog";

  return (
    <Link
      href={href}
      className="group relative block"
      aria-label={product.title}
    >
      {/* Картинка-квадрат */}
      <div
        className="relative aspect-square overflow-hidden card-hover flex items-center justify-center"
        style={{ background: "var(--card)" }}
      >
        {/* Метка */}
        {badgeLabel ? (
          <span
            className="absolute top-3.5 left-3.5 z-10 px-2 py-1"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--muted)",
              background: "var(--bg)",
            }}
          >
            {badgeLabel}
          </span>
        ) : null}

        {/* Heart на hover */}
        <span
          className="absolute top-3.5 right-3.5 z-10 w-[30px] h-[30px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ color: "var(--muted)" }}
          aria-hidden
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </span>

        {img ? (
          <Image
            src={img}
            alt={alt}
            fill
            sizes="(min-width:1100px) 25vw, (min-width:640px) 50vw, 50vw"
            className="object-cover"
          />
        ) : (
          <FallbackGlass seed={String(product.id ?? product.slug)} />
        )}

        {/* Brandmark под фото для пустых карточек */}
        {!img ? (
          <span
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 13,
              letterSpacing: "0.4em",
              color: "var(--muted)",
              opacity: 0.7,
            }}
          >
            OKIYO
          </span>
        ) : null}

        {/* Нет в наличии */}
        {product.inStock === false ? (
          <span
            className="absolute bottom-3.5 right-3.5 px-2 py-1"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--bg)",
              background: "var(--ink)",
            }}
          >
            Нет в наличии
          </span>
        ) : (
          /* Hover-CTA — выезжает снизу. Подсказка пользователю, что карточка кликабельна. */
          <span className="card-cta" aria-hidden>
            Подробнее →
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="pt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="truncate"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1.2,
              color: "var(--ink)",
            }}
          >
            {product.title}
          </h3>
          {product.subtitle ? (
            <div
              className="mt-1 truncate"
              style={{
                fontSize: 11,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              {product.subtitle}
            </div>
          ) : null}
          {colors.length > 0 ? (
            <div className="flex gap-1.5 mt-2.5">
              {colors.slice(0, 6).map((c, i) => (
                <span
                  key={i}
                  title={c.name ?? c.hex}
                  className="inline-block w-[9px] h-[9px] rounded-full"
                  style={{
                    background: c.hex,
                    border: "1px solid var(--line)",
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="text-right shrink-0">
          <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap" }}>
            {formatPrice(product.price)}
          </div>
          {product.oldPrice && product.oldPrice > product.price ? (
            <div
              style={{
                fontSize: 11,
                color: "var(--muted)",
                textDecoration: "line-through",
                marginTop: 2,
              }}
            >
              {formatPrice(product.oldPrice)}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/**
 * Декоративные SVG-очки на случай, если у товара нет mainImage.
 * 4 формы — выбираются хешем seed.
 */
function FallbackGlass({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const v = Math.abs(h) % 4;
  const common = {
    width: "65%",
    height: "auto" as const,
    color: "var(--ink)",
    style: { color: "var(--ink)" } as const,
  };
  if (v === 0) {
    return (
      <svg viewBox="0 0 400 140" {...common}>
        <rect x="20" y="30" width="150" height="80" rx="40" fill="currentColor" />
        <rect x="230" y="30" width="150" height="80" rx="40" fill="currentColor" />
        <path d="M170 65 Q200 55 230 65" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
    );
  }
  if (v === 1) {
    return (
      <svg viewBox="0 0 400 140" {...common}>
        <rect x="25" y="35" width="145" height="70" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="230" y="35" width="145" height="70" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M170 60 H230" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  }
  if (v === 2) {
    return (
      <svg viewBox="0 0 400 140" {...common}>
        <path d="M30 40 L165 40 L150 110 Q97 122 45 110 Z" fill="currentColor" />
        <path d="M235 40 L370 40 L355 110 Q302 122 250 110 Z" fill="currentColor" />
        <path d="M165 60 Q200 50 235 60" stroke="currentColor" strokeWidth="3" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 140" {...common}>
      <ellipse cx="95" cy="70" rx="78" ry="42" fill="currentColor" />
      <ellipse cx="305" cy="70" rx="78" ry="42" fill="currentColor" />
      <path d="M173 70 Q200 60 227 70" stroke="currentColor" strokeWidth="3" fill="none" />
    </svg>
  );
}
