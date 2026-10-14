import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { MotionProvider } from "@/components/reveal";
import { site } from "@/lib/site";
import { buildBarSchema, jsonLdString } from "@/lib/schema";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  keywords: ["tiki bar", "cocktail bar", "Kenya", "beach bar", "rum", "watermelon cocktail", "nightlife", site.address.town ?? ""].filter(Boolean),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: "/images/bar-night.jpg", width: 1320, height: 738, alt: "The BushyBaby Tiki Pub at night" }],
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description, images: ["/images/bar-night.jpg"] },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
  formatDetection: { telephone: true, address: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-moon focus:px-4 focus:py-2 focus:text-night">Skip to content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(buildBarSchema(site)) }} />
        <MotionProvider>
          <Nav />
          <main id="main" className="overflow-x-clip">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
