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
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumbnail", width: 400, height: 400, position: "centre" },
      { name: "card", width: 768, height: 768, position: "centre" },
      { name: "hero", width: 1600, height: 900, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
