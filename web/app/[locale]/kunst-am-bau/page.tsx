import type { Metadata } from "next"
import { getContent } from "@/lib/content"
import { getWork } from "@/lib/works"
import { localeNames, ui, type Locale } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"
import { Gallery } from "@/components/gallery"
import { Counter } from "@/components/motion"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  const { kunstAmBau } = getContent(locale)
  return { title: ui[locale].kunstAmBau, description: kunstAmBau.lead, alternates: alternates(locale, "/kunst-am-bau") }
}

const units: Record<Locale, { pre: string[]; unit: string[] }> = {
  de: { pre: ["über", "fast", "über"], unit: ["qm", "Liter", ""] },
  en: { pre: ["over", "almost", "over"], unit: ["m²", "litres", ""] },
  zh: { pre: ["逾", "近", "逾"], unit: ["平方米", "升", "座"] },
}

export default async function KunstAmBauPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { kunstAmBau } = getContent(locale)
  const work = getWork(locale, "kunst-am-bau")
  const t = ui[locale]
  const u = units[locale]
  return (
    <>
      <PageHero kicker={kunstAmBau.kicker} title={t.kunstAmBau} film={{ base: "/media/fassaden" }}>
        <p className="mb-5 font-display text-2xl italic leading-snug text-text">{kunstAmBau.lead}</p>
        {work?.text.map((p) => (
          <p key={p} className="mb-4">
            {p}
          </p>
        ))}
      </PageHero>
      <Container className="pb-32">
        <dl className="mb-20 grid gap-5 sm:grid-cols-3">
          {[30000, 600, 100].map((n, i) => (
            <div key={i} data-reveal="scale" style={{ ["--i" as string]: i }} className="glass flex flex-col-reverse rounded-[var(--nc-radius-l)] p-7">
              <dt className="kicker mt-4">{t.stats[i][1]}</dt>
              <dd>
                <span className="block text-sm text-muted">{u.pre[i]}</span>
                <span className="text-metal font-display text-5xl">
                  <Counter to={n} locale={localeNames[locale].dateLocale} />
                </span>
                {u.unit[i] ? <span className="ml-2 font-display text-xl italic text-muted">{u.unit[i]}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
        <h2 data-reveal className="mb-8 font-display text-4xl italic sm:text-5xl">
          {t.references}
        </h2>
        <div data-reveal className="glass overflow-x-auto rounded-[var(--nc-radius-l)]">
          <table className="w-full min-w-[34rem] text-left">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="kicker px-6 py-4 font-normal">{t.year}</th>
                <th scope="col" className="kicker px-6 py-4 font-normal">{t.place}</th>
                <th scope="col" className="kicker px-6 py-4 font-normal">{t.object}</th>
              </tr>
            </thead>
            <tbody>
              {kunstAmBau.projects.map((p, i) => (
                <tr key={i} className="border-b border-line/60 transition-colors duration-300 last:border-0 hover:bg-white/[0.035]">
                  <td className="px-6 py-3 font-mono text-sm text-primary">{p.year}</td>
                  <td className="px-6 py-3">{p.place}</td>
                  <td className="px-6 py-3 text-muted">{p.object}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 data-reveal className="mb-8 mt-24 font-display text-4xl italic sm:text-5xl">
          {t.projects}
        </h2>
        <Gallery images={work?.images ?? []} title={t.kunstAmBau} t={t} />
      </Container>
    </>
  )
}
