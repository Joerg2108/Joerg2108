// Erzeugt für jedes Bild in public/images verkleinerte WebP-Varianten (public/_img/…-<breite>.webp)
// und ein Manifest mit der Originalbreite. lib/image-loader.ts baut daraus das srcset für next/image.
// Läuft automatisch vor `next build` (npm prebuild) und vor `next dev`; schon vorhandene Varianten werden übersprungen.
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { createHash } from "node:crypto"

export const WIDTHS = [320, 640, 960, 1280, 1920]
const ROOT = path.resolve("public")
const SRC = path.join(ROOT, "images")
const OUT = path.join(ROOT, "_img")
const MANIFEST = path.resolve("lib/image-manifest.json")

async function walk(dir) {
  const out = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (/\.(webp|jpe?g|png|avif)$/i.test(e.name)) out.push(p)
  }
  return out
}

const files = await walk(SRC)
const manifest = {}
let made = 0
const t0 = Date.now()

// in kleinen Gruppen parallel, damit der Build-Server nicht überlastet
for (let i = 0; i < files.length; i += 6) {
  await Promise.all(
    files.slice(i, i + 6).map(async (file) => {
      const rel = "/" + path.relative(ROOT, file).split(path.sep).join("/")
      const { width } = await sharp(file).metadata()
      // Breite + Inhalts-Fingerabdruck: ändert sich das Bild, ändert sich die URL (?v=…) → kein alter Browser-Cache
      const hash = createHash("sha1").update(await fs.readFile(file)).digest("hex").slice(0, 8)
      manifest[rel] = [width, hash]
      for (const w of WIDTHS) {
        if (w >= width) continue // größer als das Original: Original wird verwendet
        const target = path.join(OUT, rel.replace(/^\/images\//, "").replace(/\.\w+$/, `-${w}.webp`))
        // vorhandene Variante nur behalten, wenn sie neuer ist als das Original (Bild ausgetauscht → neu erzeugen)
        const [src, out] = await Promise.all([fs.stat(file), fs.stat(target).catch(() => null)])
        if (out && out.mtimeMs >= src.mtimeMs) continue
        await fs.mkdir(path.dirname(target), { recursive: true })
        await sharp(file).resize({ width: w }).webp({ quality: w <= 640 ? 70 : 74, effort: 5 }).toFile(target)
        made++
      }
    }),
  )
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
await fs.writeFile(MANIFEST, JSON.stringify(sorted, null, 0) + "\n")
console.log(`responsive-images: ${files.length} Bilder, ${made} neue Varianten, ${((Date.now() - t0) / 1000).toFixed(1)} s`)
