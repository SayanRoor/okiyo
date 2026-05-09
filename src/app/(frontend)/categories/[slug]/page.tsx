import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { payload } from "@/lib/payload";

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

export default async function CategoryPage({
  params,
  searchParams,
}: Params) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

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
    page,
    limit: 24,
    sort: "-createdAt",
    depth: 2,
  });

  return (
    <div className="container-x py-10 md:py-14">
      <nav className="text-sm text-(--muted) mb-6 flex gap-1.5">
        <Link href="/" className="hover:text-(--accent)">
          Главная
        </Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-(--accent)">
          Каталог
        </Link>
        <span>/</span>
        <span className="text-(--primary)">{category.title}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--primary)">
        {category.title}
      </h1>
      {category.description ? (
        <p className="mt-3 text-(--muted) max-w-2xl">{category.description}</p>
      ) : null}
      <p className="mt-2 text-sm text-(--muted)">
        {products.totalDocs} товаров
      </p>

      {products.docs.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.docs.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-(--muted)">
          В этой категории пока нет товаров.
        </p>
      )}
    </div>
  );
}
