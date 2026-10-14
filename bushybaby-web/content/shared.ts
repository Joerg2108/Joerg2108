/** Language-independent content shared by all dictionaries. */

export const IMAGES = {
  hurricane: "/images/sundown-hurricane.jpg",
  melon: "/images/whole-melon.jpg",
  mango: "/images/mango-mint.jpg",
  barNight: "/images/bar-night.jpg",
  barSign: "/images/bar-sign.jpg",
} as const;

/** The four acts of the day: times + accent colours (text lives in the dictionaries). */
export const ACTS = [
  { roman: "I", time: "11:00", dot: "#ffaa40" },
  { roman: "II", time: "18:00", dot: "#ff7a3d" },
  { roman: "III", time: "19:30", dot: "#c45cff" },
  { roman: "IV", time: "22:30", dot: "#9c40ff" },
] as const;

/** Weekly events: JS weekday (0 = Sunday) → index into dict.home.week.items. */
export const WEEK_EVENTS: Record<number, number> = { 2: 0, 4: 1, 0: 2 };
