"""Build the walkable-terrain grid and the mini-map image from the solid splat points
(world coords: X right, Y up, Z toward the bottom of the map)."""
import sys
import json
import zlib
import struct
import numpy as np

OUT_DIR = sys.argv[1]
P = np.load('map_pts.npy').astype(np.float64)
C = np.load('map_rgb.npy').astype(np.float32) / 255

X0, Z0, X1, Z1 = -8.0, -22.0, 26.0, 22.0
CELL = 0.5
NX = int(round((X1 - X0) / CELL))
NZ = int(round((Z1 - Z0) / CELL))
MIN_GROUND_POINTS = 3
OBSTACLE_MIN_H, OBSTACLE_MAX_H = 0.45, 2.2
OBSTACLE_MIN_POINTS = 20

x, y, z = P[:, 0], P[:, 1], P[:, 2]
ix = np.floor((x - X0) / CELL).astype(int)
iz = np.floor((z - Z0) / CELL).astype(int)
inside = (ix >= 0) & (ix < NX) & (iz >= 0) & (iz < NZ)
cell = np.where(inside, iz * NX + ix, -1)

# --- ground height per cell: 25th percentile of low points ---
gmask = inside & (y > -2.0) & (y < 1.2)
gc, gy = cell[gmask], y[gmask]
order = np.argsort(gc, kind='stable')
gc, gy = gc[order], gy[order]
uniq, start, counts = np.unique(gc, return_index=True, return_counts=True)
ground = np.full(NX * NZ, np.nan)
for u, s, c in zip(uniq, start, counts):
    if c >= MIN_GROUND_POINTS:
        ground[u] = np.percentile(gy[s:s + c], 25)
print('cells with ground', np.isfinite(ground).sum(), 'of', NX * NZ)

# --- fill single-cell holes from neighbours (two passes) ---
g2 = ground.reshape(NZ, NX)
for _ in range(3):
    padded = np.pad(g2, 1, constant_values=np.nan)
    neigh = np.stack([padded[1 + dz:1 + dz + NZ, 1 + dx:1 + dx + NX]
                      for dz in (-1, 0, 1) for dx in (-1, 0, 1) if (dx, dz) != (0, 0)])
    known = np.isfinite(neigh).sum(0)
    fill = np.isnan(g2) & (known >= 3)
    g2 = np.where(fill, np.nanmean(np.where(np.isfinite(neigh), neigh, np.nan), axis=0), g2)
ground = g2.reshape(-1)
print('after hole fill', np.isfinite(ground).sum())

# --- obstacles: points between 0.45 and 2.2 m above the local ground ---
local_g = np.where(cell >= 0, np.nan_to_num(ground[np.clip(cell, 0, None)], nan=0.0), 0.0)
omask = inside & (y > local_g + OBSTACLE_MIN_H) & (y < local_g + OBSTACLE_MAX_H)
ocount = np.bincount(cell[omask], minlength=NX * NZ)
blocked = (ocount >= OBSTACLE_MIN_POINTS)
print('blocked cells', blocked.sum())

alturas = [None if not np.isfinite(h) else round(float(h), 2) for h in ground]
with open(f'{OUT_DIR}/datos/terreno.json', 'w') as f:
    json.dump({'x0': X0, 'z0': Z0, 'celda': CELL, 'nx': NX, 'nz': NZ,
               'alturas': alturas, 'bloqueadas': blocked.astype(int).tolist()}, f, separators=(',', ':'))
print('wrote terreno.json')


def write_png(path, img):
    h, w, _ = img.shape
    raw = b''.join(b'\x00' + img[r].tobytes() for r in range(h))
    def chunk(tag, body):
        c = struct.pack('>I', len(body)) + tag + body
        return c + struct.pack('>I', zlib.crc32(tag + body) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(png)


# --- mini-map: ground (painter's by height), then walls up to 2.6 m, no canopies ---
PX = 10
W, H = int((X1 - X0) * PX), int((Z1 - Z0) * PX)
img = np.full((H, W, 3), 0.07, dtype=np.float32)
mx = ((x - X0) * PX).astype(int)
mz = ((z - Z0) * PX).astype(int)
mok = (mx >= 0) & (mx < W) & (mz >= 0) & (mz < H) & (y > -0.8) & (y < 2.6)
sel_x, sel_z, sel_y, sel_c = mx[mok], mz[mok], y[mok], C[mok]
o = np.argsort(sel_y)
img[sel_z[o], sel_x[o]] = sel_c[o]

# 3x3 dilation to close gaps (take brightest neighbour where the pixel is background)
bg = (img.max(2) <= 0.071)
padded = np.pad(img, ((1, 1), (1, 1), (0, 0)), constant_values=0.07)
best = img.copy()
for dz in (-1, 0, 1):
    for dx in (-1, 0, 1):
        n = padded[1 + dz:1 + dz + H, 1 + dx:1 + dx + W]
        take = bg & (n.max(2) > best.max(2))
        best = np.where(take[..., None], n, best)
img = best
write_png(f'{OUT_DIR}/datos/mapa.png', (np.clip(img, 0, 1) * 255).astype(np.uint8))
print('wrote mapa.png', W, H)

# Debug overlay: blocked cells in red, walkable in green tint
dbg = img.copy()
b2 = blocked.reshape(NZ, NX)
k2 = np.isfinite(ground).reshape(NZ, NX)
cell_px = int(CELL * PX)
for cz in range(NZ):
    for cx in range(NX):
        sl = (slice(cz * cell_px, (cz + 1) * cell_px), slice(cx * cell_px, (cx + 1) * cell_px))
        if b2[cz, cx]:
            dbg[sl] = dbg[sl] * 0.4 + np.array([0.9, 0.1, 0.1]) * 0.6
        elif k2[cz, cx]:
            dbg[sl] = dbg[sl] * 0.75 + np.array([0.1, 0.9, 0.2]) * 0.25
write_png('terreno_debug.png', (np.clip(dbg, 0, 1) * 255).astype(np.uint8))
print('wrote terreno_debug.png')
