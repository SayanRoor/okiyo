import { LeadForm } from "@/components/lead-form";
import { payload } from "@/lib/payload";

export const metadata = { title: "Контакты" };
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const settings = await (await payload()).findGlobal({ slug: "settings" });
  return (
    <div className="container-x py-12 md:py-20">
      <div
        className="grid gap-12"
        style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
      >
        <header>
          <div className="eyebrow mb-3">О бренде</div>
          <h1
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 300,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              maxWidth: 760,
            }}
          >
            OKIYO — японский минимализм{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>в Алматы.</em>
          </h1>
        </header>

        <div
          className="grid gap-12"
          style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
        >
          <div className="okiyo-contacts-grid">
            <div>
              <div className="eyebrow mb-4">Контакты</div>
              <dl className="space-y-5">
                {settings.phone ? (
                  <ContactRow label="Телефон">
                    <a
                      href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                      className="hover:opacity-60 transition-opacity"
                    >
                      {settings.phone}
                    </a>
                  </ContactRow>
                ) : null}
                {settings.email ? (
                  <ContactRow label="E-mail">
                    <a
                      href={`mailto:${settings.email}`}
                      className="hover:opacity-60 transition-opacity"
                    >
                      {settings.email}
                    </a>
                  </ContactRow>
                ) : null}
                {settings.address ? (
                  <ContactRow label="Адрес">
                    <span className="whitespace-pre-line">{settings.address}</span>
                  </ContactRow>
                ) : null}
                {settings.workingHours ? (
                  <ContactRow label="Часы">{settings.workingHours}</ContactRow>
                ) : null}
              </dl>
            </div>

            <div
              className="p-7"
              style={{
                border: "1px solid var(--line)",
                background: "var(--card)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontSize: 22,
                  fontWeight: 400,
                  color: "var(--ink)",
                }}
              >
                Записаться на примерку
              </div>
              <p
                className="mt-2 mb-5"
                style={{ fontSize: 13, color: "var(--muted)" }}
              >
                Подберём оправу под форму лица, расскажем про линзы.
                Бесплатно, без обязательств.
              </p>
              <LeadForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: "var(--muted)",
        }}
      >
        {label}
      </dt>
      <dd
        className="mt-1.5"
        style={{
          fontFamily: "var(--font-serif), serif",
          fontSize: 22,
          fontWeight: 400,
          color: "var(--ink)",
        }}
      >
        {children}
      </dd>
    </div>
  );
}
