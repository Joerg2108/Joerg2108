// English version of the site content. Structure mirrors ./de.ts.
import type * as DE from "./de"
import * as de from "./de"

export const site: typeof DE.site = {
  ...de.site,
  claim: "Painter, sculptor, illustrator, draughtsman",
  tagline: "Visionary",
}

export const contact: typeof DE.contact = {
  ...de.contact,
  place: "Kunstfabrik (Art Factory)",
  city: "04552 Borna, Germany",
  phone: "+49 172 3426684",
  intro: "For enquiries, bookings and further information, please get in touch. We look forward to hearing from you.",
}

export const nav: typeof DE.nav = [
  { href: "/#werk", label: "Work" },
  { href: "/#leistungen", label: "Services" },
  { href: "/person", label: "About" },
  { href: "/vita", label: "CV" },
  { href: "/ausstellungen", label: "Exhibitions" },
  { href: "/kunst-am-bau", label: "Art in Architecture" },
  { href: "/publikationen", label: "Publications" },
  { href: "/aktuelles", label: "News" },
  { href: "/#kontakt", label: "Contact" },
]

export const about: typeof DE.about = {
  title: "Michael Fischer-Art",
  text: "Born in Leipzig, the artist Michael Fischer-Art decided as a child that he would make the world more colourful. His art takes a socially critical look at the world around us. Drawing on the tradition of Socialist Realism, he assigns his own work to what he calls “Market Economy Realism”.",
  fields: [
    {
      title: "Originals",
      text: "Fischer-Art's paintings are always loud, colourful attacks on dull intellectualism and feigned profundity. Echoing Socialist Realism, Fischer-Art describes his works as belonging to “Market Economy Realism”. His visual language relies on rich colours, large surfaces, simple structures and comic-like “muppets”, which makes his work instantly recognisable.",
    },
    {
      title: "Sculptures",
      text: "Colourful, striking and always an eye-catcher, Michael Fischer-Art's sculptures brighten up many squares across Germany and attract tourists and art lovers alike. One of his first sculpture projects was a 100-metre-long fountain in the centre of Frankfurt (Oder), in which eight sculptures up to six metres tall spout water.",
    },
    {
      title: "Façades",
      text: "“Hardly any artist in the world has painted as much surface as he has” (Die Zeit, 2011). Yet Michael Fischer-Art's art-in-architecture projects are not limited to walls. Bridges, playgrounds and much more are also immersed in colour by the artist.",
    },
    {
      title: "Portraits",
      text: "A slightly different style, but no less colourful: Michael Fischer-Art has portrayed many celebrities in pop-art style. The artist also maintains good contacts with representatives from politics, business and show business.",
    },
    {
      title: "New Art",
      text: "As you would expect from an artist like Michael Fischer-Art, not everything he takes on fits into a category. Wherever inspiration strikes, art sometimes happens in unusual ways.",
    },
    {
      title: "Author",
      text: "As an author, Fischer-Art is always good for a surprise, as he proved with the latest edition of his seven short stories. In them he tells of state-approved criminals and accidental offenders, unheard personalities and compliant shadow existences. Sometimes thoughtful, sometimes wickedly funny and always unusually entertaining.",
    },
  ],
}

export const quotes: typeof DE.quotes = {
  bach: { text: "For those to whom art is life, life is a great work of art.", author: "Johann Sebastian Bach" },
  twain: { text: "When we remember we are all mad, the mysteries disappear and life stands explained.", author: "Mark Twain" },
}

export const services: typeof DE.services = {
  intro: "We make your world more colourful, whether through commissions, art in architecture or events.",
  items: [
    {
      title: "Commissions",
      text: "It does not get more individual than this. Commissions can go far beyond paintings on canvas. In painting there are hardly any limits: from designing a house wall, art in architecture or a mural in an entrance hall to your very own portrait – anything is possible. Talk to us and share your idea.",
    },
    {
      title: "Events",
      text: "Michael Fischer-Art's studio is not only a place where art is created. Our events take place in an extraordinary setting. If you would like to spend an evening with your clients or business partners in an industrial atmosphere, right where one of Leipzig's best-known artists creates his works, get in touch.",
    },
    {
      title: "Studio tour",
      text: "If you have always wanted to see what Michael Fischer-Art's studio looks like and would enjoy a personal tour, full of fascinating stories from the past, present and future, send us an enquiry.",
    },
    {
      title: "Painting with Fischer-Art",
      text: "This is about (re)discovering your own creativity. You paint on canvas, experiment with colours and let off steam – all under the artist's guidance. He also provides the materials, canvases and acrylic paints. Participants are free to interpret the suggested work as they like; there are no limits to creativity. No previous experience is needed – just the courage to try something new.",
    },
  ],
}

