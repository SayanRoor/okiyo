import Image from "next/image";
import Link from "next/link";

import { LeadForm } from "@/components/lead-form";
import { ProductCard } from "@/components/product-card";
import { mediaAlt, mediaUrl } from "@/lib/format";
import { payload } from "@/lib/payload";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const p = await payload();
  const [settings, featured, categories] = await Promise.all([
    p.findGlobal({ slug: "settings" }),
    p.find({
      collection: "products",
      where: {
        and: [
          { isPublished: { equals: true } },
          { isFeatured: { equals: true } },
        ],
      },
      limit: 8,
      sort: "-createdAt",
      depth: 2,
    }),
    p.find({ collection: "categories", sort: "order", limit: 12, depth: 1 }),
  ]);

  const heroBg = mediaUrl(settings.heroImage, "hero");
  const heroAlt = mediaAlt(settings.heroImage);

  return (
    <>
      <section className="relative bg-(--primary) text-white overflow-hidden">
        {heroBg ? (
          <Image
            src={heroBg}
            alt={heroAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-50"
          />
        ) : null}
        <div className="container-x relative py-20 md:py-32 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            {settings.heroTitle || "Мебель для вашего дома"}
          </h1>
          {settings.heroSubtitle ? (
            <p className="mt-5 text-lg md:text-xl text-white/85 max-w-xl">
              {settings.heroSubtitle}
            </p>
          ) : null}
          <Link
            href={settings.heroCtaHref || "/catalog"}
            className="mt-8 inline-flex items-center rounded-md bg-(--accent) text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            {settings.heroCtaLabel || "Смотреть каталог"}
          </Link>
        </div>
      </section>

      {categories.docs.length > 0 ? (
        <section className="py-16">
          <div className="container-x">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-(--primary)">
                Категории
              </h2>
              <Link
                href="/catalog"
                className="text-sm text-(--muted) hover:text-(--accent)"
              >
                Все товары →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.docs.map((c) => {
                const img = mediaUrl(c.image, "card");
                return (
                  <Link
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-(--border) bg-(--card)"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt={c.title}
                        fill
                        sizes="(min-width:1024px) 25vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="text-base md:text-lg font-medium">
                        {c.title}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {featured.docs.length > 0 ? (
        <section className="py-16 bg-white/40">
          <div className="container-x">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-(--primary)">
                Подборка
              </h2>
              <Link
                href="/catalog"
                className="text-sm text-(--muted) hover:text-(--accent)"
              >
                Весь каталог →
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featured.docs.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-16">
        <div className="container-x grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-(--primary)">
              Не нашли нужное?
            </h2>
            <p className="mt-3 text-(--muted) max-w-md">
              Оставьте заявку — менеджер свяжется и подберёт мебель под ваш
              интерьер и бюджет.
            </p>
          </div>
          <LeadForm />
        </div>
      </section>
    </>
  );
}
