"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { trackEvent } from "@/lib/analytics";

import type { VtoFrame } from "./virtual-try-on";

// MediaPipe весит ~12 MB — lazy-импорт только при клике, без SSR.
const VirtualTryOn = dynamic(
  () => import("./virtual-try-on").then((m) => m.VirtualTryOn),
  { ssr: false },
);

type Props = {
  /** Все модели с включённой VTO. Первый элемент = начальная оправа. */
  frames: VtoFrame[];
  /** ID активной модели при открытии (обычно — текущая страница товара). */
  initialId?: number | string;
  /** Tailwind/CSS-класс кнопки. По умолчанию — наша .btn .btn-ghost. */
  className?: string;
  /** Текст кнопки. */
  label?: string;
  /**
   * Автоматически открыть модалку при монтировании.
   * Используется при переходе с главной по ссылке `/catalog/{slug}?try=1`.
   */
  defaultOpen?: boolean;
};

export function TryOnButton({
  frames,
  initialId,
  className = "btn btn-ghost",
  label = "Примерить онлайн",
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  if (frames.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setOpen(true);
          trackEvent("try_on_open", {
            product_id: initialId ?? null,
            frames_count: frames.length,
          });
        }}
      >
        {label}
      </button>
      {open ? (
        <VirtualTryOn
          frames={frames}
          initialId={initialId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
