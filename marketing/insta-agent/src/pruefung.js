// Harte, regelbasierte Qualitätsprüfung. Alles, was hier gefunden wird, geht
// als Mängelliste zurück an Claude, bis der Post sauber ist.

const GRENZEN = {
  eyebrow: 40,
  headline: 60,
  akzent: 40,
  text: 220,
  punkt: 70,
  hook: 125,
  caption: 2000,
};

// Aussagen, die nach UWG (irreführende Werbung) oder schlicht unseriös heikel sind.
const VERBOTEN = [
  [/garantier/i, "„garantiert“ – Garantien vermeiden (UWG/Erwartungsmanagement)"],
  [/platz\s*(1|eins)\b/i, "„Platz 1“ – Google-Platzierungen kann niemand versprechen"],
  [/\b100\s*%|\b100\s*prozent/i, "„100 %“ – absolute Versprechen vermeiden"],
  [/\b(die|der|das)\s+beste[nr]?\b/i, "Superlativ „beste“ ohne Beleg"],
  [/günstigste|billigste|billig\b/i, "Preis-Superlativ/„billig“ passt nicht zu hochwertigem Angebot"],
  [/abmahnsicher|rechtssicher/i, "„abmahn-/rechtssicher“ – wäre ein Rechtsversprechen"],
  [/\bnr\.?\s*1\b|nummer\s*1\b/i, "„Nr. 1“ ohne Beleg"],
];

export function pruefePost(post) {
  const m = [];
  const folien = post.folien ?? [];

  if (post.format === "karussell") {
    if (folien.length < 5 || folien.length > 8) m.push(`Karussell hat ${folien.length} Folien – erlaubt sind 5–8.`);
    if (folien[0]?.typ !== "titel") m.push("Folie 1 muss vom Typ „titel“ sein (Hook).");
    if (folien.at(-1)?.typ !== "cta") m.push("Letzte Folie muss vom Typ „cta“ sein.");
  } else if (folien.length !== 1) {
    m.push(`Einzelbild braucht genau 1 Folie, hat aber ${folien.length}.`);
  }

  folien.forEach((f, i) => {
    const n = `Folie ${i + 1}`;
    for (const feld of ["eyebrow", "headline", "akzent", "text"]) {
      const len = (f[feld] ?? "").length;
      if (len > GRENZEN[feld]) m.push(`${n}: ${feld} hat ${len} Zeichen (max. ${GRENZEN[feld]}).`);
    }
    if (!f.headline?.trim()) m.push(`${n}: headline fehlt.`);
    if (f.typ === "liste") {
      if (f.punkte.length < 2 || f.punkte.length > 5) m.push(`${n}: Liste braucht 2–5 Punkte (hat ${f.punkte.length}).`);
      f.punkte.forEach((p, j) => {
        if (p.length > GRENZEN.punkt) m.push(`${n}, Punkt ${j + 1}: ${p.length} Zeichen (max. ${GRENZEN.punkt}).`);
      });
    } else if (f.punkte.length) {
      m.push(`${n}: „punkte“ nur bei typ „liste“ verwenden.`);
    }
  });

  const caption = post.caption ?? "";
  const hook = caption.split("\n")[0] ?? "";
  if (caption.length > GRENZEN.caption) m.push(`Caption hat ${caption.length} Zeichen (max. ${GRENZEN.caption}).`);
  if (hook.length > GRENZEN.hook) m.push(`Erste Caption-Zeile (Hook) hat ${hook.length} Zeichen (max. ${GRENZEN.hook}).`);
  if (/#\w/.test(caption)) m.push("Hashtags gehören nicht in die Caption, sondern in das Feld „hashtags“.");
  if (!/link in (der )?bio|dm|nachricht|erstgespräch|termin/i.test(caption)) m.push("Caption braucht einen klaren CTA (z. B. „Link in Bio“ oder DM).");

  const tags = post.hashtags ?? [];
  if (tags.length < 8 || tags.length > 15) m.push(`${tags.length} Hashtags – ideal sind 8–15.`);
  const kaputt = tags.filter((t) => !/^#[\p{L}\p{N}_]+$/u.test(t));
  if (kaputt.length) m.push(`Ungültige Hashtags: ${kaputt.join(", ")}`);
  const doppelt = tags.filter((t, i) => tags.findIndex((x) => x.toLowerCase() === t.toLowerCase()) !== i);
  if (doppelt.length) m.push(`Doppelte Hashtags: ${doppelt.join(", ")}`);

  if (!post.alt_text?.trim()) m.push("Alt-Text fehlt.");

  const alles = JSON.stringify([folien, caption]);
  for (const [re, grund] of VERBOTEN) if (re.test(alles)) m.push(`Heikle Aussage: ${grund}.`);

  return m;
}
