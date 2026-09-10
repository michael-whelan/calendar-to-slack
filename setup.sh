#!/usr/bin/env bash
#
# Creates the Apps Script project, pushes the code, and deploys the web app the
# Chrome extension talks to. Run once per organisation, from the repo root.
#
# Everything it cannot do — creating the Slack app, pasting the token — is printed
# as a numbered list at the end.

set -euo pipefail

readonly TITLE="Calendar to Slack"

die() { printf '\nerror: %s\n' "$1" >&2; exit 1; }

command -v node >/dev/null || die "node is not installed"
command -v clasp >/dev/null || die "clasp is not installed — run: npm install -g @google/clasp"
[[ -f appsscript.json && -f Code.gs ]] || die "run this from the repository root"

if ! clasp show-authorized-user >/dev/null 2>&1; then
  echo "Logging in to Apps Script — pick your work Google account."
  echo "If this fails, enable the Apps Script API first: https://script.google.com/home/usersettings"
  clasp login
fi

if [[ -f .clasp.json ]]; then
  echo "Using the existing Apps Script project in .clasp.json"
else
  echo "Creating the Apps Script project…"
  # clasp writes its own starter manifest, so restore ours before pushing.
  clasp create-script --type standalone --title "$TITLE" >/dev/null
  git checkout -- appsscript.json 2>/dev/null || true
fi

echo "Pushing the code…"
clasp push --force >/dev/null

echo "Deploying the web app…"
deployment_id=$(clasp create-deployment --description "extension endpoint" --json 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=s.match(/AKfyc[\w-]+/);if(!m)process.exit(1);console.log(m[0])})')

[[ -n "$deployment_id" ]] || die "could not read the deployment id from clasp"

endpoint="https://script.google.com/macros/s/${deployment_id}/exec"
script_url=$(node -e 'const c=require("./.clasp.json");console.log(`https://script.google.com/d/${c.scriptId}/edit`)')

cat <<EOF

Done. The Apps Script side is deployed.

  Editor    $script_url
  Endpoint  $endpoint

Remaining steps, none of which can be scripted:

  1. Create a Slack app at https://api.slack.com/apps (From scratch).
     Add these User Token Scopes — the User section, not Bot:
       groups:write   users:read   users:read.email   mpim:write
     Install to Workspace, then copy the User OAuth Token (xoxp-…).

  2. In the Apps Script editor: Deploy > Test deployments > Install.
     Reload Google Calendar, open the add-on from the right-hand strip
     *without* an event selected, and paste the token into the settings card.

  3. Optional, for the popup button: load extension/ at chrome://extensions
     (Developer mode > Load unpacked), then open its options and paste:
       Web app URL     $endpoint
       Shared secret   the value shown in the settings card

After changing Code.gs, run: clasp push --force && clasp update-deployment $deployment_id
EOF
