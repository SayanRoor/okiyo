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
  gallery?: Array<{ image?: unknown }> | null;
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
  colors,
}: ProductGalleryProps) {
  const baseMain = useMemo(
    () => toImage(mainImage, productTitle),
    [mainImage, productTitle],
  );
  const baseGallery: ImageLike[] = useMemo(
    () =>
      (gallery ?? [])
        .map((g, i) => toImage(g.image, `${productTitle} — ${i + 1}`))
        .filter((g): g is ImageLike => g != null),
    [gallery, productTitle],
  );
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

  const allImages: ImageLike[] = useMemo(() => {
    const list: ImageLike[] = [];
    if (baseMain) list.push(baseMain);
    list.push(...baseGallery);
    return list;
  }, [baseMain, baseGallery]);

  const displayedMain = colorImage ?? allImages[activeThumbIdx] ?? baseMain;

  return (
    <div>
      {displayedMain ? (
        <div className="relative aspect-square rounded-xl overflow-hidden border border-(--border) bg-(--card)">
          <Image
            src={displayedMain.url}
            alt={displayedMain.alt}
            fill
            priority
            sizes="(min-width:1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      {allImages.length > 1 && !colorImage ? (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {allImages.map((img, idx) => {
            const thumb = toThumb(
              idx === 0 ? mainImage : gallery?.[idx - 1]?.image,
              img.alt,
            );
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
                className={
                  "relative aspect-square rounded-lg overflow-hidden border bg-(--card) transition " +
                  (isActive
                    ? "border-(--accent) ring-2 ring-(--accent)/40"
                    : "border-(--border) hover:border-(--accent)")
                }
              >
                {thumb ? (
                  <Image src={thumb.url} alt={thumb.alt} fill sizes="20vw" className="object-cover" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {safeColors.length > 0 ? (
        <div className="mt-6">
          <div className="text-sm text-(--muted) mb-3">
            Цвет:{" "}
            <span className="text-(--primary) font-medium">
              {activeColorIdx >= 0 ? safeColors[activeColorIdx].name : "выберите вариант"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {safeColors.map((c, idx) => {
              const isActive = idx === activeColorIdx;
              const outOfStock = typeof c.stock === "number" && c.stock <= 0;
              return (
                <button
                  type="button"
                  key={`${c.hex}-${idx}`}
                  onClick={() => {
                    setActiveColorIdx(idx);
                  }}
                  aria-label={c.name}
                  aria-pressed={isActive}
                  title={
                    typeof c.stock === "number"
                      ? `${c.name} · ${c.stock} в наличии`
                      : c.name
                  }
                  className={
                    "relative w-9 h-9 rounded-full ring-offset-2 transition " +
                    (isActive
                      ? "ring-2 ring-(--accent) ring-offset-(--background)"
                      : "ring-1 ring-(--border) hover:ring-(--accent)") +
                    (outOfStock ? " opacity-40" : "")
                  }
                  style={{ backgroundColor: c.hex }}
                >
                  {outOfStock ? (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/90">
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
