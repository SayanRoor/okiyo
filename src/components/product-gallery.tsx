"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  isVideoMedia,
  mediaAlt,
  mediaMime,
  mediaRawUrl,
  mediaUrl,
} from "@/lib/format";

type MediaKind = "image" | "video";

type GalleryItem = {
  url: string;
  /** thumb-URL (для миниатюр и lightbox-counter). У видео нет — null. */
  thumb: string | null;
  alt: string;
  kind: MediaKind;
  mime: string;
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

function toItem(media: unknown, fallbackAlt: string): GalleryItem | null {
  if (!media || typeof media !== "object") return null;
  const isVideo = isVideoMedia(media);
  // У видео нет image-sizes — берём исходный URL.
  // У картинок — hero-resized, чтобы не качать оригинал.
  const url = isVideo ? mediaRawUrl(media) : mediaUrl(media, "hero");
  if (!url) return null;
  return {
    url,
    thumb: isVideo ? null : mediaUrl(media, "card") ?? mediaUrl(media, "hero"),
    alt: mediaAlt(media) || fallbackAlt,
    kind: isVideo ? "video" : "image",
    mime: mediaMime(media),
  };
}

export function ProductGallery({
  productTitle,
  mainImage,
  gallery,
  photos,
  colors,
}: ProductGalleryProps) {
  // --------- Сборка всех медиа в один массив ---------
  const allItems: GalleryItem[] = useMemo(() => {
    const list: GalleryItem[] = [];
    let counter = 0;
    const push = (media: unknown) => {
      const it = toItem(media, `${productTitle} — ${++counter}`);
      if (it) list.push(it);
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
  const colorItem =
    activeColorIdx >= 0
      ? toItem(
          safeColors[activeColorIdx]?.image,
          `${productTitle} — ${safeColors[activeColorIdx]?.name}`,
        )
      : null;

  // --------- Активная позиция ---------
  const [activeIdx, setActiveIdx] = useState(0);
  const displayedItems: GalleryItem[] = colorItem ? [colorItem] : allItems;
  const activeItem =
    displayedItems[Math.min(activeIdx, displayedItems.length - 1)];

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
    setActiveIdx((i) => (i + 1) % displayedItems.length);
    setZoomed(false);
  }, [displayedItems.length]);
  const prev = useCallback(() => {
    setActiveColorIdx(-1);
    setActiveIdx((i) => (i - 1 + displayedItems.length) % displayedItems.length);
    setZoomed(false);
  }, [displayedItems.length]);

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

  // --------- Мобильная карусель ---------
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const onMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== activeIdx) setActiveIdx(i);
  }, [activeIdx]);

  if (displayedItems.length === 0) {
    return (
      <div
        className="aspect-square"
        style={{ background: "var(--card)" }}
      />
    );
  }

  return (
    <>
      {/* DESKTOP: миниатюры | главное медиа */}
      <div className="okiyo-gallery hidden md:grid">
        <div className="okiyo-gallery__thumbs">
          {displayedItems.map((it, idx) => (
            <button
              key={`${it.url}-${idx}`}
              type="button"
              onClick={() => selectThumb(idx)}
              aria-label={`Показать ${it.kind === "video" ? "видео" : "фото"} ${idx + 1}`}
              aria-pressed={idx === activeIdx}
              data-active={idx === activeIdx}
              className="okiyo-gallery__thumb"
            >
              {it.kind === "video" ? (
                <>
                  <video
                    src={it.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="okiyo-gallery__thumb-media"
                  />
                  <span className="okiyo-gallery__play" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </>
              ) : (
                <Image
                  src={it.thumb ?? it.url}
                  alt={it.alt}
                  fill
                  sizes="100px"
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={openLightbox}
          className="okiyo-gallery__main"
          aria-label={
            activeItem?.kind === "video"
              ? "Открыть видео на весь экран"
              : "Открыть фото на весь экран"
          }
        >
          {activeItem ? (
            activeItem.kind === "video" ? (
              <video
                key={activeItem.url}
                src={activeItem.url}
                className="okiyo-gallery__main-media"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activeItem.url}
                alt={activeItem.alt}
                className="okiyo-gallery__main-media"
                loading="eager"
              />
            )
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
          {displayedItems.map((it, idx) => (
            <button
              key={`${it.url}-${idx}`}
              type="button"
              onClick={openLightbox}
              className="okiyo-gallery__mobile-slide"
              aria-label={
                it.kind === "video"
                  ? `Видео ${idx + 1}, тап чтобы открыть`
                  : `Фото ${idx + 1}, тап чтобы увеличить`
              }
            >
              {it.kind === "video" ? (
                <video
                  src={it.url}
                  className="okiyo-gallery__main-media"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={it.url}
                  alt={it.alt}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="okiyo-gallery__main-media"
                />
              )}
            </button>
          ))}
        </div>
        {displayedItems.length > 1 ? (
          <div className="okiyo-gallery__dots">
            {displayedItems.map((_, i) => (
              <span key={i} data-active={i === activeIdx} aria-hidden />
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
      {lightboxOpen && activeItem ? (
        <div
          className="okiyo-lightbox"
          role="dialog"
          aria-modal
          aria-label="Просмотр"
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

          {displayedItems.length > 1 ? (
            <>
              <button
                type="button"
                className="okiyo-lightbox__nav okiyo-lightbox__nav--prev"
                onClick={prev}
                aria-label="Предыдущее"
              >
                ‹
              </button>
              <button
                type="button"
                className="okiyo-lightbox__nav okiyo-lightbox__nav--next"
                onClick={next}
                aria-label="Следующее"
              >
                ›
              </button>
            </>
          ) : null}

          <div
            className="okiyo-lightbox__stage"
            data-zoomed={zoomed}
            onClick={() => activeItem.kind === "image" && setZoomed((z) => !z)}
          >
            {activeItem.kind === "video" ? (
              <video
                key={activeItem.url}
                src={activeItem.url}
                className="okiyo-lightbox__media"
                autoPlay
                loop
                playsInline
                controls
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={activeItem.url}
                alt={activeItem.alt}
                className="okiyo-lightbox__media"
                data-zoomed={zoomed}
                style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
              />
            )}
          </div>

          {displayedItems.length > 1 ? (
            <div className="okiyo-lightbox__counter">
              {Math.min(activeIdx + 1, displayedItems.length)} /{" "}
              {displayedItems.length}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
