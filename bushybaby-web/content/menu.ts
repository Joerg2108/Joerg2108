/**
 * The real BushyBaby drinks menu (transcribed from the printed menu, Oct 2026).
 * One source for both languages: names + prices once, descriptions in EN/DE.
 * Prices in KES. `price: null` renders "ask at the bar".
 */
import { IMAGES } from "./shared";

export type L = { en: string; de: string };

export interface MenuItem {
  id: string;
  name: string;
  price: number | null;
  notes?: L;
  tag?: L;
}

export interface SpiritRow {
  name: string;
  tot: number | null; // price per shot ("tot")
  bottle: number; // price per bottle
  size: string;
}

export interface ListSection {
  kind: "list";
  id: string;
  label: L;
  kicker: L;
  image: string;
  caption: string;
  items: MenuItem[];
}

export interface SpiritsSection {
  kind: "spirits";
  id: string;
  label: L;
  kicker: L;
  image: string;
  caption: string;
  groups: { label: L; rows: SpiritRow[] }[];
}

export type MenuSection = ListSection | SpiritsSection;

const SIG: L = { en: "Signature", de: "Signature" };
const n = (en: string, de: string): L => ({ en, de });

export const MENU: MenuSection[] = [
  {
    kind: "list",
    id: "tiki",
    label: n("Tiki cocktails", "Tiki-Cocktails"),
    kicker: n("Party time, tiki way", "Party time, tiki way"),
    image: IMAGES.hurricane,
    caption: "Party time · tiki way",
    items: [
      { id: "bush-baby", name: "Bush Baby", price: 850, tag: SIG, notes: n("Orange juice, mango juice, pineapple juice, white rum, dark rum, gin, grenadine", "Orangen-, Mango- und Ananassaft, weißer und dunkler Rum, Gin, Grenadine") },
      { id: "tree-houses", name: "Tree Houses", price: 850, tag: SIG, notes: n("Pineapple juice, mango juice, coconut cream, Malibu, blue curaçao", "Ananas- und Mangosaft, Kokoscreme, Malibu, Blue Curaçao") },
      { id: "tiki-house", name: "Tiki House Cocktail", price: 750, tag: n("House", "Haus"), notes: n("Orange, passion and pineapple juice, triple sec, white rum, dark rum, grenadine", "Orangen-, Maracuja- und Ananassaft, Triple Sec, weißer und dunkler Rum, Grenadine") },
      { id: "mai-tai", name: "Mai Tai", price: 850, notes: n("Dark rum, light rum, triple sec, sugar, lime", "Dunkler und heller Rum, Triple Sec, Zucker, Limette") },
      { id: "long-island", name: "Long Island", price: 1000, tag: n("Strong", "Stark"), notes: n("Coke, white rum, dark rum, gin, vodka", "Cola, weißer und dunkler Rum, Gin, Wodka") },
      { id: "purple-rain", name: "Purple Rain", price: 950, notes: n("Pineapple juice, vodka, blue curaçao, grenadine", "Ananassaft, Wodka, Blue Curaçao, Grenadine") },
      { id: "blue-lagoon", name: "Blue Lagoon", price: 900, notes: n("Vodka, blue curaçao, Sprite", "Wodka, Blue Curaçao, Sprite") },
      { id: "mango-chilli-mojito", name: "Mango Chilli Mojito", price: 750, notes: n("Fresh chilli, mint, fresh mango, rum, ginger ale", "Frische Chili, Minze, frische Mango, Rum, Ginger Ale") },
      { id: "planters-punch", name: "Planter’s Punch", price: 750, notes: n("Orange juice, lime juice, rum, grenadine", "Orangensaft, Limettensaft, Rum, Grenadine") },
      { id: "rainbow", name: "Rainbow", price: 850, notes: n("Grenadine, orange juice, blue curaçao, tequila", "Grenadine, Orangensaft, Blue Curaçao, Tequila") },
      { id: "tequila-sunrise", name: "Tequila Sunrise", price: 850, notes: n("Tequila, orange juice, grenadine", "Tequila, Orangensaft, Grenadine") },
      { id: "pina-colada", name: "Piña Colada", price: 750, notes: n("Coconut cream, coconut rum, pineapple juice", "Kokoscreme, Kokosrum, Ananassaft") },
      { id: "mud-driver", name: "Mud Driver", price: 750, notes: n("Dark rum, white rum, triple sec", "Dunkler und weißer Rum, Triple Sec") },
      { id: "cuba-libre", name: "Cuba Libre", price: 750, notes: n("Rum, lime, Coca-Cola", "Rum, Limette, Coca-Cola") },
      { id: "cindy", name: "Cindy", price: 750, notes: n("Vodka, lime, soda water", "Wodka, Limette, Sodawasser") },
      { id: "gin-fizz", name: "Gin Fizz", price: 750, notes: n("Gin, lime, soda water", "Gin, Limette, Sodawasser") },
    ],
  },
  {
    kind: "list",
    id: "tropicals",
    label: n("Tropicals & classics", "Tropicals & Klassiker"),
    kicker: n("Blended, shaken, stirred", "Gemixt, geshakt, gerührt"),
    image: IMAGES.mango,
    caption: "Fresh fruit · every day",
    items: [
      { id: "zombie", name: "Zombie", price: 1000, tag: n("Strong", "Stark"), notes: n("A powerful mix of rums & tropical juices", "Ein kräftiger Mix aus mehreren Rumsorten und tropischen Säften") },
      { id: "strawberry-daiquiri", name: "Strawberry Daiquiri", price: 900, notes: n("Sweet strawberries, blended", "Süße Erdbeeren, frisch gemixt") },
      { id: "mango-daiquiri", name: "Mango Daiquiri", price: 750, notes: n("Fresh mango, rum & lime", "Frische Mango, Rum & Limette") },
      { id: "margarita", name: "Margarita", price: 750, notes: n("Tequila, triple sec & fresh lime", "Tequila, Triple Sec & frische Limette") },
      { id: "martini", name: "Martini", price: 750, notes: n("Gin or vodka with dry vermouth — clean & snappy", "Gin oder Wodka mit trockenem Wermut — klar & knackig") },
      { id: "old-fashioned", name: "Old Fashioned", price: 750, notes: n("Bourbon, bitters & sugar, served on ice", "Bourbon, Bitters & Zucker, auf Eis") },
      { id: "negroni", name: "Negroni", price: 750, notes: n("Gin, Campari & vermouth — rich & bitter", "Gin, Campari & Wermut — vollmundig & bitter") },
      { id: "aperol-spritz", name: "Aperol Spritz", price: 800, notes: n("Light & refreshing", "Leicht & erfrischend") },
      { id: "mimosa", name: "Mimosa", price: 750, notes: n("Light & refreshing", "Leicht & erfrischend") },
      { id: "americano", name: "Americano", price: 750, notes: n("Light & refreshing", "Leicht & erfrischend") },
      { id: "kenyan-dawa", name: "Kenyan Dawa", price: 750, tag: n("Local", "Lokal"), notes: n("Kenya’s own: vodka, lime & honey", "Kenias Klassiker: Wodka, Limette & Honig") },
    ],
  },
  {
    kind: "list",
    id: "mocktails",
    label: n("Mocktails", "Alkoholfrei"),
    kicker: n("All the fruit, none of the alcohol", "Alle Früchte, kein Alkohol"),
    image: IMAGES.melon,
    caption: "Zero-proof",
    items: [
      { id: "virgin-dawa", name: "Virgin Dawa", price: 350, notes: n("Lime, honey, soda", "Limette, Honig, Soda") },
      { id: "virgin-cindy", name: "Virgin Cindy", price: 350, notes: n("Lime & soda", "Limette & Soda") },
      { id: "virgin-pina-colada", name: "Virgin Piña Colada", price: 400, notes: n("Coconut cream & pineapple", "Kokoscreme & Ananas") },
      { id: "virgin-mojito", name: "Virgin Mojito", price: 350, notes: n("Mint, lime, soda", "Minze, Limette, Soda") },
      { id: "virgin-tree-houses", name: "Virgin Tree Houses", price: 400, notes: n("Our signature, without the rum", "Unser Signature-Drink, ohne Rum") },
      { id: "fresh-juice", name: "Fresh juice", price: 200, notes: n("Whatever the market had today", "Was der Markt heute hatte") },
    ],
  },
  {
    kind: "list",
    id: "beer",
    label: n("Beer & cider", "Bier & Cider"),
    kicker: n("Ice cold", "Eiskalt"),
    image: IMAGES.barSign,
    caption: "The bar front",
    items: [
      { id: "tusker-lager", name: "Tusker Lager", price: 350, tag: n("Kenyan", "Kenianisch") },
      { id: "tusker-lite", name: "Tusker Lite", price: 400 },
      { id: "tusker-malt", name: "Tusker Malt", price: 400 },
      { id: "tusker-cider", name: "Tusker Cider", price: 400 },
      { id: "white-cap", name: "White Cap", price: 350 },
      { id: "pilsner", name: "Pilsner", price: 350 },
      { id: "balozi", name: "Balozi", price: 350 },
      { id: "ko", name: "K.O", price: 350 },
      { id: "manyatta", name: "Manyatta", price: 350 },
      { id: "guinness", name: "Guinness", price: 450 },
      { id: "kingfisher", name: "Kingfisher", price: 450 },
      { id: "heineken", name: "Heineken", price: 400 },
      { id: "desperados", name: "Desperados", price: 400 },
      { id: "savanna", name: "Savanna", price: 400 },
      { id: "hunters-dry", name: "Hunter’s Dry Cider", price: 400 },
      { id: "hunters-gold", name: "Hunter’s Gold Cider", price: 400 },
      { id: "snapp", name: "Snapp", price: 400 },
      { id: "smirnoff-black-ice", name: "Smirnoff Black Ice", price: 400 },
      { id: "smirnoff-guarana", name: "Smirnoff Guarana", price: 400 },
    ],
  },
  {
    kind: "spirits",
    id: "spirits",
    label: n("Spirits", "Spirituosen"),
    kicker: n("By the shot or the bottle", "Als Shot oder Flasche"),
    image: IMAGES.barNight,
    caption: "The back bar",
    groups: [
      { label: n("Gin", "Gin"), rows: [
        { name: "Hendrick’s", size: "750 ml", tot: 650, bottle: 12000 },
        { name: "Gordon’s", size: "750 ml", tot: 400, bottle: 5500 },
        { name: "Gilbey’s", size: "750 ml", tot: 250, bottle: 3500 },
      ] },
      { label: n("Vodka", "Wodka"), rows: [
        { name: "Absolut", size: "750 ml", tot: 350, bottle: 7500 },
        { name: "Smirnoff", size: "750 ml", tot: 250, bottle: 3500 },
      ] },
      { label: n("Rum", "Rum"), rows: [
        { name: "Bacardi White", size: "750 ml", tot: 300, bottle: 6000 },
        { name: "Bacardi Spiced", size: "750 ml", tot: 300, bottle: 6000 },
        { name: "Malibu Coconut", size: "750 ml", tot: 300, bottle: 5000 },
        { name: "Captain Morgan Spiced", size: "750 ml", tot: 300, bottle: 5000 },
        { name: "Captain Morgan Gold", size: "750 ml", tot: 200, bottle: 2500 },
        { name: "Kenya Cane", size: "750 ml", tot: 200, bottle: 2500 },
        { name: "Havana Club 3", size: "750 ml", tot: 250, bottle: 5000 },
      ] },
      { label: n("Liqueurs & creams", "Liköre & Cremes"), rows: [
        { name: "Jägermeister", size: "750 ml", tot: 350, bottle: 8500 },
        { name: "Campari", size: "750 ml", tot: 350, bottle: 7500 },
        { name: "Martini Rosso", size: "750 ml", tot: 350, bottle: 7000 },
        { name: "Sambuca (Zappa)", size: "750 ml", tot: 300, bottle: 6000 },
        { name: "Amarula", size: "750 ml", tot: 300, bottle: 7500 },
        { name: "Baileys", size: "750 ml", tot: 300, bottle: 6000 },
      ] },
      { label: n("Whisky — blended scotch", "Whisky — Blended Scotch"), rows: [
        { name: "Johnnie Walker Black Label", size: "750 ml", tot: null, bottle: 20000 },
        { name: "Johnnie Walker Gold Label", size: "750 ml", tot: null, bottle: 16000 },
        { name: "Chivas Regal 12", size: "750 ml", tot: null, bottle: 10000 },
        { name: "Grant’s", size: "750 ml", tot: null, bottle: 5000 },
        { name: "Johnnie Walker Red Label", size: "750 ml", tot: null, bottle: 4500 },
      ] },
      { label: n("Whisky — single malt", "Whisky — Single Malt"), rows: [
        { name: "Glenfiddich 12", size: "750 ml", tot: null, bottle: 18000 },
        { name: "Glenlivet 12", size: "750 ml", tot: null, bottle: 15000 },
        { name: "Talisker 10", size: "700 ml", tot: null, bottle: 15000 },
        { name: "Singleton 12", size: "700 ml", tot: null, bottle: 10000 },
      ] },
      { label: n("American & Irish whiskey", "Amerikanischer & irischer Whiskey"), rows: [
        { name: "Jack Daniel’s Single Barrel", size: "750 ml", tot: null, bottle: 16500 },
        { name: "Gentleman Jack", size: "750 ml", tot: null, bottle: 12500 },
        { name: "Jack Daniel’s No. 7", size: "700 ml", tot: null, bottle: 8000 },
        { name: "Bulleit Bourbon", size: "700 ml", tot: null, bottle: 7000 },
        { name: "Jameson Black Barrel", size: "750 ml", tot: null, bottle: 10000 },
        { name: "Jameson", size: "750 ml", tot: null, bottle: 5500 },
      ] },
      { label: n("Cognac & brandy", "Cognac & Brandy"), rows: [
        { name: "Hennessy VS", size: "700 ml", tot: null, bottle: 12000 },
        { name: "Martell VS", size: "700 ml", tot: null, bottle: 10000 },
        { name: "Viceroy", size: "750 ml", tot: null, bottle: 3000 },
      ] },
    ],
  },
];

/** Finds a drink by id across all list sections (used by the home page signatures). */
export function findItem(id: string): MenuItem | undefined {
  for (const s of MENU) if (s.kind === "list") {
    const hit = s.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return undefined;
}

/** "1000" → "1,000" — fixed format so server and browser render the same text. */
export function kes(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
