// Lädt .env (falls vorhanden), BEVOR andere Module ihre Einstellungen lesen.
// Muss deshalb als erstes importiert werden. Auf dem Server kommen die Variablen aus /etc/insta-agent.env (systemd).
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const datei = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
if (existsSync(datei)) process.loadEnvFile(datei);
