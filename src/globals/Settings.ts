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
                  "До 4 коротких фраз — на сайте они станут заглавными и разделятся точкой. Оптимально 2–3 строки. Пример: Алматы — бесплатно, за 2 часа · По Казахстану — Kaspi PickUp или Казпочтой · Поляризация UV400 в каждой паре. Если оставить пусто — подставятся дефолтные.",
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
            {
              name: "kaspiShopUrl",
              type: "text",
              label: "Ссылка на магазин в Kaspi",
              admin: {
                description:
                  "Полный URL вида https://kaspi.kz/shop/p/okiyo-...  — на странице товара появится тонкая ссылка-альтернатива «Также в Kaspi · Рассрочка 0–0–12». Если пусто — блок не показывается.",
                placeholder: "https://kaspi.kz/shop/p/okiyo-...",
              },
            },
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
              defaultValue: "Spring Collection 2026 · от 12 000 ₸",
              admin: {
                description:
                  "Маленькая надпись над заголовком. Указывайте сезон и минимальную цену через `·` — формат премиум-DTC (Aritzia, Sezane).",
              },
            },
            {
              name: "heroTitle",
              type: "text",
              defaultValue: "Очки японского дизайна",
              admin: {
                description:
                  "Заголовок hero. Держите в 3-5 слов, чтобы не уезжал в несколько строк. Тире `—` рендерится как italic-tail (всё после тире — курсивом на новой строке). НЕ дублируйте «OKIYO» — бренд уже в шапке.",
              },
            },
            {
              name: "heroSubtitle",
              type: "textarea",
              defaultValue:
                "Поляризация UV400, прочные оправы из поликарбоната и металла. Доставка по Алматы за 2 часа, по Казахстану — Kaspi PickUp или Казпочтой.",
              admin: {
                description:
                  "Подзаголовок. 2-3 предложения с выгодами по убыванию приоритета: качество → доставка → способ оплаты.",
              },
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
              defaultValue: "Выбрать пару",
              admin: {
                description:
                  "Текст основной кнопки. Глагол + конкретное «что» («Выбрать пару», «Подобрать модель»). Избегайте пассивных «Смотреть», «Перейти».",
              },
            },
            {
              name: "heroCtaHref",
              type: "text",
              defaultValue: "/catalog",
              admin: {
                description:
                  "Куда ведёт основная кнопка hero. По умолчанию — каталог.",
              },
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
        {
          label: "Юридическое",
          description:
            "Реквизиты для страниц политики, оферты и возврата. Эти поля попадают в footer этих страниц — без них Google Ads может отклонить кампанию на модерации.",
          fields: [
            {
              name: "legalCompanyName",
              type: "text",
              label: "Юр. наименование",
              admin: {
                description:
                  "Например: ИП Иванова И.И. — указывается на правовых страницах.",
              },
            },
            {
              name: "legalBin",
              type: "text",
              label: "БИН / ИИН",
              admin: { description: "12-значный номер." },
            },
            {
              name: "legalAddress",
              type: "textarea",
              label: "Юридический адрес",
              admin: {
                description:
                  "Полный адрес регистрации, отдельно от адреса салона.",
              },
            },
            {
              name: "legalEmail",
              type: "email",
              label: "Email для правовых обращений",
              admin: {
                description:
                  "Куда писать запросы по персональным данным. Если пусто — используется обычный email.",
              },
            },
          ],
        },
      ],
    },
  ],
};
