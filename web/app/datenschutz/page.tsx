import type { Metadata } from "next"
import { operator } from "@/lib/legal"
import { Container, PageHero } from "@/components/page-hero"
import { LegalDraftNote } from "@/components/legal-draft-note"

export const metadata: Metadata = { title: "Datenschutz", robots: { index: false } }

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-extrabold">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  )
}

export default function DatenschutzPage() {
  return (
    <>
      <PageHero title="Datenschutzerklärung" />
      <Container className="max-w-3xl space-y-8 py-16 leading-relaxed">
        <LegalDraftNote />
        <S title="1. Verantwortlicher">
          <p>
            {operator.name}, {operator.street}, {operator.city}, E-Mail:{" "}
            <a className="underline" href={`mailto:${operator.email}`}>{operator.email}</a>, Telefon: {operator.phone}
          </p>
        </S>
        <S title="2. Grundsätze">
          <p>
            Diese Website setzt keine Cookies, verwendet keine Analyse- oder Trackingdienste und bindet keine Inhalte von Drittanbietern
            ein. Schriftarten werden vom eigenen Server geladen, es findet keine Verbindung zu Google Fonts statt.
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
        <S title="5. Links zu sozialen Netzwerken">
          <p>
            Wir verlinken auf unsere Profile bei Instagram und Facebook (Meta Platforms Ireland Ltd.). Es handelt sich um einfache Links;
            Daten werden erst übertragen, wenn Sie den Link anklicken und die Seite des Anbieters aufrufen. Dort gilt die
            Datenschutzerklärung von Meta.
          </p>
        </S>
        <S title="6. Ihre Rechte">
          <p>
            Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung
            (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Außerdem können Sie sich bei einer
            Datenschutz-Aufsichtsbehörde beschweren, z. B. bei der Sächsischen Datenschutz- und Transparenzbeauftragten.
          </p>
        </S>
      </Container>
    </>
  )
}
