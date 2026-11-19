#!/usr/bin/env bash
# Schlankes ECC-Setup für Node.js/TypeScript + Python. Keine Hooks, keine Commands.
# Nutzung:  ./install-lean.sh [ECC_REPO_PFAD] [ZIEL]
#   ZIEL = ~/.claude (global, Standard)  oder  ./.claude (nur dieses Projekt)
set -euo pipefail

ECC="${1:-$HOME/ECC}"
DEST="${2:-$HOME/.claude}"

[ -d "$ECC/agents" ] || { echo "ECC-Repo nicht gefunden: $ECC (git clone https://github.com/affaan-m/ECC.git)"; exit 1; }

AGENTS=(planner tdd-guide code-reviewer python-reviewer typescript-reviewer
        security-reviewer build-error-resolver silent-failure-hunter
        refactor-cleaner doc-updater docs-lookup database-reviewer fastapi-reviewer)

SKILLS=(tdd-workflow verification-loop security-review security-scan search-first
        coding-standards error-handling api-design backend-patterns
        python-patterns python-testing typescript-patterns fastapi-patterns
        postgres-patterns docker-patterns git-workflow documentation-lookup
        deep-research context-budget strategic-compact codebase-onboarding)

mkdir -p "$DEST/agents" "$DEST/skills" "$DEST/rules/ecc"

for a in "${AGENTS[@]}"; do cp "$ECC/agents/$a.md" "$DEST/agents/"; done
for s in "${SKILLS[@]}"; do rm -rf "$DEST/skills/$s"; cp -R "$ECC/skills/$s" "$DEST/skills/$s"; done
for r in common typescript python; do rm -rf "$DEST/rules/ecc/$r"; cp -R "$ECC/rules/$r" "$DEST/rules/ecc/$r"; done

echo "Fertig: ${#AGENTS[@]} Agents, ${#SKILLS[@]} Skills, Rules common+typescript+python -> $DEST"
echo "Hooks wurden NICHT installiert."
