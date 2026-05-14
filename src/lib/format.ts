export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);
}

function relativize(url: string | null | undefined): string | null {
  if (!url) return null;
  // Strip any absolute origin so Next.js Image treats it as a local URL
  // (matches `images.localPatterns` instead of needing `remotePatterns`).
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return url;
  }
}

export function mediaUrl(
  media: unknown,
  size?: "thumbnail" | "card" | "hero",
): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as {
    url?: string | null;
    sizes?: Record<string, { url?: string | null }>;
  };
  if (size && m.sizes?.[size]?.url) return relativize(m.sizes[size].url);
  return relativize(m.url);
}

export function mediaAlt(media: unknown): string {
  if (!media || typeof media !== "object") return "";
  const m = media as { alt?: string | null };
  return m.alt ?? "";
}

/** MIME-тип медиа из Payload. Пустая строка если не определён. */
export function mediaMime(media: unknown): string {
  if (!media || typeof media !== "object") return "";
  const m = media as { mimeType?: string | null };
  return (m.mimeType ?? "").toLowerCase();
}

/** Является ли media-объект видеофайлом. */
export function isVideoMedia(media: unknown): boolean {
  return mediaMime(media).startsWith("video/");
}

/**
 * Полноразмерный URL без image-size трансформаций — нужен для видео
 * (у видео нет sizes.hero/card) и для исходных файлов.
 */
export function mediaRawUrl(media: unknown): string | null {
  if (!media || typeof media !== "object") return null;
  const m = media as { url?: string | null };
  if (!m.url) return null;
  try {
    const parsed = new URL(m.url);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return m.url;
  }
}

/**
 * Очищает номер от всего кроме цифр — для wa.me и tel: ссылок.
 * Возвращает null, если на входе пусто или цифр нет вовсе.
 */
export function sanitizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 9 ? digits : null;
}
