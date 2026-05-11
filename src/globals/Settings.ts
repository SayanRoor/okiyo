import type { GlobalConfig } from "payload";

export const Settings: GlobalConfig = {
  slug: "settings",
  label: "Настройки сайта",
  access: {
    read: () => true,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Шапка",
          fields: [
            { name: "siteName", type: "text", required: true, defaultValue: "OKIYO" },
            {
              name: "logo",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Логотип в шапке. Если пусто — выводится siteName текстом.",
              },
            },
            { name: "tagline", type: "text", label: "Подзаголовок (под логотипом)" },
            {
              name: "topbar",
              type: "array",
              label: "Топ-бар (тонкая полоска над шапкой)",
              maxRows: 4,
              admin: {
                description:
                  "До 4 фраз, разделяются точкой. Например: Бесплатная доставка по Алматы · Привезём за 2 часа",
              },
              fields: [{ name: "text", type: "text", required: true }],
            },
          ],
        },
        {
          label: "Контакты",
          fields: [
            { name: "phone", type: "text", label: "Основной телефон" },
            { name: "phoneSecondary", type: "text", label: "Доп. телефон" },
            { name: "email", type: "email" },
            { name: "address", type: "textarea", label: "Адрес салона" },
            { name: "workingHours", type: "text", label: "Часы работы" },
          ],
        },
        {
          label: "Соцсети",
          fields: [
            { name: "instagram", type: "text" },
            { name: "whatsapp", type: "text", admin: { description: "Без +" } },
            { name: "telegram", type: "text" },
          ],
        },
        {
          label: "Главная",
          fields: [
            {
              name: "heroEyebrow",
              type: "text",
              defaultValue: "Spring Collection — 2026",
              admin: { description: "Маленькая надпись над заголовком" },
            },
            {
              name: "heroTitle",
              type: "text",
              defaultValue: "Тише линий — ярче взгляд.",
            },
            {
              name: "heroSubtitle",
              type: "textarea",
              defaultValue:
                "OKIYO — японские очки с минималистичным силуэтом. Лёгкий ацетат, поляризация UV400, бессрочная гарантия каркаса.",
            },
            {
              name: "heroImage",
              type: "upload",
              relationTo: "media",
              label: "Главное фото в hero (или одно из карусели)",
              admin: {
                description:
                  "Если ниже задана карусель — это фото будет первым в ней.",
              },
            },
            {
              name: "heroImages",
              type: "array",
              label: "Карусель в hero (модель + очки)",
              admin: {
                description:
                  "Загрузите 2–5 фото — будут сменять друг друга на главной с плавным crossfade каждые ~5 секунд. Оптимально: квадратные или 4:5, по длинной стороне 1600–2400px.",
              },
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                },
              ],
            },
            {
              name: "heroCtaLabel",
              type: "text",
              defaultValue: "Смотреть коллекцию",
            },
            {
              name: "heroCtaHref",
              type: "text",
              defaultValue: "/catalog",
            },
            {
              name: "trustBadges",
              type: "array",
              label: "Бейджи доверия (под hero CTA)",
              maxRows: 4,
              fields: [{ name: "text", type: "text", required: true }],
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            { name: "metaTitle", type: "text" },
            { name: "metaDescription", type: "textarea" },
            { name: "ogImage", type: "upload", relationTo: "media" },
          ],
        },
      ],
    },
  ],
};
