import type { Metadata } from "next"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { site } from "@/lib/content"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.claim}`,
    template: `%s | ${site.name}`,
  },
  description: `${site.artist} – ${site.claim}. Originale, Skulpturen, Kunst am Bau, Porträts und Events aus der Kunstfabrik Borna.`,
  icons: { icon: "/images/logo.webp" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: site.name,
    images: ["/images/home/hero.webp"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-pop-yellow focus:px-4 focus:py-2 focus:font-bold"
        >
          Zum Inhalt springen
        </a>
        <SiteHeader />
        <main id="inhalt">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
