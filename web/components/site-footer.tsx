"use client"

import WildHuntFooter from "@/components/ui/wild-hunt-footer"
import imageLoader from "@/lib/image-loader"
import { getContent } from "@/lib/content"
import { lp, ui, type Locale } from "@/lib/i18n"

const FOOTER_IMG = "/images/werk/originale/originale-14.webp"
const footerSrcSet = [320, 640, 960]
  .map((w) => `${imageLoader({ src: FOOTER_IMG, width: w })} ${w}w`)
  .filter((v, i, a) => a.findIndex((x) => x.split(" ")[0] === v.split(" ")[0]) === i)
  .join(", ")

export function SiteFooter({ locale }: { locale: Locale }) {
  const { contact, site, nav } = getContent(locale)
  const t = ui[locale]
  const f = t.footer
  const label = (href: string) => nav.find((n) => n.href === href)?.label ?? href
  const year = new Date().getFullYear()
  return (
    <WildHuntFooter
      wordmark="FISCHER-ART"
      preset="vermilion"
      image={{ src: FOOTER_IMG, srcSet: footerSrcSet, sizes: "100vw", alt: "", position: "50% 45%" }}
      imageHeight={0.55}
      height="min(100svh, 860px)"
      tagline={f.tagline}
      sideNote={f.sideNote}
      backToTopLabel={f.backToTop}
      fontFamily={'"Inter Variable", "Helvetica Neue", Arial, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif'}
      columns={[
        {
          title: t.work,
          links: [
            { label: f.originals, href: lp(locale, "/werk/originale") },
            { label: f.sculptures, href: lp(locale, "/werk/skulpturen") },
            { label: label("/kunst-am-bau"), href: lp(locale, "/kunst-am-bau") },
          ],
        },
        {
          title: f.artist,
          links: ["/person", "/vita", "/ausstellungen", "/publikationen"].map((h) => ({ label: label(h), href: lp(locale, h) })),
        },
        {
          title: f.follow,
          links: [
            { label: "Instagram", href: site.instagram },
            { label: "Facebook", href: site.facebook },
            { label: t.shop, href: site.shopUrl },
          ],
        },
        {
          title: t.contact,
          links: [
            { label: contact.email, href: `mailto:${contact.email}` },
            { label: contact.phone, href: contact.phoneHref },
            { label: t.imprint, href: lp(locale, "/impressum") },
            { label: t.privacy, href: lp(locale, "/datenschutz") },
          ],
        },
      ]}
      legal={`© ${year} ${site.artist}`}
      colophon={f.colophon}
    />
  )
}
