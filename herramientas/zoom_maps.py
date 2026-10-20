"""Zoomed plan maps of the house area with a 1 m grid (bright every 5 m, blue at 0)."""
import sys
import zlib
import struct
import numpy as np

X0, Z0, X1, Z1 = [float(v) for v in sys.argv[1:5]]
PX = 32
P = np.load('map_pts.npy').astype(np.float64)
C = np.load('map_rgb.npy').astype(np.float32) / 255
W, H = int((X1 - X0) * PX), int((Z1 - Z0) * PX)
x, y, z = P[:, 0], P[:, 1], P[:, 2]
mx = ((x - X0) * PX).astype(int)
mz = ((z - Z0) * PX).astype(int)
inside = (mx >= 0) & (mx < W) & (mz >= 0) & (mz < H)


def write_png(path, img):
    h, w, _ = img.shape
    raw = b''.join(b'\x00' + img[r].tobytes() for r in range(h))
    def chunk(tag, body):
        c = struct.pack('>I', len(body)) + tag + body
        return c + struct.pack('>I', zlib.crc32(tag + body) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(png)


def grid(img):
    for xm in range(int(np.ceil(X0)), int(X1) + 1):
        px = int((xm - X0) * PX)
        if 0 <= px < W:
            img[:, px] = [0.95, 0.95, 0.95] if xm % 5 == 0 else [0.28, 0.28, 0.28]
            if xm == 0: img[:, px] = [0.4, 0.4, 1.0]
    for zm in range(int(np.ceil(Z0)), int(Z1) + 1):
        pz = int((zm - Z0) * PX)
        if 0 <= pz < H:
            img[pz, :] = [0.95, 0.95, 0.95] if zm % 5 == 0 else [0.28, 0.28, 0.28]
            if zm == 0: img[pz, :] = [0.4, 0.4, 1.0]
    return img


def paint(sel, lowest_first):
    img = np.full((H, W, 3), 0.05, dtype=np.float32)
    o = np.argsort(y[sel] if lowest_first else -y[sel])
    img[mz[sel][o], mx[sel][o]] = C[sel][o]
    return img

tag = sys.argv[5] if len(sys.argv) > 5 else 'zoom'
write_png(f'{tag}_piso.png', (np.clip(grid(paint(inside & (y > -0.6) & (y < 0.7), False)), 0, 1) * 255).astype(np.uint8))
write_png(f'{tag}_paredes.png', (np.clip(grid(paint(inside & (y > 0.9) & (y < 2.5), True)), 0, 1) * 255).astype(np.uint8))
write_png(f'{tag}_techo.png', (np.clip(grid(paint(inside & (y > 2.5) & (y < 4.6), True)), 0, 1) * 255).astype(np.uint8))
print('ok', W, H)
