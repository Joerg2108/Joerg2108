/**
 * Homepage copy. Anything in [brackets] is a placeholder the owner must replace.
 * Reviews are intentionally empty: paste real ones (with permission) — the
 * section hides itself while the list is empty.
 */

export const ingredients = ["Rum", "Passion fruit", "Watermelon", "Fresh mint", "Mango", "Makuti roof", "Hakuna matata", "Drink first"];

export const signatures = [
  {
    no: "N° 01",
    name: "Sundown Hurricane",
    image: "/images/sundown-hurricane.jpg",
    alt: "Red frozen cocktail in a hurricane glass with an orange wedge on a blue bar",
    notes: "Our red one. Frozen, fruit-forward, an orange wheel on the rim. The drink that starts the night.",
    price: null as string | null,
  },
  {
    no: "N° 02",
    name: "The Whole Melon",
    image: "/images/whole-melon.jpg",
    alt: "A cocktail served inside a hollowed-out watermelon with a pink paper umbrella",
    notes: "Served in a hollowed watermelon, built to share. Crushed ice, fresh fruit, a paper umbrella on top.",
    price: null as string | null,
  },
  {
    no: "N° 03",
    name: "Mango Mint Smash",
    image: "/images/mango-mint.jpg",
    alt: "A golden mango cocktail with fresh mint in a short glass",
    notes: "Muddled mango, a fistful of mint, rum. Short, bright and dangerously easy.",
    price: null as string | null,
  },
];

export const acts = [
  { roman: "I", time: "18:00", title: "Sundown", body: "Golden light through the thatch. First fresh fruit of the evening, first rum.", dot: "#ffaa40" },
  { roman: "II", time: "20:00", title: "Lights on", body: "The bar front glows red, the tiki faces wake up. Stools fill.", dot: "#ff7a3d" },
  { roman: "III", time: "22:00", title: "The pour", body: "Signature rounds, music turned up, strangers turned friends.", dot: "#c45cff" },
  { roman: "IV", time: "00:00", title: "Bushbaby hour", body: "Big eyes, late talks. Last call is when the night says so.", dot: "#9c40ff" },
];

export const spaceFacts = [
  ["Roof", "Makuti thatch"],
  ["Walls", "Hand-painted tiki"],
  ["Bar", "Glows red after dark"],
  ["Floor", "Sand. Shoes optional."],
] as const;

export const plans = [
  {
    kicker: "Walk in",
    price: "Free",
    sub: "Just show up. The bar is always open to you.",
    features: ["First come, first served", "Full drinks menu", "Bar stools & standing"],
    cta: { label: "Get directions", href: "/reserve#find-us" },
  },
  {
    kicker: "Reserved table",
    price: "[KES —]",
    sub: "Minimum spend per table, fully redeemable on drinks.",
    features: ["Your table, held for 30 min", "Groups of 2 — 20", "Confirmed on WhatsApp"],
    cta: { label: "Reserve a table", href: "/reserve" },
    featured: true,
  },
  {
    kicker: "The whole pub",
    price: "On request",
    sub: "Birthdays, crews, weddings-after. It's yours.",
    features: ["Exclusive use of the pub", "A drinks list built with you", "Your playlist, your night"],
    cta: { label: "Plan a private night", href: "/nights" },
  },
];

export const reviews: { quote: string; who: string }[] = [];

export const faqs = [
  { q: "Do I need to book?", a: "Walk-ins are always welcome at the bar. For bigger groups or weekend nights, reserve so we can keep a table for you — it takes 30 seconds on WhatsApp." },
  { q: "When are you open?", a: "[Daily from 17:00 until late.] Holiday hours are posted on Instagram first." },
  { q: "Is there a dress code?", a: "Barefoot-friendly. Sand on your feet is a compliment here." },
  { q: "Can we book the whole pub?", a: "Yes. Birthdays, crews, after-parties — tell us the date, the headcount and the mood, we build the night around it." },
  { q: "How can I pay?", a: "[Cash, card and M-Pesa — confirm accepted methods.]" },
];
