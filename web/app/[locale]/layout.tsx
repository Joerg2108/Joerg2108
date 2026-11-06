import type { Metadata } from "next"
import { notFound } from "next/navigation"
import "../globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { RevealObserver, SmoothScroll } from "@/components/motion"
import { getContent } from "@/lib/content"
import { isLocale, localeNames, locales, ui, type Locale } from "@/lib/i18n"

export const dynamicParams = false

export const viewport = { themeColor: "#06060a", colorScheme: "dark" as const }

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

const descriptions: Record<Locale, string> = {
  de: "Michael Fischer-Art – Maler, Bildhauer, Illustrator, Zeichner. Originale, Skulpturen, Kunst am Bau, Porträts und Events aus der Kunstfabrik Borna.",
  en: "Michael Fischer-Art – painter, sculptor, illustrator, draughtsman. Originals, sculptures, art in architecture, portraits and events from the Kunstfabrik in Borna, Germany.",
  zh: "Michael Fischer-Art——画家、雕塑家、插画家、素描艺术家。来自德国博尔纳艺术工厂的原作、雕塑、建筑艺术、肖像与活动。",
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { site } = getContent(locale)
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name} | ${site.claim}`, template: `%s | ${site.name}` },
    description: descriptions[locale],
    icons: { icon: "/images/logo.webp" },
    alternates: {
      canonical: `/${locale}/`,
      languages: { de: "/de/", en: "/en/", "zh-Hans": "/zh/", "x-default": "/de/" },
    },
    openGraph: {
      type: "website",
      locale: localeNames[locale].ogLocale,
      siteName: site.name,
      images: ["/media/hero-poster.webp"],
    },
  }
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return (
    <html lang={localeNames[locale].htmlLang}>
      <body className="nc-grain antialiased">
        <SmoothScroll />
        <RevealObserver />
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-text focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
        >
          {ui[locale].skip}
        </a>
        <SiteHeader locale={locale} />
        <main id="inhalt">{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  )
}
