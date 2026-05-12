import type { CollectionConfig } from "payload";

import { slugify } from "../lib/slugify";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "order"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        const raw = (data.slug as string | undefined) || (data.title as string | undefined) || "";
        const normalized = slugify(raw);
        if (normalized) data.slug = normalized;
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      unique: true,
      index: true,
      admin: {
        description:
          "URL: /categories/{slug}. Можно оставить пустым — сгенерируется из названия.",
      },
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Порядок отображения, меньше — выше",
      },
    },
  ],
};
