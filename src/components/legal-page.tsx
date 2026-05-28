import type { ReactNode } from "react";

/**
 * Единое оформление для правовых страниц (Политика, Оферта, Возврат).
 * Минималистичный layout — заголовок в серифе, prose-тело в sans,
 * последнее обновление мелкими капителями. Совпадает по дыханию со
 * страницами товара и каталога — никакой «юридической стены».
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="container-x py-16 md:py-24">
      <div className="okiyo-legal">
        <div className="eyebrow mb-6">Правовая информация</div>
        <h1 className="okiyo-legal__title">{title}</h1>
        <div className="okiyo-legal__updated">Обновлено: {updatedAt}</div>
        <div className="okiyo-legal__body">{children}</div>
      </div>
    </div>
  );
}
