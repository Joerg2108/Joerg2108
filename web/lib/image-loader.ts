// Bild-Loader für next/image beim statischen Export.
// Liefert die vorab erzeugte Variante aus public/_img (siehe scripts/responsive-images.mjs).
// Ist die gewünschte Breite >= Originalbreite oder das Bild unbekannt, kommt das Original.
import manifest from "./image-manifest.json"

const widths = manifest as Record<string, number>

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const original = widths[src]
  if (!original || width >= original || !src.startsWith("/images/")) return src
  return src.replace(/^\/images\//, "/_img/").replace(/\.\w+$/, `-${width}.webp`)
}
