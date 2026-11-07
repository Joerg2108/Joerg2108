import type { MetadataRoute } from "next"
import { getContent } from "@/lib/content"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  const base = getContent("de").site.url
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/de/nicht-gefunden/", "/en/nicht-gefunden/", "/zh/nicht-gefunden/"] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
