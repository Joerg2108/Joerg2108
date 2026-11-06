import type { Metadata } from "next"
import Link from "next/link"
import { lp, ui } from "@/lib/i18n"
import { getLocale, type LocaleParams } from "@/lib/locale-params"
import { PageHero } from "@/components/page-hero"

// Wird von Netlify für unbekannte Adressen ausgeliefert (siehe public/_redirects).
export const metadata: Metadata = { robots: { index: false } }

export default async function NotFoundPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  const t = ui[locale]
  return (
    <PageHero kicker={t.notFoundKicker} title={t.notFoundTitle}>
      <p>
        {t.notFoundText}{" "}
        <Link href={lp(locale, "/")} className="font-bold text-pop-red underline">
          {t.home}
        </Link>
        .
      </p>
    </PageHero>
  )
}
