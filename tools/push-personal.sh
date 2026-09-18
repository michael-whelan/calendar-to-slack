#!/usr/bin/env bash
#
# Pushes Code.gs and appsscript.json to a second Apps Script project owned by another
# Google account — used when the work account cannot share the script outside its domain.
#
#   tools/push-personal.sh
#
# Expects, one time:
#   clasp --user personal login
#   .clasp.personal.json in the repo root, holding that project's scriptId (gitignored)
#
# clasp resolves its project root from the working directory, and -P with a file path
# trips its path-traversal guard, so the files are staged into a temp directory that the
# personal .clasp.json sits in.
#
# The copy has its own script id, so it needs its own OAuth callback registered in the
# Slack app, and its own SLACK_CLIENT_ID / SLACK_CLIENT_SECRET script properties.

set -euo pipefail

readonly ROOT="$(cd "$(dirname "$0")/.." && pwd)"
readonly CONFIG="$ROOT/.clasp.personal.json"
readonly USER_KEY="personal"

[[ -f $CONFIG ]] || { echo "error: no $CONFIG — see the header" >&2; exit 1; }

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT

cp "$ROOT/appsscript.json" "$ROOT/Code.gs" "$stage/"
cp "$CONFIG" "$stage/.clasp.json"

( cd "$stage" && clasp --user "$USER_KEY" push --force )

script_id="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["scriptId"])' "$CONFIG")"
printf '\nCallback for this copy, which must be a redirect URL in the Slack app:\n  https://script.google.com/macros/d/%s/usercallback\n' "$script_id"
