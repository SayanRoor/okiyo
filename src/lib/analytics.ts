/**
 * Лёгкий wrapper для push-а событий в GTM dataLayer.
 * Безопасен на сервере (no-op), безопасен если GTM не загружен (просто заполнит
 * dataLayer; когда GTM прогрузится — он подберёт накопившиеся события).
 *
 * Имена событий — стандартизированные snake_case, чтобы в GTM/GA4 их можно было
 * один раз настроить как conversion. Используем нашу собственную нотацию вместо
 * GA4-recommended (`generate_lead`, `purchase`...) — наш бизнес-флоу не похож на
 * стандартный e-commerce: главные конверсии — WhatsApp/звонок/лид-форма, а не
 * checkout. Кастомные события всё равно ставятся как conversion в Ads.
 */

type EventParams = Record<string, string | number | boolean | null | undefined>;

export type OkiyoEvent =
  | "lead_form_submit"
  | "whatsapp_click"
  | "kaspi_click"
  | "try_on_open"
  | "try_on_frame_switch"
  | "phone_click";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(name: OkiyoEvent, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: name,
    // Чистим undefined — иначе попадают в payload и портят воронку в GA4.
    ...Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
    ),
  });
}

/**
 * Обновляет Google Consent Mode v2 — вызывается из cookie-баннера при accept.
 * Без этого Google Ads не будет персонализировать показы и retargeting.
 */
export function updateConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "consent_update",
    consent: granted ? "granted" : "denied",
  });
  // gtag-style вызов (GTM проксирует на нужные теги).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtagFn = (window as any).gtag as
    | ((...args: unknown[]) => void)
    | undefined;
  if (typeof gtagFn === "function") {
    gtagFn("consent", "update", {
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied",
    });
  }
}
