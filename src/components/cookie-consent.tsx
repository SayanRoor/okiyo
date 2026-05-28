"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { updateConsent } from "@/lib/analytics";

/**
 * Cookie-баннер согласия. Появляется только если выбор не сохранён в
 * localStorage. После клика «Принять» / «Только необходимые» — сохраняем
 * и больше не показываем (даже после релоада).
 *
 * Дизайн — минималистичная плашка снизу, без модальности (не блокирует
 * скролл и взаимодействие с сайтом). Так делают Aesop / Toteme / Cubitts —
 * не агрессивный consent, который раздражает покупателя в первые 3 секунды.
 *
 * UX-нюанс: НЕ показываем баннер до окончания гидратации, иначе SSR
 * подставит его всем (включая тех, кто уже сделал выбор) — будет «вспышка».
 */
const STORAGE_KEY = "okiyo-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      // localStorage может быть недоступен (private mode) — тогда показываем.
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const persist = (value: "granted" | "denied") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore — баннер всё равно закроется
    }
    updateConsent(value === "granted");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Использование cookie"
      className="okiyo-consent"
    >
      <div className="okiyo-consent__inner">
        <p className="okiyo-consent__text">
          Мы используем cookie для аналитики и улучшения сайта. Подробнее — в{" "}
          <Link href="/policy" className="okiyo-consent__link">
            политике конфиденциальности
          </Link>
          .
        </p>
        <div className="okiyo-consent__actions">
          <button
            type="button"
            className="okiyo-consent__btn okiyo-consent__btn--ghost"
            onClick={() => persist("denied")}
          >
            Только необходимые
          </button>
          <button
            type="button"
            className="okiyo-consent__btn okiyo-consent__btn--primary"
            onClick={() => persist("granted")}
          >
            Принять всё
          </button>
        </div>
      </div>
    </div>
  );
}
