"use client";

import { useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";

/**
 * Фиксированная панель снизу на мобильной странице товара.
 * Решает главную проблему мобильной конверсии: при скролле через галерею
 * и спеки основной CTA уезжает за пределы экрана, человек забывает написать
 * и закрывает вкладку. Sticky-панель **всегда** перед глазами.
 *
 * Появляется через ~120px скролла (чтобы не мешать в самом верху, где CTA
 * и так виден). Плавно въезжает снизу. На десктопе скрыта.
 *
 * iOS safe-area inset поддержан через `env(safe-area-inset-bottom)`.
 */
export function MobileStickyBar({
  productId,
  productTitle,
  price,
  whatsapp,
  soldOut,
}: {
  productId: string | number;
  productTitle: string;
  price: number | null | undefined;
  whatsapp: string | null;
  soldOut: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Появляется после ~120px скролла — чтобы не висеть, когда основной
      // CTA ещё в зоне видимости в верхней части страницы.
      setVisible(window.scrollY > 120);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const waText = encodeURIComponent(
    soldOut
      ? `Здравствуйте! Хочу узнать когда модель ${productTitle} снова появится в наличии.`
      : `Здравствуйте! Интересует модель ${productTitle}${price ? ` (${formatPrice(price)})` : ""}.`,
  );

  // Если sold-out и нет WhatsApp — просто ведём на форму ниже.
  // Если в наличии и нет WhatsApp — тоже на форму.
  const primaryHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${waText}`
    : "#lead-form";
  const primaryLabel = soldOut ? "Сообщить о поступлении" : "Заказать";
  const isWhatsApp = Boolean(whatsapp);

  const handleClick = () => {
    if (isWhatsApp && !soldOut) {
      trackEvent("whatsapp_click", {
        source: "sticky_mobile",
        product_id: productId,
        value: price ?? null,
      });
    } else if (soldOut) {
      trackEvent("lead_form_submit", {
        product_id: productId,
        source: "sticky_mobile_soldout",
      });
    }
  };

  return (
    <div className="okiyo-sticky-bar" data-visible={visible} aria-hidden={!visible}>
      <div className="okiyo-sticky-bar__inner">
        <div className="okiyo-sticky-bar__price">
          <div className="okiyo-sticky-bar__label">
            {soldOut ? "Нет в наличии" : "Цена"}
          </div>
          <div
            className="okiyo-sticky-bar__value"
            style={{ textDecoration: soldOut ? "line-through" : undefined }}
          >
            {price ? formatPrice(price) : ""}
          </div>
        </div>
        <a
          href={primaryHref}
          target={isWhatsApp && !soldOut ? "_blank" : undefined}
          rel={isWhatsApp && !soldOut ? "noreferrer" : undefined}
          className="okiyo-sticky-bar__btn"
          onClick={handleClick}
        >
          {primaryLabel}
          <span aria-hidden className="okiyo-sticky-bar__arrow">
            →
          </span>
        </a>
      </div>
    </div>
  );
}
