import type { MetadataRoute } from "next";

import { payload } from "@/lib/payload";

export const dynamic = "force-dynamic";

/**
 * Динамический sitemap.xml. Next.js автоматически отдаёт его по адресу
 * /sitemap.xml — туда же ссылается robots.txt.
 *
 * Включает:
 *  — все статические страницы (главная, каталог, контакты, правовые);
 *  — все опубликованные товары;
 *  — все категории.
 *
 * Без sitemap Google Search Console индексирует сайт хаотично, что бьёт
 * по Quality Score рекламы (Google считает страницы «незнакомыми» и поднимает
 * CPC). С sitemap индексация занимает дни, без — недели.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || "https://okiyo.kz";
  const now = new Date();

  const p = await payload();
  const [products, categories] = await Promise.all([
    p.find({
      collection: "products",
      where: { isPublished: { equals: true } },
      limit: 1000,
      depth: 0,
    }),
    p.find({ collection: "categories", limit: 100, depth: 0 }),
  ]);

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, priority: 1.0, changeFrequency: "weekly" },
    { url: `${base}/catalog`, lastModified: now, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/contacts`, lastModified: now, priority: 0.6, changeFrequency: "monthly" },
    { url: `${base}/policy`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${base}/oferta`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${base}/return`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
  ];

  const productUrls: MetadataRoute.Sitemap = products.docs
    .map((d) => {
      const doc = d as { slug?: string; updatedAt?: string };
      if (!doc.slug) return null;
      return {
        url: `${base}/catalog/${doc.slug}`,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
        priority: 0.8,
        changeFrequency: "weekly" as const,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const categoryUrls: MetadataRoute.Sitemap = categories.docs
    .map((d) => {
      const doc = d as { slug?: string; updatedAt?: string };
      if (!doc.slug) return null;
      return {
        url: `${base}/categories/${doc.slug}`,
        lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
        priority: 0.7,
        changeFrequency: "weekly" as const,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return [...staticUrls, ...productUrls, ...categoryUrls];
}
