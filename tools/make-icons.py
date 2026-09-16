#!/usr/bin/env python3
"""
Generates the Marketplace listing icons into docs/assets/.

Pure standard library: there is no rasteriser on a stock macOS box, so the glyph is
drawn by supersampled coverage tests rather than by converting an SVG. Re-run after
changing COLOURS or the geometry in draw(); the output is deterministic.

    python3 tools/make-icons.py
"""

import os
import struct
import zlib

BACKGROUND = (74, 21, 75)       # Slack aubergine
FOREGROUND = (255, 255, 255)
SUPERSAMPLE = 4                 # coverage samples per axis, per pixel

OUT = os.path.join(os.path.dirname(__file__), "..", "docs", "assets")

# Marketplace requires 32 and 128; 48 and 96 are required only if the project ships a
# web app. Generated anyway so reviving the extension does not mean regenerating assets.
ICON_SIZES = (32, 48, 96, 128)
BANNER = (220, 140)


def rounded_rect(x, y, w, h, r):
    """Point-inside test for a rounded rectangle."""
    def inside(px, py):
        if not (x <= px <= x + w and y <= py <= y + h):
            return False
        cx = min(max(px, x + r), x + w - r)
        cy = min(max(py, y + r), y + h - r)
        return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
    return inside


def calendar_glyph(scale, offset_x, offset_y):
    """A calendar mark drawn on a nominal 128x128 grid, then scaled into place."""
    def u(value):
        return value * scale

    body_outer = rounded_rect(u(26), u(38), u(76), u(68), u(10))
    body_inner = rounded_rect(u(34), u(46), u(60), u(52), u(4))
    header = rounded_rect(u(26), u(38), u(76), u(20), u(10))
    tab_left = rounded_rect(u(44), u(24), u(9), u(20), u(4))
    tab_right = rounded_rect(u(75), u(24), u(9), u(20), u(4))

    def inside(px, py):
        px -= offset_x
        py -= offset_y
        if tab_left(px, py) or tab_right(px, py):
            return True
        if header(px, py):
            return True
        return body_outer(px, py) and not body_inner(px, py)

    return inside


def render(width, height, shapes, background):
    """Composites shapes over background, anti-aliased by supersampling."""
    step = 1.0 / SUPERSAMPLE
    rows = []

    for py in range(height):
        row = bytearray()
        for px in range(width):
            hits = 0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    fx = px + (sx + 0.5) * step
                    fy = py + (sy + 0.5) * step
                    if any(shape(fx, fy) for shape in shapes):
                        hits += 1
            coverage = hits / (SUPERSAMPLE * SUPERSAMPLE)
            row += bytes(
                round(background[i] + (FOREGROUND[i] - background[i]) * coverage)
                for i in range(3)
            )
            row.append(255)
        rows.append(bytes(row))

    return rows


def write_png(path, width, height, rows):
    raw = b"".join(b"\x00" + row for row in rows)

    def chunk(tag, payload):
        body = tag + payload
        return struct.pack(">I", len(payload)) + body + struct.pack(">I", zlib.crc32(body))

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )

    with open(path, "wb") as handle:
        handle.write(png)
    print(f"wrote {os.path.relpath(path)} ({width}x{height})")


def main():
    os.makedirs(OUT, exist_ok=True)

    for size in ICON_SIZES:
        scale = size / 128.0
        shapes = [calendar_glyph(scale, 0, 0)]
        # The plate is the icon itself, so round its corners rather than the glyph's.
        plate = rounded_rect(0, 0, size, size, size * 0.22)
        rows = render(size, size, shapes, BACKGROUND)
        rows = punch_out(rows, size, size, plate)
        write_png(os.path.join(OUT, f"logo-{size}.png"), size, size, rows)

    width, height = BANNER
    scale = 84 / 128.0
    shapes = [calendar_glyph(scale, (width - 84) / 2, (height - 84) / 2)]
    rows = render(width, height, shapes, BACKGROUND)
    write_png(os.path.join(OUT, "banner-220x140.png"), width, height, rows)


def punch_out(rows, width, height, inside):
    """Makes everything outside `inside` transparent, anti-aliased at the edge."""
    step = 1.0 / SUPERSAMPLE
    out = []

    for py in range(height):
        row = bytearray(rows[py])
        for px in range(width):
            hits = 0
            for sy in range(SUPERSAMPLE):
                for sx in range(SUPERSAMPLE):
                    if inside(px + (sx + 0.5) * step, py + (sy + 0.5) * step):
                        hits += 1
            alpha = round(255 * hits / (SUPERSAMPLE * SUPERSAMPLE))
            row[px * 4 + 3] = alpha
        out.append(bytes(row))

    return out


if __name__ == "__main__":
    main()
