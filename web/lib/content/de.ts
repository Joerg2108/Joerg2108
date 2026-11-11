// Alle Inhalte der neuen Website, übernommen von www.fischer-art.de (Stand: November 2026).
// Bilder liegen unter /public/images und werden über scripts/import-images.mjs erzeugt.

export const site = {
  name: "Fischer-Art",
  artist: "Michael Fischer-Art",
  claim: "Maler, Bildhauer, Illustrator, Zeichner",
  tagline: "Visionär",
  url: "https://www.fischer-art.de",
  shopUrl: "http://fischer-art-shop.de",
  instagram: "https://www.instagram.com/fischerart/",
  facebook: "https://www.facebook.com/fischerart/",
  tiktok: "https://www.tiktok.com/@michael_fischer_art",
  // WhatsApp-Chat (Click-to-Chat) mit der Handynummer aus `contact.phone`
  whatsapp: "https://wa.me/491723426684",
  maps: "https://www.google.com/maps/search/?api=1&query=Am+Steigerhain+13%2C+04552+Borna",
  mapsEmbed: "https://www.google.com/maps?q=Am+Steigerhain+13,+04552+Borna&z=15&output=embed",
}

export const contact = {
  atelier: "Atelier Fischer-Art",
  place: "Kunstfabrik",
  street: "Am Steigerhain 13",
  city: "04552 Borna",
  phone: "0049 172 3 42 66 84",
  phoneHref: "tel:+491723426684",
  email: "atelier@fischer-art.de",
  vatId: "DE 18 45 68 599",
  intro: "Für Anfragen, Bookings und weitere Informationen kontaktieren Sie uns. Wir freuen uns auf Ihre Anfrage.",
}

export const nav = [
  { href: "/#werk", label: "Werk" },
  { href: "/#leistungen", label: "Leistungen" },
  { href: "/person", label: "Person" },
  { href: "/vita", label: "Vita" },
  { href: "/ausstellungen", label: "Ausstellungen" },
  { href: "/kunst-am-bau", label: "Kunst am Bau" },
  { href: "/publikationen", label: "Publikationen" },
  { href: "/aktuelles", label: "Aktuelles" },
  { href: "/#kontakt", label: "Kontakt" },
]

export const about = {
  title: "Michael Fischer-Art",
  text: "Der in Leipzig geborene Künstler Michael Fischer-Art hat sich schon im Kindesalter vorgenommen, die Welt bunter zu gestalten. In seiner Kunst setzt Fischer-Art sich sozialkritisch mit der Umwelt auseinander, ordnet sein Schaffen selber in Anlehnung an den Sozialkritischen Realismus dem „Marktwirtschaftlichen Realismus“ zu.",
  fields: [
    {
      title: "Originale",
      text: "Fischer-Arts Bilder – immer auch farbig-kreischende Attacken gegen langweiligen Intellektualismus oder geheuchelten Tiefsinn. In Anlehnung an den Sozialistischen Realismus bezeichnet Fischer-Art seine Arbeiten als dem „Marktwirtschaftlichen Realismus“ zugehörig. In seiner Bildsprache bedient er sich an satten Farben, großer Flächen, einfachen Strukturen und comicartigen „Muppets“, wodurch ein hoher Wiedererkennungswert entsteht.",
    },
    {
      title: "Skulpturen",
      text: "Bunt, auffällig und immer ein Blickfang, Michael Fischer-Arts Skulpturen verschönern viele Plätze in Deutschland und sind ein Magnet für Touristen und Kunstliebhaber. Ein 100 Meter langer Brunnen in der Innenstadt von Frankfurt (Oder), in dem acht bis zu sechs Meter hohe Skulpturen Wasser spucken, gehörte zu den ersten Skulptur-Projekten.",
    },
    {
      title: "Fassaden",
      text: "„Kaum ein Künstler hat weltweit so viel Fläche bemalt wie er“ (Zeit, 2011). Doch auf Flächen alleine lassen sich die Kunst am Bau-Projekte von Michael Fischer-Art nicht beschränken. Auch Brücken, Spielplätze und vieles mehr werden von dem Künstler in Farbe getaucht.",
    },
    {
      title: "Porträts",
      text: "Mal ein etwas anderer Stil, aber nicht weniger bunt: Schon viele Berühmtheiten wurden von Michael Fischer-Art in Pop-Art Manier dargestellt. Dazu pflegt der Künstler Fischer-Art guten Kontakt zu Vertretern aus Politik, Wirtschaft und Showbusiness.",
    },
    {
      title: "New Art",
      text: "Wie man es von einem Künstler wie Michael Fischer-Art erwartet, lässt sich nicht alles, was er anpackt, in Kategorien unterteilen. Wo die Inspiration einen packt, passiert Kunst auch mal auf außergewöhnliche Weise.",
    },
    {
      title: "Autor",
      text: "Als Autor ist Fischer-Art immer wieder für eine Überraschung gut, das hat er mit der letzten Auflage seiner sieben Kurzgeschichten bewiesen. In seinen Geschichten erzählt Fischer-Art von staatlich anerkannten Kriminellen und zufälligen Tätern, ungehörten Persönlichkeiten und fügsamen Schattenexistenzen. Mal nachdenklich, mal bitterböse und stets auf ungewöhnliche Weise unterhaltend.",
    },
  ],
}

