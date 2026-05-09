import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { payload } from "@/lib/payload";

export const metadata = {
  title: "Каталог",
  description: "Каталог мебели — диваны, кровати, столы и аксессуары.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  const p = await payload();
  const [products, categories] = await Promise.all([
    p.find({
      collection: "products",
      where: { isPublished: { equals: true } },
      page,
      limit: 24,
      sort: "-createdAt",
      depth: 2,
    }),
    p.find({ collection: "categories", sort: "order", limit: 100 }),
  ]);

  return (
    <div className="container-x py-10 md:py-14">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--primary)">
            Каталог
          </h1>
          <p className="mt-2 text-(--muted)">
            {products.totalDocs > 0
              ? `${products.totalDocs} товаров`
              : "Каталог пока пуст — первые товары появятся скоро."}
          </p>
        </div>
        {categories.docs.length > 0 ? (
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/catalog"
              className="text-sm rounded-full border border-(--border) px-3 py-1.5 hover:border-(--accent) hover:text-(--accent) transition"
            >
              Все
            </Link>
            {categories.docs.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="text-sm rounded-full border border-(--border) px-3 py-1.5 hover:border-(--accent) hover:text-(--accent) transition"
              >
                {c.title}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      {products.docs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.docs.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}

      {products.totalPages > 1 ? (
        <Pagination
          page={products.page ?? 1}
          totalPages={products.totalPages}
          basePath="/catalog"
        />
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  return (
    <div className="mt-10 flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          href={n === 1 ? basePath : `${basePath}?page=${n}`}
          aria-current={n === page ? "page" : undefined}
          className={
            "min-w-9 h-9 inline-flex items-center justify-center rounded-md border text-sm transition " +
            (n === page
              ? "border-(--accent) bg-(--accent) text-white"
              : "border-(--border) hover:border-(--accent)")
          }
        >
          {n}
        </Link>
      ))}
    </div>
  );
}
