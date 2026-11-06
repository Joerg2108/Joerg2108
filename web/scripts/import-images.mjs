// Converts the images downloaded from the old WordPress site into web-sized WebP files
// under public/images and writes lib/works-images.json for the gallery pages.
//
// Usage: node scripts/import-images.mjs <raw-dir> <gallery.json>
//   raw-dir      folder with the original uploads, named "<yyyy>_<mm>_<file>"
//   gallery.json [{ slug, title, images: [{ url, caption }] }] scraped from the portfolio pages

import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

const [rawDir, galleryFile] = process.argv.slice(2)
if (!rawDir || !galleryFile) {
  console.error("Usage: node scripts/import-images.mjs <raw-dir> <gallery.json>")
  process.exit(1)
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
const out = path.join(root, "public", "images")
const MAX = 1800

const slugMap = {
  "aussergewoehnliches-5": "originale",
  skulpturen: "skulpturen",
  "leipzig-4": "kunst-am-bau",
  "tom-jones": "portraets",
  "mensch-aergere-dich-nicht": "new-art",
  "events-mit-michael-fischer-art-3": "events",
  "china-2": "reisen",
  "fischer-art-friends-2": "friends",
  "axel-schulz-2": "charity",
}

const rawName = (url) => decodeURIComponent(url).replace(/.*\/uploads\//, "").replace(/\//g, "_")
const rawPath = (url) => {
  const a = path.join(rawDir, rawName(url))
  if (fs.existsSync(a)) return a
  const b = path.join(rawDir, url.replace(/.*\/uploads\//, "").replace(/\//g, "_"))
  return fs.existsSync(b) ? b : null
}

async function convert(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const info = await sharp(src, { animated: false })
    .rotate()
    .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(dest)
  return { width: info.width, height: info.height }
}

const missing = []
const gallery = JSON.parse(fs.readFileSync(galleryFile, "utf8"))
const result = {}
for (const cat of gallery) {
  const slug = slugMap[cat.slug] ?? cat.slug
  result[slug] = []
  let n = 0
  for (const img of cat.images) {
    const src = rawPath(img.url)
    if (!src) {
      missing.push(img.url)
      continue
    }
    n++
    const file = `${slug}-${String(n).padStart(2, "0")}.webp`
    const size = await convert(src, path.join(out, "werk", slug, file))
    result[slug].push({ src: `/images/werk/${slug}/${file}`, ...size, caption: img.caption || "" })
  }
}
fs.writeFileSync(path.join(root, "lib", "works-images.json"), JSON.stringify(result, null, 1) + "\n")

// Single images used on the content pages: [upload path, target]
const singles = [
  ["2019/11/Kontaktbild-5.jpg", "person/kontaktbild.webp"],
  ["2019/10/Fischer_Art_Logo.jpg", "logo.webp"],
  ["2019/10/11.jpg", "home/hero.webp"],
  ["2019/10/DSC04975.jpg", "home/services-1.webp"],
  ["2019/10/70e5ea2c-181a-4eac-9eee-a1d5ee965e5d.jpg", "home/services-2.webp"],
  ["2019/10/Gemalde-bearbeitet_9602.jpg", "ausstellungen/gemaelde-1.webp"],
  ["2019/10/Gemälde-2_9605.jpg", "ausstellungen/gemaelde-2.webp"],
  ["2019/10/Gemälde-3_9606.jpg", "ausstellungen/gemaelde-3.webp"],
  ["2019/10/Serie_9608.jpg", "ausstellungen/serie.webp"],
  ["2019/10/Kandahar.jpg", "ausstellungen/kandahar.webp"],
  ["2019/10/00058409.jpg", "ausstellungen/stahlfigur.webp"],
  ["2019/10/00097339.jpg", "ausstellungen/ausstellung.webp"],
  ["2019/10/Das-Diplom-und-andere-organisierte-Verbrechen.gif", "publikationen/das-diplom.webp"],
  ["2019/10/Kunst-am-Bau.gif", "publikationen/kunst-am-bau.webp"],
  ["2019/10/Leipziger-Schule-Eine-Interpretation.gif", "publikationen/leipziger-schule.webp"],
  ["2019/10/The-Way-to-colour-shock-and-back.jpg", "publikationen/farbschock.webp"],
  ["2023/01/Nepal-Kalender-2023.jpg", "shop/kalender-2023-nepal.webp"],
  ["2023/01/Kalender-2023.jpg", "shop/kalender-2023-hoffnung.webp"],
  ["2020/12/1235c43b-4212-44bd-9199-50e27e2d0057.jpg", "shop/kalender-2021-a.webp"],
  ["2020/12/Design-ohne-Titel-1.png", "shop/kalender-2021-b.webp"],
]
for (const [up, dest] of singles) {
  const src = rawPath("/uploads/" + up)
  if (!src) {
    missing.push(up)
    continue
  }
  await convert(src, path.join(out, dest))
}

const video = path.join(rawDir, "fruehlingssalon.mp4")
if (fs.existsSync(video) && fs.statSync(video).size > 0) {
  fs.mkdirSync(path.join(root, "public", "media"), { recursive: true })
  fs.copyFileSync(video, path.join(root, "public", "media", "fruehlingssalon-2026.mp4"))
} else missing.push("fruehlingssalon.mp4")

const total = Object.values(result).reduce((a, b) => a + b.length, 0)
console.log(`gallery images: ${total}, missing: ${missing.length}`)
for (const m of missing) console.log("  missing", m)
