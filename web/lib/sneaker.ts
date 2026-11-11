// Inhalte der Startseiten-Sektion „Kunst trifft Sneaker“ (Texte vom Flyer, DE/EN/ZH).
import type { Locale } from "@/lib/i18n"

export const sneakerPrice = { amount: 599, currency: "EUR" }

export const sneaker: Record<
  Locale,
  {
    kicker: string
    title: string
    lead: string
    features: [string, string][]
    price: string
    priceNote: string
    claim: string
    ask: string
    askSubject: string
    whatsapp: string
    whatsappText: string
    flyerAlt: string
    flyerOpen: string
    videos: [string, string]
    markerAlt: string
  }
> = {
  de: {
    kicker: "Limitierte Edition",
    title: "Kunst trifft Sneaker.",
    lead: "Handgezeichnetes Design von Michael Fischer-Art: Jeder Sneaker erzählt eine Geschichte und ist ein Unikat. Für alle, die ihren eigenen Weg gehen.",
    features: [
      ["Premium Wildleder", "Weiches, strapazierfähiges Wildleder für einen hochwertigen Look und ein angenehmes Tragegefühl."],
      ["Gepolsterter Kragen", "Weiche Polsterung für optimalen Komfort und sicheren Halt – den ganzen Tag über."],
      ["Verstärkte Ferse", "Stabiler Fersenbereich für mehr Halt, Langlebigkeit und zuverlässige Unterstützung."],
      ["Einzigartiges Design", "Handgezeichnete Kunst von Michael Fischer-Art – jeder Sneaker ist ein Unikat."],
    ],
    price: "599 €",
    priceNote: "inkl. 19 % MwSt.",
    claim: "Ausdruck. Individualität. Original.",
    ask: "Sneaker anfragen",
    askSubject: "Anfrage: Michael Fischer-Art Sneaker",
    whatsapp: "Per WhatsApp anfragen",
    whatsappText: "Hallo, ich interessiere mich für die Michael Fischer-Art Sneaker (limitierte Edition).",
    flyerAlt:
      "Flyer „Michael Fischer-Art – Kunst trifft Sneaker“: weißer High-Top-Sneaker mit handgezeichneten bunten Figuren, limitierte Edition, 599 € inkl. 19 % MwSt.",
    flyerOpen: "Flyer groß ansehen",
    videos: ["Film: Die Sneaker im Detail", "Film: Die Sneaker getragen"],
    markerAlt: "Nahaufnahme einer Stiftspitze mit bunten Farbtropfen",
  },
  en: {
    kicker: "Limited edition",
    title: "Art meets sneaker.",
    lead: "Hand-drawn design by Michael Fischer-Art: every sneaker tells a story and is one of a kind. For everyone who goes their own way.",
    features: [
      ["Premium suede", "Soft, hard-wearing suede for a premium look and a comfortable feel."],
      ["Padded collar", "Soft padding for comfort and a secure fit – all day long."],
      ["Reinforced heel", "A stable heel for more support, durability and reliable hold."],
      ["Unique design", "Hand-drawn art by Michael Fischer-Art – every sneaker is one of a kind."],
    ],
    price: "€599",
    priceNote: "incl. 19% VAT",
    claim: "Expression. Individuality. Original.",
    ask: "Enquire about the sneakers",
    askSubject: "Enquiry: Michael Fischer-Art sneakers",
    whatsapp: "Enquire via WhatsApp",
    whatsappText: "Hello, I am interested in the Michael Fischer-Art sneakers (limited edition).",
    flyerAlt:
      "Flyer “Michael Fischer-Art – art meets sneaker”: white high-top sneaker with hand-drawn colourful figures, limited edition, €599 incl. 19% VAT.",
    flyerOpen: "View flyer full size",
    videos: ["Film: the sneakers in detail", "Film: the sneakers worn"],
    markerAlt: "Close-up of a marker tip with colourful drops of paint",
  },
  zh: {
    kicker: "限量版",
    title: "艺术遇见球鞋。",
    lead: "Michael Fischer-Art 的手绘设计：每一双球鞋都讲述一个故事，独一无二。献给所有走自己路的人。",
    features: [
      ["优质麂皮", "柔软耐穿的麂皮，质感高级，穿着舒适。"],
      ["加厚鞋领", "柔软衬垫，全天舒适贴合。"],
      ["加固鞋跟", "稳固的后跟设计，支撑更好，更耐用。"],
      ["独特设计", "Michael Fischer-Art 的手绘艺术——每一双都是孤品。"],
    ],
    price: "599 欧元",
    priceNote: "含 19% 增值税",
    claim: "表达。个性。原创。",
    ask: "咨询球鞋",
    askSubject: "咨询：Michael Fischer-Art 球鞋",
    whatsapp: "通过 WhatsApp 咨询",
    whatsappText: "您好，我对 Michael Fischer-Art 限量版球鞋感兴趣。",
    flyerAlt: "传单“Michael Fischer-Art——艺术遇见球鞋”：白色高帮球鞋，手绘彩色图案，限量版，599 欧元（含 19% 增值税）。",
    flyerOpen: "查看大图",
    videos: ["影片：球鞋细节", "影片：上脚效果"],
    markerAlt: "马克笔笔尖与彩色颜料滴的特写",
  },
}
