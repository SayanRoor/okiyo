import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadForm } from "@/components/lead-form";
import { ProductCard } from "@/components/product-card";
import { formatPrice, mediaAlt, mediaUrl } from "@/lib/format";
import { payload } from "@/lib/payload";
import { RichText } from "@payloadcms/richtext-lexical/react";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const p = await payload();
  const r = await p.find({
    collection: "products",
    where: {
      and: [
        { slug: { equals: slug } },
        { isPublished: { equals: true } },
      ],
    },
    limit: 1,
  });
  const product = r.docs[0];
  if (!product) return {};
  return {
    title: product.title,
    description: product.shortDescription ?? undefined,
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const p = await payload();
  const result = await p.find({
    collection: "products",
    where: {
      and: [
        { slug: { equals: slug } },
        { isPublished: { equals: true } },
      ],
    },
    limit: 1,
    depth: 2,
  });
  const product = result.docs[0];
  if (!product) notFound();

  const main = mediaUrl(product.mainImage, "hero");
  const mainAlt = mediaAlt(product.mainImage) || product.title;
  const gallery = (product.gallery ?? [])
    .map((g: { image?: unknown }) => ({
      url: mediaUrl(g.image, "card"),
      alt: mediaAlt(g.image),
    }))
    .filter((g: { url: string | null }) => g.url);

  const category =
    typeof product.category === "object" && product.category
      ? product.category
      : null;

  const related = category
    ? await p.find({
        collection: "products",
        where: {
          and: [
            { isPublished: { equals: true } },
            { id: { not_equals: product.id } },
            {
              category: {
                equals:
                  typeof product.category === "object"
                    ? product.category.id
                    : product.category,
              },
            },
          ],
        },
        limit: 4,
        sort: "-createdAt",
        depth: 2,
      })
    : null;

  return (
    <div className="container-x py-10 md:py-14">
      <nav className="text-sm text-(--muted) mb-6 flex flex-wrap gap-1.5">
        <Link href="/" className="hover:text-(--accent)">
          Главная
        </Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-(--accent)">
          Каталог
        </Link>
        {category ? (
          <>
            <span>/</span>
            <Link
              href={`/categories/${category.slug}`}
              className="hover:text-(--accent)"
            >
              {category.title}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-(--primary)">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          {main ? (
            <div className="relative aspect-square rounded-xl overflow-hidden border border-(--border) bg-(--card)">
              <Image
                src={main}
                alt={mainAlt}
                fill
                priority
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          {gallery.length > 0 ? (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.map((g, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border border-(--border) bg-(--card)"
                >
                  {g.url ? (
                    <Image
                      src={g.url}
                      alt={g.alt}
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--primary)">
            {product.title}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-(--primary)">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price ? (
              <span className="text-lg text-(--muted) line-through">
                {formatPrice(product.oldPrice)}
              </span>
            ) : null}
          </div>

          {product.sku ? (
            <div className="mt-2 text-sm text-(--muted)">
              Артикул: {product.sku}
            </div>
          ) : null}

          {product.shortDescription ? (
            <p className="mt-6 text-(--muted)">{product.shortDescription}</p>
          ) : null}

          {product.specifications && product.specifications.length > 0 ? (
            <dl className="mt-8 divide-y divide-(--border) border-y border-(--border)">
              {product.specifications.map(
                (s: { name: string; value: string }, i: number) => (
                  <div key={i} className="grid grid-cols-2 py-2.5 text-sm">
                    <dt className="text-(--muted)">{s.name}</dt>
                    <dd className="text-(--primary)">{s.value}</dd>
                  </div>
                ),
              )}
            </dl>
          ) : null}

          <div className="mt-8 rounded-xl border border-(--border) bg-(--card) p-6">
            <div className="text-lg font-medium text-(--primary)">
              Заказать или уточнить наличие
            </div>
            <p className="text-sm text-(--muted) mt-1 mb-4">
              Менеджер перезвонит, расскажет про доставку и сборку.
            </p>
            <LeadForm productId={product.id} />
          </div>
        </div>
      </div>

      {product.description ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-xl font-semibold text-(--primary) mb-4">
            Описание
          </h2>
          <div className="prose prose-neutral max-w-none">
            <RichText data={product.description} />
          </div>
        </section>
      ) : null}

      {related && related.docs.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-(--primary) mb-6">
            Похожие товары
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {related.docs.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
