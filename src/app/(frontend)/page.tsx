import Image from "next/image";
import Link from "next/link";

import { CollectionGrid } from "@/components/collection-grid";
import { mediaAlt, mediaUrl } from "@/lib/format";
import { payload } from "@/lib/payload";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const p = await payload();
  const [settings, collection] = await Promise.all([
    p.findGlobal({ slug: "settings" }),
    p.find({
      collection: "products",
      where: { isPublished: { equals: true } },
      limit: 24,
      sort: ["order", "-createdAt"],
      depth: 2,
    }),
  ]);

  const heroBg = mediaUrl(settings.heroImage, "hero");
  const heroAlt = mediaAlt(settings.heroImage);
  const heroEyebrow = settings.heroEyebrow || "Spring Collection — 2026";
  const heroTitle = settings.heroTitle || "Тише линий — ярче взгляд.";
  const heroSubtitle =
    settings.heroSubtitle ||
    "OKIYO — японские очки с минималистичным силуэтом. Лёгкий ацетат, поляризация UV400, бессрочная гарантия каркаса.";
  const heroCtaLabel = settings.heroCtaLabel || "Смотреть коллекцию";
  const heroCtaHref = settings.heroCtaHref || "/catalog";

  // Заголовок может содержать «—» как разделитель, выделяем хвост курсивом.
  const renderTitle = renderItalicTail(heroTitle);

  const trust =
    (settings.trustBadges as { id?: string | null; text: string }[] | undefined) ??
    [];

  return (
    <>
      {/* HERO */}
      <section className="container-x okiyo-hero py-16 md:py-24">
        <div className="min-w-0">
          <div className="eyebrow mb-7">{heroEyebrow}</div>
          <h1
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
              fontSize: "clamp(56px, 8vw, 108px)",
              color: "var(--ink)",
            }}
          >
            {renderTitle}
          </h1>
          <p
            className="mt-9"
            style={{
              maxWidth: 380,
              color: "var(--muted)",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {heroSubtitle}
          </p>
          <div className="mt-10 flex gap-3 flex-wrap">
            <Link href={heroCtaHref} className="btn btn-primary">
              {heroCtaLabel} →
            </Link>
            <Link href="/contacts" className="btn btn-ghost">
              Записаться на примерку
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          {heroBg ? (
            <Image
              src={heroBg}
              alt={heroAlt || "OKIYO"}
              fill
              priority
              sizes="(min-width:1100px) 40vw, 100vw"
              className="object-cover"
            />
          ) : (
            // Заглушка-брендмарк, пока не загружено фото модели в очках.
            // Подсказка для админа: /admin → Настройки сайта → Главная → Фон для hero-секции.
            <div
              className="flex flex-col items-center justify-center text-center px-6"
              style={{ width: "100%", height: "100%" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-sans), sans-serif",
                  fontWeight: 300,
                  fontSize: "clamp(48px, 7vw, 92px)",
                  letterSpacing: "0.42em",
                  color: "var(--ink)",
                  paddingLeft: "0.42em",
                  lineHeight: 1,
                }}
              >
                O K I Y O
              </div>
              <div
                className="mt-4"
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "var(--muted)",
                  letterSpacing: "0.18em",
                }}
              >
                Загрузите фото в админке
              </div>
            </div>
          )}
          {heroBg ? (
            <div className="seal">— OKIYO · Kūki —</div>
          ) : null}
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
