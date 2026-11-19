# ECC schlank: Node.js/TypeScript + Python

Auswahl aus [affaan-m/ECC](https://github.com/affaan-m/ECC) v2.2.3 (Stand 19.11.2026).
Ziel: wenig Kontext-Ballast, keine Hooks, volle Kontrolle.

## Warum nicht `--profile minimal`?

Per Dry-Run geprüft: `./install.sh --profile minimal` plant **551 Datei-Operationen**.
Das sind 72 Agents, 112 Skills, 98 Commands und 122 Rules-Dateien.
"Minimal" bezieht sich also nur auf die Hooks. Für ein wirklich schlankes Setup kopiert man gezielt.
`install-lean.sh` macht das: 13 Agents, 21 Skills, 3 Rule-Packs, 56 Dateien, ca. 600 KB.

## Installation

```bash
git clone https://github.com/affaan-m/ECC.git ~/ECC
./install-lean.sh ~/ECC ~/.claude      # global
./install-lean.sh ~/ECC ./.claude      # oder nur pro Projekt
```

Nicht zusätzlich das Plugin `ecc@ecc` oder `--profile full` installieren. Die README warnt vor doppelter Installation.
Update: `git -C ~/ECC pull` und das Skript erneut ausführen. Es überschreibt nur seine eigenen Ordner.

## Was drin ist

**Agents (13):** planner, tdd-guide, code-reviewer, python-reviewer, typescript-reviewer, security-reviewer,
build-error-resolver, silent-failure-hunter, refactor-cleaner, doc-updater, docs-lookup, database-reviewer, fastapi-reviewer

**Skills (21):** tdd-workflow, verification-loop, security-review, security-scan, search-first, coding-standards,
error-handling, api-design, backend-patterns, python-patterns, python-testing, typescript-patterns, fastapi-patterns,
postgres-patterns, docker-patterns, git-workflow, documentation-lookup, deep-research, context-budget,
strategic-compact, codebase-onboarding

**Rules:** `common`, `typescript`, `python` unter `~/.claude/rules/ecc/`

Bewusst weggelassen: Commands (98 Legacy-Shims), alle Hooks, Skills für Domänen, die du nicht brauchst
(Healthcare, Logistik, Homelab, Trading, Swift, Kotlin usw.) sowie Sponsor- und Marketing-Skills.
Wenn du Postgres, FastAPI oder Docker nicht nutzt, streich die Einträge in `SKILLS` und `AGENTS`.

## Hook-Audit (Stichprobe)

Geprüft wurden `scripts/hooks/` und `scripts/lib/` per grep und Stichproben im Code. Das ist **keine vollständige Code-Prüfung**.

| Prüfpunkt | Befund |
|---|---|
| Ausgehende Netzwerkzugriffe | Keine externen Ziele gefunden. `plan-canvas-pending.js` spricht nur mit `127.0.0.1`. `mcp-health-check.js` importiert http/https, enthält aber keine festen URLs. Es prüft MCP-Server aus deiner eigenen Config. |
| Telemetrie | `skill-run-tracker.js` schreibt nur lokal. Kein Aufruf von ecc.tools in den Hook-Skripten. |
| Prozessstart | Nur `spawnSync`/`execFileSync` mit Argument-Arrays für `git`, `tmux`, Formatter und Typecheck. Kein `eval`, kein `new Function`. |
| Schreibzugriffe | Nur State- und Log-Dateien. `desktop-notify.js` schreibt Escape-Sequenzen ans TTY. |
| Secrets | `post-bash-command-log.js` loggt Shell-Befehle, enthält aber Redaction (z. B. JWT-Header). Das Log liegt trotzdem auf deiner Platte. |
| Zugriff auf `~/.ssh`, `~/.aws` | Nicht gefunden. `.env` taucht nur in Kommentaren zur Redaction auf. |

**Hinweise**

- Hooks laufen mit deinen Rechten bei jedem Tool-Aufruf. `pre-bash-commit-quality` kann Commits blockieren, `dev-server-blocker` kann `npm run dev` außerhalb von tmux blockieren. Das ist legitim, aber Verhalten, das du kennen solltest.
- Nicht geprüft: `scripts/lib/install/*` (schreibt in deine `settings.json`), `insaits-security-monitor.py` und der Rest von `scripts/`.
- Das Repo wird sehr aktiv geändert. Bei jedem Update die Hooks neu überfliegen (`git -C ~/ECC log --stat -- hooks scripts/hooks`).

**Falls du Hooks doch willst:** erst mit `--dry-run` ansehen, dann mit kleinem Profil starten.

```bash
export ECC_HOOK_PROFILE=standard
export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"
./install.sh --target claude --modules hooks-runtime --enable-hooks --dry-run
```

## CLAUDE.md-Vorlage (global: `~/.claude/CLAUDE.md`)

```markdown
# Arbeitsweise

- Antworte auf Deutsch, locker und direkt. Keine langen Einleitungen.
- Stack: Node.js/JavaScript/TypeScript und Python gleichwertig. Standard bei neuem JS-Code: TypeScript.

## Workflow bei Features und Bugfixes
1. Erst suchen, dann schreiben: bestehenden Code, npm/PyPI-Pakete und Doku prüfen (Skill `search-first`).
2. Bei mehr als 3 Dateien: Agent `planner` einen Plan erstellen lassen und auf meine Freigabe warten.
3. Tests zuerst (Skill `tdd-workflow`). Bugfix = erst reproduzierender Test.
4. Nach größeren Änderungen: `code-reviewer` plus `python-reviewer` bzw. `typescript-reviewer`.
5. Vor "fertig": Skill `verification-loop`. Tests, Lint und Typecheck müssen grün sein.
   Kein Skip, kein Auskommentieren von Tests.

## Sicherheit
- Keine Secrets im Code oder in Commits. Eingaben validieren, SQL nur parametrisiert.
- Bei Auth, Dateizugriff, Shell-Aufrufen oder User-Input: `security-reviewer` einsetzen.
- Destruktive Aktionen (rm -rf, force-push, DROP, Deploy) nur nach ausdrücklicher Bestätigung.

## Git
- Conventional Commits. Nie direkt auf main pushen. Nie `--no-verify`.
- Kein PR, kein Push ohne Aufforderung.

## Kontext sparen
- Große Dateien nur gezielt lesen. Bei langen Sessions rechtzeitig `/compact` vorschlagen.
- Nicht alles auf einmal laden. Skills nur nutzen, wenn sie zur Aufgabe passen.

## Code-Stil
- Python: Type Hints, ruff, pytest. Node: ESLint + Prettier, Vitest oder Jest, `strict` in tsconfig.
- Kleine Funktionen, früh zurückkehren, Fehler nie still schlucken.
```

Die Rules unter `rules/ecc/` bringen die detaillierten Standards schon mit. Die `CLAUDE.md` bleibt deshalb kurz und enthält nur deine Vorgaben.

## Nächste Schritte

1. Skript starten, danach in Claude Code `/agents` und `/skills` öffnen und prüfen, ob alles erscheint.
2. Eine Woche im Alltag nutzen. Was du nie benutzt, aus `AGENTS` oder `SKILLS` streichen.
3. Nur bei echtem Bedarf einzelne Skills nachziehen, z. B. `continuous-learning-v2`.
