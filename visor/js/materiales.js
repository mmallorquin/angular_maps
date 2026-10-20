import * as THREE from 'three';

/**
 * Materiales de la casa y el lote. Colores tomados de datos/ficha-casa.json (relevamiento de las fotos).
 * Dos modos:
 *  - 'relleno': colores planos (Lambert) con desplazamiento de profundidad, para asomar entre los splats del visor.
 *  - 'maqueta': texturas procedurales dibujadas en canvas (1 unidad UV = 1 m), con sombras, para la maqueta 3D.
 */

export const COLORES = {
  pared: 0xeeeeea, cielorraso: 0xece9e1, techo: 0x3a3e43, piedra: 0xcdbba0, piso: 0xe9dcc0,
  interior: 0xe6e3dc, marco: 0x17181a, vidrio: 0x7d99ad, viga: 0x2a2a2a, madera: 0x8a8278,
  hormigon: 0x9b9a92, chapaNegra: 0x1e1e1e, ladrillo: 0xa4573f, cesped: 0x5c9a3a, tierra: 0x9e4a2e,
  farol: 0x111111, agua: 0x3fa4c9, mortero: 0x8d8678,
};

const DESPLAZAMIENTO_PROFUNDIDAD = { factor: 1.5, unidades: 30000 };
const TAMANIO_LIENZO = 256;

function hex(c) {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function mezclar(base, delta) {
  const col = new THREE.Color(base);
  col.offsetHSL(0, 0, delta);
  return `#${col.getHexString()}`;
}

/** Textura repetible dibujada en un canvas; `metros` es el tamaño del mosaico en el mundo. */
function textura(metros, dibujar) {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = TAMANIO_LIENZO;
  const ctx = lienzo.getContext('2d');
  dibujar(ctx, TAMANIO_LIENZO);
  const tex = new THREE.CanvasTexture(lienzo);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / metros, 1 / metros);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function ruido(ctx, n, base, amplitud, cantidad = 1500, radio = 3) {
  ctx.fillStyle = hex(base);
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < cantidad; i++) {
    ctx.fillStyle = mezclar(base, (Math.random() - 0.5) * amplitud);
    ctx.beginPath();
    ctx.arc(Math.random() * n, Math.random() * n, radio * (0.5 + Math.random()), 0, Math.PI * 2);
    ctx.fill();
  }
}

const DIBUJOS = {
  pared: (ctx, n) => ruido(ctx, n, COLORES.pared, 0.05, 2500, 1.5),
  interior: (ctx, n) => ruido(ctx, n, COLORES.interior, 0.03, 1200, 2),
  hormigon: (ctx, n) => ruido(ctx, n, COLORES.hormigon, 0.08, 2000, 2),
  cesped: (ctx, n) => ruido(ctx, n, COLORES.cesped, 0.16, 4000, 2),
  tierra: (ctx, n) => ruido(ctx, n, COLORES.tierra, 0.12, 3000, 2.5),
  techo: (ctx, n) => {                       // chapa acanalada: ondas de 0,1 m en 1 m
    const ondas = 10;
    for (let i = 0; i < ondas; i++) {
      const g = ctx.createLinearGradient((i * n) / ondas, 0, ((i + 1) * n) / ondas, 0);
      g.addColorStop(0, mezclar(COLORES.techo, -0.06));
      g.addColorStop(0.5, mezclar(COLORES.techo, 0.08));
      g.addColorStop(1, mezclar(COLORES.techo, -0.06));
      ctx.fillStyle = g;
      ctx.fillRect((i * n) / ondas, 0, n / ondas + 1, n);
    }
  },
  chapaNegra: (ctx, n) => {
    const ondas = 12;
    for (let i = 0; i < ondas; i++) {
      ctx.fillStyle = i % 2 ? '#2a2a2a' : '#141414';
      ctx.fillRect((i * n) / ondas, 0, n / ondas + 1, n);
    }
  },
  piedra: (ctx, n) => {                      // laja irregular crema con junta oscura, mosaico de 1 m
    ctx.fillStyle = hex(COLORES.mortero);
    ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 26; i++) {
      const cx = Math.random() * n; const cy = Math.random() * n;
      const r = n * (0.07 + Math.random() * 0.08);
      ctx.fillStyle = mezclar(COLORES.piedra, (Math.random() - 0.5) * 0.14);
      ctx.beginPath();
      for (let k = 0; k < 7; k++) {
        const ang = (k / 7) * Math.PI * 2;
        const rr = r * (0.7 + Math.random() * 0.5);
        ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.75);
      }
      ctx.closePath();
      ctx.fill();
    }
  },
  piso: (ctx, n) => {                        // porcelanato de 0,6 m: mosaico de 1,2 m con 2x2 piezas
    ctx.fillStyle = '#cfc2a6';
    ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      ctx.fillStyle = mezclar(COLORES.piso, (Math.random() - 0.5) * 0.04);
      ctx.fillRect(i * n / 2 + 2, j * n / 2 + 2, n / 2 - 4, n / 2 - 4);
    }
  },
  madera: (ctx, n) => {                      // tablas verticales de 0,12 m, mosaico de 1 m
    const tablas = 8;
    for (let i = 0; i < tablas; i++) {
      ctx.fillStyle = mezclar(COLORES.madera, (Math.random() - 0.5) * 0.14);
      ctx.fillRect((i * n) / tablas, 0, n / tablas - 1, n);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(((i + 1) * n) / tablas - 2, 0, 2, n);
    }
  },
  ladrillo: (ctx, n) => {                    // ladrillos de 0,25 x 0,07 m, mosaico de 0,5 m
    ctx.fillStyle = '#b9ad98';
    ctx.fillRect(0, 0, n, n);
    const filas = 7; const altoFila = n / filas; const ancho = n / 2;
    for (let f = 0; f < filas; f++) {
      const corrimiento = f % 2 ? ancho / 2 : 0;
      for (let c = -1; c < 3; c++) {
        ctx.fillStyle = mezclar(COLORES.ladrillo, (Math.random() - 0.5) * 0.12);
        ctx.fillRect(c * ancho + corrimiento + 2, f * altoFila + 2, ancho - 4, altoFila - 4);
      }
    }
  },
};

