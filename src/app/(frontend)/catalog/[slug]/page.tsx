import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadForm } from "@/components/lead-form";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { TryOnButton } from "@/components/try-on-button";
import { formatPrice, sanitizePhone } from "@/lib/format";
import { payload } from "@/lib/payload";
import { RichText } from "@payloadcms/richtext-lexical/react";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  // `try=1` приходит из hero-кнопки на главной — автоматически открывает
  // модалку виртуальной примерки, без лишнего клика.
  searchParams?: Promise<{ try?: string }>;
};

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

export default async function ProductPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const autoOpenTryOn = sp?.try === "1";
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
    tryOnImage?: unknown;
    enableTryOn?: boolean | null;
  };

  const settings = await p.findGlobal({ slug: "settings" });
  const whatsapp = sanitizePhone(settings.whatsapp);
  // URL прозрачного PNG для виртуальной примерки (если менеджер загрузил)
  const tryOnUrl =
    product.tryOnImage && typeof product.tryOnImage === "object"
      ? ((product.tryOnImage as { url?: string | null }).url ?? null)
      : null;
  // Кнопка примерки появляется ТОЛЬКО при двух условиях:
  //  1) менеджер включил тоггл «Включить кнопку» в админке (enableTryOn = true)
  //  2) загружено PNG оправы на прозрачном фоне (tryOnImage)
  const tryOnEnabled = Boolean(product.enableTryOn) && Boolean(tryOnUrl);

  // Все модели с активной VTO — для боковой карусели внутри модалки,
  // чтобы юзер мог переключаться между оправами не выходя из примерки.
  // Если есть текущая модель — она первая в списке (activated by default).
  type VtoFrame = {
    id: number | string;
    slug: string;
    title: string;
    overlaySrc: string;
    thumbSrc?: string | null;
    price?: number | null;
  };
  let tryOnFrames: VtoFrame[] = [];
  if (tryOnEnabled) {
    const all = await p.find({
      collection: "products",
      where: {
        and: [
          { isPublished: { equals: true } },
          { enableTryOn: { equals: true } },
          { tryOnImage: { exists: true } },
        ],
      },
      limit: 30,
      sort: ["order", "-createdAt"],
      depth: 1,
    });
    const raw: VtoFrame[] = all.docs
      .map((d) => {
        const doc = d as typeof d & {
          tryOnImage?: unknown;
          mainImage?: unknown;
        };
        const overlay =
          doc.tryOnImage && typeof doc.tryOnImage === "object"
            ? ((doc.tryOnImage as { url?: string | null }).url ?? null)
            : null;
        if (!overlay) return null;
        const main =
          doc.mainImage && typeof doc.mainImage === "object"
            ? ((doc.mainImage as { sizes?: { thumbnail?: { url?: string } }; url?: string })
                .sizes?.thumbnail?.url ??
              (doc.mainImage as { url?: string }).url ??
              null)
            : null;
        return {
          id: doc.id,
          slug: doc.slug,
          title: doc.title,
          overlaySrc: overlay,
          thumbSrc: main,
          price: doc.price ?? null,
        } as VtoFrame;
      })
      .filter((x): x is VtoFrame => x !== null);

    // Текущий товар — первым, остальные сохраняют свой order.
    const cur = raw.find((f) => f.id === product.id);
    const others = raw.filter((f) => f.id !== product.id);
    tryOnFrames = cur ? [cur, ...others] : raw;
  }

  // Проверяем lexical-описание на «реальное» содержимое.
  // Пустой редактор сохраняет валидный JSON ({root:{children:[{type:'paragraph',children:[]}]}}),
  // который truthy, но рендерится пустотой — поэтому проверяем структуру.
  const hasRichDescription = hasLexicalContent(product.description);

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

  const soldOut = product.inStock === false;
  const waText = encodeURIComponent(
    soldOut
      ? `Здравствуйте! Хочу узнать когда модель ${product.title} снова появится в наличии.`
      : `Здравствуйте! Интересует модель ${product.title} (${formatPrice(product.price)}).`,
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
              // Tenor Sans uppercase — echo логотипа OKIYO и значений спек.
              // Saint Laurent / Mykita / Cubitts именно так делают название
              // товара: единый brand voice, без декоративного Cormorant.
              fontFamily: "var(--font-logo), 'Optima', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(28px, 3.4vw, 40px)",
              lineHeight: 1,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
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

          <div className="mt-8 flex items-baseline gap-3 flex-wrap">
            <span
              style={{
                // Цена в sans — convention для e-commerce. Cormorant
                // у цены делает её декоративной, а должна быть функциональной.
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: soldOut ? "var(--muted)" : "var(--ink)",
                fontVariantNumeric: "tabular-nums",
                textDecoration: soldOut ? "line-through" : undefined,
              }}
            >
              {formatPrice(product.price)}
            </span>
            {!soldOut && product.oldPrice && product.oldPrice > product.price ? (
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
            {soldOut ? (
              <span className="chip-soldout chip-soldout--inline">
                Sold out
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

          {/* Полное описание — accordion в info-колонке, как у Cubitts /
              Toteme / Saint Laurent. По умолчанию РАСКРЫТ (атрибут open),
              чтобы менеджер сразу видел, что описание подцепилось, и клиент
              мог прочитать ключевую информацию без лишних кликов. Свернуть
              можно вручную — нативный <details>. */}
          {hasRichDescription && product.description ? (
            <details className="okiyo-accordion mt-10" open>
              <summary className="okiyo-accordion__summary">
                <span className="eyebrow">Описание</span>
                <span className="okiyo-accordion__chevron" aria-hidden>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div
                className="okiyo-accordion__body prose prose-neutral max-w-none"
                style={{
                  color: "var(--ink)",
                  fontSize: 14,
                  lineHeight: 1.75,
                }}
              >
                <RichText data={product.description} />
              </div>
            </details>
          ) : null}

          <div className="mt-12 flex flex-wrap gap-3">
            {soldOut ? (
              /* SOLD OUT — основной CTA меняется на «уведомить о поступлении».
                 Цель не потерять интерес: модель разобрана → лид-форма ниже. */
              <a className="btn btn-primary" href="#lead-form">
                <span>Сообщить о поступлении</span>
                <span className="arrow" aria-hidden>
                  →
                </span>
              </a>
            ) : whatsapp ? (
              <a
                className="btn btn-primary"
                href={`https://wa.me/${whatsapp}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`Заказать ${product.title} в WhatsApp`}
              >
                Заказать в WhatsApp
              </a>
            ) : null}

            {tryOnEnabled && tryOnFrames.length > 0 ? (
              <TryOnButton
                frames={tryOnFrames}
                initialId={product.id}
                label="Примерить онлайн"
                defaultOpen={autoOpenTryOn}
              />
            ) : !soldOut ? (
              <a className="btn btn-ghost" href="#lead-form">
                Перезвоните мне
              </a>
            ) : whatsapp ? (
              /* В sold-out режиме вторая кнопка — WhatsApp для прямого вопроса
                 продавцу (а не лид-форма дублём) */
              <a
                className="btn btn-ghost"
                href={`https://wa.me/${whatsapp}?text=${waText}`}
                target="_blank"
                rel="noreferrer"
              >
                Написать в WhatsApp
              </a>
            ) : null}
          </div>

          <div
            id="lead-form"
            className="mt-14 pt-10 scroll-mt-24"
            style={{
              borderTop: "1px solid var(--line)",
            }}
          >
            <div className="eyebrow mb-3">
              {soldOut ? "Уведомить о поступлении" : "Уточнить наличие"}
            </div>
            <p
              className="mb-5"
              style={{
                fontSize: 13,
                color: "var(--muted)",
                lineHeight: 1.6,
                maxWidth: 360,
              }}
            >
              {soldOut
                ? "Модель разобрана. Оставьте номер — мы напишем, как только она снова появится в наличии."
                : "Менеджер перезвонит, расскажет про доставку и примерку."}
            </p>
            <LeadForm productId={product.id} />
          </div>
        </div>
      </div>

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

/**
 * Проверяет, что lexical-JSON содержит непустое описание.
 * Пустой редактор сохраняет `{root:{children:[{type:'paragraph',children:[]}]}}`
 * — это truthy, но `<RichText>` нарисует пустоту. Прокручиваем дерево и ищем
 * хотя бы один text-узел с непустым содержимым.
 */
function hasLexicalContent(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const root = (data as { root?: { children?: unknown[] } }).root;
  if (!root || !Array.isArray(root.children) || root.children.length === 0) {
    return false;
  }
  const walk = (nodes: unknown[]): boolean => {
    for (const n of nodes) {
      if (!n || typeof n !== "object") continue;
      const node = n as { type?: string; text?: string; children?: unknown[] };
      if (node.type === "text" && typeof node.text === "string" && node.text.trim()) {
        return true;
      }
      if (Array.isArray(node.children) && walk(node.children)) return true;
    }
    return false;
  };
  return walk(root.children);
}
