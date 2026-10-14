import type { NextConfig } from "next";

// `npm run build:upload` sets STATIC_EXPORT=1 to produce a plain static folder
// (HTML/CSS/JS) for Netlify drag-and-drop. Regular `npm run build` stays a full
// Next.js server build (proxy.ts, on-demand rendering).
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export" as const } : {}),
  images: {
    // Static hosting has no image optimizer — serve the original files.
    unoptimized: staticExport,
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
};

export default nextConfig;
