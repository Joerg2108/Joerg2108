// Zentrale SEO-Texte: Seitentitel (ohne „| Fischer-Art“, das hängt das Layout an) und Meta-Beschreibungen.
// Richtwerte: Titel ≤ 50 Zeichen (+ 14 Zeichen Suffix ≈ 60–65 gesamt), Beschreibung 120–155 Zeichen.
// Chinesisch: Zeichen sind breiter, daher kürzer (Titel ≤ 25, Beschreibung ≤ 80 Zeichen).

import type { Metadata } from "next"
import { localeNames, locales, type Locale } from "@/lib/i18n"
import { alternates } from "@/lib/locale-params"

type Entry = { title: string; description: string; image?: string }
type Pages = Record<string, Entry>

export const seo: Record<Locale, Pages> = {
  de: {
    "/": {
      title: "Michael Fischer-Art – Maler & Bildhauer aus Leipzig",
      description:
        "Michael Fischer-Art – Maler, Bildhauer und Illustrator aus Leipzig. Originale, Skulpturen, Kunst am Bau, Porträts und Events aus der Kunstfabrik Borna.",
    },
    "/person": {
      title: "Über Michael Fischer-Art – Künstler aus Leipzig",
      description:
        "Michael Fischer-Art will die Welt bunter machen: Der Leipziger Maler und Bildhauer über seine sozialkritische Kunst, seine Farben und seinen Weg.",
      image: "/og/person.jpg",
    },
    "/vita": {
      title: "Vita – Lebenslauf von Michael Fischer-Art",
      description:
        "Lebenslauf von Michael Fischer-Art: vom Maurer und Maler über das Kunststudium bis zu Großprojekten, Ausstellungen und der Sunshine Art Galerie.",
      image: "/og/person.jpg",
    },
    "/ausstellungen": {
      title: "Ausstellungen von Michael Fischer-Art",
      description:
        "Ausstellungen von Michael Fischer-Art in Deutschland und weltweit – eine Auswahl der wichtigsten Einzel- und Gruppenausstellungen des Leipziger Künstlers.",
    },
    "/kunst-am-bau": {
      title: "Kunst am Bau – Fassaden von Michael Fischer-Art",
      description:
        "Kunst am Bau von Michael Fischer-Art: bunte Fassaden, Brücken und Wandbilder im öffentlichen Raum. „Kaum ein Künstler hat so viel Fläche bemalt“ (Zeit).",
      image: "/og/kunst-am-bau.jpg",
    },
    "/publikationen": {
      title: "Bücher & Publikationen von Michael Fischer-Art",
      description:
        "Bücher, Kurzgeschichten und Illustrationen von Michael Fischer-Art – von „Der Weg zum Farbschock und zurück“ bis „Leipziger Schule“.",
    },
    "/aktuelles": {
      title: "Aktuelles & Termine aus dem Atelier Fischer-Art",
      description:
        "Neuigkeiten und Termine aus dem Atelier Fischer-Art in der Kunstfabrik Borna: Ausstellungen, Atelierfeste, Salons und Aktionen mit Michael Fischer-Art.",
    },
    "/werk/originale": {
      title: "Originale – Gemälde von Michael Fischer-Art",
      description:
        "Originale von Michael Fischer-Art: signierte Unikate in leuchtenden Farben, voller Figuren und Geschichten. Gemälde direkt aus dem Atelier anfragen.",
      image: "/og/originale.jpg",
    },
    "/werk/skulpturen": {
      title: "Skulpturen von Michael Fischer-Art",
      description:
        "Bunte Skulpturen von Michael Fischer-Art – Blickfänge auf Plätzen in Deutschland und darüber hinaus, bis zum 100 Meter langen Brunnen.",
      image: "/og/skulpturen.jpg",
    },
    "/werk/portraets": {
      title: "Pop-Art-Porträts von Michael Fischer-Art",
      description:
        "Pop-Art-Porträts von Michael Fischer-Art: Berühmtheiten in seiner Farbsprache – Naomi Campbell kaufte ihr Porträt selbst. Auch als Auftragsarbeit.",
      image: "/og/portraets.jpg",
    },
    "/werk/new-art": {
      title: "New Art – Objekte & Fahrzeuge von Fischer-Art",
      description:
        "New Art: Wenn das Objekt den Künstler findet – bemalte Fahrzeuge, ungewöhnliche Objekte und der Friedenspanzer von Michael Fischer-Art.",
      image: "/og/new-art.jpg",
    },
    "/werk/events": {
      title: "Events in der Kunstfabrik Borna",
      description:
        "Events mit Michael Fischer-Art: Sommerfeste, Atelierabende und Firmenfeiern in der Kunstfabrik Borna – mit Kunst, Livemusik und besonderer Kulisse.",
      image: "/og/events.jpg",
    },
    "/werk/reisen": {
      title: "Reisen – Inspiration aus aller Welt",
      description:
        "Rom, London, Korea, Mexiko, China: Auf Reisen sammelt Michael Fischer-Art neue Inspiration und hält seine Eindrücke in Bildern fest.",
      image: "/og/reisen.jpg",
    },
    "/werk/friends": {
      title: "Fischer-Art & Friends – Begegnungen",
      description:
        "Fischer-Art & Friends: Begegnungen von Michael Fischer-Art mit bekannten Gesichtern und interessanten Persönlichkeiten in Leipzig und weltweit.",
      image: "/og/friends.jpg",
    },
    "/werk/charity": {
      title: "Charity – Kunst für den guten Zweck",
      description:
        "Charity mit Michael Fischer-Art: Buddy Bär Berlin Show, Kunstwerke für den guten Zweck und ehrenamtliches Malen mit Kindern aus allen sozialen Schichten.",
      image: "/og/charity.jpg",
    },
  },
  en: {
    "/": {
      title: "Michael Fischer-Art – Painter & Sculptor, Leipzig",
      description:
        "Michael Fischer-Art – painter, sculptor and illustrator from Leipzig. Originals, sculptures, façade art, portraits and events from the Kunstfabrik Borna.",
    },
    "/person": {
      title: "About Michael Fischer-Art – Leipzig Artist",
      description:
        "Michael Fischer-Art wants to make the world more colourful: the Leipzig painter and sculptor on his socially critical art, his colours and his path.",
      image: "/og/person.jpg",
    },
    "/vita": {
      title: "Biography of Michael Fischer-Art",
      description:
        "Biography of Michael Fischer-Art: from bricklayer and painter to art school, large-scale façade projects, exhibitions and the Sunshine Art Gallery.",
      image: "/og/person.jpg",
    },
    "/ausstellungen": {
      title: "Exhibitions by Michael Fischer-Art",
      description:
        "Exhibitions by Michael Fischer-Art in Germany and worldwide – a selection of the most important solo and group shows of the Leipzig artist.",
    },
    "/kunst-am-bau": {
      title: "Façade Art by Michael Fischer-Art",
      description:
        "Art in architecture by Michael Fischer-Art: colourful façades, bridges and murals in public space. “Hardly any artist has painted as much surface” (Zeit).",
      image: "/og/kunst-am-bau.jpg",
    },
    "/publikationen": {
      title: "Books & Publications by Michael Fischer-Art",
      description:
        "Books, short stories and illustrations by Michael Fischer-Art – from “The Road to Colour Shock and Back” to “Leipziger Schule”.",
    },
    "/aktuelles": {
      title: "News & Dates from Studio Fischer-Art",
      description:
        "News and dates from Studio Fischer-Art at the Kunstfabrik Borna, Germany: exhibitions, studio parties, salons and live events with Michael Fischer-Art.",
    },
    "/werk/originale": {
      title: "Original Paintings by Michael Fischer-Art",
      description:
        "Original paintings by Michael Fischer-Art: signed one-offs in vivid colours, full of figures and stories. Enquire about works directly from the studio.",
      image: "/og/originale.jpg",
    },
    "/werk/skulpturen": {
      title: "Sculptures by Michael Fischer-Art",
      description:
        "Colourful sculptures by Michael Fischer-Art – eye-catchers on squares across Germany and beyond, up to a 100-metre-long fountain.",
      image: "/og/skulpturen.jpg",
    },
    "/werk/portraets": {
      title: "Pop Art Portraits by Michael Fischer-Art",
      description:
        "Pop art portraits by Michael Fischer-Art: celebrities in his colour language – Naomi Campbell bought hers herself. Also available as commissions.",
      image: "/og/portraets.jpg",
    },
    "/werk/new-art": {
      title: "New Art – Objects & Vehicles by Fischer-Art",
      description:
        "New Art: when the object finds the artist – painted vehicles, unusual objects and the Peace Tank by Michael Fischer-Art.",
      image: "/og/new-art.jpg",
    },
    "/werk/events": {
      title: "Events at the Kunstfabrik Borna",
      description:
        "Events with Michael Fischer-Art: summer parties, studio evenings and corporate events at the Kunstfabrik Borna – with art, live music and a unique setting.",
      image: "/og/events.jpg",
    },
    "/werk/reisen": {
      title: "Travel – Inspiration from Around the World",
      description:
        "Rome, London, Korea, Mexico, China: on his travels Michael Fischer-Art gathers new inspiration and captures his impressions in pictures.",
      image: "/og/reisen.jpg",
    },
    "/werk/friends": {
      title: "Fischer-Art & Friends – Encounters",
      description:
        "Fischer-Art & Friends: encounters of Michael Fischer-Art with famous faces and fascinating personalities in Leipzig and around the world.",
      image: "/og/friends.jpg",
    },
    "/werk/charity": {
      title: "Charity – Art for a Good Cause",
      description:
        "Charity with Michael Fischer-Art: Buddy Bear Berlin Show, artworks for good causes and volunteer painting with children from all walks of life.",
      image: "/og/charity.jpg",
    },
  },
  zh: {
    "/": {
      title: "Michael Fischer-Art——莱比锡画家与雕塑家",
      description: "Michael Fischer-Art，来自莱比锡的画家、雕塑家与插画家。原作、雕塑、建筑艺术、肖像及来自博尔纳艺术工厂的活动。",
    },
    "/person": {
      title: "关于 Michael Fischer-Art",
      description: "Michael Fischer-Art 想让世界更加多彩：这位莱比锡画家与雕塑家谈他的社会批判艺术、色彩与创作之路。",
      image: "/og/person.jpg",
    },
    "/vita": {
      title: "Michael Fischer-Art 个人履历",
      description: "Michael Fischer-Art 的履历：从泥瓦匠与油漆工到艺术学院，再到大型建筑立面项目、展览与 Sunshine Art 画廊。",
      image: "/og/person.jpg",
    },
    "/ausstellungen": {
      title: "Michael Fischer-Art 展览",
      description: "Michael Fischer-Art 在德国及世界各地的展览——这位莱比锡艺术家最重要的个展与群展精选。",
    },
    "/kunst-am-bau": {
      title: "建筑艺术——Fischer-Art 立面作品",
      description: "Michael Fischer-Art 的建筑艺术：公共空间中的多彩立面、桥梁与壁画。《时代周报》称“几乎没有艺术家画过如此多的面积”。",
      image: "/og/kunst-am-bau.jpg",
    },
    "/publikationen": {
      title: "Michael Fischer-Art 出版物",
      description: "Michael Fischer-Art 的书籍、短篇小说与插画作品，包括《色彩冲击之路》与《莱比锡画派》。",
    },
    "/aktuelles": {
      title: "Fischer-Art 工作室最新动态",
      description: "来自博尔纳艺术工厂 Fischer-Art 工作室的新闻与日程：展览、工作室活动、沙龙及与 Michael Fischer-Art 的现场活动。",
    },
    "/werk/originale": {
      title: "Michael Fischer-Art 原作绘画",
      description: "Michael Fischer-Art 的原作：签名的独一无二之作，色彩鲜明，充满人物与故事。可直接向工作室咨询作品。",
      image: "/og/originale.jpg",
    },
    "/werk/skulpturen": {
      title: "Michael Fischer-Art 雕塑作品",
      description: "Michael Fischer-Art 的多彩雕塑——遍布德国及世界各地广场的醒目地标，包括一座长达 100 米的喷泉。",
      image: "/og/skulpturen.jpg",
    },
    "/werk/portraets": {
      title: "Michael Fischer-Art 波普肖像",
      description: "Michael Fischer-Art 的波普艺术肖像：以他独特色彩语言描绘的名人——娜奥米·坎贝尔亲自买下了自己的肖像。亦可定制。",
      image: "/og/portraets.jpg",
    },
    "/werk/new-art": {
      title: "新艺术——Fischer-Art 的物件与车辆",
      description: "新艺术：当物件找到艺术家——Michael Fischer-Art 彩绘的车辆、不寻常的物件以及“和平坦克”。",
      image: "/og/new-art.jpg",
    },
    "/werk/events": {
      title: "博尔纳艺术工厂活动",
      description: "与 Michael Fischer-Art 一起参加活动：博尔纳艺术工厂的夏日派对、工作室之夜与企业活动——艺术、现场音乐与独特氛围。",
      image: "/og/events.jpg",
    },
    "/werk/reisen": {
      title: "旅行——来自世界各地的灵感",
      description: "罗马、伦敦、韩国、墨西哥、中国：Michael Fischer-Art 在旅途中汲取新的灵感，并将印象融入画作。",
      image: "/og/reisen.jpg",
    },
    "/werk/friends": {
      title: "Fischer-Art 与朋友们",
      description: "Fischer-Art 与朋友们：Michael Fischer-Art 在莱比锡及世界各地与知名人士和有趣人物的相遇。",
      image: "/og/friends.jpg",
    },
    "/werk/charity": {
      title: "慈善——为公益而创作",
      description: "Michael Fischer-Art 的慈善活动：柏林伙伴熊展、为公益创作的艺术品，以及与各阶层儿童一起义务绘画。",
      image: "/og/charity.jpg",
    },
  },
}

