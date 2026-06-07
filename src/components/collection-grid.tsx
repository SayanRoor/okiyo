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
type SortMode = "default" | "price-asc" | "price-desc";
type PriceRange = "all" | "u13" | "13to15" | "15to17" | "p17";

/**
 * Каталог OKIYO с расширенным discovery:
 *   • Категории (Все / Солнцезащитные / Имиджевые) — основная навигация
 *   • Сортировка (Новинки / Цена ↑ / Цена ↓)
 *   • Ценовой фильтр (≤13к / 13-15к / 15-17к / 17к+) — критично для KZ-mid-market,
 *     где у покупателя обычно есть конкретный потолок бюджета
 *   • «Только в наличии» — снимает sold-out из выдачи
 *
 * Гибрид infinite-scroll + Load More для подгрузки.
 */
export function CollectionGrid({
  products,
  initialVisible = 12,
  step = 8,
  initialFilter = "all",
  showFilters = true,
  autoLoadBatches = 4,
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
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [visible, setVisible] = useState(initialVisible);
  const [autoLoads, setAutoLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Полный пайплайн: фильтр по типу → фильтр по цене → фильтр по наличию → сортировка.
  const filtered = useMemo(() => {
    let arr = products;

    // Категория
    if (filter !== "all") {
      arr = arr.filter((p) => (p.type ?? "sun") === filter);
    }

    // Цена
    if (priceRange !== "all") {
      arr = arr.filter((p) => {
        const price = Number(p.price) || 0;
        switch (priceRange) {
          case "u13":
            return price <= 13_000;
          case "13to15":
            return price > 13_000 && price <= 15_000;
          case "15to17":
            return price > 15_000 && price <= 17_000;
          case "p17":
            return price > 17_000;
          default:
            return true;
        }
      });
    }

    // Наличие
    if (inStockOnly) {
      arr = arr.filter((p) => p.inStock !== false);
    }

    // Сортировка — не мутируем исходный массив.
    if (sortMode === "price-asc") {
      arr = [...arr].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortMode === "price-desc") {
      arr = [...arr].sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    // default = сохраняем порядок из payload (sort: ["order", "-createdAt"])

    return arr;
  }, [products, filter, priceRange, inStockOnly, sortMode]);

  const visibleSlice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const isSmallCatalog = filtered.length <= smallCatalogThreshold;
  const autoMode = hasMore && (isSmallCatalog || autoLoads < autoLoadBatches);

  function pickFilter(next: Filter) {
    setFilter(next);
    setVisible(initialVisible);
    setAutoLoads(0);
  }
  function pickPriceRange(next: PriceRange) {
    setPriceRange(next);
    setVisible(initialVisible);
    setAutoLoads(0);
  }
  function pickSort(next: SortMode) {
    setSortMode(next);
    setVisible(initialVisible);
    setAutoLoads(0);
  }

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
      { rootMargin: "300px 0px", threshold: 0.01 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [autoMode, step, filtered.length, visible]);

  const hasAnyFilterApplied =
    filter !== "all" ||
    priceRange !== "all" ||
    inStockOnly ||
    sortMode !== "default";

  function resetAll() {
    setFilter("all");
    setPriceRange("all");
    setInStockOnly(false);
    setSortMode("default");
    setVisible(initialVisible);
    setAutoLoads(0);
  }

  return (
    <>
      {showFilters ? (
        <div className="okiyo-catalog-filters">
          {/* Категория */}
          <div className="okiyo-catalog-filters__row">
            <div className="okiyo-catalog-filters__label">Категория</div>
            <div className="okiyo-catalog-filters__chips">
              <button
                type="button"
                className="chip"
                data-active={filter === "all"}
                onClick={() => pickFilter("all")}
              >
                Все
              </button>
              <button
                type="button"
                className="chip"
                data-active={filter === "sun"}
                onClick={() => pickFilter("sun")}
              >
                Солнцезащитные
              </button>
              <button
                type="button"
                className="chip"
                data-active={filter === "optic"}
                onClick={() => pickFilter("optic")}
              >
                Имиджевые
              </button>
            </div>
          </div>

          {/* Цена */}
          <div className="okiyo-catalog-filters__row">
            <div className="okiyo-catalog-filters__label">Цена</div>
            <div className="okiyo-catalog-filters__chips">
              <button
                type="button"
                className="chip"
                data-active={priceRange === "all"}
                onClick={() => pickPriceRange("all")}
              >
                Любая
              </button>
              <button
                type="button"
                className="chip"
                data-active={priceRange === "u13"}
                onClick={() => pickPriceRange("u13")}
              >
                до 13 000 ₸
              </button>
              <button
                type="button"
                className="chip"
                data-active={priceRange === "13to15"}
                onClick={() => pickPriceRange("13to15")}
              >
                13–15 000 ₸
              </button>
              <button
                type="button"
                className="chip"
                data-active={priceRange === "15to17"}
                onClick={() => pickPriceRange("15to17")}
              >
                15–17 000 ₸
              </button>
              <button
                type="button"
                className="chip"
                data-active={priceRange === "p17"}
                onClick={() => pickPriceRange("p17")}
              >
                17 000+ ₸
              </button>
            </div>
          </div>

          {/* Сортировка + наличие */}
          <div className="okiyo-catalog-filters__row okiyo-catalog-filters__row--split">
            <div className="okiyo-catalog-filters__sort">
              <span className="okiyo-catalog-filters__label">Сортировка</span>
              <select
                className="okiyo-catalog-filters__select"
                value={sortMode}
                onChange={(e) => pickSort(e.target.value as SortMode)}
                aria-label="Сортировка моделей"
              >
                <option value="default">По новизне</option>
                <option value="price-asc">Цена: дешевле</option>
                <option value="price-desc">Цена: дороже</option>
              </select>
            </div>
            <label className="okiyo-catalog-filters__toggle">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setVisible(initialVisible);
                  setAutoLoads(0);
                }}
              />
              <span>Только в наличии</span>
            </label>
            {hasAnyFilterApplied ? (
              <button
                type="button"
                className="okiyo-catalog-filters__reset"
                onClick={resetAll}
              >
                Сбросить
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {visibleSlice.length === 0 ? (
        <div
          className="text-center py-16"
          style={{ color: "var(--muted)", fontSize: 13 }}
        >
          {hasAnyFilterApplied
            ? "Под выбранные фильтры моделей не нашлось. Попробуйте смягчить условия."
            : "Моделей пока нет — добавьте первую через админ-панель."}
        </div>
      ) : (
        <div className="okiyo-grid">
          {visibleSlice.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {autoMode ? (
        <div
          ref={sentinelRef}
          aria-hidden
          style={{ height: 1, width: "100%", marginTop: 32 }}
        />
      ) : null}

      {autoMode ? (
        <div className="flex justify-center pt-10 pb-2">
          <span className="okiyo-grid-spinner" aria-hidden />
        </div>
      ) : null}

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