const METROS_POR_MOSAICO = { piso: 1.2, ladrillo: 0.5, cesped: 2, tierra: 2 };

/**
 * Devuelve una función `material(nombre, extra)` con caché, según el modo.
 * `metrosPorMosaico(nombre)` sirve para escalar UVs (1 unidad = 1 m).
 */
export function crearFabricaMateriales(modo = 'maqueta') {
  const cache = new Map();
  const texturas = new Map();
  const obtenerTextura = (nombre) => {
    if (!texturas.has(nombre) && DIBUJOS[nombre]) {
      texturas.set(nombre, textura(METROS_POR_MOSAICO[nombre] ?? 1, DIBUJOS[nombre]));
    }
    return texturas.get(nombre) ?? null;
  };

  return function material(nombre, extra = {}) {
    const clave = nombre + JSON.stringify(extra);
    if (cache.has(clave)) return cache.get(clave);
    let m;
    if (modo === 'relleno') {
      m = new THREE.MeshLambertMaterial({
        color: COLORES[nombre], side: THREE.DoubleSide, polygonOffset: true,
        polygonOffsetFactor: DESPLAZAMIENTO_PROFUNDIDAD.factor, polygonOffsetUnits: DESPLAZAMIENTO_PROFUNDIDAD.unidades,
        ...extra,
      });
    } else if (nombre === 'vidrio' || nombre === 'agua') {
      m = new THREE.MeshPhysicalMaterial({
        color: COLORES[nombre], transparent: true, opacity: nombre === 'agua' ? 0.8 : 0.45,
        roughness: 0.1, metalness: 0.1, side: THREE.DoubleSide, ...extra,
      });
    } else {
      const map = obtenerTextura(nombre);
      m = new THREE.MeshStandardMaterial({
        color: map ? 0xffffff : COLORES[nombre], map, roughness: nombre === 'techo' ? 0.55 : 0.9,
        metalness: nombre === 'techo' ? 0.35 : 0, side: THREE.DoubleSide, ...extra,
      });
    }
    cache.set(clave, m);
    return m;
  };
}

/** Escala las UVs de una BoxGeometry para que 1 unidad UV = 1 m en cada cara. */
export function escalarUVsCaja(geo, ancho, alto, largo) {
  const uv = geo.attributes.uv;
  const normal = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(normal.getX(i)); const ny = Math.abs(normal.getY(i));
    const [su, sv] = nx > 0.5 ? [largo, alto] : ny > 0.5 ? [ancho, largo] : [ancho, alto];
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  uv.needsUpdate = true;
  return geo;
}
