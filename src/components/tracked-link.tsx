"use client";

import { trackEvent, type OkiyoEvent } from "@/lib/analytics";

/**
 * Лёгкая клиентская обёртка над `<a>`, которая пушит событие в dataLayer.
 * Используется в Server-компонентах (шапка, страница товара), где нельзя
 * напрямую написать `onClick`. Не меняет рендер — это всё ещё обычный <a>,
 * но с listener-ом.
 *
 * Не делаем `<Link>`-обёртку специально: tracked-ссылки в нашем коде это
 * всегда внешние (WhatsApp, Kaspi, tel:), для них Next/Link бессмыслен.
 */
type Props = {
  event: OkiyoEvent;
  params?: Record<string, string | number | boolean | null | undefined>;
  href: string;
  target?: string;
  rel?: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
};

export function TrackedLink({
  event,
  params,
  href,
  target,
  rel,
  className,
  title,
  ariaLabel,
  children,
}: Props) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onClick={() => trackEvent(event, params)}
    >
      {children}
    </a>
  );
}
