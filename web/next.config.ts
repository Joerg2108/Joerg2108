import type { NextConfig } from "next"

// Rein statische Website: `next build` erzeugt den Ordner out/, den Netlify direkt ausliefert.
// Responsive Bilder: scripts/responsive-images.mjs erzeugt vor dem Build Varianten in 320–1920 px,
// lib/image-loader.ts setzt sie ins srcset von next/image. Die Breiten hier müssen zu WIDTHS im Skript passen.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
    deviceSizes: [640, 960, 1280, 1920],
    imageSizes: [320],
  },
}

export default nextConfig
