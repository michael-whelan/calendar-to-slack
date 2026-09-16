#!/usr/bin/env bash
#
# Maintainer tooling. Pushes the working tree, cuts an immutable version, and points a
# deployment at it. Nobody installing the add-on ever runs this — they install from the
# Marketplace.
#
#   tools/release.sh                 update every non-HEAD deployment
#   tools/release.sh <deploymentId>  update just that one
#
# Deployments pin a snapshot, so pushing alone changes nothing that users see. That gap is
# the usual reason a fix appears to have no effect.

set -euo pipefail

cd "$(dirname "$0")/.."

die() { printf '\nerror: %s\n' "$1" >&2; exit 1; }

command -v node >/dev/null || die "node is not installed"
[[ -f appsscript.json && -f Code.gs ]] || die "run this from the repository root"

clasp() { npx --yes @google/clasp "$@"; }

clasp show-authorized-user >/dev/null 2>&1 || die "not logged in — run: npx clasp login"

version_label=$(node -e '
  const source = require("fs").readFileSync("Code.gs", "utf8");
  const match = source.match(/var VERSION = .([^.]+)./);
  if (!match) process.exit(1);
  console.log(match[1]);
') || die "could not read VERSION from Code.gs"

echo "Pushing…"
clasp push --force >/dev/null

echo "Cutting version $version_label…"
version_number=$(clasp create-version "$version_label" | grep -oE '[0-9]+$') \
  || die "could not create a version"

if [[ $# -ge 1 ]]; then
  targets=("$1")
else
  # @HEAD tracks the working copy on its own and needs no update.
  mapfile -t targets < <(clasp deployments | grep -oE 'AKfyc[A-Za-z0-9_-]+ @[0-9]+' | cut -d' ' -f1)
fi

[[ ${#targets[@]} -gt 0 ]] || die "no deployments to update"

for id in "${targets[@]}"; do
  echo "Pointing ${id:0:16}… at version $version_number"
  clasp update-deployment -V "$version_number" "$id" >/dev/null
done

cat <<EOF

Done. Version $version_number ($version_label) is live on ${#targets[@]} deployment(s).

Publishing a listing change as well? The Marketplace serves whatever the add-on deployment
points at, but store listing edits — icons, screenshots, description — go through review
separately. See docs/publishing.md.
EOF
