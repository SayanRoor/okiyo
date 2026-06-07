"use client";

import { useEffect, useState } from "react";

/**
 * Бейдж наличия + срока доставки с живым отсчётом.
 *
 * Логика:
 *  — Если ДО 18:00 (по Алматы, UTC+5) → «Закажите сегодня — отправим до конца дня»
 *  — Если ПОСЛЕ 18:00, но в будний день → «Доставка завтра до 18:00»
 *  — В выходные → «Доставка в понедельник»
 *
 * Зелёный pulsing-dot создаёт ощущение «живого статуса» — на премиум-сайтах
 * это работает лучше статичной надписи «В наличии».
 *
 * Если sold-out — компонент возвращает null, его рендерит парент условно.
 */
const ALMATY_OFFSET_MINUTES = 5 * 60; // UTC+5

function getAlmatyTime(): Date {
  const now = new Date();
  // Сдвигаем на UTC+5 независимо от часового пояса клиента.
  const utc = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utc + ALMATY_OFFSET_MINUTES * 60_000);
}

function formatDeliveryMessage(): { primary: string; secondary: string } {
  const a = getAlmatyTime();
  const h = a.getHours();
  const m = a.getMinutes();
  const day = a.getDay(); // 0 = sun, 6 = sat

  // Выходные
  if (day === 0 || day === 6) {
    return {
      primary: "Доставка в понедельник",
      secondary: "Закажите сейчас — отправим утром",
    };
  }

  // Будний день, до 18:00
  if (h < 18) {
    const minutesLeft = (17 - h) * 60 + (60 - m);
    if (minutesLeft <= 60) {
      return {
        primary: "Закажите за час",
        secondary: `Отправим сегодня — осталось ${minutesLeft} мин`,
      };
    }
    const hoursLeft = Math.floor(minutesLeft / 60);
    return {
      primary: "Закажите сегодня",
      secondary: `Отправим до 18:00 — осталось ${hoursLeft} ч`,
    };
  }

  // Будний день, после 18:00
  if (day === 5) {
    // Пятница вечер — отправка в понедельник
    return {
      primary: "Доставка в понедельник",
      secondary: "Закажите сейчас — отправим утром",
    };
  }
  return {
    primary: "Доставка завтра",
    secondary: "По Алматы — до 18:00",
  };
}

export function AvailabilityBadge() {
  // Рендерим заглушку на сервере, чтобы не было mismatch с актуальным временем.
  const [msg, setMsg] = useState<{ primary: string; secondary: string } | null>(
    null,
  );

  useEffect(() => {
    setMsg(formatDeliveryMessage());
    // Обновляем раз в минуту — счётчик «осталось N мин» становится живым.
    const id = setInterval(() => {
      setMsg(formatDeliveryMessage());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // SSR-плейсхолдер с тем же layout, чтобы не было layout shift.
  if (!msg) {
    return (
      <div className="okiyo-availability" aria-hidden>
        <span className="okiyo-availability__dot" />
        <span className="okiyo-availability__text">В наличии</span>
        <span className="okiyo-availability__delivery">· Доставка по Алматы</span>
      </div>
    );
  }

  return (
    <div
      className="okiyo-availability"
      role="status"
      aria-label={`${msg.primary}. ${msg.secondary}`}
    >
      <span className="okiyo-availability__dot" aria-hidden />
      <span className="okiyo-availability__text">{msg.primary}</span>
      <span className="okiyo-availability__delivery">· {msg.secondary}</span>
    </div>
  );
}
