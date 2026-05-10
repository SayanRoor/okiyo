import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { cookies } from "next/headers";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { payload } from "@/lib/payload";

import "./globals.css";

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
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        {/* Блокируем FOUC до гидратации: читаем localStorage и применяем тему синхронно. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('okiyo-theme');if(!t){var c=document.cookie.split('; ').find(function(s){return s.indexOf('okiyo-theme=')===0});if(c)t=c.split('=')[1]}if(t==='night'||t==='day'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Header settings={settings} categories={categories.docs} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
