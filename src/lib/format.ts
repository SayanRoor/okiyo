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

/**
 * Очищает номер от всего кроме цифр — для wa.me и tel: ссылок.
 * Возвращает null, если на входе пусто или цифр нет вовсе.
 */
export function sanitizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 9 ? digits : null;
}
