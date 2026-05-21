"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// MediaPipe весит ~12 MB — lazy-импорт только при клике, без SSR.
const VirtualTryOn = dynamic(
  () => import("./virtual-try-on").then((m) => m.VirtualTryOn),
  { ssr: false },
);

type Props = {
  overlaySrc: string;
  productTitle: string;
  /** Tailwind/CSS-класс кнопки. По умолчанию — наша .btn .btn-ghost. */
  className?: string;
  /** Текст кнопки. */
  label?: string;
  /**
   * Автоматически открыть модалку при монтировании.
   * Используется при переходе с главной по ссылке `/catalog/{slug}?try=1`,
   * чтобы юзер сразу попал в примерку без лишнего клика.
   */
  defaultOpen?: boolean;
};

export function TryOnButton({
  overlaySrc,
  productTitle,
  className = "btn btn-ghost",
  label = "Примерить онлайн",
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <VirtualTryOn
          overlaySrc={overlaySrc}
          productTitle={productTitle}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
