"use client";

import { useMemo, useState } from "react";

import { ProductCard } from "@/components/product-card";

type Color = { hex: string; name?: string | null };
type Product = {
  id: string | number;
  slug: string;
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

export function CollectionGrid({
  products,
  initialVisible = 8,
  step = 4,
  initialFilter = "all",
  showFilters = true,
}: {
  products: Product[];
  initialVisible?: number;
  step?: number;
  initialFilter?: Filter;
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [visible, setVisible] = useState(initialVisible);

  const filtered = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => (p.type ?? "sun") === filter);
  }, [products, filter]);

  const visibleSlice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  function pick(next: Filter) {
    setFilter(next);
    setVisible(initialVisible);
  }

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
              Оптические
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

      {hasMore ? (
        <div className="flex justify-center pt-16 pb-6">
          <button
            type="button"
            onClick={() => setVisible((v) => v + step)}
            className="px-8 py-3.5 border bg-transparent cursor-pointer transition-colors"
            style={{
              borderColor: "var(--line)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "var(--muted)",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--ink)";
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--line)";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            Показать ещё
          </button>
        </div>
      ) : null}
    </>
  );
}
