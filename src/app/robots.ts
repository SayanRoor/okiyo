import type { MetadataRoute } from "next";

/**
 * robots.txt — управляет тем, что Google/Yandex могут индексировать.
 * Закрываем /admin (Payload-админка) и /api (служебные эндпоинты), чтобы
 * они не появлялись в выдаче. Sitemap указываем явно — поисковики берут
 * его за основу при обходе сайта.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.PAYLOAD_PUBLIC_SERVER_URL || "https://okiyo.kz";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/_next/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
