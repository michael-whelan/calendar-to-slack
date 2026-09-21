#!/usr/bin/env python3
"""
Removes a horizontal band from a PNG — used to take a third-party add-on's overlay out of
a listing screenshot, where cropping cannot reach it because the row sits mid-card.

    tools/cut-band.py shot.png --left 212 --right 637 --top 418 --bottom 448 --until 620

Rows between --top and --bottom are removed from the columns between --left and --right.
With --until, the rows below the band shift up to close the gap and the vacated strip at
the bottom of that region is filled; without it the band is simply painted over, which
leaves the card taller but seamless.

Pure standard library, matching make-icons.py: there is no rasteriser on a stock macOS box.
Handles 8-bit RGB/RGBA non-interlaced PNGs, which is what macOS screencapture produces.
"""

import argparse
import struct
import sys
import zlib

FILTER_NONE = 0


def read_png(path):
    data = open(path, "rb").read()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        sys.exit(f"{path}: not a PNG")

    width, height, depth, colour, _, _, interlace = struct.unpack(">IIBBBBB", data[16:29])
    if depth != 8 or colour not in (2, 6) or interlace:
        sys.exit(f"{path}: need an 8-bit RGB/RGBA non-interlaced PNG")

    channels = 4 if colour == 6 else 3
    compressed, offset = b"", 8
    while offset < len(data):
        length, kind = struct.unpack(">I4s", data[offset:offset + 8])
        if kind == b"IDAT":
            compressed += data[offset + 8:offset + 8 + length]
        offset += 12 + length

    raw = zlib.decompress(compressed)
    stride = width * channels
    rows, previous, pos = [], bytearray(stride), 0

    for _ in range(height):
        filter_type, pos = raw[pos], pos + 1
        line = bytearray(raw[pos:pos + stride])
        pos += stride

        for i in range(stride):
            left = line[i - channels] if i >= channels else 0
            up = previous[i]
            upper_left = previous[i - channels] if i >= channels else 0
            if filter_type == 1:
                line[i] = (line[i] + left) & 0xFF
            elif filter_type == 2:
                line[i] = (line[i] + up) & 0xFF
            elif filter_type == 3:
                line[i] = (line[i] + (left + up) // 2) & 0xFF
            elif filter_type == 4:
                p = left + up - upper_left
                pa, pb, pc = abs(p - left), abs(p - up), abs(p - upper_left)
                predictor = left if (pa <= pb and pa <= pc) else (up if pb <= pc else upper_left)
                line[i] = (line[i] + predictor) & 0xFF

        rows.append(line)
        previous = line

    return width, height, channels, rows


def write_png(path, width, height, channels, rows):
    raw = bytearray()
    for line in rows:
        raw.append(FILTER_NONE)
        raw += line

    colour = 6 if channels == 4 else 2

    def chunk(kind, payload):
        return (struct.pack(">I", len(payload)) + kind + payload
                + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF))

    with open(path, "wb") as handle:
        handle.write(b"\x89PNG\r\n\x1a\n")
        handle.write(chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, colour, 0, 0, 0)))
        handle.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
        handle.write(chunk(b"IEND", b""))


def find_flowtrace(width, height, channels, rows):
    """Locates the overlay row by its pale green estimate chip, then grows the cut out to
    the blank padding either side so the join lands on empty card, not on text."""

    def pixel(y, x):
        i = x * channels
        return rows[y][i], rows[y][i + 1], rows[y][i + 2]

    def greenish(y):
        return sum(1 for x in range(int(width * 0.1), int(width * 0.6))
                   if (lambda r, g, b: g > 150 and g > r + 15 and g > b + 15)(*pixel(y, x)))

    chip = [y for y in range(int(height * 0.8)) if greenish(y) > 20]
    if not chip:
        sys.exit("could not find the estimate chip - pass coordinates by hand")
    chip_top, chip_bottom = chip[0], chip[-1]
    middle = (chip_top + chip_bottom) // 2

    # Anchor on the chip itself. Taking the widest colour run on the row instead finds
    # whatever panel happens to be largest, which is not the card the chip sits in.
    green_x = [x for x in range(width)
               if (lambda r, g, b: g > 150 and g > r + 15 and g > b + 15)(*pixel(middle, x))]

    # Measure the card on a blank row above the chip: the chip's own row is broken up by
    # the icon and the logo, so a colour run there stops short of the card's real edges.
    probe = max(chip_top - 8, 0)
    card = pixel(probe, green_x[0])
    left = green_x[0]
    while left > 0 and pixel(probe, left - 1) == card:
        left -= 1
    right = green_x[-1]
    while right < width - 1 and pixel(probe, right + 1) == card:
        right += 1

    def content(y):
        return sum(1 for x in range(left + 4, right - 4)
                   if max(abs(pixel(y, x)[c] - card[c]) for c in range(3)) > 12)

    top = chip_top
    while top > 1 and content(top - 1) > 2:
        top -= 1
    bottom = chip_bottom
    while bottom < height - 2 and content(bottom + 1) > 2:
        bottom += 1

    # Land the cut in the middle of the blank padding above and below the row.
    gap_above = top
    while gap_above > 1 and content(gap_above - 1) <= 2:
        gap_above -= 1
    gap_below = bottom
    while gap_below < height - 2 and content(gap_below + 1) <= 2:
        gap_below += 1

    column = left + 5
    card_bottom = next(y for y in range(height - 1, middle, -1) if pixel(y, column) == card)

    return {
        "left": left,
        "right": right + 1,
        "top": (gap_above + top) // 2,
        "bottom": (bottom + gap_below) // 2,
        "until": card_bottom,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image")
    parser.add_argument("--auto", action="store_true",
                        help="find the Flowtrace row and the card bounds automatically")
    parser.add_argument("--left", type=int)
    parser.add_argument("--right", type=int)
    parser.add_argument("--top", type=int)
    parser.add_argument("--bottom", type=int)
    parser.add_argument("--until", type=int, help="close the gap by shifting rows up to here")
    parser.add_argument("-o", "--output", help="defaults to overwriting the input")
    args = parser.parse_args()

    width, height, channels, rows = read_png(args.image)

    if args.auto:
        found = find_flowtrace(width, height, channels, rows)
        for name, value in found.items():
            if getattr(args, name) is None:
                setattr(args, name, value)
        print("found overlay at", found)
    elif None in (args.left, args.right, args.top, args.bottom):
        sys.exit("pass --auto, or all of --left --right --top --bottom")

    band = args.bottom - args.top
    if band <= 0:
        sys.exit("--bottom must be below --top")

    start, stop = args.left * channels, args.right * channels
    # Sampled just above the band, so the patch matches the card rather than a guessed colour.
    fill = bytes(rows[args.top - 2][start:stop])

    if args.until:
        for y in range(args.top, args.until - band):
            rows[y][start:stop] = rows[y + band][start:stop]
        for y in range(args.until - band, args.until):
            rows[y][start:stop] = fill
    else:
        for y in range(args.top, args.bottom):
            rows[y][start:stop] = fill

    write_png(args.output or args.image, width, height, channels, rows)
    print(f"{args.output or args.image}: removed rows {args.top}-{args.bottom} "
          f"in columns {args.left}-{args.right}")


if __name__ == "__main__":
    main()
