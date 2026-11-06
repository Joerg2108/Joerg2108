"use client"

import WildHuntFooter from "@/components/ui/wild-hunt-footer"
import { contact, site } from "@/lib/content"

export function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <WildHuntFooter
      wordmark="FISCHER-ART"
      preset="vermilion"
      image={{ src: "/images/home/hero.webp", alt: "", position: "50% 40%" }}
      imageHeight={0.55}
      height="min(100svh, 860px)"
      tagline="Wir gestalten Ihre Welt bunter · Originale · Skulpturen · Kunst am Bau"
      sideNote="Kunstfabrik · Am Steigerhain 13 · 04552 Borna"
      columns={[
        {
          title: "Werk",
          links: [
            { label: "Originale", href: "/werk/originale" },
            { label: "Skulpturen", href: "/werk/skulpturen" },
            { label: "Kunst am Bau", href: "/kunst-am-bau" },
          ],
        },
        {
          title: "Künstler",
          links: [
            { label: "Person", href: "/person" },
            { label: "Vita", href: "/vita" },
            { label: "Ausstellungen", href: "/ausstellungen" },
            { label: "Publikationen", href: "/publikationen" },
          ],
        },
        {
          title: "Folgen",
          links: [
            { label: "Instagram", href: site.instagram },
            { label: "Facebook", href: site.facebook },
            { label: "Shop", href: site.shopUrl },
          ],
        },
        {
          title: "Kontakt",
          links: [
            { label: contact.email, href: `mailto:${contact.email}` },
            { label: contact.phone, href: contact.phoneHref },
            { label: "Impressum", href: "/impressum" },
            { label: "Datenschutz", href: "/datenschutz" },
          ],
        },
      ]}
      legal={`© ${year} ${site.artist}`}
      colophon="Alle Werke, Texte und Fotos © Michael Fischer-Art. Nutzung nur mit Genehmigung des Ateliers."
    />
  )
}
