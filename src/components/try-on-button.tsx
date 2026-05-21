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
};

export function TryOnButton({
  overlaySrc,
  productTitle,
  className = "btn btn-ghost",
  label = "Примерить онлайн",
}: Props) {
  const [open, setOpen] = useState(false);

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
