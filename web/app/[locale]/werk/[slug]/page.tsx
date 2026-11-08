import type { Metadata } from "next"
import { breadcrumbJsonLd, jsonLdProps, pageMeta } from "@/lib/seo"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getWork, getWorks, workSlugs } from "@/lib/works"
import { getContent } from "@/lib/content"
import { locales, lp, ui, isLocale } from "@/lib/i18n"
import { ButtonLink, Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

type P = { params: Promise<{ locale: string; slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return locales.flatMap((locale) => workSlugs.filter((slug) => slug !== "kunst-am-bau").map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const w = getWork(locale, slug)
  return w ? pageMeta(locale, `/werk/${slug}`) : {}
}

export default async function WorkPage({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const w = getWork(locale, slug)
  if (!w) notFound()
  const t = ui[locale]
  const { contact, site } = getContent(locale)
  const works = getWorks(locale)
  const i = works.findIndex((x) => x.slug === w.slug)
  const next = works[(i + 1) % works.length]
  const nextHref = lp(locale, next.slug === "kunst-am-bau" ? "/kunst-am-bau" : `/werk/${next.slug}`)
  const crumbs = breadcrumbJsonLd(site.url, [
    { name: site.name, path: `/${locale}/` },
    { name: w.title, path: `/${locale}/werk/${w.slug}/` },
  ])
  return (
    <>
      <script {...jsonLdProps(crumbs)} />
      <PageHero kicker={`${t.chapter} ${String(i + 1).padStart(2, "0")} · ${t.work}`} title={w.title}>
        {w.text.map((p) => (
          <p key={p} className="mb-4">
            {p}
          </p>
        ))}
      </PageHero>
      <Container className="pb-24">
        <Gallery images={w.images} title={w.title} t={t} />
        <div data-reveal className="mt-20 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-10">
          <ButtonLink href={`mailto:${contact.email}?subject=${encodeURIComponent(`${t.requestAbout} ${w.title}`)}`} variant="ghost">
            {t.requestAbout} {w.title}
          </ButtonLink>
          <Link href={nextHref} className="group text-right">
            <span className="kicker">{t.nextWork}</span>
            <span className="mt-2 block font-display text-4xl italic transition-colors duration-500 group-hover:text-gold sm:text-6xl">
              {next.title} <span className="inline-block transition-transform duration-500 group-hover:translate-x-2">→</span>
            </span>
          </Link>
        </div>
      </Container>
    </>
  )
}