export const quotes = {
  bach: { text: "Wem die Kunst das Leben ist, dessen Leben ist eine große Kunst.", author: "Johann Sebastian Bach" },
  twain: { text: "Wenn wir bedenken, dass wir alle verrückt sind, ist das Leben erklärt.", author: "Mark Twain" },
}

export const services = {
  intro: "Wir gestalten Ihre Welt bunter, ob in Form von Auftragsarbeiten, Kunst am Bau oder Events.",
  items: [
    {
      title: "Auftragsarbeiten",
      text: "Individueller geht es nicht. Arbeiten können weit über Bilder auf Leinwand hinausgehen. In der Malerei gibt es kaum Grenzen, angefangen von der Gestaltung einer Hauswand, Kunst am Bau, Wandbemalung im Eingangsbereich oder Ihr ganz persönliches Porträt – alles ist möglich. Sprechen Sie uns an und teilen Sie Ihre Idee mit uns.",
    },
    {
      title: "Events",
      text: "Das Atelier von Michael Fischer-Art dient nicht nur zur Erschaffung von Kunst. Unsere Events finden in einer außergewöhnlichen Kulisse statt. Wenn auch Sie mit Ihren Kunden oder Geschäftspartnern im industriellen Style einen schönen Abend dort verbringen wollen, wo einer der bekanntesten Künstler Leipzigs seine Werke erschafft, melden Sie sich bei uns.",
    },
    {
      title: "Atelierrundgang",
      text: "Wenn Sie schon immer wissen wollten, wie das Atelier von Michael Fischer-Art aussieht, und dazu eine persönliche Führung erhalten möchten, gespickt mit spannenden Geschichten aus der Vergangenheit, Gegenwart und Zukunft, dann schicken Sie uns eine Anfrage.",
    },
    {
      title: "Malen mit Fischer-Art",
      text: "Es geht um die (Wieder-)Entdeckung der eigenen Kreativität. Hier wird auf Leinwänden gemalt, mit Farben experimentiert, sich ausgetobt – und das alles unter der Anleitung des Künstlers. Dieser sorgt auch für das Material, die Leinwände und die Acrylfarben. Die Teilnehmer sind in der Interpretation des vorgeschlagenen Werks frei, der Kreativität sind keine Grenzen gesetzt. Sie benötigen keinerlei Vorerfahrung und müssen lediglich den Mut mitbringen, etwas Neues auszuprobieren.",
    },
  ],
}

export const person = {
  kicker: "Der Visionär",
  title: "Michael Fischer-Art",
  role: "Künstler, Designer, Autor",
  claim: "Weltweit erfolgreich als Künstler, Designer und Autor",
  image: "/images/person/kontaktbild.webp",
  text: "Michael Fischer, Künstlername Michael Fischer-Art, machte eine Lehre als Maurer und Maler, arbeitete als Hausmeister und Krankenpfleger in der Psychiatrie, machte nach der Wende Abitur und studierte von 1992 bis 1997 an der Hochschule für Graphik und Buchkunst in Leipzig. Der Künstler arbeitet mit sehr starken Farben auf großen Flächen, verwendet einfache Strukturen und zeichnet teils comicartige Figuren, aber auch z. B. realistische Porträts. Er ist bekannt für seine sozialkritischen Themen (Tibet, Afrika) und seine großflächigen Gebäudebemalungen. Seine Skulpturen formt er aus Eisen bzw. gestaltet sie auch aus Schrott (Panzer, Autos). Seine Kontakte sind weltweit gestreut, da er sehr viel reist und gute Kontakte zur Politik pflegt. International hat er weit über 100 Gebäude künstlerisch gestaltet und sucht stetig neue Herausforderungen.",
}

