"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Slide = { url: string; alt: string };

/**
 * Hero-карусель для главной. Crossfade между фото, без стрелок и подписей —
 * чистая ткань изображений, как у Loewe/Toteme. Автосмена 5.5s.
 *
 * Если pause на hover нужен — можно добавить onMouseEnter/Leave; пока без него,
 * чтобы пользователь не «застревал» на одной картинке при первом наведении.
 *
 * Параметр respectsReducedMotion соблюдает prefers-reduced-motion: пользователь
 * с настройкой «уменьшить анимации» увидит только первое фото.
 */
export function HeroSlideshow({
  slides,
  intervalMs = 5500,
}: {
  slides: Slide[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) {
    // Пустое полотно — фон совпадает с .hero-visual (var(--card)).
    return null;
  }

  return (
    <div className="hero-slideshow" aria-roledescription="carousel">
      {slides.map((s, i) => (
        <div
          key={s.url + i}
          className="hero-slideshow__slide"
          data-active={i === active}
          aria-hidden={i !== active}
        >
          <Image
            src={s.url}
            alt={s.alt}
            fill
            priority={i === 0}
            sizes="(min-width:1100px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      ))}

      {slides.length > 1 ? (
        <div className="hero-slideshow__dots" aria-hidden>
          {slides.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActive(i)}
              data-active={i === active}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
