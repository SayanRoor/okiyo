import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { payload } from "@/lib/payload";

import "./globals.css";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await (await payload()).findGlobal({ slug: "settings" });
  const siteName = settings.siteName || "OKIYO";
  return {
    title: {
      default: settings.metaTitle || siteName,
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
  const [settings, categories] = await Promise.all([
    (await payload()).findGlobal({ slug: "settings" }),
    (await payload()).find({
      collection: "categories",
      sort: "order",
      limit: 100,
    }),
  ]);

  return (
    <html lang="ru" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Header settings={settings} categories={categories.docs} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
