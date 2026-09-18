#!/usr/bin/env bash
#
# Screenshots the whole screen after a delay, for capturing things that vanish before you
# can reach for a shortcut — the create-confirmation toast in particular, which clears in
# a few seconds and loses focus to the Slack tab that opens behind it.
#
#   tools/delayed-capture.sh 6 ~/Desktop/toast.png
#
# Run it, switch to Calendar, click the button, and let the timer fire while the toast is up.
# Then size the result with tools/fit-screenshot.sh.

set -euo pipefail

readonly DELAY="${1:-6}"
readonly TARGET="${2:-$HOME/Desktop/capture-$(date +%H%M%S).png}"

[[ $DELAY =~ ^[0-9]+$ ]] || { echo "usage: $(basename "$0") [seconds] [output.png]" >&2; exit 1; }

echo "Capturing in ${DELAY}s — switch to Calendar and click now."
screencapture -T "$DELAY" -x "$TARGET"
echo "Wrote $TARGET"
