#!/usr/bin/env node
/**
 * Builds a ready-to-upload static folder for Netlify drag-and-drop:
 *   npm run build:upload   →   netlify-upload/  +  netlify-upload.zip
 *
 * What replaces the server features on static hosting:
 *   proxy.ts (language redirect)  → _redirects rules with Language=de
 *   [...rest] localized 404       → _redirects 404 rules → /de/lost, /en/lost
 * Both server-only files are parked during the export and always restored.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const OUT = join(root, "out");
const DEST = join(root, "netlify-upload");
const ZIP = join(root, "netlify-upload.zip");
const PARK = join(root, ".export-parked");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bushybaby-tikipub.netlify.app";

// Server-only pieces that `output: export` cannot build.
const parked = [
  ["proxy.ts", "proxy.ts"],
  ["app/[lang]/[...rest]", "rest"],
];

mkdirSync(PARK, { recursive: true });
const moved = [];
try {
  for (const [src, name] of parked) {
    const from = join(root, src);
    if (existsSync(from)) {
      renameSync(from, join(PARK, name));
      moved.push([from, join(PARK, name)]);
    }
  }
  rmSync(join(root, ".next"), { recursive: true, force: true });
  rmSync(OUT, { recursive: true, force: true });
  execSync("npx next build", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_SITE_URL: SITE_URL },
  });
} finally {
  for (const [from, to] of moved.reverse()) renameSync(to, from);
  rmSync(PARK, { recursive: true, force: true });
  // The export's .next cache differs from a server build — clear it so `next dev/build` start clean.
  rmSync(join(root, ".next"), { recursive: true, force: true });
}

rmSync(DEST, { recursive: true, force: true });
cpSync(OUT, DEST, { recursive: true });

// Netlify rules. First match wins; Language= matches the browser's Accept-Language.
writeFileSync(
  join(DEST, "_redirects"),
  `# Language detection (replaces proxy.ts on static hosting)
# 1) choice from the EN | DE switch (presence cookie), 2) browser language, 3) English
/          /en          302  Cookie=bb_lang_en
/          /de          302  Cookie=bb_lang_de
/reserve   /en/reserve  302  Cookie=bb_lang_en
/reserve   /de/reserve  302  Cookie=bb_lang_de
/          /de          302  Language=de
/          /en          302
/reserve   /de/reserve  302  Language=de
/reserve   /en/reserve  302

# Localized 404 for unknown URLs (status stays 404 for search engines)
/de/*      /de/lost     404
/*         /en/lost     404
`,
);

writeFileSync(
  join(DEST, "_headers"),
  `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=604800
`,
);

rmSync(ZIP, { force: true });
execSync(`cd "${DEST}" && zip -qr "${ZIP}" .`);
console.log(`\n✓ Upload folder: ${DEST}\n✓ Zip:           ${ZIP}\n  Site URL baked in: ${SITE_URL}`);
