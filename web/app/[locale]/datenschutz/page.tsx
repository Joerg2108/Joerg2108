import type { Metadata } from "next"
import { operator } from "@/lib/legal"
import { Container, PageHero } from "@/components/page-hero"
import { LegalDraftNote } from "@/components/legal-draft-note"
import { ui } from "@/lib/i18n"
import { alternates, getLocale, type LocaleParams } from "@/lib/locale-params"

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const locale = await getLocale(params)
  return { title: ui[locale].privacy, robots: { index: false }, alternates: alternates(locale, "/datenschutz") }
}

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  )
}

export default async function DatenschutzPage({ params }: LocaleParams) {
  const locale = await getLocale(params)
  return (
    <>
      <PageHero kicker={locale === "de" ? undefined : ui[locale].privacy} title="Datenschutzerklärung" />
      <Container className="max-w-3xl space-y-8 pb-32 leading-relaxed text-muted [&_h2]:text-text [&_h2]:font-display [&_h2]:italic [&_a]:text-gold">
        <LegalDraftNote t={ui[locale]} />
        <div lang="de" className="space-y-8">
        <S title="1. Verantwortlicher">
          <p>
            {operator.name}, {operator.street}, {operator.city}, E-Mail:{" "}
            <a className="underline" href={`mailto:${operator.email}`}>{operator.email}</a>, Telefon: {operator.phone}
          </p>
        </S>
        <S title="2. Grundsätze">
          <p>
            Diese Website setzt keine Cookies, verwendet keine Analyse- oder Trackingdienste und bindet Inhalte von Drittanbietern
            nur nach Ihrer ausdrücklichen Zustimmung ein (YouTube-Videos und Google Maps, siehe Abschnitte 6 und 7). Schriftarten werden vom eigenen Server geladen, es findet keine Verbindung zu Google Fonts statt.
          </p>
        </S>
        <S title="3. Server-Logfiles">
          <p>
            Beim Aufruf der Website verarbeitet der Hosting-Anbieter technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene
            Seite, Referrer, Browser und Betriebssystem). Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt
            im sicheren und stabilen Betrieb der Website. Die Daten werden nach spätestens 14 Tagen gelöscht, sofern keine längere
            Aufbewahrung zu Beweiszwecken erforderlich ist.
          </p>
          <p>Hosting-Anbieter: [bitte ergänzen: Name, Anschrift, Auftragsverarbeitungsvertrag].</p>
        </S>
        <S title="4. Kontakt per E-Mail und Telefon">
          <p>
            Das Kontaktformular überträgt keine Daten an diese Website. Es öffnet lediglich Ihr eigenes E-Mail-Programm. Wenn Sie uns per
            E-Mail oder Telefon kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b DSGVO bei
            Vertragsanbahnung, sonst lit. f DSGVO). Die Daten werden gelöscht, sobald die Anfrage erledigt ist und keine gesetzlichen
            Aufbewahrungsfristen entgegenstehen.
          </p>
        </S>
        <S title="5. Links zu sozialen Netzwerken und WhatsApp">
          <p>
            Wir verlinken auf unsere Profile bei Instagram und Facebook (Meta Platforms Ireland Ltd.) sowie bei TikTok (TikTok
            Technology Limited, Irland). Es handelt sich um einfache Links; Daten werden erst übertragen, wenn Sie den Link anklicken
            und die Seite des Anbieters aufrufen. Dort gilt die Datenschutzerklärung des jeweiligen Anbieters.
          </p>
          <p>
            Über die WhatsApp-Links (wa.me) können Sie uns eine Nachricht über WhatsApp (WhatsApp Ireland Limited, Merrion Road,
            Dublin 4, Irland) schicken. Auch das ist ein einfacher Link: Erst wenn Sie ihn anklicken, öffnet sich WhatsApp, und erst
            wenn Sie eine Nachricht absenden, verarbeiten WhatsApp und wir Ihre Telefonnummer, Ihren Namen und den Inhalt der Nachricht
            zur Beantwortung Ihrer Anfrage (Art. 6 Abs. 1 lit. b bzw. f DSGVO). WhatsApp verschlüsselt Nachrichten Ende-zu-Ende,
            verarbeitet aber Metadaten; eine Übermittlung in die USA ist möglich (Meta ist nach dem EU-US Data Privacy Framework
            zertifiziert). Wenn Sie das nicht möchten, schreiben Sie uns bitte per E-Mail oder rufen Sie an.
          </p>
        </S>
        <section id="youtube" className="scroll-mt-28">
        <S title="6. YouTube-Videos">
          <p>
            Auf der Startseite zeigen wir Videos von YouTube (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland). Wir
            nutzen den erweiterten Datenschutzmodus (youtube-nocookie.com) und eine Zwei-Klick-Lösung: Beim Seitenaufruf wird nur ein
            lokales Vorschaubild angezeigt, es besteht keine Verbindung zu YouTube. Erst wenn Sie auf „Video abspielen“ klicken, wird der
            Player geladen. Dabei werden u. a. Ihre IP-Adresse, die aufgerufene Seite und technische Browserdaten an Google übertragen;
            eine Übermittlung in die USA ist möglich (Google ist nach dem EU-US Data Privacy Framework zertifiziert). YouTube kann
            dabei Cookies bzw. lokalen Speicher nutzen.
          </p>
          <p>
            Rechtsgrundlage ist Ihre Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Die Einwilligung gilt
            nur für das angeklickte Video und den aktuellen Seitenaufruf; sie endet, wenn Sie die Seite verlassen oder neu laden. Weitere
            Informationen: <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.
          </p>
        </S>
        </section>
        <section id="google-maps" className="scroll-mt-28">
        <S title="7. Google Maps">
          <p>
            Im Kontaktbereich können Sie eine Karte von Google Maps (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4,
            Irland) anzeigen lassen. Beim Seitenaufruf sehen Sie nur eine lokal gespeicherte Platzhaltergrafik, es besteht keine
            Verbindung zu Google. Erst wenn Sie auf „Karte laden“ klicken, wird die Karte geladen. Dabei werden u. a. Ihre IP-Adresse
            und technische Browserdaten an Google übertragen; eine Übermittlung in die USA ist möglich (Google ist nach dem EU-US Data
            Privacy Framework zertifiziert). Google kann dabei Cookies bzw. lokalen Speicher nutzen.
          </p>
          <p>
            Rechtsgrundlage ist Ihre Einwilligung durch den Klick (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Sie gilt nur für
            den aktuellen Seitenaufruf. Der Link „Route in Google Maps“ öffnet Google Maps in einem neuen Fenster; erst dann werden
            Daten an Google übertragen. Weitere Informationen:{" "}
            <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.
          </p>
        </S>
        </section>
        <S title="8. Ihre Rechte">
          <p>
            Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung
            (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Außerdem können Sie sich bei einer
            Datenschutz-Aufsichtsbehörde beschweren, z. B. bei der Sächsischen Datenschutz- und Transparenzbeauftragten.
          </p>
        </S>
        </div>
      </Container>
    </>
  )
}
