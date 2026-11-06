import type { Metadata } from "next"
import { getContent } from "@/lib/content"
import { ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  return { title: ui[locale].vita, alternates: alternates(locale, "/vita") }
}

export default async function VitaPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { vita } = getContent(locale)
  const t = ui[locale]
  return (
    <>
      <PageHero kicker={t.lifeKicker} title={t.vita} />
      <Container className="py-16">
        <ol className="relative max-w-3xl border-l-4 border-ink">
          {vita.map((v, i) => (
            <li key={v.year + v.text} className="relative mb-8 pl-8">
              <span className={`absolute -left-[13px] top-1.5 h-5 w-5 rounded-full border-2 border-ink ${["bg-pop-red", "bg-pop-yellow", "bg-pop-blue", "bg-pop-green"][i % 4]}`} />
              <p className="font-display text-xl font-extrabold">{v.year}</p>
              <p className="text-lg">{v.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </>
  )
}
