import type { NextConfig } from "next"

// Rein statische Website: `next build` erzeugt den Ordner out/, den Netlify direkt ausliefert.
// Bilder liegen bereits als WebP (max. 1800 px) vor, daher keine Laufzeit-Bildoptimierung.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