export const vita: { year: string; text: string }[] = [
  { year: "2017", text: "Eröffnung Sunshine Art Galerie" },
  { year: "2017", text: "Athen & Amsterdam Marathon" },
  { year: "2016", text: "Geburt von Tochter Clara" },
  { year: "2015", text: "Völkerschlachtdenkmal im Ural, Russland" },
  { year: "2015", text: "New York Marathon" },
  { year: "2008", text: "Geburt von Tochter Elisabeth" },
  { year: "2008", text: "New York Marathon" },
  { year: "2005", text: "Studienaufenthalt Villa Romana, Florenz" },
  { year: "2004", text: "Mitglied der 12. Bundesversammlung, Sonderbotschafter Verbundnetz der Wärme" },
  { year: "2001", text: "Geburt von Tochter Charlotte" },
  { year: "2000", text: "Geburt von Sohn Artur" },
  { year: "seit 1997", text: "Freischaffender Künstler" },
  { year: "1992 – 1997", text: "Student an der Hochschule für Graphik und Buchkunst Leipzig" },
  { year: "1992", text: "Abitur" },
  { year: "1989 – 1992", text: "Krankenpfleger in der Psychiatrie" },
  { year: "1989", text: "Verhaftung beim Pleißemarsch in Leipzig, im Zusammenhang mit den Friedensgebeten in der Nikolaikirche" },
  { year: "1987 – 1989", text: "Jobs als Maurer, Maler, Hausmeister" },
  { year: "1985 – 1987", text: "Lehre als Maurer und Maler" },
  { year: "1975 – 1987", text: "Schulbesuch" },
  { year: "1969", text: "In Leipzig geboren" },
]

export const exhibitions = {
  kicker: "Ausstellungen",
  lead: "Eine Ausstellung vorzubereiten, heißt sich mit einem Thema auseinanderzusetzen, das in diesen, nicht für alle glücklichen Zeiten, schon fast eine Provokation ist. Gespräche über Unglück sind stets willkommen, sicherlich politisch und gesellschaftlich korrekt und benötigen keiner Begründung.",
  text: "Aus dem Verborgenen der Kunstfabrik Borna in die Öffentlichkeit – was gibt es Schöneres für einen Künstler. Zahlreiche Ausstellungen über Politik, Reisen, Personen und Projekte eröffnete Fischer-Art selbst. Zuletzt standen seine Skizzenbücher im Fokus, diese hatte er im Rahmen einer Sonderausstellung der Universität Leipzig vermacht. Die Ausstellung gibt einen ersten Einblick in das noch unerschlossene Konvolut, das es ermöglicht, das künstlerische Schaffen von Fischer-Art über 30 Jahre hinweg zu verfolgen.",
  // Die Originalseite führt Zeitpunkte und Institutionen als zwei getrennte Spalten
  // (36 bzw. 35 Einträge, also nicht eindeutig zuordenbar). Deshalb bleiben es zwei Listen.
  dates: [
    "2019 Dezember", "2019 Vernissage", "2018 Galerie", "2017 RETRO CLASSIC", "2015 Art Fair Landmark",
    "2014 Art-Karlsruhe", "2013 Art Fair Köln", "2013 Ausstellung „Schnick Schnack“", "2013 KomprimArt",
    "2013 Ausstellung", "2012 Louvre", "2012 Ausstellung", "2012 Small monuments", "2012 Salon de la Louvre",
    "2011 Aktion Mauerfälle", "2011 Ausstellung", "2011 Munich Contempo", "2011 art KARLSRUHE", "2011 Takinu",
    "2010 Aktion Mauerfälle", "2010 Expo in Shanghai", "2010 Munich Contempo", "2010 ART.FAIR 21",
    "2010 „Let's go outside“", "2010 art KARLSRUHE", "2009 Galerie Schönhof", "2009 „20 Jahre Mauerfall“",
    "2009 Kunst im Loft", "2009 art KARLSRUHE", "2008 Galleria", "2008 Blaue Fabrik",
    "2008 Müller und Petzinna, Ausstellung „Skulptur“", "2008 art KARLSRUHE", "2007 Scope", "2007 Galleria",
    "2007 art KARLSRUHE",
  ],
  institutions: [
    "Ausstellung Schloss Brandis", "Ausstellung „Die Welt im Tagebuch“", "Rathaus in Eschborn", "Cologne",
    "Arts Centre, England", "Galerie Casteel aus Mönchengladbach", "Galerie Casteel",
    "Drei Leipziger Künstler – Drei Systeme", "Künstler & Gäste, im The Q", "„Die Fischer-Art-Bank“, Kunsthaus Müller",
    "Société Nationale des Beaux Arts", "„Respektlos – Bunt – Genial“ Galerie TAKINU und Kunsthaus Schiller",
    "Galerie Müller & Petzinna", "Frankreich – Paris", "Zu Gast in Hoyerswerda, Erfurt",
    "Nature 2 Garden of Light a cura di Bodo Peintka", "Galerie Casteel", "Galerie Casteel", "Galerie Stuttgart",
    "Wanderausstellung", "Blüthner-Flügel im chinesischen Pavillon", "Galerie Casteel", "Galerie Casteel",
    "Museum Schloss Burgk", "Galerie Casteel", "Jade, Niedersachsen", "VNG Verbundnetz Gas AG, Leipzig", "München",
    "Galerie Casteel", "Babara Mahler", "Dresden", "Galerie Casteel", "Miami", "Babara Mahler", "Galerie Casteel",
  ],
  images: [
    { src: "/images/ausstellungen/gemaelde-1.webp", caption: "" },
    { src: "/images/ausstellungen/gemaelde-2.webp", caption: "" },
    { src: "/images/ausstellungen/gemaelde-3.webp", caption: "" },
    { src: "/images/ausstellungen/serie.webp", caption: "Serie" },
    { src: "/images/ausstellungen/kandahar.webp", caption: "Kandahar" },
    { src: "/images/ausstellungen/stahlfigur.webp", caption: "Stahlfigur" },
    { src: "/images/ausstellungen/ausstellung.webp", caption: "" },
  ],
}

