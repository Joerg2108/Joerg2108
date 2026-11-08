// Instagram-API mit Instagram-Login (graph.instagram.com) – keine Facebook-Seite nötig.
// Voraussetzungen: Instagram-Business-Konto (Profi-Konto), Meta-App mit den Berechtigungen
// instagram_business_basic + instagram_business_content_publish, langlebiges Zugriffstoken.
//
// Ablauf beim Veröffentlichen (vorgegeben von Meta):
//   1. Medien-Container anlegen  POST /{ig-user-id}/media      (image_url muss öffentlich sein)
//   2. Warten bis status_code = FINISHED
//   3. Veröffentlichen           POST /{ig-user-id}/media_publish
import path from "node:path";
import { ladeJson, speichereJson, AUSGABE, log } from "./werkstatt.js";

const VERSION = process.env.INSTAGRAM_API_VERSION || "v24.0";
const HOST = process.env.INSTAGRAM_API_HOST || "https://graph.instagram.com"; // nur für Tests überschreiben
const TOKEN_DATEI = path.join(AUSGABE, "zustand", "instagram-token.json");
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Zugriffstoken -----------------------------------------------------------
// Langlebige Tokens gelten 60 Tage. Wir erneuern sie automatisch, sobald sie älter als 7 Tage sind,
// und merken uns das neue Token in ausgabe/zustand/instagram-token.json (nicht ins Git!).
let token;

async function holeToken() {
  if (token) return token;
  const gespeichert = await ladeJson(TOKEN_DATEI, null);
  const ausEnv = process.env.INSTAGRAM_ACCESS_TOKEN;
  // Ein neu in die .env eingetragenes Token hat Vorrang vor einem alten gespeicherten.
  if (gespeichert && gespeichert.quelle === ausEnv) token = gespeichert.token;
  else if (ausEnv) token = ausEnv;
  else throw new Error("INSTAGRAM_ACCESS_TOKEN fehlt (siehe .env.beispiel und README → Instagram einrichten).");

  const alterTage = gespeichert?.quelle === ausEnv ? (Date.now() - Date.parse(gespeichert.erneuert)) / 864e5 : Infinity;
  if (alterTage > 7) await erneuereToken(ausEnv);
  return token;
}

async function erneuereToken(quelle) {
  try {
    const url = `${HOST}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error?.message ?? res.statusText);
    token = json.access_token;
    const tage = Math.round(json.expires_in / 86400);
    await speichereJson(TOKEN_DATEI, { token, quelle, erneuert: new Date().toISOString(), gueltig_tage: tage });
    log(`🔑 Instagram-Token erneuert (gültig für ${tage} Tage).`);
  } catch (e) {
    // Kein Abbruch: Das alte Token funktioniert evtl. noch. Ein frisches Token (< 24 h) lässt sich z. B. noch nicht erneuern.
    log(`⚠️  Token-Erneuerung fehlgeschlagen: ${e.message}`);
  }
}

// --- API-Aufrufe --------------------------------------------------------------
async function api(methode, pfad, params = {}) {
  const daten = new URLSearchParams({ ...params, access_token: await holeToken() });
  const url = `${HOST}/${VERSION}/${pfad}`;
  const res = methode === "GET" ? await fetch(`${url}?${daten}`) : await fetch(url, { method: "POST", body: daten });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error ?? {};
    throw new Error(`Instagram-API ${pfad}: ${e.message ?? res.statusText} (Code ${e.code ?? res.status}${e.error_subcode ? `/${e.error_subcode}` : ""})`);
  }
  return json;
}

let ohneAltText = false; // merkt sich, ob die API alt_text ablehnt
let igUserId;
async function userId() {
  igUserId ??= process.env.INSTAGRAM_USER_ID || (await api("GET", "me", { fields: "user_id" })).user_id;
  return igUserId;
}

export async function konto() {
  const me = await api("GET", "me", { fields: "user_id,username,account_type,followers_count,media_count" });
  let limit = null;
  try {
    limit = (await api("GET", `${me.user_id}/content_publishing_limit`, { fields: "config,quota_usage" })).data?.[0];
  } catch { /* nicht kritisch */ }
  return { ...me, limit };
}

async function warteAufContainer(id) {
  for (let i = 0; i < 40; i++) {
    const { status_code, status } = await api("GET", id, { fields: "status_code,status" });
    if (status_code === "FINISHED") return;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new Error(`Container ${id}: ${status_code} – ${status ?? ""}`);
    await warte(3000);
  }
  throw new Error(`Container ${id} wurde nicht rechtzeitig fertig.`);
}

async function veroeffentliche(containerId) {
  await warteAufContainer(containerId);
  const { id } = await api("POST", `${await userId()}/media_publish`, { creation_id: containerId });
  let permalink = null;
  try {
    permalink = (await api("GET", id, { fields: "permalink" })).permalink;
  } catch { /* Stories haben teils keinen Permalink */ }
  return { id, permalink };
}

// Alt-Text wird von neueren API-Versionen unterstützt. Lehnt die API ihn ab, ohne ihn erneut versuchen.
async function bildContainer(params) {
  const ig = await userId();
  const { alt_text, ...ohne } = params;
  if (ohneAltText || !alt_text) return api("POST", `${ig}/media`, ohne);
  try {
    return await api("POST", `${ig}/media`, params);
  } catch (e) {
    if (!/alt_text/i.test(e.message)) throw e;
    log("ℹ️  alt_text wird von dieser API-Version nicht angenommen – poste ohne.");
    ohneAltText = true;
    return api("POST", `${ig}/media`, ohne);
  }
}

// Feed: Einzelbild oder Karussell (2–10 Bilder). Caption inkl. Hashtags.
export async function postFeed(bildUrls, caption, altText) {
  const ig = await userId();
  if (bildUrls.length === 1) {
    const { id } = await bildContainer({ image_url: bildUrls[0], caption, alt_text: altText });
    return veroeffentliche(id);
  }
  const kinder = [];
  for (const url of bildUrls) {
    const { id } = await bildContainer({ image_url: url, is_carousel_item: "true", alt_text: altText });
    kinder.push(id);
  }
  for (const id of kinder) await warteAufContainer(id);
  const { id } = await api("POST", `${ig}/media`, { media_type: "CAROUSEL", children: kinder.join(","), caption });
  return veroeffentliche(id);
}

// Story: ein Bild pro Story-Frame (Hochformat 1080×1920).
export async function postStory(bildUrl) {
  const { id } = await api("POST", `${await userId()}/media`, { media_type: "STORIES", image_url: bildUrl });
  return veroeffentliche(id);
}
