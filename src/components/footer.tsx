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
};

export function Footer({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-(--primary) text-(--background) mt-20">
      <div className="container-x py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            {settings.siteName || "OKIYO"}
          </div>
          <p className="mt-3 text-sm text-(--background)/70 max-w-xs">
            Японские очки с минималистичным силуэтом.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold">Каталог</div>
          <ul className="mt-3 space-y-2 text-sm text-(--background)/80">
            <li>
              <Link href="/catalog" className="hover:text-(--accent)">
                Все товары
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="hover:text-(--accent)">
                Контакты
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold">Контакты</div>
          <ul className="mt-3 space-y-2 text-sm text-(--background)/80">
            {settings.phone ? (
              <li>
                <a
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                  className="hover:text-(--accent)"
                >
                  {settings.phone}
                </a>
              </li>
            ) : null}
            {settings.phoneSecondary ? <li>{settings.phoneSecondary}</li> : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="hover:text-(--accent)">
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings.address ? (
              <li className="whitespace-pre-line">{settings.address}</li>
            ) : null}
            {settings.workingHours ? <li>{settings.workingHours}</li> : null}
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold">Соцсети</div>
          <ul className="mt-3 space-y-2 text-sm text-(--background)/80">
            {settings.instagram ? (
              <li>
                <a
                  href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-(--accent)"
                >
                  Instagram
                </a>
              </li>
            ) : null}
            {settings.whatsapp ? (
              <li>
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-(--accent)"
                >
                  WhatsApp
                </a>
              </li>
            ) : null}
            {settings.telegram ? (
              <li>
                <a
                  href={`https://t.me/${settings.telegram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-(--accent)"
                >
                  Telegram
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-(--background)/15 py-6 text-center text-xs text-(--background)/60">
        © {year} {settings.siteName || "OKIYO"}. Все права защищены.
      </div>
    </footer>
  );
}