const kabYears = [
  "2019 Washington", "2019 Hoyerswerda", "2019 Leipzig", "2019 Zwönitz", "2019 Leipzig", "2018 Tharandter Wald",
  "2018 Altenburg", "2018 Nordhausen", "2017 Äthiopien", "2016 Templin", "2015 Leipzig", "2015 Leipzig",
  "2015 Leipzig", "2015 Leipzig", "2015 Berlin", "2014 Varel Friesland", "2014 Leipzig", "2014 Washington",
  "2014 Leipzig", "2013 Berlin", "2013 Markkleeberg", "2012 Markkleeberg", "2012 Leipzig", "2010 Stuttgart",
  "2010 Stuttgart", "2010 Chemnitz", "2010 Leipzig", "2009 Leipzig", "2009 Leipzig", "2009 Zwenkau",
  "2008 Wurzbach", "2008 Leipzig", "2007 Hannover", "2007 Weida", "2007 Freiberg", "2007 Leipzig", "2007 Leipzig",
  "2007 Gera", "2006 Berlin", "2006 Leipzig", "2003 Leipzig – Borna", "2003 Mönchengladbach", "2002 Leipzig",
  "2002 Leipzig", "2001 Leipzig",
]
const kabObjects = [
  "Einweihung State Department", "Hochhaus", "Fassade Goldschmidtstraße", "Pflegeheim des EHK",
  "Industriegebäude Plagwitz", "GEORADO Erlebniswelt", "Tower Flughafen", "Nordhausen", "Brückenbemalung",
  "Fassadenbemalung", "Fassadenbemalung", "Sonne des Lebens (Edelstahl 4,5 m)", "Baum des Lebens (Edelstahl 2,98 m)",
  "Kulturhaus Leipzig im Ural, Russland", "Wandbemalung", "6 farbig beschichtete Edelstahlfiguren",
  "Das Letzte Abendmahl, Kuppelbemalung", "Aufstellung Berliner Mauersegment", "Deckengemälde im Westbad",
  "Moabit/Wedding", "11-Geschosser DDR-Plattenbau", "Gestaltung Synlabgebäude", "Eingangsportal der Grundschule",
  "Völkerschlachtpanoramabild", "KiTa Olgastraße", "Gestaltung Wohngebiet", "Leipziger Platz, Addis Abeba",
  "Außenfassade der Brühlarkaden", "Görlitzer Straße", "Kindergarten", "Turm in Wurzbach", "Sonderpflegeheim",
  "Fischer-Art-Haus", "Verhüllung Schlosswache Osterburg", "Giebelbemalung Gymnasium",
  "Wandbild Musikschule Johann Sebastian Bach", "Wandbemalung Klinikum St. Georg", "Verhüllung Hofwiesenpark BUGA",
  "Entrollung des Wandbildes", "Verhüllung Außenfassaden „Drei Türme“", "Gestaltung Schulgebäude Lehmbaugruppe",
  "Gebäudegestaltung Sankratstraße", "Fertigstellung Elsterlofts", "Giebelwand Grafisches Viertel",
  "Ausgestaltung der HTWK",
]

