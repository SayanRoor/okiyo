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
      { name: "thumbnail", width: 400, height: 400, position: "centre" },
      { name: "card", width: 768, height: 768, position: "centre" },
      { name: "hero", width: 1600, height: 900, position: "centre" },
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
