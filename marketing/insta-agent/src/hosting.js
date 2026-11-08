// Die Instagram-API lädt Bilder selbst von einer ÖFFENTLICHEN https-URL herunter.
// Deshalb müssen die JPEGs vor dem Veröffentlichen irgendwo erreichbar sein.
//
// Zwei Varianten (Umgebungsvariable BILD_HOSTING):
//   ordner – Bilder in einen Ordner kopieren, den dein Webserver (Caddy/nginx) ausliefert. Ideal auf dem eigenen VPS.
//   s3     – Upload in einen S3-kompatiblen Speicher mit öffentlicher URL (z. B. Cloudflare R2, AWS S3, IONOS S3).
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

function pflicht(name) {
  const wert = process.env[name];
  if (!wert) throw new Error(`Umgebungsvariable ${name} fehlt (siehe .env.beispiel).`);
  return wert;
}

const basisUrl = () => pflicht("BILD_BASIS_URL").replace(/\/+$/, "");

// Zufälliger Pfadanteil: Bild-URLs sind nicht erratbar, solange der Post noch nicht online ist.
const neuerOrdner = (datum) => `${datum}-${randomBytes(6).toString("hex")}`;

async function ordnerHochladen(dateien, datum) {
  const ziel = pflicht("BILD_ORDNER");
  const urls = [];
  const unterordner = neuerOrdner(datum);
  await mkdir(path.join(ziel, unterordner), { recursive: true });
  for (const datei of dateien) {
    const rel = `${unterordner}/${path.basename(datei)}`;
    await copyFile(datei, path.join(ziel, rel));
    urls.push(`${basisUrl()}/${rel}`);
  }
  return urls;
}

let s3;
async function s3Hochladen(dateien, datum) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined, // R2: https://<account-id>.r2.cloudflarestorage.com
    credentials: { accessKeyId: pflicht("S3_ACCESS_KEY_ID"), secretAccessKey: pflicht("S3_SECRET_ACCESS_KEY") },
  });
  const bucket = pflicht("S3_BUCKET");
  const unterordner = neuerOrdner(datum);
  const urls = [];
  for (const datei of dateien) {
    const key = `instagram/${unterordner}/${path.basename(datei)}`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: await readFile(datei), ContentType: "image/jpeg" }));
    urls.push(`${basisUrl()}/${key}`);
  }
  return urls;
}

export async function hochladen(dateien, datum) {
  const art = process.env.BILD_HOSTING || "ordner";
  if (art === "ordner") return ordnerHochladen(dateien, datum);
  if (art === "s3") return s3Hochladen(dateien, datum);
  throw new Error(`BILD_HOSTING="${art}" unbekannt – erlaubt sind „ordner“ oder „s3“.`);
}

// Kurzer Selbsttest: Ist die URL wirklich öffentlich erreichbar? (Instagram scheitert sonst mit kryptischen Fehlern.)
export async function pruefeErreichbar(url) {
  const res = await fetch(url, { method: "HEAD" });
  if (!res.ok) throw new Error(`Bild nicht öffentlich erreichbar (${res.status}): ${url}`);
  const typ = res.headers.get("content-type") ?? "";
  if (!typ.includes("jpeg")) throw new Error(`Bild wird als „${typ}“ ausgeliefert, Instagram braucht image/jpeg: ${url}`);
}
