"""Regenerate the simple flower launcher icons with Python's standard library.

Run: python3 scripts/icons.py
Artwork fits inside Android's maskable-icon safe circle.
"""
import math
from pathlib import Path
import struct
import zlib


def icon(size):
    scale = 3
    width = size * scale
    pixels = bytearray(bytes.fromhex('faf7f2') * width * width)

    def ellipse(cx, cy, rx, ry, color, angle=0):
        radius = max(rx, ry)
        cosine, sine = math.cos(angle), math.sin(angle)
        rgb = bytes.fromhex(color)
        for y in range(max(0, int((cy-radius)*width)), min(width, math.ceil((cy+radius)*width))):
            for x in range(max(0, int((cx-radius)*width)), min(width, math.ceil((cx+radius)*width))):
                dx, dy = (x+.5)/width-cx, (y+.5)/width-cy
                u, v = dx*cosine+dy*sine, -dx*sine+dy*cosine
                if (u/rx)**2 + (v/ry)**2 <= 1:
                    offset = (y*width+x)*3
                    pixels[offset:offset+3] = rgb

    ellipse(.5, .745, .235, .038, 'e7e9db')
    ellipse(.5, .59, .014, .16, '425d44')
    ellipse(.437, .635, .075, .03, '8a9e7a', .6)
    ellipse(.56, .59, .075, .03, '8a9e7a', -.6)
    for petal in range(6):
        angle = petal * math.pi / 3 - math.pi / 2
        ellipse(.5 + .105*math.cos(angle), .405 + .105*math.sin(angle),
                .092, .092, 'bda6cd')
    ellipse(.5, .405, .065, .065, 'e5bd67')

    rows = bytearray()
    for y in range(size):
        rows.append(0)  # PNG scanline filter: none.
        for x in range(size):
            for channel in range(3):
                total = sum(pixels[((y*scale+sy)*width+x*scale+sx)*3+channel]
                            for sy in range(scale) for sx in range(scale))
                rows.append(round(total/(scale*scale)))

    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind+data))

    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b''))


if __name__ == '__main__':
    output = Path(__file__).resolve().parent.parent / 'assets' / 'icons'
    output.mkdir(parents=True, exist_ok=True)
    for size in (192, 512):
        (output / f'garden-{size}.png').write_bytes(icon(size))
