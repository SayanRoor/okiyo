import type { CollectionConfig } from "payload";

export const Leads: CollectionConfig = {
  slug: "leads",
  labels: {
    singular: "Заявка",
    plural: "Заявки",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "phone", "product", "status", "createdAt"],
    listSearchableFields: ["name", "phone", "message"],
  },
  access: {
    create: () => true, // public form posts here
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    { name: "name", type: "text", required: true, label: "Имя" },
    { name: "phone", type: "text", required: true, label: "Телефон" },
    { name: "message", type: "textarea", label: "Сообщение" },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      label: "Интересующий товар",
    },
    {
      name: "source",
      type: "text",
      admin: {
        position: "sidebar",
        description: "URL страницы, с которой была отправлена форма",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "new",
      options: [
        { label: "Новая", value: "new" },
        { label: "В работе", value: "in_progress" },
        { label: "Закрыта", value: "closed" },
      ],
      admin: { position: "sidebar" },
    },
  ],
};
