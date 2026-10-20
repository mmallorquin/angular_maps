"""High-res plan maps with a metre grid: floor colours and wall heights."""
import zlib
import struct
import numpy as np

P = np.load('map_pts.npy').astype(np.float64)
C = np.load('map_rgb.npy').astype(np.float32) / 255
X0, Z0, X1, Z1 = -8.0, -22.0, 26.0, 22.0
PX = 16
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
    for xm in range(int(X0), int(X1) + 1, 2):
        px = int((xm - X0) * PX)
        if 0 <= px < W:
            img[:, px] = [0.9, 0.9, 0.9] if xm % 10 == 0 else ([0.5, 0.5, 0.9] if xm == 0 else [0.3, 0.3, 0.3])
    for zm in range(int(Z0), int(Z1) + 1, 2):
        pz = int((zm - Z0) * PX)
        if 0 <= pz < H:
            img[pz, :] = [0.9, 0.9, 0.9] if zm % 10 == 0 else ([0.5, 0.5, 0.9] if zm == 0 else [0.3, 0.3, 0.3])
    return img


# 1) floor colours: lowest points (painter's from high to low so lowest wins)
img = np.full((H, W, 3), 0.05, dtype=np.float32)
sel = inside & (y > -0.8) & (y < 0.9)
o = np.argsort(-y[sel])
img[mz[sel][o], mx[sel][o]] = C[sel][o]
write_png('plan_piso.png', (np.clip(grid(img), 0, 1) * 255).astype(np.uint8))

# 2) wall height: max height in [-0.3, 3.0] as colour ramp (dark=floor, yellow=1.5m, white=3m)
sel = inside & (y > -0.3) & (y < 3.0)
hmax = np.full(H * W, -1.0)
np.maximum.at(hmax, mz[sel] * W + mx[sel], y[sel])
hmax = hmax.reshape(H, W)
t = np.clip((hmax + 0.3) / 3.3, 0, 1)
img = np.zeros((H, W, 3), dtype=np.float32)
img[..., 0] = t
img[..., 1] = t ** 1.5
img[..., 2] = np.where(t > 0.8, (t - 0.8) * 5, 0)
img[hmax < 0] = 0.05
write_png('plan_altura.png', (np.clip(grid(img), 0, 1) * 255).astype(np.uint8))

# 3) wall-only band 1.0..2.6 colours (shows walls/windows colours, no floor)
img = np.full((H, W, 3), 0.05, dtype=np.float32)
sel = inside & (y > 1.0) & (y < 2.6)
o = np.argsort(y[sel])
img[mz[sel][o], mx[sel][o]] = C[sel][o]
write_png('plan_paredes.png', (np.clip(grid(img), 0, 1) * 255).astype(np.uint8))
print('ok', W, H)