/** Complete metadata for an indexable page: title, description, canonical/hreflang, Open Graph, Twitter. */
export function pageMeta(locale: Locale, path: string): Metadata {
  const e = seo[locale][path]
  if (!e) throw new Error(`SEO-Eintrag fehlt: ${locale} ${path}`)
  const alt = alternates(locale, path)
  const image = e.image ?? "/og/default.jpg"
  const isHome = path === "/"
  return {
    title: isHome ? { absolute: e.title } : e.title,
    description: e.description,
    alternates: alt,
    openGraph: {
      type: path === "/person" ? "profile" : "website",
      url: alt.canonical,
      title: isHome ? e.title : `${e.title} | Fischer-Art`,
      description: e.description,
      siteName: "Fischer-Art",
      locale: localeNames[locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeNames[l].ogLocale),
      images: [{ url: image, width: 1200, height: 630, alt: e.title }],
    },
    twitter: { card: "summary_large_image", title: e.title, description: e.description, images: [image] },
  }
}

/** Schema.org data for the home page: the artist, his studio (local business) and the website. */
export function homeJsonLd(
  locale: Locale,
  c: {
    site: { url: string; artist: string; name: string; instagram: string; facebook: string; tiktok: string; maps: string }
    contact: { atelier: string; street: string; city: string; email: string; phoneHref: string }
  },
) {
  const base = c.site.url
  const [postalCode, ...town] = c.contact.city.split(" ")
  const sameAs = [c.site.instagram, c.site.facebook, c.site.tiktok]
  const address = {
    "@type": "PostalAddress",
    streetAddress: c.contact.street,
    postalCode,
    addressLocality: town.join(" "),
    addressCountry: "DE",
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${base}/#artist`,
        name: c.site.artist,
        alternateName: "Michael Fischer",
        jobTitle: { de: "Maler, Bildhauer, Illustrator", en: "Painter, sculptor, illustrator", zh: "画家、雕塑家、插画家" }[locale],
        birthPlace: "Leipzig",
        url: `${base}/${locale}/`,
        image: `${base}/og/person.jpg`,
        sameAs,
        worksFor: { "@id": `${base}/#atelier` },
      },
      {
        "@type": ["LocalBusiness", "ArtGallery"],
        "@id": `${base}/#atelier`,
        name: c.contact.atelier,
        url: `${base}/${locale}/`,
        image: `${base}/og/default.jpg`,
        email: c.contact.email,
        telephone: c.contact.phoneHref.replace(/^tel:/, ""),
        address,
        hasMap: c.site.maps,
        founder: { "@id": `${base}/#artist` },
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: `${base}/`,
        name: c.site.name,
        inLanguage: ["de", "en", "zh-Hans"],
        publisher: { "@id": `${base}/#artist` },
      },
    ],
  }
}

/** Breadcrumb for sub pages (Home › Section › Page). */
export function breadcrumbJsonLd(base: string, items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${base}${it.path}` })),
  }
}

/** Renders JSON-LD safely (escapes "<" so content cannot close the script tag). */
export function jsonLdProps(data: unknown) {
  return { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") } }
}