export const person: typeof DE.person = {
  ...de.person,
  kicker: "The visionary",
  role: "Artist, designer, author",
  claim: "Successful worldwide as an artist, designer and author",
  text: "Michael Fischer, whose artist name is Michael Fischer-Art, trained as a bricklayer and painter, worked as a caretaker and as a psychiatric nurse, took his Abitur (A-levels) after German reunification and studied at the Academy of Fine Arts Leipzig (Hochschule für Grafik und Buchkunst) from 1992 to 1997. He works with very strong colours on large surfaces, uses simple structures and draws comic-like figures as well as, for example, realistic portraits. He is known for his socially critical themes (Tibet, Africa) and his large-scale building paintings. He shapes his sculptures from iron or creates them from scrap (tanks, cars). His contacts span the globe, as he travels a great deal and maintains good relations with politicians. Internationally he has artistically designed well over 100 buildings and is constantly looking for new challenges.",
}

export const vita: typeof DE.vita = [
  { year: "2017", text: "Opening of the Sunshine Art Gallery" },
  { year: "2017", text: "Athens & Amsterdam Marathon" },
  { year: "2016", text: "Birth of daughter Clara" },
  { year: "2015", text: "Monument to the Battle of the Nations in the Urals, Russia" },
  { year: "2015", text: "New York Marathon" },
  { year: "2008", text: "Birth of daughter Elisabeth" },
  { year: "2008", text: "New York Marathon" },
  { year: "2005", text: "Study residency at Villa Romana, Florence" },
  { year: "2004", text: "Member of the 12th Federal Convention; special ambassador of the “Verbundnetz der Wärme” initiative" },
  { year: "2001", text: "Birth of daughter Charlotte" },
  { year: "2000", text: "Birth of son Artur" },
  { year: "since 1997", text: "Freelance artist" },
  { year: "1992 – 1997", text: "Student at the Academy of Fine Arts Leipzig (HGB)" },
  { year: "1992", text: "Abitur (A-levels)" },
  { year: "1989 – 1992", text: "Psychiatric nurse" },
  { year: "1989", text: "Arrested during the Pleisse march in Leipzig, connected with the peace prayers at St Nicholas Church" },
  { year: "1987 – 1989", text: "Jobs as bricklayer, painter and caretaker" },
  { year: "1985 – 1987", text: "Apprenticeship as bricklayer and painter" },
  { year: "1975 – 1987", text: "School" },
  { year: "1969", text: "Born in Leipzig" },
]

export const exhibitions: typeof DE.exhibitions = {
  ...de.exhibitions,
  kicker: "Exhibitions",
  lead: "Preparing an exhibition means engaging with a subject that, in these times – not happy ones for everyone – is almost a provocation. Conversations about misfortune are always welcome, certainly politically and socially correct, and need no justification.",
  text: "From the seclusion of the Kunstfabrik in Borna into the public eye – what could be better for an artist? Fischer-Art has opened numerous exhibitions himself, on politics, travel, people and projects. Most recently his sketchbooks were in focus: he bequeathed them to Leipzig University as part of a special exhibition. The exhibition offers a first glimpse into this still unexplored body of work, which makes it possible to follow Fischer-Art's artistic output over 30 years.",
  dates: de.exhibitions.dates.map((d) =>
    d.replace("Dezember", "December").replace("Ausstellung", "Exhibition").replace(/^(\d{4}) Galerie$/, "$1 Gallery").replace("Aktion Mauerfälle", "“Wall falls” campaign").replace("„20 Jahre Mauerfall“", "“20 years since the fall of the Wall”").replace("Müller und Petzinna, Exhibition „Skulptur“", "Müller und Petzinna, exhibition “Sculpture”").replace(/„([^“]+)“/g, "“$1”"),
  ),
  institutions: de.exhibitions.institutions.map((d) =>
    d
      .replace("Ausstellung Schloss Brandis", "Exhibition, Brandis Castle")
      .replace("Ausstellung „Die Welt im Tagebuch“", "Exhibition “The World in a Diary”")
      .replace("Rathaus in Eschborn", "Town Hall, Eschborn")
      .replace("Galerie Casteel aus Mönchengladbach", "Galerie Casteel, Mönchengladbach")
      .replace("Drei Leipziger Künstler – Drei Systeme", "Three Leipzig Artists – Three Systems")
      .replace("Künstler & Gäste, im The Q", "Artists & Guests, at The Q")
      .replace("Frankreich – Paris", "France – Paris")
      .replace("Zu Gast in Hoyerswerda, Erfurt", "Guest exhibitions in Hoyerswerda and Erfurt")
      .replace("Wanderausstellung", "Touring exhibition")
      .replace("Blüthner-Flügel im chinesischen Pavillon", "Blüthner grand piano in the Chinese Pavilion")
      .replace("Museum Schloss Burgk", "Burgk Castle Museum")
      .replace("Jade, Niedersachsen", "Jade, Lower Saxony")
      .replace("München", "Munich")
      .replace(/„([^“]+)“/g, "“$1”"),
  ),
  images: de.exhibitions.images.map((i) => ({ ...i, caption: i.caption === "Serie" ? "Series" : i.caption === "Stahlfigur" ? "Steel figure" : i.caption })),
}

