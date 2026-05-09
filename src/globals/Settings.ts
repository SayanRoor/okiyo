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
            { name: "siteName", type: "text", required: true, defaultValue: "okiyo" },
            {
              name: "logo",
              type: "upload",
              relationTo: "media",
              admin: {
                description: "Логотип в шапке. Если пусто — выводится siteName текстом.",
              },
            },
            { name: "tagline", type: "text", label: "Подзаголовок (под логотипом)" },
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
              name: "heroTitle",
              type: "text",
              defaultValue: "Мебель для вашего дома",
            },
            {
              name: "heroSubtitle",
              type: "textarea",
              defaultValue:
                "Каталог тщательно подобранной мебели — от диванов до спален.",
            },
            {
              name: "heroImage",
              type: "upload",
              relationTo: "media",
              label: "Фон для hero-секции",
            },
            {
              name: "heroCtaLabel",
              type: "text",
              defaultValue: "Смотреть каталог",
            },
            {
              name: "heroCtaHref",
              type: "text",
              defaultValue: "/catalog",
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
