export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(value);
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
  if (size && m.sizes?.[size]?.url) return m.sizes[size].url ?? null;
  return m.url ?? null;
}

export function mediaAlt(media: unknown): string {
  if (!media || typeof media !== "object") return "";
  const m = media as { alt?: string | null };
  return m.alt ?? "";
}
