import Link from "next/link";

type Settings = {
  siteName?: string | null;
  phone?: string | null;
  phoneSecondary?: string | null;
  email?: string | null;
  address?: string | null;
  workingHours?: string | null;
  instagram?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  tagline?: string | null;
};

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  const brandName = settings.siteName || "OKIYO";
  const brandSpaced = brandName.split("").join(" ");

  const aboutText =
    settings.tagline ||
    [
      "Минималистичные очки.",
      settings.address?.replace(/\n/g, ", ") || "Алматы.",
      "Студия открыта по записи.",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <footer
      className="border-t mt-16 md:mt-20"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="container-x py-16">
        <div className="okiyo-footer-grid">
          <div className="brand-col">
            <div
              className="mb-3.5"
              style={{
                fontFamily: "var(--font-serif), serif",
                fontWeight: 400,
                fontSize: 22,
                letterSpacing: "0.32em",
                color: "var(--ink)",
              }}
            >
              {brandSpaced}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "var(--muted)",
                lineHeight: 1.7,
                maxWidth: 280,
              }}
            >
              {aboutText}
            </p>
          </div>

          <FooterCol title="Магазин">
            <FootLink href="/catalog">Каталог</FootLink>
            <FootLink href="/catalog?type=sun">Солнцезащитные</FootLink>
            <FootLink href="/catalog?type=optic">Оптические</FootLink>
            <FootLink href="/contacts">Записаться на примерку</FootLink>
          </FooterCol>

          <FooterCol title="Помощь">
            <FootLink href="/contacts">Доставка</FootLink>
            <FootLink href="/contacts">Обмен и возврат</FootLink>
            <FootLink href="/contacts">Уход за оправой</FootLink>
          </FooterCol>

          <FooterCol title="Связь">
            {settings.whatsapp ? (
              <FootLink
                href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                external
              >
                WhatsApp
              </FootLink>
            ) : null}
            {settings.instagram ? (
              <FootLink
                href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                external
              >
                Instagram
              </FootLink>
            ) : null}
            {settings.telegram ? (
              <FootLink
                href={`https://t.me/${settings.telegram.replace(/^@/, "")}`}
                external
              >
                Telegram
              </FootLink>
            ) : null}
            <FootLink href={`mailto:${settings.email || "hello@okiyo.kz"}`} external>
              {settings.email || "hello@okiyo.kz"}
            </FootLink>
            {settings.phone ? (
              <FootLink
                href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                external
              >
                {settings.phone}
              </FootLink>
            ) : null}
          </FooterCol>
        </div>

        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-14 pt-6 gap-3 border-t"
          style={{
            borderColor: "var(--line)",
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: "0.1em",
          }}
        >
          <span>
            © {year} {brandName}. Все права защищены.
          </span>
          <span>
            <a
              href="/admin"
              style={{ opacity: 0.55 }}
              className="hover:opacity-100 transition-opacity"
            >
              Админ
            </a>
            {" · "}Сделано в Алматы
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="footer-col">
      <h4
        className="mb-4"
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: "var(--muted)",
          fontWeight: 500,
        }}
      >
        {title}
      </h4>
      <div className="flex flex-col" style={{ fontSize: 13 }}>
        {children}
      </div>
    </div>
  );
}

function FootLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const cls = "py-1.5 hover:opacity-60 transition-opacity";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
