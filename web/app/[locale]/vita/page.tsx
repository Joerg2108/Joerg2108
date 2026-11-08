import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { getContent } from "@/lib/content"
import { ui } from "@/lib/i18n"
import { getLocale, type LocaleParams } from "@/lib/locale-params"
import { Container, PageHero } from "@/components/page-hero"
import { Timeline } from "@/components/timeline"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  return pageMeta(locale, "/vita")
}

export default async function VitaPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const { vita } = getContent(locale)
  const t = ui[locale]
  return (
    <>
      <PageHero kicker={t.lifeKicker} title={t.vita} />
      <Container className="pb-32">
        <Timeline items={vita} />
      </Container>
    </>
  )
}
