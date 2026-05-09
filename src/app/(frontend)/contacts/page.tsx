import { LeadForm } from "@/components/lead-form";
import { payload } from "@/lib/payload";

export const metadata = { title: "Контакты" };
export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const settings = await (await payload()).findGlobal({ slug: "settings" });
  return (
    <div className="container-x py-10 md:py-14 grid lg:grid-cols-2 gap-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-(--primary)">
          Контакты
        </h1>
        <dl className="mt-8 space-y-4 text-(--primary)">
          {settings.phone ? (
            <div>
              <dt className="text-sm text-(--muted)">Телефон</dt>
              <dd className="text-lg">
                <a
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                  className="hover:text-(--accent)"
                >
                  {settings.phone}
                </a>
              </dd>
            </div>
          ) : null}
          {settings.email ? (
            <div>
              <dt className="text-sm text-(--muted)">E-mail</dt>
              <dd className="text-lg">
                <a
                  href={`mailto:${settings.email}`}
                  className="hover:text-(--accent)"
                >
                  {settings.email}
                </a>
              </dd>
            </div>
          ) : null}
          {settings.address ? (
            <div>
              <dt className="text-sm text-(--muted)">Адрес</dt>
              <dd className="text-lg whitespace-pre-line">{settings.address}</dd>
            </div>
          ) : null}
          {settings.workingHours ? (
            <div>
              <dt className="text-sm text-(--muted)">Часы работы</dt>
              <dd className="text-lg">{settings.workingHours}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-(--primary)">
          Напишите нам
        </h2>
        <p className="mt-2 text-(--muted) mb-6">
          Расскажите, что вас интересует, — перезвоним и подберём вариант.
        </p>
        <LeadForm />
      </div>
    </div>
  );
}
