import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "price", "isFeatured", "isPublished"],
    listSearchableFields: ["title", "sku"],
  },
  access: {
    read: () => true,
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
              label: "Название",
            },
            {
              name: "slug",
              type: "text",
              required: true,
              unique: true,
              index: true,
              admin: {
                description: "URL вида /catalog/диван/{slug}",
              },
            },
            {
              name: "category",
              type: "relationship",
              relationTo: "categories",
              required: true,
              admin: { allowCreate: true },
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
              name: "shortDescription",
              type: "textarea",
              label: "Краткое описание (для карточки)",
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
            },
            {
              name: "gallery",
              type: "array",
              label: "Галерея",
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
                  "Если у варианта своё фото — при клике на свотч на странице товара главное фото поменяется.",
              },
              fields: [
                { name: "name", type: "text", required: true, label: "Название" },
                {
                  name: "hex",
                  type: "text",
                  required: true,
                  label: "HEX",
                  admin: { description: "Например #0B0B0B" },
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
              label: "Параметры",
              fields: [
                { name: "name", type: "text", required: true, label: "Название" },
                { name: "value", type: "text", required: true, label: "Значение" },
              ],
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
          ],
        },
      ],
    },
  ],
};
