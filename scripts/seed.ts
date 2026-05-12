/**
 * One-shot seed for the OKIYO catalog.
 *
 * Reads seed/data/site-config.json + seed/data/products.json, uploads images
 * from seed/images/, populates the Settings global, creates Categories
 * (one per product shape) and creates Products with their main image and
 * gallery linked to Media items.
 *
 * Idempotent: skips items that already exist (matched by slug / category title).
 *
 * Usage:
 *   pnpm seed                       # local: requires DATABASE_URI in env
 *   docker compose exec web pnpm seed   # production
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";
import config from "../src/payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(dirname, "../seed");

type SeedProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  shape: "rectangle" | "oval" | "angled" | "classic";
  images: string[];
  variants?: Array<{
    id: string;
    name: string;
    hex: string;
    image?: string;
    stock: number;
  }>;
  isNew?: boolean;
};

type SiteConfig = {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    trust: string[];
  };
  contact: {
    whatsapp?: string;
    instagram?: string;
    email?: string;
  };
};

const SHAPE_CATEGORIES: Record<
  SeedProduct["shape"],
  { title: string; slug: string; order: number; description: string }
> = {
  rectangle: {
    title: "Прямоугольные",
    slug: "rectangle",
    order: 1,
    description: "Прямые грани, уверенный силуэт.",
  },
  oval: {
    title: "Овальные",
    slug: "oval",
    order: 2,
    description: "Мягкая универсальная посадка.",
  },
  angled: {
    title: "Угловатые",
    slug: "angled",
    order: 3,
    description: "Резкие линии, заметный характер.",
  },
  classic: {
    title: "Классика",
    slug: "classic",
    order: 4,
    description: "Минимализм, который идёт всем.",
  },
};

async function main() {
  console.log("[seed] starting");
  const payload = await getPayload({ config });

  const siteConfig: SiteConfig = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, "data/site-config.json"), "utf-8"),
  );
  const products: SeedProduct[] = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, "data/products.json"), "utf-8"),
  );

  // ---- Logo (Media) -------------------------------------------------------
  let logoId: number | null = null;
  const existingLogo = await payload.find({
    collection: "media",
    where: { alt: { equals: "OKIYO логотип" } },
    limit: 1,
  });
  if (existingLogo.docs[0]) {
    logoId = existingLogo.docs[0].id as number;
    console.log(`[seed] logo already in media (id=${logoId})`);
  } else {
    const created = await payload.create({
      collection: "media",
      data: { alt: "OKIYO логотип" },
      filePath: path.join(SEED_DIR, "images/logo.png"),
    });
    logoId = created.id as number;
    console.log(`[seed] uploaded logo (id=${logoId})`);
  }

  // ---- Settings global ----------------------------------------------------
  await payload.updateGlobal({
    slug: "settings",
    data: {
      siteName: "OKIYO",
      tagline: "Японские очки",
      logo: logoId ?? undefined,
      phone: siteConfig.contact.whatsapp ? `+${siteConfig.contact.whatsapp}` : undefined,
      email: siteConfig.contact.email ?? undefined,
      whatsapp: siteConfig.contact.whatsapp ?? undefined,
      instagram: siteConfig.contact.instagram?.replace(/^https?:\/\/(www\.)?instagram\.com\//, "") ?? undefined,
      heroEyebrow: siteConfig.hero.eyebrow,
      heroTitle: siteConfig.hero.title,
      heroSubtitle: siteConfig.hero.description,
      heroCtaLabel: siteConfig.hero.primaryCtaLabel,
      heroCtaHref: siteConfig.hero.primaryCtaHref,
      trustBadges: siteConfig.hero.trust.map((text) => ({ text })),
      topbar: [
        { text: "Бесплатная доставка по Алматы" },
        { text: "Привезём за 2 часа" },
      ],
      metaTitle: "OKIYO — японские очки",
      metaDescription: siteConfig.hero.description,
    },
  });
  console.log("[seed] settings updated");

  // ---- Categories (by shape) ---------------------------------------------
  const usedShapes = new Set(products.map((p) => p.shape));
  const categoryIdByShape = new Map<SeedProduct["shape"], number>();
  for (const shape of usedShapes) {
    const meta = SHAPE_CATEGORIES[shape];
    const existing = await payload.find({
      collection: "categories",
      where: { slug: { equals: meta.slug } },
      limit: 1,
    });
    if (existing.docs[0]) {
      categoryIdByShape.set(shape, existing.docs[0].id as number);
      console.log(`[seed] category exists: ${meta.title} (id=${existing.docs[0].id})`);
      continue;
    }
    const created = await payload.create({
      collection: "categories",
      data: {
        title: meta.title,
        slug: meta.slug,
        description: meta.description,
        order: meta.order,
      },
    });
    categoryIdByShape.set(shape, created.id as number);
    console.log(`[seed] category created: ${meta.title} (id=${created.id})`);
  }

  // ---- Media for product images ------------------------------------------
  // map seed-relative path → media id
  const mediaIdByPath = new Map<string, number>();
  async function ensureMedia(seedRelPath: string, alt: string): Promise<number> {
    if (mediaIdByPath.has(seedRelPath)) return mediaIdByPath.get(seedRelPath)!;
    // strip leading / from seed paths like "/products/foo.png"
    const rel = seedRelPath.replace(/^\//, "");
    const fullPath = path.join(SEED_DIR, "images", rel);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`seed image not found: ${fullPath}`);
    }
    const filename = path.basename(fullPath);
    const existing = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
    });
    let id: number;
    if (existing.docs[0]) {
      id = existing.docs[0].id as number;
    } else {
      const created = await payload.create({
        collection: "media",
        data: { alt },
        filePath: fullPath,
      });
      id = created.id as number;
      console.log(`[seed]   uploaded ${filename} (id=${id})`);
    }
    mediaIdByPath.set(seedRelPath, id);
    return id;
  }

  // ---- Hero images -------------------------------------------------------
  async function findMediaByFilename(filename: string): Promise<number | null> {
    const r = await payload.find({
      collection: "media",
      where: { filename: { equals: filename } },
      limit: 1,
    });
    return r.docs[0] ? (r.docs[0].id as number) : null;
  }
  const heroImageId = await findMediaByFilename("kaze-1.jpg");
  const heroImg2 = await findMediaByFilename("takeshi-1.jpg");
  const heroImg3 = await findMediaByFilename("fuji-1.png");
  const heroImg4 = await findMediaByFilename("one-1.png");
  if (heroImageId) {
    await payload.updateGlobal({
      slug: "settings",
      data: {
        heroImage: heroImageId,
        heroImages: [heroImg2, heroImg3, heroImg4]
          .filter(Boolean)
          .map((id) => ({ image: id as number })),
      },
    });
    console.log("[seed] hero images set");
  } else {
    console.log("[seed] hero images skipped — media not found");
  }

  // ---- Products ----------------------------------------------------------
  async function buildColors(
    p: SeedProduct,
  ): Promise<Array<{ name: string; hex: string; stock?: number; image?: number }>> {
    const out: Array<{ name: string; hex: string; stock?: number; image?: number }> = [];
    for (const v of p.variants ?? []) {
      const entry: { name: string; hex: string; stock?: number; image?: number } = {
        name: v.name,
        hex: v.hex,
      };
      if (typeof v.stock === "number") entry.stock = v.stock;
      if (v.image) entry.image = await ensureMedia(v.image, `${p.name} — ${v.name}`);
      out.push(entry);
    }
    return out;
  }

  for (const p of products) {
    if (p.images.length === 0) {
      console.warn(`[seed] product ${p.slug} has no images, skipping`);
      continue;
    }
    const existing = await payload.find({
      collection: "products",
      where: { slug: { equals: p.slug } },
      limit: 1,
      depth: 0,
    });

    if (existing.docs[0]) {
      const cur = existing.docs[0];
      console.log(`[seed] updating product: ${p.slug}`);
      const mainId = await ensureMedia(p.images[0], `${p.name} — главное фото`);
      const gallery: { image: number }[] = [];
      for (const img of p.images.slice(1)) {
        gallery.push({ image: await ensureMedia(img, `${p.name} — галерея`) });
      }
      const colors = await buildColors(p);
      const categoryId = categoryIdByShape.get(p.shape);
      const firstColor = p.variants?.[0]?.name;
      const subtitle = firstColor ? `Acetate · ${firstColor}` : undefined;
      const specs = (cur.specifications ?? []).filter(
        (s: { name?: string | null }) =>
          !(s.name ?? "").toLowerCase().startsWith("цвет —"),
      );
      await payload.update({
        collection: "products",
        id: cur.id,
        data: {
          title: p.name,
          subtitle,
          type: "sun",
          badge: p.isNew ? "new" : "none",
          category: categoryId,
          price: p.price,
          shortDescription: p.description,
          sku: p.id.toUpperCase(),
          mainImage: mainId,
          gallery,
          colors,
          specifications: specs,
          isPublished: true,
          isFeatured: Boolean(p.isNew),
          inStock: (p.variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0) > 0,
        },
      });
      console.log(`[seed]   updated ${p.slug}`);
      continue;
    }

    console.log(`[seed] uploading product: ${p.name}`);
    const mainId = await ensureMedia(p.images[0], `${p.name} — главное фото`);
    const gallery: { image: number }[] = [];
    for (const img of p.images.slice(1)) {
      gallery.push({ image: await ensureMedia(img, `${p.name} — галерея`) });
    }
    const colors = await buildColors(p);
    const categoryId = categoryIdByShape.get(p.shape);
    if (!categoryId) {
      throw new Error(`no category for shape ${p.shape}`);
    }
    // Маппинг под новые поля редизайна
    // - subtitle: «Acetate · {имя первого цвета}» если есть варианты
    // - colors:   полный объект с stock/image (через buildColors)
    // - badge:    NEW для isNew, иначе none
    // - type:     sun по умолчанию (можно переопределить в админке)
    const firstColor = p.variants?.[0]?.name;
    const subtitle = firstColor ? `Acetate · ${firstColor}` : undefined;

    await payload.create({
      collection: "products",
      data: {
        title: p.name,
        slug: p.slug,
        subtitle,
        type: "sun",
        badge: p.isNew ? "new" : "none",
        category: categoryId,
        price: p.price,
        shortDescription: p.description,
        sku: p.id.toUpperCase(),
        mainImage: mainId,
        gallery,
        colors,
        isPublished: true,
        isFeatured: Boolean(p.isNew),
        inStock: (p.variants ?? []).reduce((s, v) => s + (v.stock ?? 0), 0) > 0,
      },
    });
    console.log(`[seed]   created product ${p.slug}`);
  }

  console.log("[seed] done");
  process.exit(0);
}

main().catch((e) => {
  console.error("[seed] failed", e);
  process.exit(1);
});