export const kunstAmBau = {
  kicker: "Referenzen",
  lead: "Fischer-Art schuf in den vergangenen Jahrzehnten viele Arbeiten im öffentlichen Raum. Bis heute sind es über 30.000 qm Fassadenfläche, dabei hat Fischer-Art fast 600 Liter bunte Farbe verbraucht.",
  projects: kabYears.map((yc, i) => {
    const [year, ...rest] = yc.split(" ")
    return { year, place: rest.join(" "), object: kabObjects[i] ?? "" }
  }),
}

export const publications = {
  kicker: "Veröffentlichungen",
  text: about.fields[5].text,
  publisher: "Publikationen von Schwarzkopf & Schwarzkopf",
  books: [
    { year: "2014", title: "Kurzgeschichten. Herrenlose Stadt", note: "nicht mehr verfügbar" },
    { year: "2008", title: "Der Angeklagte ist anGERICHTet.", note: "Veikko Bartel mit Illustrationen von Michael Fischer-Art" },
    { year: "2002", title: "Leipziger Schule." },
    { year: "2002", title: "Kunst am Bau" },
    { year: "1997", title: "Das Diplom und andere organisierte Verbrechen." },
    { year: "1995", title: "Der Weg zum Farbschock und zurück." },
  ],
  covers: [
    { src: "/images/publikationen/das-diplom.webp", caption: "Das Diplom und andere organisierte Verbrechen" },
    { src: "/images/publikationen/kunst-am-bau.webp", caption: "Kunst am Bau" },
    { src: "/images/publikationen/leipziger-schule.webp", caption: "Leipziger Schule" },
    { src: "/images/publikationen/farbschock.webp", caption: "Der Weg zum Farbschock und zurück" },
  ],
}

export type NewsItem = {
  date: string
  title: string
  text: string
  video?: string
  /** Flyer oder Foto; `alt` beschreibt den Inhalt für Screenreader. */
  image?: { src: string; width: number; height: number; alt: string }
  link?: { href: string; label: string }
}

export const news: NewsItem[] = [
  {
    date: "2026-11-11",
    title: "Kranzzauber – Workshops mit Fischer-Art",
    text: "Dein Bild. Deine Farben. Dein Kunstmoment. Am 11.11.2026 und 18.11.2026 im Pop-up Store in der Leipziger Innenstadt: Lass deiner Kreativität freien Lauf und gestalte mit Unterstützung von Michael Fischer-Art dein eigenes Bild. Für alle, die Kunst lieben und selbst kreativ werden möchten.",
    image: {
      src: "/images/aktuelles/kranzzauber-2026.webp",
      width: 1810,
      height: 1206,
      alt: "Flyer „Kranzzauber“: Workshops mit Fischer-Art am 11.11.2026 und 18.11.2026 im Pop-up Store, Leipzig Innenstadt. Anmeldung über kranzzauber.de.",
    },
    link: { href: "https://kranzzauber.de", label: "Platz buchen auf kranzzauber.de" },
  },
  {
    date: "2026-04-14",
    title: "Frühlingssalon Atelier Borna 18.04.2026",
    text: "Frühlingssalon im Atelier Borna: 18.04.2026 von 10 – 20 Uhr. Schaut vorbei und genießt die Kunst!",
    video: "/media/fruehlingssalon-2026.mp4",
  },
]