const objects: Record<string, string> = {
  "Einweihung State Department": "Inauguration, State Department",
  Hochhaus: "High-rise building",
  "Fassade Goldschmidtstraße": "Façade, Goldschmidtstrasse",
  "Pflegeheim des EHK": "EHK care home",
  "Industriegebäude Plagwitz": "Industrial building, Plagwitz",
  "GEORADO Erlebniswelt": "GEORADO adventure world",
  "Tower Flughafen": "Airport tower",
  Nordhausen: "Nordhausen",
  Brückenbemalung: "Bridge painting",
  Fassadenbemalung: "Façade painting",
  "Sonne des Lebens (Edelstahl 4,5 m)": "Sun of Life (stainless steel, 4.5 m)",
  "Baum des Lebens (Edelstahl 2,98 m)": "Tree of Life (stainless steel, 2.98 m)",
  "Kulturhaus Leipzig im Ural, Russland": "Leipzig Cultural Centre in the Urals, Russia",
  Wandbemalung: "Mural",
  "6 farbig beschichtete Edelstahlfiguren": "6 colour-coated stainless steel figures",
  "Das Letzte Abendmahl, Kuppelbemalung": "The Last Supper, dome painting",
  "Aufstellung Berliner Mauersegment": "Installation of a Berlin Wall segment",
  "Deckengemälde im Westbad": "Ceiling painting, Westbad",
  "Moabit/Wedding": "Moabit/Wedding",
  "11-Geschosser DDR-Plattenbau": "11-storey GDR prefab building",
  "Gestaltung Synlabgebäude": "Design of the Synlab building",
  "Eingangsportal der Grundschule": "Primary school entrance",
  Völkerschlachtpanoramabild: "Battle of the Nations panorama",
  "KiTa Olgastraße": "Olgastrasse day-care centre",
  "Gestaltung Wohngebiet": "Residential area design",
  "Leipziger Platz, Addis Abeba": "Leipzig Square, Addis Ababa",
  "Außenfassade der Brühlarkaden": "Exterior façade, Brühl Arcades",
  "Görlitzer Straße": "Görlitzer Strasse",
  Kindergarten: "Kindergarten",
  "Turm in Wurzbach": "Tower in Wurzbach",
  Sonderpflegeheim: "Specialist care home",
  "Fischer-Art-Haus": "Fischer-Art House",
  "Verhüllung Schlosswache Osterburg": "Wrapping of the castle guardhouse, Osterburg",
  "Giebelbemalung Gymnasium": "Gable painting, grammar school",
  "Wandbild Musikschule Johann Sebastian Bach": "Mural, Johann Sebastian Bach Music School",
  "Wandbemalung Klinikum St. Georg": "Mural, St. Georg Hospital",
  "Verhüllung Hofwiesenpark BUGA": "Wrapping, Hofwiesenpark (Federal Garden Show)",
  "Entrollung des Wandbildes": "Unrolling of the mural",
  "Verhüllung Außenfassaden „Drei Türme“": "Wrapping of the “Three Towers” façades",
  "Gestaltung Schulgebäude Lehmbaugruppe": "Design of the Lehmbaugruppe school building",
  "Gebäudegestaltung Sankratstraße": "Building design, Sankratstrasse",
  "Fertigstellung Elsterlofts": "Completion of the Elster Lofts",
  "Giebelwand Grafisches Viertel": "Gable wall, Graphic Quarter",
  "Ausgestaltung der HTWK": "Interior design, HTWK Leipzig",
}
const places: Record<string, string> = {
  "Tharandter Wald": "Tharandt Forest",
  Äthiopien: "Ethiopia",
  "Varel Friesland": "Varel, Friesland",
}

export const kunstAmBau: typeof DE.kunstAmBau = {
  kicker: "References",
  lead: "Over the past decades Fischer-Art has created many works in public space. To date this amounts to more than 30,000 m² of façade, for which Fischer-Art has used almost 600 litres of bright paint.",
  projects: de.kunstAmBau.projects.map((p) => ({ year: p.year, place: places[p.place] ?? p.place, object: objects[p.object] ?? p.object })),
}

