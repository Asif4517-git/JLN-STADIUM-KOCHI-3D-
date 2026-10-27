#!/usr/bin/env bash
# Deploy the simulation to GitHub + enable GitHub Pages.
# Usage:  GITHUB_TOKEN=ghp_xxx bash deploy.sh
set -euo pipefail

OWNER="Asif4517-git"
REPO="JLN-STADIUM-KOCHI-3D-"
SITE="https://${OWNER,,}.github.io/${REPO}/"
DESC="Interactive 3D simulation of JLN Kaloor Stadium, Kochi — Kerala Blasters vs Mohun Bagan, Manjappada, live drone POV. ▶ ${SITE}"
TOKEN="${GITHUB_TOKEN:?set GITHUB_TOKEN first}"

cd "$(dirname "$0")"

echo "→ committing"
git init -q 2>/dev/null || true
git checkout -q -B main
git add -A
git -c user.name="Asif" -c user.email="asif@users.noreply.github.com" \
    commit -q -m "JLN Kaloor Stadium 3D — live match, Manjappada, real OSM surroundings" || echo "  (nothing new to commit)"

echo "→ pushing"
git remote remove origin 2>/dev/null || true
git remote add origin "https://x-access-token:${TOKEN}@github.com/${OWNER}/${REPO}.git"
git push -q -u origin main --force

echo "→ repo description + homepage"
curl -sS -X PATCH \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}" \
  -d "$(python3 - "$DESC" "$SITE" <<'PY'
import json, sys
print(json.dumps({"description": sys.argv[1], "homepage": sys.argv[2]}))
PY
)" -o /dev/null -w "  PATCH %{http_code}\n"

echo "→ enabling GitHub Pages"
curl -sS -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${OWNER}/${REPO}/pages" \
  -d '{"source":{"branch":"main","path":"/"}}' \
  -o /dev/null -w "  POST %{http_code} (409 = already enabled)\n" || true

echo "→ Pages status"
curl -sS -H "Authorization: Bearer ${TOKEN}" \
  "https://api.github.com/repos/${OWNER}/${REPO}/pages" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('  url:', d.get('html_url'), '| status:', d.get('status'))" || true

echo
echo "Live in ~1 minute → ${SITE}"
