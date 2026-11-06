import images from "./works-images.json"
import type { Locale } from "./i18n"
import { metaEn, metaZh, captionsEn, captionsZh } from "./works-i18n"

export interface WorkImage {
  src: string
  width: number
  height: number
  caption: string
}

export interface WorkCategory {
  slug: string
  title: string
  text: string[]
  images: WorkImage[]
  /** Image used on cards and in the mega menu. */
  cover?: WorkImage
}

export const metaDe: Omit<WorkCategory, "images" | "cover">[] = [
  {
    slug: "originale",
    title: "Originale",
    text: [
      "Bei Originalen erwirbt man, wie der Name schon sagt, einen echten Fischer-Art, signiert und natürlich in Farbe! Ein Original ist deshalb in der Regel ein Unikat, es existiert nur ein einziges Mal auf der Welt. Dies ist besonders bei aufwendigen Malereien der Fall und macht den besonderen Reiz von Originalkunst aus.",
      "Satte Farben, große Flächen, einfache Strukturen und comicartige „Muppets“ – dieser Bildsprache bedient sich Michael Fischer-Art in vielen seiner Originale. Aber auch Landschaften, Porträts oder abstrakte Bilder finden sich in der Sammlung wieder. Was daraus entsteht, ist ein großer Wiedererkennungswert und Bilder, die immer auch ein bisschen provozieren.",
    ],
  },
  {
    slug: "skulpturen",
    title: "Skulpturen",
    text: [
      "Die Handschrift von Michael Fischer-Art findet sich auch in seinen Skulpturen wieder. Bunt und auffällig wie sie sind, sind sie ein Anziehungspunkt auf vielen Plätzen in Deutschland und auch darüber hinaus. Ein Blickfang, der so schnell nicht vergessen wird.",
      "Ähnlich wie bei Kunst am Bau sollten auch Skulpturen in ihrer Herkunft langlebig und nachhaltig sein. Mit recycelten Materialien erschafft er neue individuelle Figuren, die für Kunst im öffentlichen Raum zugänglich sind.",
    ],
  },
  {
    slug: "kunst-am-bau",
    title: "Kunst am Bau",
    text: [
      "Was dem Künstler die Farbe, ist dem Bauherren die Fassade. Und so verbinden sich Architektur, eine Grundidee und Kunst im öffentlichen Raum zu einem Ort, der den Menschen in ihrem Lebensalltag zugänglich gemacht wird.",
      "Kindergärten, Wohnhäuser oder Brücken – alles lässt sich durch Kunst am Bau individualisieren. Dabei geht es allerdings nicht nur um das reine Verschönern von Objekten, es sollte immer auch ein Thema, wie die Historie des Gebäudes oder der Anlass der Entstehung des Kunstwerkes, verarbeitet werden.",
    ],
  },
  {
    slug: "portraets",
    title: "Porträts",
    text: [
      "Jeder Künstler entdeckt für sich seine ganz eigene Leidenschaft, die von Michael Fischer-Art findet sich in dieser Kategorie wieder. Viele seiner Fans kommen bei den Porträts richtig ins Schwärmen. Naomi Campbell war z. B. so begeistert, dass sie sich das Gemälde selbst als nachträgliches Geburtstagsgeschenk kaufte.",
      "Durch was lässt sich Fischer-Art bei seiner Auswahl inspirieren? Durchaus auch mal von Musik und markanten Persönlichkeiten, und so liegt es nah, dass „einer den Job machen muss“ und Udo Lindenberg porträtiert wird.",
    ],
  },
  {
    slug: "new-art",
    title: "New Art",
    text: [
      "Manchmal findet nicht der Künstler die Leinwand, sondern das Objekt findet den Künstler. So hat Michael Fischer-Art neben einer Vielzahl von Fahrzeugen auch sein persönliches Highlight gefunden: Der Friedenspanzer als Herzensprojekt von Künstler und Auftraggeber.",
      "Michael Fischer-Art ist immer auf der Suche nach neuen Herausforderungen und Inspirationen. Wenn auch Sie Gegenstände oder Objekte mit Geschichte durch Kunst zum Leben erwecken lassen möchten, dann melden Sie sich bei uns.",
    ],
  },
  {
    slug: "events",
    title: "Events",
    text: [
      "Jeder Künstler erfindet sich immer wieder mal neu. Michael Fischer-Art wählte als Startschuss dafür das Sommerfest 2019 in der Fabrik nahe Borna. Mit knapp 300 Gästen verwandelte sich das Gelände in einen Sommernachtstraum mit Fischer-Art als DJ, Livemusik, und für den kulinarischen Geschmack sorgte Starkoch Lutz Köhler.",
      "Sie suchen eine Location für ein Event in außergewöhnlicher Kulisse? Verbringen Sie einen schönen Abend dort, wo einer der bekanntesten Künstler Leipzigs seine Kunstwerke erschafft.",
    ],
  },
  {
    slug: "reisen",
    title: "Reisen",
    text: [
      "Rom, London, Ischia, Korea, Portugal, Mexiko, Frankreich, Athen, Jordanien, China und Amerika zählen zu den vielen verschiedenen Metropolen und Ländern auf dieser Welt, die Michael Fischer-Art in den vergangenen Jahren bereist hat, um seine Gedanken zu relativieren und vor allem neue Inspirationen zu sammeln. Seine Eindrücke hält er dabei immer in Skizzentagebüchern fest.",
      "Einer der beeindruckendsten Orte, die Fischer-Art besuchte, war die Felsenstadt Petra in der Schlucht Siq in Jordanien. Geschaffen wurde Petra vor mehr als 2000 Jahren. Die Stadt galt viele Jahre als verschollen und ist Schauplatz von Filmen wie Indiana Jones. Bis heute birgt die Felsenstadt viele Geheimnisse und gilt nicht nur deshalb als Inspirationsquelle.",
    ],
  },
  {
    slug: "friends",
    title: "Fischer-Art & Friends",
    text: [
      "Nicht nur in Leipzig ist Michael Fischer-Art viel unterwegs. Auch im Rest der Welt holt er sich Inspirationen und trifft dabei auf bekannte Gesichter und interessante Persönlichkeiten.",
      "Zu den Persönlichkeiten, die Michael Fischer-Art bei verschiedenen Events getroffen hat, zählen nicht nur Politiker wie Angela Merkel oder Bill Clinton, sondern auch Sportler und Prominente aus Film, Fernsehen und Musik.",
    ],
  },
  {
    slug: "charity",
    title: "Charity",
    text: [
      "Seit vielen Jahren engagiert sich Michael Fischer-Art für verschiedenste Charity-Projekte weltweit. Er beteiligte sich an der Buddy Bär Berlin Show, erschuf viele Kunstwerke für einen guten Zweck und malt ehrenamtlich mit Kindern aus allen sozialen Schichten. Charity liegt dem Künstler sehr am Herzen, weshalb er nicht nur Materialien spendet, sondern auch viel Zeit investiert.",
      "„Ich finde es immer gut, für Kinder und Jugendliche zu spenden und Menschen in unserer Gesellschaft zu unterstützen, die durch Schicksalsschläge geprägt wurden. Ich bin selber Vater von vier Kindern – Kinder brauchen immer helfende Hände“, so Michael Fischer-Art über das Charity-Projekt „Ein Herz für Kinder“.",
    ],
  },
]

const byCategory = images as Record<string, WorkImage[]>

const meta: Record<Locale, Omit<WorkCategory, "images" | "cover">[]> = { de: metaDe, en: metaEn, zh: metaZh }
const captions: Record<Locale, Record<string, string>> = { de: {}, en: captionsEn, zh: captionsZh }

// Covers: the most expressive picture of each category (index into its image list).
const coverIndex: Record<string, number> = { originale: 14, "kunst-am-bau": 6, events: 3 }

export function getWorks(locale: Locale): WorkCategory[] {
  return meta[locale].map((m) => {
    const images = (byCategory[m.slug] ?? []).map((img) => ({ ...img, caption: captions[locale][img.caption] ?? img.caption }))
    return { ...m, images, cover: images[coverIndex[m.slug] ?? 0] ?? images[0] }
  })
}

export function getWork(locale: Locale, slug: string) {
  return getWorks(locale).find((w) => w.slug === slug)
}

export const workSlugs = metaDe.map((m) => m.slug)
