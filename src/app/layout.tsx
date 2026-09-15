import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { connection } from "next/server";
import { getEnv } from "@/config/env";
import { SiteShell } from "@/features/property/site-shell";
import { TranslationProvider } from "@/i18n/client";
import { localeDetails } from "@/i18n/config";
import { getServerTranslation } from "@/i18n/server";
import "./globals.css";

const lora = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/lora/files/lora-latin-wght-normal.woff2",
      style: "normal",
      weight: "400 700",
    },
    {
      path: "../../node_modules/@fontsource-variable/lora/files/lora-latin-wght-italic.woff2",
      style: "italic",
      weight: "400 700",
    },
  ],
  variable: "--font-heading",
  display: "swap",
  fallback: ["Georgia"],
});
const sourceSans = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2",
      style: "normal",
      weight: "200 900",
    },
    {
      path: "../../node_modules/@fontsource-variable/source-sans-3/files/source-sans-3-greek-wght-normal.woff2",
      style: "normal",
      weight: "200 900",
    },
  ],
  variable: "--font-body",
  weight: "200 900",
  display: "swap",
  fallback: ["Arial"],
});

export async function generateMetadata(): Promise<Metadata> {
  const env = getEnv();
  const { locale, Translate } = await getServerTranslation();
  return {
    metadataBase: new URL(env.APP_URL),
    title: {
      default: Translate.title,
      template: Translate.meta.titleTemplate,
    },
    description: Translate.meta.siteDescription,
    robots: env.DEMO_MODE ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: Translate.meta.openGraphTitle,
      description: Translate.meta.openGraphDescription,
      type: "website",
      locale: localeDetails[locale].openGraph,
      images: [
        {
          url: "/images/balcony-sea-view-1440.webp",
          width: 1440,
          height: 1044,
          alt: Translate.meta.openGraphImageAlt,
        },
      ],
    },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F7F4EE" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const env = getEnv();
  const { locale } = await getServerTranslation();
  return (
    <html
      lang={locale}
      className={`${lora.variable} ${sourceSans.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <meta property="csp-nonce" content={nonce} />
      </head>
      <body>
        <TranslationProvider initialLocale={locale}>
          <SiteShell demo={env.DEMO_MODE}>{children}</SiteShell>
        </TranslationProvider>
      </body>
    </html>
  );
}