export const shop = {
  intro: "Künftig werden hier Originale, Kunstdrucke, Publikationen und Merchandising-Produkte erhältlich sein.",
  order: "Wenn Sie einen Kalender erwerben wollen, senden Sie uns eine E-Mail mit Ihrem Namen und Ihrer Adresse.",
  items: [
    {
      title: "Kalender 2023 Nepal (Hochformat)",
      image: "/images/shop/kalender-2023-nepal.webp",
      text: "Jedes Jahr mindestens eine gute Tat – in Vorbereitung auf diverse Charity-Projekte beschäftigt sich der Künstler Michael Fischer-Art auch intensiv mit dem Wiederaufbau eines Kinderkrankenhauses in Nepals Hauptstadt Kathmandu. Von seinem Besuch inspiriert, entstand das Motiv zum Kalender Nepal.",
      price: "9,90 € zzgl. 8 € Versandkosten",
    },
    {
      title: "Kalender 2023 Hoffnung (Querformat)",
      image: "/images/shop/kalender-2023-hoffnung.webp",
      text: "„Die Hoffnung stirbt zuletzt“, so beschreibt Fischer-Art seinen Monatskalender, der ihn und sein Umfeld einmal mehr vor diverse Herausforderungen gestellt hat. Dabei verarbeitet der Künstler nicht nur gesellschaftlich relevante Themen, sondern versucht diese auch mit alltäglichen Situationen aufzulockern. So werden die Wirtschaftskrise und sportliche Aktivitäten kombiniert in Szene gesetzt und geben einen Einblick in die gedankliche Welt des Künstlers.",
      price: "9,90 € zzgl. 8 € Versandkosten",
    },
    {
      title: "Kalender 2021",
      image: "/images/shop/kalender-2021-a.webp",
      text: "Die zweite Edition des exklusiven Kalenders von Michael Fischer-Art begleitet Sie mit 12 eindrucksvollen Bildern durch das gesamte Jahr 2021. Alle hochwertigen Kunstwerke sind auf Saison, Jahreszeiten und Feste abgestimmt.",
      price: "9,90 € zzgl. 8 € Versandkosten",
    },
    {
      title: "Kalender 2021",
      image: "/images/shop/kalender-2021-b.webp",
      text: "Das Jahr 2020 hielt uns vor allem in unseren eigenen vier Wänden. Während dieser Zeit packte Michael Fischer-Art, wie viele andere auch, das Fernweh. Die Sehnsucht nach dem bewegten Leben in fremden Kulturen und fernen Ländern verarbeitet er in 12 einzigartigen, hochwertigen Bildern.",
      price: "9,90 € zzgl. 8 € Versandkosten",
    },
  ],
}

// Häufige Fragen – alle Antworten beruhen auf Angaben der bisherigen Website.
export const faq = [
  {
    q: "Wie frage ich eine Auftragsarbeit an?",
    a: "Schreiben Sie uns Ihre Idee an atelier@fischer-art.de. Auftragsarbeiten reichen vom persönlichen Porträt über Bilder auf Leinwand bis zur Wandbemalung im Eingangsbereich und zur Gestaltung ganzer Fassaden.",
  },
  {
    q: "Kann ich das Atelier besuchen?",
    a: "Ja. Auf Anfrage gibt es einen persönlichen Atelierrundgang in der Kunstfabrik Borna – mit Geschichten aus Vergangenheit, Gegenwart und Zukunft.",
  },
  {
    q: "Kann ich das Atelier für ein Event buchen?",
    a: "Ja. Die Kunstfabrik bietet eine außergewöhnliche Kulisse im industriellen Stil für Abende mit Kunden oder Geschäftspartnern. Senden Sie uns Ihre Anfrage per E-Mail.",
  },
  {
    q: "Brauche ich Vorkenntnisse für „Malen mit Fischer-Art“?",
    a: "Nein. Sie brauchen nur den Mut, etwas Neues auszuprobieren. Material, Leinwände und Acrylfarben stellt der Künstler.",
  },
  {
    q: "Wie bestelle ich einen Kalender?",
    a: "Senden Sie uns eine E-Mail mit Ihrem Namen und Ihrer Adresse. Ein Kalender kostet 9,90 € zzgl. 8 € Versandkosten.",
  },
  {
    q: "Wo befindet sich das Atelier?",
    a: "In der Kunstfabrik, Am Steigerhain 13, 04552 Borna – südlich von Leipzig.",
  },
]
