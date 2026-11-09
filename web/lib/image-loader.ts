// Bild-Loader für next/image beim statischen Export.
// Liefert die vorab erzeugte Variante aus public/_img (siehe scripts/responsive-images.mjs).
// Ist die gewünschte Breite >= Originalbreite oder das Bild unbekannt, kommt das Original.
// ?v=<Fingerabdruck>: Bilder werden ein Jahr gecacht; wird ein Bild ersetzt, ändert sich die URL.
import manifest from "./image-manifest.json"

const entries = manifest as unknown as Record<string, [number, string]>

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const entry = entries[src]
  if (!entry || !src.startsWith("/images/")) return src
  const [original, hash] = entry
  const file = width >= original ? src : src.replace(/^\/images\//, "/_img/").replace(/\.\w+$/, `-${width}.webp`)
  return `${file}?v=${hash}`
}
