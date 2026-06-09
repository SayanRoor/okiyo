import Link from "next/link";

import { CollectionGrid } from "@/components/collection-grid";
import { HeroSlideshow } from "@/components/hero-slideshow";
// ReviewsBlock временно не используется — коллекция reviews откатана,
// чтобы вернуть админку. После переработки миграции (через payload
// generate:migrations вместо ручного SQL) вернём импорт + safeFindReviews.
// import { ReviewsBlock, type Review } from "@/components/reviews-block";
import { mediaAlt, mediaUrl } from "@/lib/format";
import { payload } from "@/lib/payload";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const p = await payload();
  const [settings, collection, tryOnFirst] = await Promise.all([
    p.findGlobal({ slug: "settings" }),
    p.find({
      collection: "products",
      where: { isPublished: { equals: true } },
      limit: 24,
      sort: ["order", "-createdAt"],
      depth: 2,
    }),
    // Первый товар, у которого включена виртуальная примерка И загружен PNG —
    // на него ведёт hero-кнопка «Виртуальная примерка». Кнопка получает
    // query `?try=1`, страница товара авто-открывает модалку.
    p.find({
      collection: "products",
      where: {
        and: [
          { isPublished: { equals: true } },
          { enableTryOn: { equals: true } },
          { tryOnImage: { exists: true } },
        ],
      },
      limit: 1,
      sort: ["order", "-createdAt"],
      depth: 0,
    }),
  ]);

  const tryOnSlug =
    (tryOnFirst.docs[0] as { slug?: string } | undefined)?.slug ?? null;

  // Собираем слайды для карусели: сначала главное фото (если есть),
  // затем массив дополнительных. Дубли отсекаем по url.
  type Slide = { url: string; alt: string };
  const slides: Slide[] = [];
  const mainUrl = mediaUrl(settings.heroImage, "hero");
  if (mainUrl) {
    slides.push({
      url: mainUrl,
      alt: mediaAlt(settings.heroImage) || "OKIYO",
    });
  }
  const extra =
    (settings.heroImages as { id?: string; image?: unknown }[] | undefined) ??
    [];
  for (const h of extra) {
    const u = mediaUrl(h.image, "hero");
    if (!u || slides.some((s) => s.url === u)) continue;
    slides.push({ url: u, alt: mediaAlt(h.image) || "OKIYO" });
  }

  // ---------------------------------------------------------------
  // SMART DEFAULTS для hero
  //
  // У админки в БД остались старые значения с прошлых итераций
  // (старая копирайтерская стратегия + дублирующий префикс «OKIYO»).
  // Чтобы не заставлять менеджера руками перебивать поля, код сам
  // распознаёт «старые» паттерны и подменяет их на свежие — но при
  // этом уважает любой кастомный текст, не совпадающий со старым.
  //
  // Правила:
  //  — пустое поле          → новый дефолт
  //  — старый дефолт        → новый дефолт (по точному совпадению)
  //  — «OKIYO» префикс       → срезается всегда
  //  — «японского дизайна»  → переписывается в «в японском стиле»
  //    (юридически безопаснее: очки в стиле, не сделаны в Японии)
  //  — кастомный текст      → оставляем как есть
  //
  // Дополнительно: если в будущем хочешь править — просто пиши свой
  // текст в админке. Если он не попадает под known-старые шаблоны,
  // код его пропустит без изменений.
  // ---------------------------------------------------------------

  const NEW_EYEBROW = "Spring Collection 2026 · от 12 000 ₸";
  const NEW_TITLE = "Очки в японском стиле";
  const NEW_SUBTITLE =
    "Поляризация UV400, прочные оправы из поликарбоната и металла. Доставка по Алматы за 2 часа, по Казахстану — Kaspi PickUp или Казпочтой.";
  const NEW_CTA = "Выбрать пару";

  // Известные «старые» формулировки, которые подменяем на новые.
  const OLD_EYEBROWS = new Set(["Spring Collection — 2026"]);
  const OLD_TITLES = new Set([
    "Тише линий — ярче взгляд.",
    "Тише линий — ярче взгляд",
    "OKIYO Искусство видеть детали",
    "Искусство видеть детали",
  ]);
  const OLD_SUBTITLE_PREFIXES = [
    "OKIYO — японские очки с минималистичным силуэтом",
    "Прочные оправы из поликарбоната и металла. UV400-защита",
  ];
  const OLD_CTAS = new Set(["Смотреть коллекцию"]);

  // Eyebrow: пусто или старый дефолт → новый.
  const eyebrowRaw = (settings.heroEyebrow || "").trim();
  const heroEyebrow =
    !eyebrowRaw || OLD_EYEBROWS.has(eyebrowRaw) ? NEW_EYEBROW : eyebrowRaw;

  // Title: убираем «OKIYO» (любая форма + опц. разделитель), затем
  // переписываем «японского дизайна» → «в японском стиле» (юр-чисто).
  // Если после преобразований получаем пусто или совпадает со старым —
  // подставляем новый.
  const titleRaw = (settings.heroTitle || "").trim();
  const titleStripped = titleRaw
    .replace(/^\s*o\s*k\s*i\s*y\s*o\s*[—\-:·]?\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const titleNormalized = titleStripped
    // «Очки японского дизайна (от 12 000 ₸)» → «Очки в японском стиле»
    .replace(/^очки\s+японского\s+дизайна.*$/i, "Очки в японском стиле")
    // «японского дизайна» (внутри иной фразы) → «в японском стиле»
    .replace(/японского\s+дизайна/gi, "в японском стиле")
    // «японские очки» (как страна-производитель) → «очки в японском стиле»
    .replace(/японск(ие|ий)\s+очки/gi, "очки в японском стиле");
  const heroTitle =
    !titleNormalized || OLD_TITLES.has(titleNormalized)
      ? NEW_TITLE
      : titleNormalized;

  // Subtitle: пусто или начинается с известного старого префикса → новый.
  const subtitleRaw = (settings.heroSubtitle || "").trim();
  const heroSubtitle =
    !subtitleRaw ||
    OLD_SUBTITLE_PREFIXES.some((p) => subtitleRaw.startsWith(p))
      ? NEW_SUBTITLE
      : subtitleRaw;

  // CTA: пусто или известный старый текст → новый.
  const ctaRaw = (settings.heroCtaLabel || "").trim();
  const heroCtaLabel = !ctaRaw || OLD_CTAS.has(ctaRaw) ? NEW_CTA : ctaRaw;
  const heroCtaHref = settings.heroCtaHref || "/catalog";

  // Заголовок может содержать «—» как разделитель, выделяем хвост курсивом.
  const renderTitle = renderItalicTail(heroTitle);

  const trust =
    (settings.trustBadges as { id?: string | null; text: string }[] | undefined) ??
    [];

  const siteUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "https://okiyo.kz";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OKIYO",
    url: siteUrl,
    description: heroSubtitle,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      {/* HERO */}
      <section className="container-x okiyo-hero py-8 md:py-20">
        <div className="min-w-0">
          <div className="eyebrow mb-5 md:mb-6">{heroEyebrow}</div>
          <h1
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 300,
              // Чуть «дышим» в строке — 0.95 слишком плотно для serif
              lineHeight: 1.02,
              // -0.02em рубил буквы; -0.015 безопаснее для разных слов
              letterSpacing: "-0.015em",
              // 36px минимум на мобайле даёт больше воздуха под фото.
              // 72px max — снижение с 84px чтобы 4-5 словные title не
              // ломались в 3-4 строки в узкой колонке хero-сетки
              // (Saint Laurent ~72px, Toteme ~56px — это норма premium-tier).
              // 5.2vw вместо 6.2vw — мягче рост на широких экранах.
              fontSize: "clamp(36px, 5.2vw, 72px)",
              color: "var(--ink)",
            }}
          >
            {renderTitle}
          </h1>
          <p
            className="mt-5 md:mt-7"
            style={{
              maxWidth: 420,
              color: "var(--muted)",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {heroSubtitle}
          </p>
          <div className="mt-7 md:mt-9 flex gap-3 flex-wrap">
            <Link href={heroCtaHref} className="btn btn-primary">
              <span>{heroCtaLabel}</span>
              <span className="arrow" aria-hidden>
                →
              </span>
            </Link>
            {tryOnSlug ? (
              <Link
                href={`/catalog/${tryOnSlug}?try=1`}
                className="btn btn-ghost"
                title="Откроется модель с активной виртуальной примеркой"
              >
                Виртуальная примерка
              </Link>
            ) : null}
          </div>
        </div>

        <div className="hero-visual">
          <HeroSlideshow slides={slides} />
        </div>
      </section>

      {/* STRIP — преимущества */}
      <div className="container-x">
        <div className="feature-strip">
          {(trust.length > 0
            ? trust.map((t) => t.text)
            : [
                "Поляризация UV400",
                "Доставка по Алматы — 2 ч",
                "Оплата счётом или Kaspi QR",
              ]
          )
            .slice(0, 3)
            .map((t, i) => (
              <div className="item" key={i}>
                <FeatureIcon i={i} />
                <span>{t}</span>
              </div>
            ))}
        </div>
      </div>

      {/* COLLECTION */}
      <section className="container-x py-20 md:py-24" id="collection">
        <div className="flex justify-between items-end mb-10 flex-wrap gap-4">
          <div>
            <div className="eyebrow mb-3">Новое · 2026</div>
            <h2
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
            </h2>
          </div>
          <Link
            href="/catalog"
            className="pb-1 border-b transition-colors"
            style={{
              fontSize: 12,
              color: "var(--muted)",
              borderColor: "var(--line)",
            }}
          >
            Смотреть все →
          </Link>
        </div>

        <CollectionGrid products={collection.docs} />
      </section>

      {/* Отзывы временно отключены вместе с коллекцией reviews.
          Будут возвращены после рабочей миграции:
          {reviews.length > 0 ? (
            <section className="container-x" id="reviews">
              <ReviewsBlock reviews={reviews} />
            </section>
          ) : null} */}
    </>
  );
}

/**
 * Если в заголовке есть «—», то всё после него — italic-акцент.
 * Так в эталоне: «Тише линий — <em>ярче взгляд.</em>»
 */
function renderItalicTail(s: string) {
  const idx = s.indexOf("—");
  if (idx < 0) return s;
  const head = s.slice(0, idx + 1);
  const tail = s.slice(idx + 1);
  return (
    <>
      {head}
      <br />
      <em style={{ fontStyle: "italic", fontWeight: 400 }}>{tail.trim()}</em>
    </>
  );
}

function FeatureIcon({ i }: { i: number }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    style: { stroke: "var(--muted)", flexShrink: 0 } as const,
  };
  if (i === 0)
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    );
  if (i === 1)
    return (
      <svg {...props}>
        <path d="M3 7h13l5 5v5h-3" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    );
  return (
    <svg {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
