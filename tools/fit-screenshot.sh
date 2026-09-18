#!/usr/bin/env bash
#
# Fits screenshots to the Marketplace's 1280x800, writing <name>-1280x800.png next to the
# original.
#
#   tools/fit-screenshot.sh ~/Desktop/sidebar.png            # scale to fit, pad the rest
#   tools/fit-screenshot.sh --crop right ~/Desktop/panel.png # scale to fill, crop the rest
#
# Padding leaves bars, which look poor on a listing. Crop scales to cover and trims to the
# anchor instead: "right" keeps the add-on panel and trims the calendar's left rail, which
# is usually what a capture of the side panel wants.

set -euo pipefail

readonly WIDTH=1280
readonly HEIGHT=800
readonly PAD_COLOUR=FFFFFF

mode=pad
anchor=center

while [[ ${1:-} == --* ]]; do
  case $1 in
    --crop)
      mode=crop
      case ${2:-} in
        left|center|centre|right) anchor="$2"; shift 2 ;;
        *) shift ;;
      esac
      ;;
    --pad) mode=pad; shift ;;
    *) echo "error: unknown option $1" >&2; exit 1 ;;
  esac
done

[[ $# -ge 1 ]] || { echo "usage: $(basename "$0") [--crop [left|center|right]] <image>..." >&2; exit 1; }

for source in "$@"; do
  [[ -f $source ]] || { echo "error: no such file: $source" >&2; exit 1; }

  target="${source%.*}-${WIDTH}x${HEIGHT}.png"
  cp "$source" "$target"

  read -r current_width current_height < <(
    sips -g pixelWidth -g pixelHeight "$target" \
      | awk '/pixelWidth/ {w=$2} /pixelHeight/ {h=$2} END {print w, h}'
  )

  # Fit scales until the image sits inside the canvas; fill scales until it covers it.
  read -r scaled_width scaled_height < <(
    awk -v w="$current_width" -v h="$current_height" -v mw="$WIDTH" -v mh="$HEIGHT" -v mode="$mode" \
      'BEGIN { sw = mw / w; sh = mh / h;
               s = (mode == "crop") ? (sw > sh ? sw : sh) : (sw < sh ? sw : sh);
               if (mode != "crop" && s > 1) s = 1;
               printf "%d %d\n", int(w * s + 0.5), int(h * s + 0.5) }'
  )

  sips -z "$scaled_height" "$scaled_width" "$target" >/dev/null

  if [[ $mode == crop ]]; then
    read -r offset_x offset_y < <(
      awk -v sw="$scaled_width" -v sh="$scaled_height" -v mw="$WIDTH" -v mh="$HEIGHT" -v a="$anchor" \
        'BEGIN { spare_x = sw - mw; spare_y = sh - mh;
                 x = (a == "left") ? 0 : (a == "right") ? spare_x : int(spare_x / 2);
                 printf "%d %d\n", x, int(spare_y / 2) }'
    )
    sips -c "$HEIGHT" "$WIDTH" --cropOffset "$offset_y" "$offset_x" "$target" >/dev/null
    printf '%s  (%sx%s -> filled %sx%s, cropped %s)\n' \
      "$(basename "$target")" "$current_width" "$current_height" "$WIDTH" "$HEIGHT" "$anchor"
  else
    # sips chatters about the pad colour on stderr; it is not an error.
    sips -p "$HEIGHT" "$WIDTH" --padColor "$PAD_COLOUR" "$target" >/dev/null 2>&1
    printf '%s  (%sx%s -> %sx%s, padded to %sx%s)\n' \
      "$(basename "$target")" "$current_width" "$current_height" \
      "$scaled_width" "$scaled_height" "$WIDTH" "$HEIGHT"
  fi
done
