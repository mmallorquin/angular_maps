#!/usr/bin/env python3
"""
Extrae texturas fotográficas PBR reales a partir de las fotos del lote (visor/fotos/)
y genera mapas difusos (color) y de normales (relieve) con bordes continuos (seamless tiling).
"""

import os
import numpy as np
from PIL import Image, ImageFilter

FOTOS_DIR = os.path.join(os.path.dirname(__file__), '../visor/fotos')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../visor/texturas')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Coordenadas [x0, y0, x1, y1] ajustadas para cada material
MATERIALES = {
    'piedra': {
        'foto': 'foto-2.jpg',
        'caja': (780, 680, 1060, 960),
        'escala_m': 1.0,
        'normal_fuerza': 2.5
    },
    'piso': {
        'foto': 'foto-1.jpg',
        'caja': (320, 920, 650, 1100),
        'escala_m': 1.2,
        'normal_fuerza': 1.2
    },
    'pared': {
        'foto': 'foto-6.jpg',
        'caja': (1050, 380, 1280, 600),
        'escala_m': 1.5,
        'normal_fuerza': 1.0
    },
    'madera': {
        'foto': 'foto-10.jpg',
        'caja': (1300, 650, 1600, 950),
        'escala_m': 1.0,
        'normal_fuerza': 2.0
    },
    'techo': {
        'foto': 'foto-3.jpg',
        'caja': (520, 440, 720, 560),
        'escala_m': 1.0,
        'normal_fuerza': 2.8
    },
    'ladrillo': {
        'foto': 'foto-8.jpg',
        'caja': (1220, 520, 1420, 680),
        'escala_m': 0.8,
        'normal_fuerza': 2.2
    },
    'hormigon': {
        'foto': 'foto-4.jpg',
        'caja': (760, 460, 940, 640),
        'escala_m': 1.0,
        'normal_fuerza': 1.5
    },
    'cesped': {
        'foto': 'foto-2.jpg',
        'caja': (180, 950, 500, 1180),
        'escala_m': 2.0,
        'normal_fuerza': 1.2
    },
    'tierra': {
        'foto': 'foto-2.jpg',
        'caja': (300, 1260, 650, 1450),
        'escala_m': 2.0,
        'normal_fuerza': 1.4
    }
}

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
        ruta_foto = os.path.join(FOTOS_DIR, cfg['foto'])
        if not os.path.exists(ruta_foto):
            print(f"[!] Foto no encontrada: {ruta_foto}")
            continue

        im = Image.open(ruta_foto)
        caja = cfg['caja']
        recorte = im.crop(caja)

        # Redimensionar a tamaño cuadrado estándar de potencia de dos
        recorte = recorte.resize((TAMANIO, TAMANIO), Image.Resampling.LANCZOS)

        # Hacer seamless
        diffuse = hacer_seamless(recorte)

        # Guardar textura difusa
        ruta_diffuse = os.path.join(OUTPUT_DIR, f"{nombre}.jpg")
        diffuse.save(ruta_diffuse, quality=90, optimize=True)

        # Generar y guardar mapa de normales
        normal = generar_mapa_normales(diffuse, fuerza=cfg['normal_fuerza'])
        ruta_normal = os.path.join(OUTPUT_DIR, f"{nombre}_normal.jpg")
        normal.save(ruta_normal, quality=90, optimize=True)

        print(f"✓ {nombre}: extraído de {cfg['foto']} -> {nombre}.jpg + {nombre}_normal.jpg (512x512)")

    print("=== Extracción completada exitosamente ===")

if __name__ == '__main__':
    main()
