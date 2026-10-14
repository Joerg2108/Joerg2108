/** Language-independent content shared by all dictionaries. */

export const IMAGES = {
  hurricane: "/images/sundown-hurricane.jpg",
  melon: "/images/whole-melon.jpg",
  mango: "/images/mango-mint.jpg",
  barNight: "/images/bar-night.jpg",
  barSign: "/images/bar-sign.jpg",
} as const;

/** The four acts of the night: times + accent colours (text lives in the dictionaries). */
export const ACTS = [
  { roman: "I", time: "18:00", dot: "#ffaa40" },
  { roman: "II", time: "20:00", dot: "#ff7a3d" },
  { roman: "III", time: "22:00", dot: "#c45cff" },
  { roman: "IV", time: "00:00", dot: "#9c40ff" },
] as const;
