import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getWork, getWorks, workSlugs } from "@/lib/works"
import { getContent } from "@/lib/content"
import { locales, lp, ui, isLocale } from "@/lib/i18n"
import { alternates } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"

type P = { params: Promise<{ locale: string; slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return locales.flatMap((locale) => workSlugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const w = getWork(locale, slug)
  return w ? { title: w.title, description: w.text[0], alternates: alternates(locale, `/werk/${slug}`) } : {}
}

export default async function WorkPage({ params }: P) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const w = getWork(locale, slug)
  if (!w) notFound()
  const t = ui[locale]
  const { contact } = getContent(locale)
  const works = getWorks(locale)
  const i = works.findIndex((x) => x.slug === w.slug)
  const next = works[(i + 1) % works.length]
  return (
    <>
      <PageHero kicker={t.work} title={w.title}>
        {w.text.map((p) => (
          <p key={p} className="mb-4">
            {p}
          </p>
        ))}
      </PageHero>
      <Container className="py-16">
        <Gallery images={w.images} title={w.title} t={t} />
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-8">
          <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`${t.requestAbout} ${w.title}`)}`} className="font-bold text-pop-red underline decoration-2 underline-offset-4">
            {t.requestAbout} {w.title}
          </a>
          <Link href={lp(locale, next.slug === "kunst-am-bau" ? "/kunst-am-bau" : `/werk/${next.slug}`)} className="pop-shadow-sm rounded border-2 border-ink bg-pop-yellow px-5 py-2.5 font-bold">
            {t.nextWork} {next.title} →
          </Link>
        </div>
      </Container>
    </>
  )
}
