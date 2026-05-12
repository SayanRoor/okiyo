import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { sanitizePhone } from "@/lib/format";

type Settings = {
  siteName?: string | null;
  tagline?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  topbar?: { id?: string | null; text: string }[] | null;
};

type Category = {
  id: string | number;
  title: string;
  slug?: string | null;
};

export function Header({
  settings,
  // categories пока не используется в шапке (минимализм), но оставляю в API
  // для совместимости и будущего меню.
}: {
  settings: Settings;
  categories: Category[];
}) {
  const brandName = settings.siteName || "OKIYO";
  // Эталонный визуальный логотип — буквы с большим letter-spacing.
  const brandSpaced = brandName.split("").join(" ");

  const topbar =
    settings.topbar && settings.topbar.length > 0
      ? settings.topbar
      : [
          { text: "Бесплатная доставка по Алматы" },
          { text: "Привезём за 2 часа" },
        ];

  const waNumber = sanitizePhone(settings.whatsapp);

  return (
    <header className="okiyo-header">
      {/* TOP BAR */}
      <div
        className="hidden sm:flex items-center justify-center gap-2 sm:gap-3 py-2.5 border-b"
        style={{
          borderColor: "var(--line)",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--muted)",
        }}
      >
        {topbar.map((b, i) => (
          <span key={b.id ?? i} className="flex items-center gap-2 sm:gap-3">
            <span>{b.text}</span>
            {i < topbar.length - 1 ? (
              <span
                aria-hidden
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--ink)",
                  opacity: 0.6,
                  display: "inline-block",
                }}
              />
            ) : null}
          </span>
        ))}
      </div>

      {/* NAV */}
      <nav
        className="grid items-center px-6 md:px-12 py-5 border-b"
        style={{
          borderColor: "var(--line)",
          gridTemplateColumns: "1fr auto 1fr",
        }}
      >
        {/* Левая часть: основные ссылки */}
        <div className="hidden md:flex gap-7 text-[13px]">
          <Link href="/catalog" className="hover:opacity-60 transition-opacity">
            Каталог
          </Link>
          <Link href="/catalog?type=sun" className="hover:opacity-60 transition-opacity">
            Солнцезащитные
          </Link>
          <Link href="/catalog?type=optic" className="hover:opacity-60 transition-opacity">
            Оптические
          </Link>
          <Link href="/contacts" className="hover:opacity-60 transition-opacity">
            О бренде
          </Link>
        </div>

        {/* На мобиле — иконка-меню (anchor на каталог) слева */}
        <div className="md:hidden">
          <Link
            href="/catalog"
            className="text-[13px] uppercase"
            style={{ letterSpacing: "0.18em", color: "var(--muted)" }}
          >
            Каталог
          </Link>
        </div>

        {/* Лого по центру — всегда текстовый брендмарк в Tenor Sans.
            Старая картинка-логотип из Settings.logo не используется в шапке,
            чтобы не конкурировать с тиснёной надписью. */}
        <Link
          href="/"
          className="flex items-center justify-center min-w-0"
          aria-label={brandName}
        >
          <div
            style={{
              fontFamily: "var(--font-logo), 'Optima', sans-serif",
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: "0.46em",
              lineHeight: 1,
              color: "var(--ink)",
              paddingLeft: "0.46em",
              whiteSpace: "nowrap",
            }}
          >
            {brandSpaced}
          </div>
        </Link>

        {/* Правая часть */}
        <div className="flex gap-3 sm:gap-4 justify-end items-center text-[13px]">
          <ThemeToggle />
          {waNumber ? (
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 hover:opacity-60 transition-opacity"
              aria-label="Написать в WhatsApp"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
