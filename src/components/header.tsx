import Image from "next/image";
import Link from "next/link";

import { mediaUrl } from "@/lib/format";

type Settings = {
  siteName?: string | null;
  tagline?: string | null;
  logo?: unknown;
  phone?: string | null;
  workingHours?: string | null;
};

type Category = {
  id: string | number;
  title: string;
  slug: string;
};

export function Header({
  settings,
  categories,
}: {
  settings: Settings;
  categories: Category[];
}) {
  const logoUrl = mediaUrl(settings.logo, "thumbnail");
  return (
    <header className="border-b border-(--border) bg-(--background)/90 backdrop-blur sticky top-0 z-30">
      <div className="container-x flex items-center justify-between gap-6 h-16 md:h-20">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={settings.siteName || "OKIYO"}
              width={40}
              height={40}
              className="h-10 w-10 rounded object-contain"
            />
          ) : null}
          <div className="min-w-0">
            <div className="text-lg md:text-xl font-semibold tracking-tight text-(--primary) truncate">
              {settings.siteName || "OKIYO"}
            </div>
            {settings.tagline ? (
              <div className="text-xs text-(--muted) truncate">
                {settings.tagline}
              </div>
            ) : null}
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/catalog" className="hover:text-(--accent) transition">
            Каталог
          </Link>
          {categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="text-(--muted) hover:text-(--accent) transition"
            >
              {c.title}
            </Link>
          ))}
          <Link href="/contacts" className="text-(--muted) hover:text-(--accent) transition">
            Контакты
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {settings.phone ? (
            <a
              href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
              className="hidden sm:inline-flex text-sm font-medium text-(--primary) hover:text-(--accent)"
            >
              {settings.phone}
            </a>
          ) : null}
          <Link
            href="/catalog"
            className="md:hidden inline-flex items-center text-sm font-medium px-3 py-1.5 rounded border border-(--border)"
          >
            Каталог
          </Link>
        </div>
      </div>
    </header>
  );
}
