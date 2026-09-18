#!/usr/bin/env bash
#
# Walks the three listing screenshots: tells you what to put on screen, counts down,
# captures, and fits the result to the Marketplace's 1280x800.
#
#   tools/capture-listing.sh
#
# Outputs into docs/assets/screenshots/. Re-run to redo them all, or pass shot numbers
# to redo only some:
#
#   tools/capture-listing.sh 2 3
#
# Capture in a clean environment — see docs/listing.md. A Biorce calendar publishes real
# event titles, a live Meet link and the Flowtrace cost overlay, none of which belong on a
# public listing.

set -euo pipefail

readonly ROOT="$(cd "$(dirname "$0")/.." && pwd)"
readonly OUT="$ROOT/docs/assets/screenshots"
readonly DELAY=6

shot_name=(
  "sidebar"
  "confirmation"
  "settings"
)

shot_brief=(
  "Meeting open, add-on panel showing the guest count and prefilled channel name.
     Guest list collapsed, left rail collapsed, no third-party overlay in frame."
  "Click 'Create private channel' while the countdown runs.
     The toast clears in a few seconds, so let the timer catch it."
  "Add-on open with NO event selected, showing 'Connected as' and Disconnect."
)

mkdir -p "$OUT"

wanted=("$@")
[[ ${#wanted[@]} -gt 0 ]] || wanted=(1 2 3)

for n in "${wanted[@]}"; do
  [[ $n =~ ^[1-3]$ ]] || { echo "error: shot must be 1, 2 or 3, got '$n'" >&2; exit 1; }

  index=$((n - 1))
  target="$OUT/shot-${n}-${shot_name[$index]}.png"

  printf '\n── Shot %s of 3 ──\n  %s\n\n' "$n" "${shot_brief[$index]}"
  read -r -p "Set the screen up, then press Enter (Ctrl-C to stop)… " _

  echo "Capturing in ${DELAY}s — switch to Calendar now."
  screencapture -T "$DELAY" -x "$target"

  # Crop rather than pad: bars down a listing image look unfinished, and anchoring right
  # keeps the add-on panel while trimming the calendar's left rail.
  "$ROOT/tools/fit-screenshot.sh" --crop right "$target" >/dev/null
  fitted="${target%.*}-1280x800.png"
  mv "$fitted" "$target"
  echo "Wrote $target"
done

printf '\nDone. Review them before uploading:\n  open %s\n' "$OUT"