export const publications: typeof DE.publications = {
  ...de.publications,
  kicker: "Publications",
  text: about.fields[5].text,
  publisher: "Published by Schwarzkopf & Schwarzkopf",
  books: [
    { year: "2014", title: "Kurzgeschichten. Herrenlose Stadt (Short stories. Ownerless City)", note: "out of print" },
    { year: "2008", title: "Der Angeklagte ist anGERICHTet. (The Defendant is Served)", note: "Veikko Bartel, illustrated by Michael Fischer-Art" },
    { year: "2002", title: "Leipziger Schule. (Leipzig School)" },
    { year: "2002", title: "Kunst am Bau (Art in Architecture)" },
    { year: "1997", title: "Das Diplom und andere organisierte Verbrechen. (The Diploma and Other Organised Crimes)" },
    { year: "1995", title: "Der Weg zum Farbschock und zurück. (The Way to Colour Shock and Back)" },
  ],
  covers: de.publications.covers.map((c, i) => ({
    ...c,
    caption: ["The Diploma and Other Organised Crimes", "Art in Architecture", "Leipzig School", "The Way to Colour Shock and Back"][i] ?? c.caption,
  })),
}

export const news: typeof DE.news = [
  {
    ...de.news[0],
    title: "Kranzzauber – workshops with Fischer-Art",
    text: "Your picture. Your colours. Your art moment. On 11 and 18 November 2026 at the pop-up store in Leipzig city centre: let your creativity run free and create your own picture with the help of Michael Fischer-Art. For everyone who loves art and wants to get creative.",
    image: { ...de.news[0].image!, alt: "Flyer “Kranzzauber”: workshops with Fischer-Art on 11 and 18 November 2026 at the pop-up store in Leipzig city centre. Booking via kranzzauber.de." },
    link: { href: "https://kranzzauber.de", label: "Book your place at kranzzauber.de" },
  },
  {
    ...de.news[1],
    title: "Spring salon at the Borna studio, 18 April 2026",
    text: "Spring salon at the studio in Borna: 18 April 2026, 10 am – 8 pm. Come along and enjoy the art!",
  },
]

export const shop: typeof DE.shop = {
  intro: "Originals, art prints, publications and merchandise will soon be available here.",
  order: "To buy a calendar, please send us an email with your name and address.",
  items: [
    {
      ...de.shop.items[0],
      title: "Calendar 2023 Nepal (portrait format)",
      text: "At least one good deed every year – in preparation for various charity projects, Michael Fischer-Art is also closely involved in rebuilding a children's hospital in Kathmandu, the capital of Nepal. His visit inspired the motif of the Nepal calendar.",
      price: "€9.90 plus €8 shipping",
    },
    {
      ...de.shop.items[1],
      title: "Calendar 2023 Hope (landscape format)",
      text: "“Hope dies last” – this is how Fischer-Art describes his monthly calendar, which once again confronted him and those around him with all kinds of challenges. The artist not only works through socially relevant themes but also tries to lighten them with everyday situations. Economic crisis and sport are staged together, giving an insight into the artist's world of thought.",
      price: "€9.90 plus €8 shipping",
    },
    {
      ...de.shop.items[2],
      title: "Calendar 2021",
      text: "The second edition of Michael Fischer-Art's exclusive calendar accompanies you through 2021 with 12 striking pictures. All the high-quality artworks are matched to the seasons and holidays.",
      price: "€9.90 plus €8 shipping",
    },
    {
      ...de.shop.items[3],
      title: "Calendar 2021",
      text: "2020 kept most of us within our own four walls. During this time Michael Fischer-Art, like many others, was gripped by wanderlust. He turned his longing for the bustling life of foreign cultures and distant countries into 12 unique, high-quality pictures.",
      price: "€9.90 plus €8 shipping",
    },
  ],
}

export const faq: typeof DE.faq = [
  {
    q: "How do I request a commission?",
    a: "Send your idea to atelier@fischer-art.de. Commissions range from a personal portrait and paintings on canvas to murals in entrance halls and the design of entire façades.",
  },
  {
    q: "Can I visit the studio?",
    a: "Yes. A personal studio tour of the Kunstfabrik in Borna is available on request – with stories from the past, present and future.",
  },
  {
    q: "Can I book the studio for an event?",
    a: "Yes. The Kunstfabrik offers an extraordinary industrial setting for evenings with clients or business partners. Send us your enquiry by email.",
  },
  {
    q: "Do I need any experience for “Painting with Fischer-Art”?",
    a: "No. All you need is the courage to try something new. The artist provides the materials, canvases and acrylic paints.",
  },
  {
    q: "How do I order a calendar?",
    a: "Send us an email with your name and address. A calendar costs €9.90 plus €8 shipping.",
  },
  {
    q: "Where is the studio?",
    a: "At the Kunstfabrik, Am Steigerhain 13, 04552 Borna, Germany – south of Leipzig.",
  },
]
