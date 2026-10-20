"""Render several top-down maps of the splat in WORLD coords (after 180° about X).
World: X = x, Y = -y (up), Z = -z. Ground ~ Y=0.
"""
import sys
import zlib
import struct
import numpy as np

PLY_PATH = sys.argv[1]
OUT = sys.argv[2]
PX = float(sys.argv[3]) if len(sys.argv) > 3 else 12

with open(PLY_PATH, 'rb') as f:
    header = b''
    while not header.endswith(b'end_header\n'):
        header += f.readline()
lines = header.decode().split('\n')
n = int([l for l in lines if l.startswith('element vertex')][0].split()[-1])
props = [l.split()[-1] for l in lines if l.startswith('property')]
data = np.memmap(PLY_PATH, dtype='<f4', mode='r', offset=len(header), shape=(n, len(props)))
col = {p: i for i, p in enumerate(props)}

xyz = np.asarray(data[:, [col['x'], col['y'], col['z']]]).astype(np.float64)
world = np.stack([xyz[:, 0], -xyz[:, 1], -xyz[:, 2]], axis=1)
opacity = 1 / (1 + np.exp(-np.asarray(data[:, col['opacity']])))
scales = np.exp(np.asarray(data[:, [col['scale_0'], col['scale_1'], col['scale_2']]]))
SH_C0 = 0.28209479177387814
rgb = np.clip(0.5 + SH_C0 * np.asarray(data[:, [col['f_dc_0'], col['f_dc_1'], col['f_dc_2']]]), 0, 1)

solid = (opacity > 0.3) & (scales.max(1) < 0.4)
P = world[solid]
C = rgb[solid]
np.save(OUT + '_pts.npy', P.astype(np.float32))
np.save(OUT + '_rgb.npy', (C * 255).astype(np.uint8))


def write_png(path, img):
    h, w, _ = img.shape
    raw = b''.join(b'\x00' + img[y].tobytes() for y in range(h))
    def chunk(tag, body):
        c = struct.pack('>I', len(body)) + tag + body
        return c + struct.pack('>I', zlib.crc32(tag + body) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(png)


# Map frame: X to the right, Z DOWN the image (so looking from above with +Z toward viewer bottom)
X0, X1 = -8.0, 26.0
Z0, Z1 = -22.0, 22.0
W = int((X1 - X0) * PX)
H = int((Z1 - Z0) * PX)
print('map', W, 'x', H, 'origin', X0, Z0, 'px/m', PX)


def render(name, mask, mode='high', hmin=None, hmax=None):
    p, c = P[mask], C[mask]
    ix = ((p[:, 0] - X0) * PX).astype(int)
    iz = ((p[:, 2] - Z0) * PX).astype(int)
    ok = (ix >= 0) & (ix < W) & (iz >= 0) & (iz < H)
    ix, iz, y, c = ix[ok], iz[ok], p[ok, 1], c[ok]
    order = np.argsort(y if mode == 'high' else -y)
    img = np.zeros((H, W, 3), dtype=np.float32)
    img[iz[order], ix[order]] = c[order]
    if mode == 'height':
        hh = np.clip((y - hmin) / (hmax - hmin), 0, 1)
        colmap = np.stack([hh, 1 - np.abs(hh - 0.5) * 2, 1 - hh], axis=1)
        img[iz[order], ix[order]] = colmap[order]
    write_png(OUT + '_' + name + '.png', (img * 255).astype(np.uint8))
    print('wrote', name, 'points', ok.sum())


Y = P[:, 1]
render('ground', (Y > -0.6) & (Y < 0.35), 'high')          # ground only
render('low', (Y > -0.6) & (Y < 3.8), 'high')              # ground + walls + roof, no trees
render('height', (Y > -0.6) & (Y < 4.5), 'height', -0.5, 4.5)
render('all', Y > -1.0, 'high')

# Count by height bands
for lo, hi in [(-3, -0.6), (-0.6, 0.35), (0.35, 1.5), (1.5, 2.8), (2.8, 4.0), (4.0, 6), (6, 12), (12, 50)]:
    print(f'Y in [{lo},{hi}): {((Y >= lo) & (Y < hi)).sum()}')
