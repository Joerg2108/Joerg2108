/** Language-independent content shared by all dictionaries. */

export const IMAGES = {
  hurricane: "/images/sundown-hurricane.jpg",
  melon: "/images/whole-melon.jpg",
  mango: "/images/mango-mint.jpg",
  barNight: "/images/bar-night.jpg",
  barSign: "/images/bar-sign.jpg",
} as const;

/**
 * Drink prices in KES, one place for both languages. `null` renders "[—]".
 * Keys match the `id`s in dictionaries → menu.sections[].items[].id.
 */
export const MENU_PRICES: Record<string, number | null> = {
  hurricane: null, melon: null, "mango-smash": null, "bushbaby-eyes": null, "hakuna-matata": null, "drink-first": null,
  "mai-tai": null, zombie: null, "pina-colada": null, painkiller: null, daiquiri: null, "dark-stormy": null,
  "virgin-melon": null, "mango-cooler": null, "passion-fizz": null, juice: null,
  "local-lager": null, "import-beer": null, "rum-shot": null, "tequila-shot": null, "shot-flight": null,
};

/** The four acts of the night: times + accent colours (text lives in the dictionaries). */
export const ACTS = [
  { roman: "I", time: "18:00", dot: "#ffaa40" },
  { roman: "II", time: "20:00", dot: "#ff7a3d" },
  { roman: "III", time: "22:00", dot: "#c45cff" },
  { roman: "IV", time: "00:00", dot: "#9c40ff" },
] as const;
