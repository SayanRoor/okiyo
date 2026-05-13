"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

function toHero(media: unknown, fallbackAlt: string): ImageLike | null {
  const url = mediaUrl(media, "hero");
  if (!url) return null;
  return { url, alt: mediaAlt(media) || fallbackAlt };
}

function toThumb(media: unknown, fallbackAlt: string): ImageLike | null {
  const url = mediaUrl(media, "card");
  if (!url) return null;
  return { url, alt: mediaAlt(media) || fallbackAlt };
}

type RichImage = ImageLike & { thumb: string | null };

export function ProductGallery({
  productTitle,
  mainImage,
  gallery,
  photos,
  colors,
}: ProductGalleryProps) {
  // --------- Сборка всех фотографий в один массив ---------
  const allImages: RichImage[] = useMemo(() => {
    const list: RichImage[] = [];
    let counter = 0;
    const push = (media: unknown) => {
      const full = toHero(media, `${productTitle} — ${++counter}`);
      if (!full) return;
      const thumb = toThumb(media, full.alt)?.url ?? null;
      list.push({ ...full, thumb });
    };
    push(mainImage);
    for (const m of photos ?? []) push(m);
    for (const g of gallery ?? []) push(g?.image);
    return list;
  }, [mainImage, photos, gallery, productTitle]);

  // --------- Цвета ---------
  const safeColors = (colors ?? []).filter((c) => c?.hex);
  const initialColorIdx = safeColors.findIndex((c) => c.image);
  const [activeColorIdx, setActiveColorIdx] = useState<number>(
    initialColorIdx >= 0 ? initialColorIdx : -1,
  );
  const colorImage =
    activeColorIdx >= 0
      ? toHero(
          safeColors[activeColorIdx]?.image,
          `${productTitle} — ${safeColors[activeColorIdx]?.name}`,
        )
      : null;

  // --------- Текущая активная картинка ---------
  const [activeIdx, setActiveIdx] = useState(0);

  // Когда выбран цвет с фото — он перекрывает базовый стек.
  const displayedImages: RichImage[] = colorImage
    ? [{ ...colorImage, thumb: null }]
    : allImages;
  const activeImage =
    displayedImages[Math.min(activeIdx, displayedImages.length - 1)];

  const selectThumb = useCallback((i: number) => {
    setActiveColorIdx(-1);
    setActiveIdx(i);
  }, []);

  // --------- Lightbox ---------
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const openLightbox = useCallback(() => {
    setZoomed(false);
    setLightboxOpen(true);
  }, []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const next = useCallback(() => {
    setActiveColorIdx(-1);
    setActiveIdx((i) => (i + 1) % displayedImages.length);
    setZoomed(false);
  }, [displayedImages.length]);
  const prev = useCallback(() => {
    setActiveColorIdx(-1);
    setActiveIdx((i) => (i - 1 + displayedImages.length) % displayedImages.length);
    setZoomed(false);
  }, [displayedImages.length]);

  // Esc/стрелки в lightbox + блокировка скролла страницы.
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, closeLightbox, next, prev]);

  // --------- Мобильная карусель: scroll-snap ---------
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const onMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== activeIdx) setActiveIdx(i);
  }, [activeIdx]);

  if (displayedImages.length === 0) {
    return (
      <div
        className="aspect-square"
        style={{ background: "var(--card)" }}
      />
    );
  }

  return (
    <>
      {/* DESKTOP: миниатюры | главное фото */}
      <div className="okiyo-gallery hidden md:grid">
        <div className="okiyo-gallery__thumbs">
          {displayedImages.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={() => selectThumb(idx)}
              aria-label={`Показать фото ${idx + 1}`}
              aria-pressed={idx === activeIdx}
              data-active={idx === activeIdx}
              className="okiyo-gallery__thumb"
            >
              <Image
                src={img.thumb ?? img.url}
                alt={img.alt}
                fill
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openLightbox}
          className="okiyo-gallery__main"
          aria-label="Открыть фото на весь экран"
        >
          {activeImage ? (
            // Обычный <img>, а не Image fill — высота определяется самим фото.
            // Это премиум-паттерн (Saint Laurent / Mykita): каждый снимок
            // показывается в своих пропорциях без обрезки и чёрных полей.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage.url}
              alt={activeImage.alt}
              className="okiyo-gallery__main-img"
              loading="eager"
            />
          ) : null}
          <span className="okiyo-gallery__zoom" aria-hidden>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
            </svg>
          </span>
        </button>
      </div>

      {/* MOBILE: snap-карусель + точки */}
      <div className="md:hidden">
        <div
          ref={mobileScrollRef}
          onScroll={onMobileScroll}
          className="okiyo-gallery__mobile no-scrollbar"
        >
          {displayedImages.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              onClick={openLightbox}
              className="okiyo-gallery__mobile-slide"
              aria-label={`Фото ${idx + 1}, тап чтобы увеличить`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt}
                loading={idx === 0 ? "eager" : "lazy"}
                className="okiyo-gallery__mobile-img"
              />
            </button>
          ))}
        </div>
        {displayedImages.length > 1 ? (
          <div className="okiyo-gallery__dots">
            {displayedImages.map((_, i) => (
              <span
                key={i}
                data-active={i === activeIdx}
                aria-hidden
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Цветовые свотчи */}
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
                  onClick={() => {
                    setActiveColorIdx(idx);
                    setActiveIdx(0);
                  }}
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

      {/* LIGHTBOX */}
      {lightboxOpen && activeImage ? (
        <div
          className="okiyo-lightbox"
          role="dialog"
          aria-modal
          aria-label="Просмотр фото"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <button
            type="button"
            className="okiyo-lightbox__close"
            onClick={closeLightbox}
            aria-label="Закрыть"
          >
            ✕
          </button>

          {displayedImages.length > 1 ? (
            <>
              <button
                type="button"
                className="okiyo-lightbox__nav okiyo-lightbox__nav--prev"
                onClick={prev}
                aria-label="Предыдущее фото"
              >
                ‹
              </button>
              <button
                type="button"
                className="okiyo-lightbox__nav okiyo-lightbox__nav--next"
                onClick={next}
                aria-label="Следующее фото"
              >
                ›
              </button>
            </>
          ) : null}

          <div
            className="okiyo-lightbox__stage"
            data-zoomed={zoomed}
            onClick={() => setZoomed((z) => !z)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.url}
              alt={activeImage.alt}
              className="okiyo-lightbox__img"
              data-zoomed={zoomed}
              style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
            />
          </div>

          {displayedImages.length > 1 ? (
            <div className="okiyo-lightbox__counter">
              {Math.min(activeIdx + 1, displayedImages.length)} /{" "}
              {displayedImages.length}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
