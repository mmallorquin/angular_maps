#!/usr/bin/env python3
"""
Extrae texturas fotográficas PBR reales a partir de las fotos del lote (visor/fotos/)
y genera mapas difusos (color) y de normales (relieve) con bordes continuos (seamless tiling).
"""

import os
import numpy as np
from PIL import Image, ImageFilter, ImageOps

FOTOS_DIR = os.path.join(os.path.dirname(__file__), '../visor/fotos')
# Fotos originales a resolución completa (no se versionan: pesan 2-6 MB cada una). Si no están, se usa
# la versión de visor/fotos/ escalando la caja de recorte.
ORIGINALES_DIR = os.environ.get('FOTOS_ORIGINALES', os.path.join(os.path.dirname(__file__), '../../fotos-originales'))
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../visor/texturas')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Recortes [x0, y0, x1, y1] en píxeles de la foto original ya rotada según su EXIF (ancho x alto de
# 'tamano'). Se eligieron zonas planas, de frente y con luz pareja. 'escala_m' es el tamaño real del
# recorte en metros (1 mosaico = escala_m x escala_m).
MATERIALES = {
    'piedra': {  # laja crema del hastial, de frente desde la calle (foto 3 original, 4032x3024)
        'foto': 'foto-3.jpg', 'original': 'IMG_2445.jpeg', 'tamano': (4032, 3024),
        'caja': (2190, 1380, 2370, 1560), 'escala_m': 1.1, 'normal_fuerza': 2.0,
    },
    'madera': {  # tablas grises del galpón (foto 10)
        'foto': 'foto-10.jpg', 'original': 'IMG_2449.jpeg', 'tamano': (4032, 3024),
        'caja': (2400, 1400, 3000, 2000), 'escala_m': 1.3, 'normal_fuerza': 1.6,
    },
    'hormigon': {  # pilar central del portón (foto 4 original, 4032x3024)
        'foto': 'foto-4.jpg', 'original': 'IMG_2446.jpeg', 'tamano': (4032, 3024),
        'caja': (870, 1500, 1090, 1720), 'escala_m': 0.45, 'normal_fuerza': 1.0,
    },
    'ladrillo': {  # muro de ladrillo del vecino, a la izquierda del portón (foto 4)
        'foto': 'foto-4.jpg', 'original': 'IMG_2446.jpeg', 'tamano': (4032, 3024),
        'caja': (110, 1628, 214, 1732), 'escala_m': 2.0, 'normal_fuerza': 1.4,
    },
    'tierra': {  # tierra colorada del frente (foto 3)
        'foto': 'foto-3.jpg', 'original': 'IMG_2445.jpeg', 'tamano': (4032, 3024),
        'caja': (2150, 2270, 2500, 2620), 'escala_m': 1.5, 'normal_fuerza': 1.2,
    },
}


def abrir_foto(cfg):
    """Abre la foto original (rotada según EXIF) o, si falta, la copia reducida con la caja escalada."""
    original = os.path.join(ORIGINALES_DIR, cfg['original'])
    if os.path.exists(original):
        return ImageOps.exif_transpose(Image.open(original)), 1.0
    reducida = os.path.join(FOTOS_DIR, cfg['foto'])
    if not os.path.exists(reducida):
        return None, 1.0
    im = ImageOps.exif_transpose(Image.open(reducida))
    return im, im.size[0] / cfg['tamano'][0]


def hacer_seamless(img, margen_ratio=0.18):
    """Convierte una imagen en mosaico continuo (seamless tileable) mediante fundido cruzado."""
    w, h = img.size
    arr = np.array(img, dtype=np.float32)

    mw = int(w * margen_ratio)
    mh = int(h * margen_ratio)

    # Máscara horizontal lineal / sinusoidal
    x = np.linspace(0, np.pi, mw)
    peso_x = 0.5 - 0.5 * np.cos(x)  # 0 a 1 suave
    peso_x = peso_x[np.newaxis, :, np.newaxis]

    # Mezclar bordes izquierdo y derecho
    izq = arr[:, :mw].copy()
    der = arr[:, w - mw:].copy()
    arr[:, :mw] = izq * (1 - peso_x) + der * peso_x
    arr[:, w - mw:] = arr[:, :mw]

    # Máscara vertical
    y = np.linspace(0, np.pi, mh)
    peso_y = 0.5 - 0.5 * np.cos(y)
    peso_y = peso_y[:, np.newaxis, np.newaxis]

    arr_top = arr[:mh, :].copy()
    arr_bot = arr[h - mh:, :].copy()
    arr[:mh, :] = arr_top * (1 - peso_y) + arr_bot * peso_y
    arr[h - mh:, :] = arr[:mh, :]

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)

def generar_mapa_normales(img, fuerza=2.0):
    """Genera un mapa de normales tangentes en espacio tangente (RGB) usando gradiente Sobel."""
    # Convertir a escala de grises
    gris = img.convert('L')
    arr = np.array(gris, dtype=np.float32) / 255.0

    # Gradientes con diferencias finitas circulares (para mantener seamless)
    dx = np.roll(arr, -1, axis=1) - np.roll(arr, 1, axis=1)
    dy = np.roll(arr, -1, axis=0) - np.roll(arr, 1, axis=0)

    dx = -dx * fuerza * 2.0
    dy = -dy * fuerza * 2.0
    dz = np.ones_like(dx)

    longitud = np.sqrt(dx * dx + dy * dy + dz * dz)
    nx = dx / longitud
    ny = dy / longitud
    nz = dz / longitud

    # Mapear de [-1, 1] a [0, 255]
    r = ((nx * 0.5 + 0.5) * 255.0).clip(0, 255).astype(np.uint8)
    g = ((ny * 0.5 + 0.5) * 255.0).clip(0, 255).astype(np.uint8)
    b = ((nz * 0.5 + 0.5) * 255.0).clip(0, 255).astype(np.uint8)

    rgb = np.stack([r, g, b], axis=-1)
    return Image.fromarray(rgb)

def main():
    print("=== Extrayendo texturas fotográficas PBR reales ===")
    TAMANIO = 512

    for nombre, cfg in MATERIALES.items():
        im, factor = abrir_foto(cfg)
        if im is None:
            print(f"[!] Foto no encontrada para {nombre}: {cfg['original']} / {cfg['foto']}")
            continue
        caja = tuple(int(round(v * factor)) for v in cfg['caja'])
        recorte = im.crop(caja).resize((TAMANIO, TAMANIO), Image.Resampling.LANCZOS)
        diffuse = hacer_seamless(recorte)
        diffuse.save(os.path.join(OUTPUT_DIR, f"{nombre}.jpg"), quality=88, optimize=True)
        normal = generar_mapa_normales(diffuse.filter(ImageFilter.GaussianBlur(1.2)), fuerza=cfg['normal_fuerza'])
        normal.save(os.path.join(OUTPUT_DIR, f"{nombre}_normal.jpg"), quality=85, optimize=True)
        origen = 'original' if factor == 1.0 else f'reducida x{factor:.2f}'
        print(f"✓ {nombre}: {cfg['original']} ({origen}) caja {caja} -> {nombre}.jpg + {nombre}_normal.jpg")

    print("=== Extracción completada ===")

if __name__ == '__main__':
    main()
