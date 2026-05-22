"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ProductCard } from "@/components/product-card";

type Color = { hex: string; name?: string | null };
type Product = {
  id: string | number;
  slug?: string | null;
  title: string;
  subtitle?: string | null;
  price: number;
  oldPrice?: number | null;
  badge?: string | null;
  type?: string | null;
  colors?: Color[] | null;
  mainImage?: unknown;
  inStock?: boolean | null;
};

type Filter = "all" | "sun" | "optic";

/**
 * Гибрид infinite-scroll + Load More — best-practice для премиум e-commerce
 * (Saint Laurent, Toteme, NET-A-PORTER, Mr Porter).
 *
 * Логика:
 *   • Первые N товаров видны сразу.
 *   • IntersectionObserver на сторож-элементе в конце сетки: когда юзер
 *     доскроллил — подгружаем следующий батч АВТОМАТИЧЕСКИ.
 *   • После `autoLoadBatches` авто-загрузок показываем явную кнопку
 *     «Показать ещё». Это критично: без неё юзер не доберётся до футера
 *     (доставка, гарантии, контакты — обязательные элементы доверия).
 *   • Счётчик «X из Y моделей» — premium-паттерн: даёт чувство масштаба
 *     коллекции и понимание «сколько ещё».
 *
 * Почему НЕ pure infinite scroll:
 *   – футер становится недостижим (Baymard: 95% e-commerce-юзеров его ищут);
 *   – back-button из карточки товара возвращает на верх каталога;
 *   – глубокий список превращается в «вечную ленту» без понимания позиции;
 *   – Google не индексирует JS-доскроленный контент.
 */
export function CollectionGrid({
  products,
  initialVisible = 8,
  step = 8,
  initialFilter = "all",
  showFilters = true,
  /** Сколько авто-подгрузок до показа кнопки (для больших каталогов). */
  autoLoadBatches = 4,
  /** Каталог считается «небольшим», если в нём не больше этого числа моделей.
   *  Для небольших — авто-скролл до конца без кнопки. */
  smallCatalogThreshold = 40,
}: {
  products: Product[];
  initialVisible?: number;
  step?: number;
  initialFilter?: Filter;
  showFilters?: boolean;
  autoLoadBatches?: number;
  smallCatalogThreshold?: number;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [visible, setVisible] = useState(initialVisible);
  // Счётчик авто-загрузок — для больших каталогов после `autoLoadBatches`
  // отключаем observer и показываем явную кнопку, чтобы был доступ к футеру.
  const [autoLoads, setAutoLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => (p.type ?? "sun") === filter);
  }, [products, filter]);

  const visibleSlice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  // Для небольших каталогов (<= 40 моделей) — авто-скролл до самого конца:
  // кнопка не нужна, юзер просто доскроллит. Для больших — после N батчей
  // включаем ручной режим (защищаем доступ к футеру + не грузим 200 DOM-узлов).
  const isSmallCatalog = filtered.length <= smallCatalogThreshold;
  const autoMode = hasMore && (isSmallCatalog || autoLoads < autoLoadBatches);

  function pick(next: Filter) {
    setFilter(next);
    setVisible(initialVisible);
    setAutoLoads(0);
  }

  // IntersectionObserver — следит за сентинелем под сеткой. Когда он
  // показывается во вьюпорте — подгружаем следующий батч.
  useEffect(() => {
    if (!autoMode) return;
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisible((v) => Math.min(v + step, filtered.length));
          setAutoLoads((n) => n + 1);
        }
      },
      {
        // Чуть с запасом — товары начинают грузиться до того, как юзер
        // долистал ровно до конца. Ощущение «бесконечности».
        rootMargin: "300px 0px",
        threshold: 0.01,
      },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [autoMode, step, filtered.length, visible]);

  return (
    <>
      {showFilters ? (
        <div
          className="flex justify-between items-center py-4 border-y mb-9 flex-wrap gap-3"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              className="chip"
              data-active={filter === "all"}
              onClick={() => pick("all")}
            >
              Все
            </button>
            <button
              type="button"
              className="chip"
              data-active={filter === "sun"}
              onClick={() => pick("sun")}
            >
              Солнцезащитные
            </button>
            <button
              type="button"
              className="chip"
              data-active={filter === "optic"}
              onClick={() => pick("optic")}
            >
              Имиджевые
            </button>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Сортировка:{" "}
            <span style={{ color: "var(--ink)" }}>по новизне ↓</span>
          </div>
        </div>
      ) : null}

      {visibleSlice.length === 0 ? (
        <div
          className="text-center py-16"
          style={{ color: "var(--muted)", fontSize: 13 }}
        >
          Моделей пока нет — добавьте первую через админ-панель.
        </div>
      ) : (
        <div className="okiyo-grid">
          {visibleSlice.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {/* Сентинель — невидимый «маяк» под сеткой. IntersectionObserver
          ловит его пересечение со вьюпортом и триггерит подгрузку. */}
      {autoMode ? (
        <div
          ref={sentinelRef}
          aria-hidden
          style={{ height: 1, width: "100%", marginTop: 32 }}
        />
      ) : null}

      {/* Авто-режим: спиннер пока новый батч "грузится" (на самом деле — мгновенно,
          но визуальный сигнал улучшает воспринимаемую плавность). */}
      {autoMode ? (
        <div className="flex justify-center pt-10 pb-2">
          <span className="okiyo-grid-spinner" aria-hidden />
        </div>
      ) : null}

      {/* Ручной режим: после N авто-подгрузок — явная кнопка «Показать ещё». */}
      {hasMore && !autoMode ? (
        <div className="flex justify-center pt-16 pb-2">
          <button
            type="button"
            onClick={() => setVisible((v) => Math.min(v + step, filtered.length))}
            className="okiyo-loadmore"
          >
            Показать ещё
            <span style={{ marginLeft: 8, opacity: 0.55 }}>
              +{Math.min(step, filtered.length - visible)}
            </span>
          </button>
        </div>
      ) : null}

      {/* Счётчик «X из Y моделей» — даёт чувство масштаба коллекции,
          подтверждает что «всё» показано когда hasMore=false. */}
      {filtered.length > 0 ? (
        <div
          className="flex justify-center pt-6 pb-2"
          style={{
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {hasMore
            ? `${visibleSlice.length} из ${filtered.length} моделей`
            : `Все ${filtered.length} моделей показаны`}
        </div>
      ) : null}
    </>
  );
}
