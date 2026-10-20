"""Mini-map image: ground colours + walls, dilated and lightly blurred, 10 px/m."""
import sys, zlib, struct
import numpy as np
OUT = sys.argv[1]
P = np.load('map_pts.npy').astype(np.float64)
C = np.load('map_rgb.npy').astype(np.float32) / 255
X0, Z0, X1, Z1, PX = -8.0, -22.0, 26.0, 22.0, 10
W, H = int((X1 - X0) * PX), int((Z1 - Z0) * PX)
x, y, z = P[:, 0], P[:, 1], P[:, 2]
mx = ((x - X0) * PX).astype(int); mz = ((z - Z0) * PX).astype(int)
inside = (mx >= 0) & (mx < W) & (mz >= 0) & (mz < H)
BG = np.array([0.08, 0.10, 0.09], dtype=np.float32)
img = np.tile(BG, (H, W, 1))
filled = np.zeros((H, W), dtype=bool)
def paint(sel, lowest_first, brighten=1.0):
    o = np.argsort(y[sel] if not lowest_first else -y[sel])
    img[mz[sel][o], mx[sel][o]] = np.clip(C[sel][o] * brighten, 0, 1)
    filled[mz[sel][o], mx[sel][o]] = True
paint(inside & (y > -2.0) & (y < 1.2), lowest_first=True, brighten=1.15)   # ground
paint(inside & (y > 0.9) & (y < 2.6), lowest_first=False, brighten=1.3)    # walls on top
def dilate(img, filled):
    out, outf = img.copy(), filled.copy()
    pi = np.pad(img, ((1, 1), (1, 1), (0, 0)), mode='edge'); pf = np.pad(filled, 1)
    acc = np.zeros_like(img); cnt = np.zeros((H, W), dtype=np.float32)
    for dz in (-1, 0, 1):
        for dx in (-1, 0, 1):
            f = pf[1 + dz:1 + dz + H, 1 + dx:1 + dx + W]
            acc += pi[1 + dz:1 + dz + H, 1 + dx:1 + dx + W] * f[..., None]; cnt += f
    take = (~filled) & (cnt >= 2)
    out[take] = acc[take] / cnt[take][..., None]; outf |= take
    return out, outf
for _ in range(2):
    img, filled = dilate(img, filled)
# light blur on filled pixels only
pi = np.pad(img, ((1, 1), (1, 1), (0, 0)), mode='edge')
blur = sum(pi[1 + dz:1 + dz + H, 1 + dx:1 + dx + W] for dz in (-1, 0, 1) for dx in (-1, 0, 1)) / 9
img = np.where(filled[..., None], img * 0.6 + blur * 0.4, img)
def write_png(path, a):
    h, w, _ = a.shape
    raw = b''.join(b'\x00' + a[r].tobytes() for r in range(h))
    def chunk(tag, body):
        c = struct.pack('>I', len(body)) + tag + body
        return c + struct.pack('>I', zlib.crc32(tag + body) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(png)
write_png(OUT, (np.clip(img, 0, 1) * 255).astype(np.uint8))
print('wrote', OUT, W, H)
