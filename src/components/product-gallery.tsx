"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { mediaAlt, mediaUrl } from "@/lib/format";

type ImageLike = {
  url: string;
  alt: string;
};

type Color = {
  id?: string | null;
  name: string;
  hex: string;
  stock?: number | null;
  image?: unknown;
};

export type ProductGalleryProps = {
  productTitle: string;
  mainImage: unknown;
  /** Старая форма: массив объектов { image: Media }. */
  gallery?: Array<{ image?: unknown }> | null;
  /** Новая форма: массив Media (upload hasMany). */
  photos?: unknown[] | null;
  colors?: Color[] | null;
};

function toImage(media: unknown, fallbackAlt: string): ImageLike | null {
  const url = mediaUrl(media, "hero");
  if (!url) return null;
  return { url, alt: mediaAlt(media) || fallbackAlt };
}

function toThumb(media: unknown, fallbackAlt: string): ImageLike | null {
  const url = mediaUrl(media, "card");
  if (!url) return null;
  return { url, alt: mediaAlt(media) || fallbackAlt };
}

export function ProductGallery({
  productTitle,
  mainImage,
  gallery,
  photos,
  colors,
}: ProductGalleryProps) {
  const baseMain = useMemo(
    () => toImage(mainImage, productTitle),
    [mainImage, productTitle],
  );

  // Источник для миниатюр — храним вместе с полноразмерным URL.
  type RichImage = ImageLike & { thumb: string | null };
  const baseGallery: RichImage[] = useMemo(() => {
    const list: RichImage[] = [];
    let counter = 0;
    const push = (media: unknown) => {
      const full = toImage(media, `${productTitle} — ${++counter}`);
      if (!full) return;
      const thumb = toThumb(media, full.alt)?.url ?? null;
      list.push({ ...full, thumb });
    };
    // Сначала новые photos (upload hasMany), потом legacy gallery.
    for (const m of photos ?? []) push(m);
    for (const g of gallery ?? []) push(g?.image);
    return list;
  }, [photos, gallery, productTitle]);
  const safeColors = (colors ?? []).filter((c) => c?.hex);

  const initialColorIdx = safeColors.findIndex((c) => c.image);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(
    initialColorIdx >= 0 ? initialColorIdx : -1,
  );
  const [activeThumbIdx, setActiveThumbIdx] = useState<number>(0);

  const colorImage =
    activeColorIdx >= 0
      ? toImage(safeColors[activeColorIdx]?.image, `${productTitle} — ${safeColors[activeColorIdx]?.name}`)
      : null;

  const mainThumb = toThumb(mainImage, baseMain?.alt ?? productTitle)?.url ?? null;
  const allImages: RichImage[] = useMemo(() => {
    const list: RichImage[] = [];
    if (baseMain) list.push({ ...baseMain, thumb: mainThumb });
    list.push(...baseGallery);
    return list;
  }, [baseMain, baseGallery, mainThumb]);

  const displayedMain = colorImage ?? allImages[activeThumbIdx] ?? baseMain;

  return (
    <div>
      {displayedMain ? (
        <div
          className="relative aspect-square overflow-hidden"
          style={{ background: "var(--card)" }}
        >
          <Image
            src={displayedMain.url}
            alt={displayedMain.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          className="aspect-square"
          style={{ background: "var(--card)" }}
        />
      )}

      {allImages.length > 1 && !colorImage ? (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {allImages.map((img, idx) => {
            const src = img.thumb ?? img.url;
            const isActive = idx === activeThumbIdx;
            return (
              <button
                type="button"
                key={`${img.url}-${idx}`}
                onClick={() => {
                  setActiveColorIdx(-1);
                  setActiveThumbIdx(idx);
                }}
                aria-label={`Показать фото ${idx + 1}`}
                aria-pressed={isActive}
                className="relative aspect-square overflow-hidden transition"
                style={{
                  background: "var(--card)",
                  outline: isActive
                    ? "1px solid var(--ink)"
                    : "1px solid var(--line)",
                  outlineOffset: 0,
                  cursor: "pointer",
                }}
              >
                <Image
                  src={src}
                  alt={img.alt}
                  fill
                  sizes="20vw"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {safeColors.length > 0 ? (
        <div className="mt-7">
          <div
            className="mb-3"
            style={{
              fontSize: 11,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
            }}
          >
            Цвет ·{" "}
            <span style={{ color: "var(--ink)" }}>
              {activeColorIdx >= 0
                ? safeColors[activeColorIdx].name
                : "выберите вариант"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {safeColors.map((c, idx) => {
              const isActive = idx === activeColorIdx;
              const outOfStock = typeof c.stock === "number" && c.stock <= 0;
              return (
                <button
                  type="button"
                  key={`${c.hex}-${idx}`}
                  onClick={() => setActiveColorIdx(idx)}
                  aria-label={c.name}
                  aria-pressed={isActive}
                  title={
                    typeof c.stock === "number"
                      ? `${c.name} · ${c.stock} в наличии`
                      : c.name
                  }
                  className="relative rounded-full transition"
                  style={{
                    width: 28,
                    height: 28,
                    background: c.hex,
                    border: isActive
                      ? "2px solid var(--ink)"
                      : "1px solid var(--line)",
                    cursor: "pointer",
                    opacity: outOfStock ? 0.4 : 1,
                  }}
                >
                  {outOfStock ? (
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ fontSize: 10, color: "var(--bg)" }}
                    >
                      ✕
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
