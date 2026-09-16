#!/usr/bin/env bash
#
# Fits screenshots to the Marketplace's 1280x800, writing <name>-1280x800.png next to the
# original. Scales proportionally to fit, then pads to the exact canvas.
#
#   tools/fit-screenshot.sh ~/Desktop/sidebar.png ~/Desktop/toast.png
#
# Padding leaves bars. A capture already at 16:10 needs none, so crop to that shape while
# grabbing it if you can — Google asks for full-bleed images with square corners.

set -euo pipefail

readonly WIDTH=1280
readonly HEIGHT=800
readonly PAD_COLOUR=FFFFFF

[[ $# -ge 1 ]] || { echo "usage: $(basename "$0") <image>..." >&2; exit 1; }

for source in "$@"; do
  [[ -f $source ]] || { echo "error: no such file: $source" >&2; exit 1; }

  target="${source%.*}-${WIDTH}x${HEIGHT}.png"
  cp "$source" "$target"

  read -r current_width current_height < <(
    sips -g pixelWidth -g pixelHeight "$target" \
      | awk '/pixelWidth/ {w=$2} /pixelHeight/ {h=$2} END {print w, h}'
  )

  read -r scaled_width scaled_height < <(
    awk -v w="$current_width" -v h="$current_height" -v mw="$WIDTH" -v mh="$HEIGHT" \
      'BEGIN { s = mw / w; if (mh / h < s) s = mh / h; if (s > 1) s = 1;
               printf "%d %d\n", int(w * s + 0.5), int(h * s + 0.5) }'
  )

  sips -z "$scaled_height" "$scaled_width" "$target" >/dev/null
  # sips chatters about the pad colour on stderr; it is not an error.
  sips -p "$HEIGHT" "$WIDTH" --padColor "$PAD_COLOUR" "$target" >/dev/null 2>&1

  printf '%s  (%sx%s -> %sx%s, padded to %sx%s)\n' \
    "$(basename "$target")" "$current_width" "$current_height" \
    "$scaled_width" "$scaled_height" "$WIDTH" "$HEIGHT"
done
