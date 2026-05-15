import type { CollectionConfig } from "payload";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  upload: {
    staticDir:
      process.env.PAYLOAD_MEDIA_DIR ?? path.resolve(dirname, "../../media"),
    mimeTypes: ["image/*", "video/mp4", "video/webm", "video/quicktime"],
    imageSizes: [
      // Миниатюры (стек слева на странице товара + админ-превью)
      // — квадраты с cover, чтобы превью были полные.
      {
        name: "thumbnail",
        width: 400,
        height: 400,
        position: "centre",
        fit: "cover",
      },
      // Карточка каталога — тоже квадрат с cover.
      {
        name: "card",
        width: 768,
        height: 768,
        position: "centre",
        fit: "cover",
      },
      // Главное фото на странице товара — квадрат 1600×1600,
      // fit: contain → фото целиком, прозрачный фон.
      // Подложка var(--card) приходит с контейнера, тема-aware.
      // Эквивалент Cloudinary: c_pad,ar_1:1,b_auto.
      {
        name: "hero",
        width: 1600,
        height: 1600,
        position: "centre",
        fit: "contain",
        formatOptions: {
          format: "webp",
          options: { quality: 88 },
        },
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    ],
  },
  hooks: {
    // Если alt пустой при сохранении — берём имя файла без расширения.
    // Это позволяет bulk-upload работать без ручного ввода alt у каждого фото.
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        const alt = (data.alt as string | undefined)?.trim();
        if (!alt) {
          const fname = (data.filename as string | undefined) ?? "";
          const base = fname.replace(/\.[a-z0-9]+$/i, "");
          data.alt = base || "OKIYO";
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: false,
      admin: {
        description:
          "Подпись для accessibility/SEO. Можно оставить пустым — подставится имя файла.",
      },
    },
  ],
};
