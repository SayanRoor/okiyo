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

    // Smart 1:1 crop — встроенные инструменты Payload:
    // 1. crop: true       — bbox-кропер в админке. Можно вручную обрезать
    //                       перед генерацией imageSizes. Пресеты aspect-ratio
    //                       подтягиваются автоматически из imageSizes ниже
    //                       (1:1 берётся из hero/card/thumbnail).
    // 2. focalPoint: true — точка-якорь поверх фото. Sharp использует её как
    //                       gravity при cover-кропе. Дефолт — центр (50/50),
    //                       что эквивалентно applyRecommendedCrop().
    //                       Менеджер передвигает точку, чтобы центрировать
    //                       на лице модели или на очках.
    crop: true,
    focalPoint: true,

    imageSizes: [
      // Превью-миниатюры (стек слева на странице товара + admin grid).
      // Квадрат, cover с focal-point.
      {
        name: "thumbnail",
        width: 400,
        height: 400,
        position: "centre",
      },
      // Карточка каталога — квадрат, cover с focal-point.
      {
        name: "card",
        width: 768,
        height: 768,
        position: "centre",
      },
      // Главное фото на странице товара — квадрат 1600×1600.
      // По дефолту fit: cover + focal point из Payload → Sharp обрезает
      // вокруг точки субъекта. Это и есть "smart square" с центрированием.
      // WebP для скорости загрузки.
      {
        name: "hero",
        width: 1600,
        height: 1600,
        position: "centre",
        formatOptions: {
          format: "webp",
          options: { quality: 90 },
        },
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

        // Smart Square default — если focal point не задан явно,
        // ставим центр (50/50). Это applyRecommendedCrop() из ТЗ:
        // largest possible 1:1 square с центрированной кропировкой.
        // Менеджер может переместить точку в админке для face-aware crop.
        if (typeof data.focalX !== "number") data.focalX = 50;
        if (typeof data.focalY !== "number") data.focalY = 50;

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
