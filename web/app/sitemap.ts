import type { MetadataRoute } from "next"
import { getContent } from "@/lib/content"
import { locales } from "@/lib/i18n"
import { workSlugs } from "@/lib/works"

export const dynamic = "force-static"

// All public pages in all languages, each with its hreflang alternates.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getContent("de").site.url
  const paths = ["/", "/person", "/vita", "/ausstellungen", "/kunst-am-bau", "/publikationen", "/aktuelles", ...workSlugs.filter((s) => s !== "kunst-am-bau").map((s) => `/werk/${s}`)]
  const at = (l: string, p: string) => `${base}/${l}${p === "/" ? "/" : `${p}/`}`
  return paths.flatMap((p) =>
    locales.map((l) => ({
      url: at(l, p),
      changeFrequency: p === "/aktuelles" ? ("weekly" as const) : ("monthly" as const),
      priority: p === "/" ? 1 : p.startsWith("/werk") ? 0.8 : 0.6,
      alternates: { languages: { de: at("de", p), en: at("en", p), "zh-Hans": at("zh", p) } },
    })),
  )
}
