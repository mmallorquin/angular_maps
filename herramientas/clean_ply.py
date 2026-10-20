"""Write a cleaned copy of a 3DGS PLY: drop far outliers, giant 'sky' splats and
near-transparent splats. Keeps all properties and the original orientation."""
import sys
import numpy as np

SRC, DST = sys.argv[1], sys.argv[2]
MAX_RADIUS = 45.0      # metres from origin; the lot + neighbours fit well inside
MAX_SCALE = 1.5        # metres; bigger splats are sky/fog backdrops
MIN_OPACITY = 0.02

with open(SRC, 'rb') as f:
    header = b''
    while not header.endswith(b'end_header\n'):
        header += f.readline()
lines = header.decode().split('\n')
n = int([l for l in lines if l.startswith('element vertex')][0].split()[-1])
props = [l.split()[-1] for l in lines if l.startswith('property')]
data = np.memmap(SRC, dtype='<f4', mode='r', offset=len(header), shape=(n, len(props)))
col = {p: i for i, p in enumerate(props)}

xyz = np.asarray(data[:, [col['x'], col['y'], col['z']]])
radius = np.linalg.norm(xyz, axis=1)
opacity = 1 / (1 + np.exp(-np.asarray(data[:, col['opacity']])))
scale_max = np.exp(np.asarray(data[:, [col['scale_0'], col['scale_1'], col['scale_2']]])).max(1)

keep = (radius < MAX_RADIUS) & (scale_max < MAX_SCALE) & (opacity > MIN_OPACITY)
print(f'kept {keep.sum()} of {n} ({100*keep.mean():.1f}%)')
print(f'  dropped by radius {(radius >= MAX_RADIUS).sum()}, by scale {(scale_max >= MAX_SCALE).sum()}, '
      f'by opacity {(opacity <= MIN_OPACITY).sum()}')

out_header = header.decode().replace(f'element vertex {n}', f'element vertex {keep.sum()}').encode()
with open(DST, 'wb') as f:
    f.write(out_header)
    f.write(np.ascontiguousarray(data[keep]).tobytes())
print('wrote', DST)
