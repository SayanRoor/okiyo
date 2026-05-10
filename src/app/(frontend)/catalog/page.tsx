import { CollectionGrid } from "@/components/collection-grid";
import { payload } from "@/lib/payload";

export const metadata = {
  title: "Каталог",
  description: "Коллекция OKIYO — японские очки разных форм оправ.",
};
export const dynamic = "force-dynamic";

type Filter = "all" | "sun" | "optic";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const initialFilter: Filter =
    sp.type === "sun" || sp.type === "optic" ? sp.type : "all";

  const p = await payload();
  const products = await p.find({
    collection: "products",
    where: { isPublished: { equals: true } },
    limit: 200,
    sort: ["order", "-createdAt"],
    depth: 2,
  });

  return (
    <div className="container-x py-12 md:py-20">
      <header className="mb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow mb-3">Каталог · {products.totalDocs} моделей</div>
          <h1
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 300,
              fontSize: "clamp(36px, 5vw, 64px)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            Коллекция
          </h1>
        </div>
      </header>

      <CollectionGrid
        products={products.docs}
        initialFilter={initialFilter}
        initialVisible={12}
        step={8}
      />
    </div>
  );
}
