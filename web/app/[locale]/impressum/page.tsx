import type { Metadata } from "next"
import { operator } from "@/lib/legal"
import { Container, PageHero } from "@/components/page-hero"
import { LegalDraftNote } from "@/components/legal-draft-note"
import { ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  return { title: ui[locale].imprint, robots: { index: false }, alternates: alternates(locale, "/impressum") }
}

export default async function ImpressumPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  return (
    <>
      <PageHero kicker={locale === "de" ? undefined : ui[locale].imprint} title="Impressum" />
      <Container className="max-w-3xl space-y-8 pb-32 leading-relaxed text-muted [&_h2]:text-text [&_h2]:font-display [&_h2]:italic [&_a]:text-gold">
        <LegalDraftNote t={ui[locale]} />
        <div lang="de" className="space-y-8">
        <section>
          <h2 className="font-display text-2xl font-extrabold">Angaben gemäß § 5 DDG</h2>
          <p className="mt-2">
            {operator.name}
            <br />
            {operator.business}
            <br />
            {operator.street}
            <br />
            {operator.city}
            <br />
            {operator.country}
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold">Kontakt</h2>
          <p className="mt-2">
            Telefon: {operator.phone}
            <br />
            E-Mail: <a className="underline" href={`mailto:${operator.email}`}>{operator.email}</a>
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold">Umsatzsteuer-ID</h2>
          <p className="mt-2">Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: {operator.vatId}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p className="mt-2">{operator.responsibleForContent}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold">Verbraucherstreitbeilegung</h2>
          <p className="mt-2">
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold">Urheberrecht</h2>
          <p className="mt-2">
            Alle auf dieser Website gezeigten Werke, Fotografien und Texte sind urheberrechtlich geschützt. Jede Verwertung außerhalb der
            Grenzen des Urheberrechts bedarf der vorherigen schriftlichen Zustimmung von Michael Fischer-Art.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-extrabold">Haftung für Links</h2>
          <p className="mt-2">
            Diese Website enthält Links zu externen Websites Dritter (z. B. Instagram, Facebook), auf deren Inhalte wir keinen Einfluss
            haben. Für diese fremden Inhalte ist stets der jeweilige Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen
            werden wir derartige Links umgehend entfernen.
          </p>
        </section>
        </div>
      </Container>
    </>
  )
}
