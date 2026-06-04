import type { CollectionConfig } from "payload";

/**
 * Отзывы клиентов — главный trust-signal для премиум/смарт-сегмента.
 * Используются в трёх местах:
 *  — Блок «Что говорят клиенты» на главной (последние 6 опубликованных)
 *  — Под товаром (отзывы только для этого продукта)
 *  — AggregateRating JSON-LD на карточке товара (звёзды в выдаче Google)
 *
 * Опубликованные отзывы без привязки к товару показываются как «общие»
 * (про бренд в целом). С привязкой — только на странице конкретной модели
 * и попадают в её agg-rating.
 */
export const Reviews: CollectionConfig = {
  slug: "reviews",
  labels: { singular: "Отзыв", plural: "Отзывы" },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: "authorName",
    defaultColumns: [
      "authorName",
      "rating",
      "product",
      "city",
      "verified",
      "isPublished",
    ],
    description:
      "Отзывы клиентов. Опубликованные показываются на сайте и формируют звёзды в выдаче Google.",
  },
  fields: [
    {
      name: "authorName",
      type: "text",
      required: true,
      label: "Имя клиента",
      admin: { description: "Как указать в отзыве — «Айгуль», «Дмитрий К.»" },
    },
    {
      name: "rating",
      type: "number",
      required: true,
      defaultValue: 5,
      min: 1,
      max: 5,
      label: "Оценка",
      admin: { step: 1, description: "От 1 до 5 звёзд." },
    },
    {
      name: "text",
      type: "textarea",
      required: true,
      label: "Текст отзыва",
      admin: { rows: 4 },
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      label: "Модель (опционально)",
      admin: {
        description:
          "Если отзыв про конкретную модель — выбери. Если о бренде в целом — оставь пустым.",
      },
    },
    {
      name: "city",
      type: "text",
      label: "Город",
      admin: { placeholder: "Алматы", description: "Например: Алматы, Астана." },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      label: "Фото клиента (опционально)",
      admin: {
        description:
          "Квадратное фото для аватара. Если нет — будет показана буква имени.",
      },
    },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
      label: "Подтверждённый покупатель",
      admin: {
        description:
          "Поставь галочку, если этот человек реально купил у нас. Показывает значок «✓ Подтверждён».",
      },
    },
    {
      name: "isPublished",
      type: "checkbox",
      defaultValue: true,
      label: "Опубликовать",
      admin: {
        position: "sidebar",
        description: "Снимите галочку, чтобы скрыть с сайта.",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      label: "Порядок (sidebar)",
      admin: {
        position: "sidebar",
        description:
          "Чем меньше число — тем выше отзыв в списке. Дефолт 0 = сортировка по дате создания.",
      },
    },
  ],
  defaultSort: ["order", "-createdAt"],
};
