import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { getContent } from "@/lib/content"
import { localeNames, ui } from "@/lib/i18n"
import { getLocale, type LocaleParams } from "@/lib/locale-params"
import Image from "next/image"
import { ButtonLink, Container, PageHero } from "@/components/page-hero"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  return pageMeta(locale, "/aktuelles")
}

export default async function NewsPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { news } = getContent(locale)
  const t = ui[locale]
  const fmt = new Intl.DateTimeFormat(localeNames[locale].dateLocale, { day: "numeric", month: "long", year: "numeric" })
  return (
    <>
      <PageHero kicker={t.newsKicker} title={t.news} />
      <Container className="space-y-12 pb-32">
        {news.map((n) => (
          <article key={n.title} data-reveal className="glass grid items-center gap-10 rounded-[var(--nc-radius-l)] p-6 sm:p-10 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <time dateTime={n.date} className="kicker text-primary">
                {fmt.format(new Date(n.date))}
              </time>
              <h2 className="mt-4 font-display text-4xl italic leading-tight sm:text-5xl">{n.title}</h2>
              <p className="mt-6 text-lg leading-relaxed text-muted">{n.text}</p>
              {n.link ? (
                <p className="mt-8">
                  <ButtonLink href={n.link.href} external>
                    {n.link.label}
                  </ButtonLink>
                </p>
              ) : null}
            </div>
            {n.image ? (
              <div className="relative mx-auto w-full">
                <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-[image:var(--nc-gradient-aurora)] opacity-25 blur-2xl" />
                <a href={n.image.src} target="_blank" rel="noopener" className="relative block overflow-hidden rounded-[1.5rem] border border-line shadow-[var(--nc-shadow-float)]">
                  <Image src={n.image.src} alt={n.image.alt} width={n.image.width} height={n.image.height} sizes="(min-width: 768px) 40vw, 92vw" className="h-auto w-full" />
                </a>
              </div>
            ) : null}
            {n.video ? (
              <div className="relative mx-auto w-full max-w-xs">
                <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-[image:var(--nc-gradient-aurora)] opacity-25 blur-2xl" />
                <video controls preload="metadata" playsInline poster="/media/atelier-loop-poster.webp" className="relative w-full rounded-[1.5rem] border border-line bg-bg shadow-[var(--nc-shadow-float)]">
                  <source src={n.video} type="video/mp4" />
                </video>
              </div>
            ) : null}
          </article>
        ))}
      </Container>
    </>
  )
}
