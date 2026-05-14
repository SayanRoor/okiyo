import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadForm } from "@/components/lead-form";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { formatPrice, sanitizePhone } from "@/lib/format";
import { payload } from "@/lib/payload";
import { RichText } from "@payloadcms/richtext-lexical/react";

export const dynamic = "force-dynamic";

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
  const productRaw = result.docs[0];
  if (!productRaw) notFound();

  // Локальный супертип — учитывает поля, добавленные в схему
  // (после `pnpm payload generate:types` они появятся в payload-types.ts).
  const product = productRaw as typeof productRaw & {
    subtitle?: string | null;
    type?: "sun" | "optic" | null;
    badge?: string | null;
    colors?: { hex: string; name?: string | null }[] | null;
    photos?: unknown[] | null;
    kit?: string | null;
  };

  const settings = await p.findGlobal({ slug: "settings" });
  const whatsapp = sanitizePhone(settings.whatsapp);

  const typeLabel =
    product.type === "optic" ? "Оптические" : "Солнцезащитные";

  // Список похожих — приоритетно по type, иначе по category.
  type RelatedFilter = { type: { equals: string } } | { category: { equals: number } };
  const relatedWhere: RelatedFilter | null = product.type
    ? { type: { equals: product.type } }
    : product.category
      ? {
          category: {
            equals:
              typeof product.category === "object"
                ? product.category.id
                : product.category,
          },
        }
      : null;

  const related = relatedWhere
    ? await p.find({
        collection: "products",
        where: {
          and: [
            { isPublished: { equals: true } },
            { id: { not_equals: product.id } },
            relatedWhere as import("payload").Where,
          ],
        },
        limit: 4,
        sort: ["order", "-createdAt"],
        depth: 2,
      })
    : null;

  const waText = encodeURIComponent(
    `Здравствуйте! Интересует модель ${product.title} (${formatPrice(product.price)}).`,
  );

  return (
    <div className="container-x py-10 md:py-16">
      <nav
        className="text-sm mb-8 flex flex-wrap gap-1.5"
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
        <span style={{ color: "var(--ink)" }}>{product.title}</span>
      </nav>

      <div className="okiyo-product-grid">
        {/* Галерея с миниатюрами и кликом по цветам */}
        <ProductGallery
          productTitle={product.title}
          mainImage={product.mainImage}
          photos={product.photos}
          gallery={product.gallery}
          colors={
            product.colors as
              | {
                  id?: string | null;
                  name: string;
                  hex: string;
                  stock?: number | null;
                  image?: unknown;
                }[]
              | null
              | undefined
          }
        />

        {/* Инфо-колонка — sticky на десктопе */}
        <div className="okiyo-product-info">
          <div className="eyebrow mb-3">{typeLabel}</div>
          <h1
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 300,
              fontSize: "clamp(36px, 4.4vw, 56px)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {product.title}
          </h1>
          {product.subtitle ? (
            <div
              className="mt-2"
              style={{
                fontSize: 12,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              {product.subtitle}
            </div>
          ) : null}

          <div className="mt-8 flex items-baseline gap-3">
            <span
              style={{
                // Цена в sans — convention для e-commerce. Cormorant
                // у цены делает её декоративной, а должна быть функциональной.
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: "var(--ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && product.oldPrice > product.price ? (
              <span
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontSize: 15,
                  color: "var(--muted)",
                  textDecoration: "line-through",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatPrice(product.oldPrice)}
              </span>
            ) : null}
          </div>

          {/* Цветовые swatch'и теперь живут в <ProductGallery>, чтобы клик по ним менял главное фото. */}

          {product.shortDescription ? (
            <p
              className="mt-7"
              style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 14 }}
            >
              {product.shortDescription}
            </p>
          ) : null}

          {(() => {
            // Только спеки с непустым значением (defaultValue ставит пустые слоты).
            const specs = (product.specifications ?? []).filter(
              (s): s is { name: string; value: string } =>
                Boolean(s?.name) && Boolean(s?.value && String(s.value).trim()),
            );
            if (specs.length === 0) return null;
            return (
              <div className="mt-12">
                <div className="eyebrow mb-5">Характеристики</div>
                <dl className="okiyo-specs">
                  {specs.map((s, i) => (
                    <div key={i} className="okiyo-specs__cell">
                      <dt className="okiyo-specs__label">{s.name}</dt>
                      <dd className="okiyo-specs__value">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })()}

          {product.kit ? (
            <p
              className="mt-5"
              style={{
                fontSize: 12,
                color: "var(--muted)",
                letterSpacing: "0.04em",
              }}
            >
              {product.kit}
            </p>
          ) : null}

          <div className="mt-12 flex flex-wrap gap-3">
            {whatsapp ? (
              <a
                className="btn btn-primary"
                href={`https://wa.me/${whatsapp}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Заказать ${product.title} в WhatsApp`}
                style={{
                  opacity: product.inStock === false ? 0.55 : 1,
                  pointerEvents: product.inStock === false ? "none" : "auto",
                }}
              >
                {product.inStock === false
                  ? "Нет в наличии"
                  : "Заказать в WhatsApp"}
              </a>
            ) : null}
            <a className="btn btn-ghost" href="#lead-form">
              Перезвоните мне
            </a>
          </div>

          <div
            id="lead-form"
            className="mt-14 pt-10 scroll-mt-24"
            style={{
              borderTop: "1px solid var(--line)",
            }}
          >
            <div className="eyebrow mb-3">Уточнить наличие</div>
            <p
              className="mb-5"
              style={{
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.6,
                maxWidth: 360,
              }}
            >
              Менеджер перезвонит, расскажет про доставку и примерку.
            </p>
            <LeadForm productId={product.id} />
          </div>
        </div>
      </div>

      {product.description ? (
        <section className="mt-16 max-w-3xl">
          <div className="eyebrow mb-4">Описание</div>
          <div
            className="prose prose-neutral max-w-none"
            style={{ color: "var(--ink)", fontSize: 15, lineHeight: 1.8 }}
          >
            <RichText data={product.description} />
          </div>
        </section>
      ) : null}

      {related && related.docs.length > 0 ? (
        <section className="mt-20">
          <div className="eyebrow mb-3">Похожие модели</div>
          <h2
            className="mb-8"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 300,
              fontSize: "clamp(28px, 3.4vw, 44px)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            Ещё из коллекции
          </h2>
          <div className="okiyo-grid">
            {related.docs.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
