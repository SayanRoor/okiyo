import { payload } from "@/lib/payload";

/**
 * Нормализованные юридические реквизиты для подвала правовых страниц.
 * Если в админке поля пустые — подставляем заглушки «не указано», чтобы
 * страница не падала и Google-боты получили хотя бы какой-то ответ.
 */
export type LegalInfo = {
  companyName: string;
  bin: string;
  address: string;
  email: string;
  phone: string;
  siteName: string;
};

export async function getLegalInfo(): Promise<LegalInfo> {
  const p = await payload();
  const s = (await p.findGlobal({ slug: "settings" })) as {
    siteName?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    legalCompanyName?: string | null;
    legalBin?: string | null;
    legalAddress?: string | null;
    legalEmail?: string | null;
  };

  return {
    siteName: s.siteName || "OKIYO",
    companyName: s.legalCompanyName || "ИП ___________________",
    bin: s.legalBin || "___________",
    address: s.legalAddress || s.address || "г. Алматы",
    email: s.legalEmail || s.email || "hello@okiyo.kz",
    phone: s.phone || "",
  };
}
