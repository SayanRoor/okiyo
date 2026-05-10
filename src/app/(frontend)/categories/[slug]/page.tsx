import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionGrid } from "@/components/collection-grid";
import { payload } from "@/lib/payload";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const p = await payload();
  const r = await p.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const c = r.docs[0];
  if (!c) return {};
  return {
    title: c.title,
    description: c.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;

  const p = await payload();
  const catRes = await p.find({
    collection: "categories",
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const category = catRes.docs[0];
  if (!category) notFound();

  const products = await p.find({
    collection: "products",
    where: {
      and: [
        { isPublished: { equals: true } },
        { category: { equals: category.id } },
      ],
    },
    limit: 200,
    sort: ["order", "-createdAt"],
    depth: 2,
  });

  return (
    <div className="container-x py-12 md:py-20">
      <nav
        className="text-sm mb-8 flex gap-1.5"
        style={{ color: "var(--muted)" }}
      >
        <Link href="/" className="hover:opacity-60 transition-opacity">
          Главная
        </Link>
        <span>/</span>
        <Link href="/catalog" className="hover:opacity-60 transition-opacity">
          Каталог
        </Link>
        <span>/</span>
        <span style={{ color: "var(--ink)" }}>{category.title}</span>
      </nav>

      <header className="mb-10">
        <div className="eyebrow mb-3">
          {products.totalDocs} {pluralRu(products.totalDocs, ["модель", "модели", "моделей"])}
        </div>
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
          {category.title}
        </h1>
        {category.description ? (
          <p
            className="mt-4 max-w-2xl"
            style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 14 }}
          >
            {category.description}
          </p>
        ) : null}
      </header>

      <CollectionGrid
        products={products.docs}
        initialVisible={12}
        step={8}
        showFilters={false}
      />
    </div>
  );
}

function pluralRu(n: number, forms: [string, string, string]) {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}
