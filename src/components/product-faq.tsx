/**
 * FAQ-аккордеон под товаром. Закрывает 5 главных возражений в момент решения:
 *  — Гарантия (что если сломается)
 *  — Возврат (что если не подойдёт)
 *  — Доставка (когда и почём)
 *  — Оплата (как платить)
 *  — Качество линз (это правда не Aliexpress)
 *
 * Без FAQ покупатель уходит в Google «есть ли возврат у okiyo» и теряется.
 * Inline-ответы держат его на странице.
 *
 * Используем нативный <details> — простой, доступный, без JS. Open-state
 * управляется браузером, переживает ре-рендеры, работает без гидрации.
 */
export function ProductFaq({
  whatsapp,
}: {
  whatsapp?: string | null;
}) {
  return (
    <div className="okiyo-faq">
      <h3 className="okiyo-faq__title">Частые вопросы</h3>

      <FaqItem question="Сколько идёт доставка?">
        <p>
          По <strong>Алматы</strong> — бесплатно, за 1-2 часа в рабочее время
          (10:00–20:00) либо в удобный вам интервал. По <strong>Казахстану</strong> —
          транспортной компанией (СДЭК / Казпочта) за 2-5 рабочих дней,
          стоимость от 1 500 ₸.
        </p>
      </FaqItem>

      <FaqItem question="Можно ли вернуть, если не подойдут?">
        <p>
          Да. В течение <strong>14 дней</strong> с момента получения — по Закону РК
          «О защите прав потребителей». Очки должны быть без следов
          использования, в фирменной упаковке. Возврат денежных средств — в
          течение 3 рабочих дней.
        </p>
      </FaqItem>

      <FaqItem question="Какая гарантия на очки?">
        <p>
          Гарантия на каркас и шарниры. При заводском браке (трещина в оправе,
          поломка шарнира, расфокусировка линзы) — бесплатная замена или
          возврат средств. Гарантия не покрывает механические повреждения и
          царапины от ненадлежащего ухода.
        </p>
      </FaqItem>

      <FaqItem question="Как можно оплатить?">
        <p>
          Принимаем: <strong>Kaspi QR</strong> и Kaspi Pay, безналичный счёт для
          юр.лиц, наличные при получении в Алматы, банковская карта по
          согласованию. Для заказа от 30 000 ₸ доступна рассрочка через Kaspi
          Магазин (0-0-12).
        </p>
      </FaqItem>

      <FaqItem question="Откуда у вас очки и почему такая цена?">
        <p>
          Очки японского дизайна, прямые контракты с производителем. Мы
          работаем без переплаты за бренд (как Saint Laurent или Ray-Ban) — вы
          получаете <strong>такое же качество материалов и линз</strong>, но без
          5-кратной наценки. Поляризация UV400 — настоящая, не «нарисованная»,
          как на Aliexpress.
        </p>
      </FaqItem>

      {whatsapp ? (
        <FaqItem question="Не нашёл ответа — как связаться?">
          <p>
            Напишите нам в{" "}
            <a
              href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "underline", color: "var(--ink)" }}
            >
              WhatsApp
            </a>{" "}
            — отвечаем обычно в течение 10-15 минут в рабочее время.
          </p>
        </FaqItem>
      ) : null}
    </div>
  );
}

function FaqItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="okiyo-faq__item">
      <summary>
        <span>{question}</span>
        <svg
          className="okiyo-faq__chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="okiyo-faq__body">{children}</div>
    </details>
  );
}
