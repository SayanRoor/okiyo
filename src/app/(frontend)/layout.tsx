import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Tenor_Sans } from "next/font/google";
import { cookies } from "next/headers";

import { CookieConsent } from "@/components/cookie-consent";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { payload } from "@/lib/payload";

import "./globals.css";

// GTM container — задаётся через .env.local (NEXT_PUBLIC_GTM_ID).
// Если не задан — скрипт не подключается и сайт работает как раньше.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

// Premium-логошрифт. Geometric sans, тонкие штрихи, единственный weight 400.
// Так пишут лого Loewe / Jacquemus / Toteme — близкий аналог Optima.
const logo = Tenor_Sans({
  variable: "--font-logo",
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await (await payload()).findGlobal({ slug: "settings" });
  const siteName = settings.siteName || "OKIYO";
  return {
    title: {
      default: settings.metaTitle || `${siteName} — японские очки`,
      template: `%s — ${siteName}`,
    },
    description:
      settings.metaDescription ||
      "OKIYO — японские очки с минималистичным силуэтом. Лёгкий ацетат, поляризация UV400, бессрочная гарантия каркаса.",
    metadataBase: new URL(
      process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3000",
    ),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, categories, jar] = await Promise.all([
    (await payload()).findGlobal({ slug: "settings" }),
    (await payload()).find({
      collection: "categories",
      sort: "order",
      limit: 100,
    }),
    cookies(),
  ]);

  // Тема из cookie для согласованного SSR. Дефолт — день.
  const themeCookie = jar.get("okiyo-theme")?.value;
  const theme = themeCookie === "night" ? "night" : "day";

  return (
    <html
      lang="ru"
      data-theme={theme}
      suppressHydrationWarning
      className={`${sans.variable} ${serif.variable} ${logo.variable} h-full antialiased`}
    >
      <head>
        {/* Блокируем FOUC до гидратации: читаем localStorage и применяем тему синхронно. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('okiyo-theme');if(!t){var c=document.cookie.split('; ').find(function(s){return s.indexOf('okiyo-theme=')===0});if(c)t=c.split('=')[1]}if(t==='night'||t==='day'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();`,
          }}
        />
        {/* Google Consent Mode v2 + GTM. Consent-defaults ОБЯЗАТЕЛЬНО должны быть
            до загрузки GTM, иначе теги отработают без учёта согласия.
            Считываем сохранённый выбор из localStorage и сразу обновляем consent,
            чтобы не было «вспышки» permission-state у возвращающихся юзеров. */}
        {GTM_ID ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});try{var c=localStorage.getItem('okiyo-consent');if(c==='granted'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'})}}catch(e){}`,
              }}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
              }}
            />
          </>
        ) : null}
      </head>
      <body className="min-h-full flex flex-col">
        {/* GTM noscript fallback — для пользователей с отключённым JS. */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        ) : null}
        <Header settings={settings} categories={categories.docs} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
        <WhatsAppFab whatsapp={settings.whatsapp} />
        {GTM_ID ? <CookieConsent /> : null}
      </body>
    </html>
  );
}
