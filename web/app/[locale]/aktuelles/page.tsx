import type { Metadata } from "next"
import { getContent } from "@/lib/content"
import { localeNames, ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  return { title: ui[locale].news, alternates: alternates(locale, "/aktuelles") }
}

export default async function NewsPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { news } = getContent(locale)
  const t = ui[locale]
  const fmt = new Intl.DateTimeFormat(localeNames[locale].dateLocale, { day: "numeric", month: "long", year: "numeric" })
  return (
    <>
      <PageHero kicker={t.newsKicker} title={t.news} />
      <Container className="space-y-12 py-16">
        {news.map((n) => (
          <article key={n.title} className="pop-shadow grid gap-8 rounded-lg border-2 border-ink bg-white p-6 md:grid-cols-2 md:p-10">
            <div>
              <time dateTime={n.date} className="text-sm font-bold uppercase tracking-widest text-pop-red">
                {fmt.format(new Date(n.date))}
              </time>
              <h2 className="mt-2 font-display text-3xl font-extrabold">{n.title}</h2>
              <p className="mt-4 text-lg">{n.text}</p>
            </div>
            {n.video ? (
              <video controls preload="metadata" playsInline className="w-full rounded border-2 border-ink bg-ink">
                <source src={n.video} type="video/mp4" />
              </video>
            ) : null}
          </article>
        ))}
      </Container>
    </>
  )
}
