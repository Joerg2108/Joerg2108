import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { MotionProvider } from "@/components/reveal";
import { getDictionary } from "@/content/dictionaries";
import { hasLocale, localeMeta, locales } from "@/lib/i18n";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";
import { buildBarSchema, jsonLdString } from "@/lib/schema";
import "../globals.css";

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

// Both languages are prerendered at build time. Unknown first segments never reach
// this layout: proxy.ts prefixes them with a locale (/fr → /en/fr → localized 404).
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).meta;
  return {
    metadataBase: new URL(site.url),
    title: { default: t.title, template: `%s · ${site.name}` },
    description: t.description,
    keywords: [...t.keywords, site.address.town ?? ""].filter(Boolean),
    alternates: alternates(lang, "/"),
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: localeMeta[lang].og,
      alternateLocale: locales.filter((l) => l !== lang).map((l) => localeMeta[l].og),
      title: t.title,
      description: t.description,
      url: `/${lang}`,
      images: [{ url: "/images/bar-night.jpg", width: 1320, height: 738, alt: t.ogAlt }],
    },
    twitter: { card: "summary_large_image", title: site.name, description: t.description, images: ["/images/bar-night.jpg"] },
    robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
    formatDetection: { telephone: true, address: true },
  };
}

export const viewport: Viewport = { themeColor: "#0a0a0a", colorScheme: "dark" };

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const schema = buildBarSchema(site, { lang, description: t.meta.description });

  return (
    <html lang={lang} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-moon focus:px-4 focus:py-2 focus:text-night">{t.common.skip}</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }} />
        <MotionProvider>
          <Nav lang={lang} t={{ nav: t.nav, common: t.common }} />
          <main id="main" className="overflow-x-clip">{children}</main>
          <Footer lang={lang} t={t.footer} country={t.common.country} />
        </MotionProvider>
      </body>
    </html>
  );
}
