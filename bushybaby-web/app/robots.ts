import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Generated once at build time (required for the static export, harmless for the server build).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Until the owner flips NEXT_PUBLIC_ALLOW_INDEXING, keep placeholder content out of Google.
  if (!site.indexable) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/*/reserve/thanks"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
