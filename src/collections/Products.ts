import type { CollectionConfig } from "payload";

import { slugify } from "../lib/slugify";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "price", "badge", "isPublished"],
    listSearchableFields: ["title", "sku", "subtitle"],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;

        // 1. Slug: если пустой — генерируем из title; если непустой — нормализуем.
        const raw = (data.slug as string | undefined) || (data.title as string | undefined) || "";
        const normalized = slugify(raw);
        if (normalized) {
          data.slug = normalized;
        }

        // 2. Specifications: если пользователь ничего не вписал, подставляем
        // дефолтный набор, чтобы на странице товара появилась сетка-плейсхолдер.
        // Применяется и к новым товарам, и к существующим (defaultValue Payload
        // в array-полях срабатывает только на create — этот хук покрывает update).
        const specs = data.specifications;
        if (!Array.isArray(specs) || specs.length === 0) {
          data.specifications = [
            { name: "Оправа", value: "" },
            { name: "Линзы", value: "" },
            { name: "Защита", value: "UV400" },
            { name: "Ширина", value: "" },
            { name: "Длина дужки", value: "" },
            { name: "Вес", value: "" },
          ];
        }

        return data;
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Основное",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Название модели",
              admin: { description: "Например, Kūki 01" },
            },
            {
              name: "slug",
              type: "text",
              unique: true,
              index: true,
              admin: {
                description:
                  "URL: /catalog/{slug}. Можно оставить пустым — сгенерируется из названия (кириллица транслитерируется в латиницу).",
                position: "sidebar",
              },
            },
            {
              name: "subtitle",
              type: "text",
              label: "Подпись (материал · цвет)",
              admin: {
                description: "Например: Acetate · Black, Titanium · Silver",
              },
            },
            {
              name: "type",
              type: "select",
              label: "Тип",
              defaultValue: "sun",
              options: [
                { label: "Солнцезащитные", value: "sun" },
                { label: "Оптические", value: "optic" },
              ],
              admin: {
                description: "Используется для фильтра в каталоге",
              },
            },
            {
              name: "category",
              type: "relationship",
              relationTo: "categories",
              admin: {
                allowCreate: true,
                description:
                  "Дополнительная категория. Не обязательна — фильтр на сайте по полю «Тип».",
              },
            },
            {
              name: "price",
              type: "number",
              required: true,
              min: 0,
              label: "Цена, ₸",
            },
            {
              name: "oldPrice",
              type: "number",
              min: 0,
              label: "Старая цена, ₸",
              admin: {
                description: "Заполните, если хотите показать скидку",
              },
            },
            {
              name: "badge",
              type: "select",
              label: "Метка",
              options: [
                { label: "Без метки", value: "none" },
                { label: "NEW IN", value: "new" },
                { label: "BESTSELLER", value: "bestseller" },
                { label: "LIMITED", value: "limited" },
              ],
              defaultValue: "none",
              admin: {
                description: "Маленькая метка в углу карточки",
              },
            },
            {
              name: "shortDescription",
              type: "textarea",
              label: "Краткое описание (для карточки/SEO)",
              maxLength: 200,
            },
            {
              name: "description",
              type: "richText",
              label: "Полное описание",
            },
          ],
        },
        {
          label: "Фото",
          fields: [
            {
              name: "mainImage",
              type: "upload",
              relationTo: "media",
              required: true,
              label: "Главное фото",
              admin: {
                description: "Обложка карточки в каталоге.",
              },
            },
            {
              name: "photos",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              label: "Доп. фото (можно выбрать сразу несколько)",
              admin: {
                description:
                  "Откроется диалог выбора файлов — выделите 5–10 фото за раз с зажатым Cmd/Shift.",
              },
            },
            {
              name: "gallery",
              type: "array",
              label: "Старая галерея (использовать только для совместимости)",
              admin: {
                description:
                  "Не заполняйте новые товары. Поле оставлено для старых данных — переезжайте на «Доп. фото» выше.",
                condition: (data) =>
                  Array.isArray(data?.gallery) && data.gallery.length > 0,
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
          ],
        },
        {
          label: "Цвета",
          fields: [
            {
              name: "colors",
              type: "array",
              label: "Цветовые варианты",
              admin: {
                description:
                  "Каждая запись — один цвет. Если у варианта есть своё фото, при клике на свотч на странице товара главное фото меняется.",
              },
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true,
                  label: "Название",
                  admin: { placeholder: "Black" },
                },
                {
                  name: "hex",
                  type: "text",
                  required: true,
                  label: "HEX",
                  admin: { placeholder: "#0B0B0B" },
                },
                {
                  name: "stock",
                  type: "number",
                  min: 0,
                  label: "В наличии (шт)",
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "Фото варианта (опционально)",
                },
              ],
            },
          ],
        },
        {
          label: "Характеристики",
          fields: [
            {
              name: "sku",
              type: "text",
              label: "Артикул",
            },
            {
              name: "specifications",
              type: "array",
              label: "Параметры (показываются сеткой под фото)",
              admin: {
                description:
                  "Типичный набор для очков: Оправа · Линзы · Защита · Ширина · Длина дужки · Вес. По 4 на ряд.",
                initCollapsed: false,
              },
              defaultValue: [
                { name: "Оправа", value: "" },
                { name: "Линзы", value: "" },
                { name: "Защита", value: "UV400" },
                { name: "Ширина", value: "" },
                { name: "Длина дужки", value: "" },
                { name: "Вес", value: "" },
              ],
              fields: [
                {
                  name: "name",
                  type: "text",
                  required: true,
                  label: "Название",
                  admin: { placeholder: "Оправа" },
                },
                {
                  name: "value",
                  type: "text",
                  required: true,
                  label: "Значение",
                  admin: { placeholder: "Металл" },
                },
              ],
            },
            {
              name: "kit",
              type: "text",
              label: "Комплектация (короткая строка под спеками)",
              admin: {
                placeholder: "В комплекте чехол и 2 салфетки",
                description: "Что лежит в коробке — фраза одной строкой.",
              },
            },
            {
              name: "inStock",
              type: "checkbox",
              defaultValue: true,
              label: "В наличии",
            },
          ],
        },
        {
          label: "Публикация",
          fields: [
            {
              name: "isPublished",
              type: "checkbox",
              defaultValue: true,
              label: "Опубликовано",
              admin: { description: "Снимите, чтобы скрыть с витрины" },
            },
            {
              name: "isFeatured",
              type: "checkbox",
              defaultValue: false,
              label: "Показать на главной",
            },
            {
              name: "order",
              type: "number",
              defaultValue: 0,
              label: "Порядок сортировки",
              admin: {
                description: "Меньше — выше. Используется для drag-n-drop позднее.",
              },
            },
          ],
        },
      ],
    },
  ],
};
