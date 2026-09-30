# claude-alt

Startet Claude Code mit einem zweiten, Anthropic-kompatiblen Anbieter (z. B. DeepSeek, GLM, MiniMax) – ohne Gateway-Server.
Ein normales `claude` bleibt unverändert bei deinem Anthropic-Login.

## Einrichten

```bash
# 1. Skript in den PATH legen
ln -s "$PWD/tools/claude-alt/claude-alt" ~/.local/bin/claude-alt

# 2. API-Key hinterlegen – Variante A: Umgebungsvariable (z. B. in ~/.bashrc)
export DEEPSEEK_API_KEY=sk-...

#    Variante B: Key-Datei, nur für dich lesbar
mkdir -p ~/.config/claude-alt/keys
printf '%s\n' 'sk-...' > ~/.config/claude-alt/keys/deepseek
chmod 600 ~/.config/claude-alt/keys/deepseek

# 3. Verbindung testen (eine Mini-Anfrage, 16 Tokens)
claude-alt check deepseek
```

Keys gehören nie ins Repo. Das Skript liest Keys nur aus der Umgebungsvariable oder aus `~/.config/claude-alt/keys/<profil>` und verweigert Key-Dateien, die andere lesen dürfen.

## Nutzen

```bash
claude-alt list                        # Profile anzeigen
claude-alt deepseek                    # interaktive Session mit DeepSeek
claude-alt glm -p "Erklär mir diesen Fehler"   # einmalige Frage
```

## Profile

Mitgeliefert in `profiles/`. Eigene oder geänderte Profile legst du in `~/.config/claude-alt/profiles/` ab – die haben Vorrang.

```ini
# ~/.config/claude-alt/profiles/deepseek.env
BASE_URL=https://api.deepseek.com/anthropic   # ohne /v1 – Claude Code hängt /v1/messages an
MODEL=deepseek-v4-pro                         # Hauptmodell (auch für Subagents)
FAST_MODEL=deepseek-v4-flash                  # für Hintergrund-Aufgaben (optional)
KEY_VAR=DEEPSEEK_API_KEY                      # Name der Umgebungsvariable mit dem Key
```

| Profil | Endpunkt | Modelle |
|---|---|---|
| `deepseek` | `https://api.deepseek.com/anthropic` | `deepseek-v4-pro`, `deepseek-v4-flash` |
| `glm` | `https://api.z.ai/api/anthropic` | `glm-5.3`, `glm-5.3-flash` |
| `minimax` | `https://api.minimax.io/anthropic` | `MiniMax-M3`, `MiniMax-M2.7-highspeed` |

Endpunkte und Modell-IDs stammen aus der Provider-Registry von [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (Stand 30.09.2026), nicht direkt aus der Anbieter-Doku. Modellnamen ändern sich schnell – vor dem ersten Einsatz `claude-alt check <profil>` laufen lassen und bei HTTP 400/404 die Modell-ID in der Anbieter-Doku prüfen.

## Sicherheit – warum `--bare`

Getestet mit Claude Code 2.1.285 gegen einen lokalen Test-Server: **Ohne `--bare` schickte Claude Code das gespeicherte Anthropic-Login-Token (OAuth) an den fremden Endpunkt**, obwohl `ANTHROPIC_AUTH_TOKEN` gesetzt war. Ein fremder Anbieter hätte damit Zugriff auf deinen Claude-Account.

`claude-alt` startet Claude Code deshalb immer mit `--bare`:

- OAuth-Login und Schlüsselbund werden nicht gelesen – nur der Profil-Key geht raus.
- Ein in der Shell gesetztes `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` / `CLAUDE_CODE_OAUTH_TOKEN` wird für den Start entfernt.
- Der Key erreicht Claude Code über `apiKeyHelper` und eine Umgebungsvariable, nicht als Kommandozeilen-Argument (nicht in `ps` sichtbar).
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` schaltet Telemetrie und Update-Checks ab.

Nebenwirkung von `--bare`: Hooks, Plugins und die automatische Suche nach `CLAUDE.md` sind aus. Das Skript lädt die `CLAUDE.md` des aktuellen Ordners über `--add-dir "$PWD"` wieder. Skills lassen sich weiter mit `/skill-name` aufrufen.

Nur `https://` ist erlaubt, `http://` ausschließlich für `localhost` (z. B. ein lokaler Ollama-/LiteLLM-Server).

## Datenschutz

Alles, was du in einer `claude-alt`-Session öffnest – Code, Dateien, Befehlsausgaben – geht an den gewählten Anbieter. DeepSeek, Z.ai und MiniMax sitzen außerhalb der EU; für personenbezogene Daten (Mieter, Kunden, Mitarbeitende) gibt es dort in der Regel keinen Auftragsverarbeitungsvertrag nach DSGVO. Solche Daten nur mit deinem normalen Claude-Zugang oder einem Anbieter mit AV-Vertrag verarbeiten.

## Windows

Das Skript ist Bash. Unter Windows über WSL oder Git Bash starten.
