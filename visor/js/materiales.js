import * as THREE from 'three';

/**
 * Materiales de la casa y el lote. Colores tomados de datos/ficha-casa.json (relevamiento de las fotos).
 * Los materiales con foto usan los recortes de visor/texturas/ (herramientas/extraer_texturas.py);
 * el resto se dibuja en un canvas (1 mosaico = METROS_POR_MOSAICO metros).
 * Dos modos:
 *  - 'relleno': sin sombras y con desplazamiento de profundidad, para asomar entre los splats del visor.
 *  - 'maqueta': PBR con sombras, para la maqueta 3D y el comparador.
 */

export const COLORES = {
  pared: 0xeeeeea, cielorraso: 0xd8dadb, techo: 0x50555b, piedra: 0xcdbba0, piso: 0xe9dcc0,
  interior: 0xe6e3dc, marco: 0x17181a, vidrio: 0x7d93a6, viga: 0x1a1a1a, madera: 0x837d72,
  hormigon: 0x9b9a92, chapaNegra: 0x1c1e21, ladrillo: 0xa4573f, cesped: 0x5c9a3a, tierra: 0x9e4a2e,
  farol: 0x111111, agua: 0x3fa4c9, mortero: 0x8d8678, cenefa: 0x15171a, zocalo: 0xcfc8b8,
  vidrioEsmerilado: 0xbfc8cc, farolVidrio: 0xfff1c8, granito: 0x48494c, heladera: 0xf2f2f0,
  acero: 0xb9bcc0, cobertor: 0xd8b648, cortina: 0x98a9b3, revoqueViejo: 0x9a958a, revoqueGris: 0x727c88,
  antena: 0xf4f4f4, arena: 0xd8c7a3, techoGalpon: 0x6b7076, alambre: 0xaeb3b6, tierraLisa: 0xa8674d,
};

const DESPLAZAMIENTO_PROFUNDIDAD = { factor: 1.5, unidades: 30000 };
const TAMANIO_LIENZO = 512;
const TINTE_TEXTURA = { techo: 0xb4b8bc };   // la chapa sale clara por el reflejo del cielo

function hex(c) {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function mezclar(base, delta) {
  const col = new THREE.Color(base);
  col.offsetHSL(0, 0, delta);
  return `#${col.getHexString()}`;
}

/** Textura repetible dibujada en un canvas; `metros` es el tamaño del mosaico en el mundo. */
function textura(metros, dibujar, transparente = false) {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = TAMANIO_LIENZO;
  const ctx = lienzo.getContext('2d');
  if (!transparente) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, TAMANIO_LIENZO, TAMANIO_LIENZO);
  }
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
  cesped: (ctx, n) => {                      // césped parejo: solo grano fino (de lejos se funde en un verde uniforme), mosaico de 3 m
    ruido(ctx, n, COLORES.cesped, 0.08, 9000, 1.0);
    for (let i = 0; i < 1800; i++) {
      ctx.strokeStyle = mezclar(COLORES.cesped, (Math.random() - 0.5) * 0.14);
      ctx.lineWidth = 1;
      const x = Math.random() * n; const y = Math.random() * n;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 5, y - 3 - Math.random() * 5);
      ctx.stroke();
    }
  },
  tierraLisa: (ctx, n) => ruido(ctx, n, COLORES.tierraLisa, 0.1, 6000, 1.5),   // calle y entrada vistas de lejos
  pared: (ctx, n) => ruido(ctx, n, COLORES.pared, 0.04, 2500, 1.5),
  interior: (ctx, n) => ruido(ctx, n, COLORES.interior, 0.03, 1200, 2),
  revoqueViejo: (ctx, n) => ruido(ctx, n, COLORES.revoqueViejo, 0.18, 2500, 4),
  revoqueGris: (ctx, n) => ruido(ctx, n, COLORES.revoqueGris, 0.08, 1500, 3),
  arena: (ctx, n) => ruido(ctx, n, COLORES.arena, 0.06, 1500, 2),
  techo: (ctx, n) => {                       // chapa trapezoidal gris grafito: nervios cada 0,2 m en 1 m
    const ondas = 5;
    for (let i = 0; i < ondas; i++) {
      const g = ctx.createLinearGradient((i * n) / ondas, 0, ((i + 1) * n) / ondas, 0);
      g.addColorStop(0, mezclar(COLORES.techo, -0.04));
      g.addColorStop(0.35, mezclar(COLORES.techo, 0.1));
      g.addColorStop(0.5, mezclar(COLORES.techo, 0.16));
      g.addColorStop(0.65, mezclar(COLORES.techo, 0.1));
      g.addColorStop(1, mezclar(COLORES.techo, -0.04));
      ctx.fillStyle = g;
      ctx.fillRect((i * n) / ondas, 0, n / ondas + 1, n);
    }
  },
  chapaNegra: (ctx, n) => {                  // panel acanalado negro mate: nervios cada 0,1 m en 1 m
    const nervios = 10;
    for (let i = 0; i < nervios; i++) {
      const g = ctx.createLinearGradient((i * n) / nervios, 0, ((i + 1) * n) / nervios, 0);
      g.addColorStop(0, mezclar(COLORES.chapaNegra, -0.03));
      g.addColorStop(0.3, mezclar(COLORES.chapaNegra, 0.07));
      g.addColorStop(0.55, mezclar(COLORES.chapaNegra, -0.02));
      g.addColorStop(1, mezclar(COLORES.chapaNegra, -0.04));
      ctx.fillStyle = g;
      ctx.fillRect((i * n) / nervios, 0, n / nervios + 1, n);
    }
  },
  techoGalpon: (ctx, n) => {
    const ondas = 10;
    for (let i = 0; i < ondas; i++) {
      const g = ctx.createLinearGradient((i * n) / ondas, 0, ((i + 1) * n) / ondas, 0);
      g.addColorStop(0, mezclar(COLORES.techoGalpon, -0.08));
      g.addColorStop(0.5, mezclar(COLORES.techoGalpon, 0.1));
      g.addColorStop(1, mezclar(COLORES.techoGalpon, -0.08));
      ctx.fillStyle = g;
      ctx.fillRect((i * n) / ondas, 0, n / ondas + 1, n);
    }
  },
  piso: (ctx, n) => {                        // porcelanato crema de 0,6 m con manchas de tierra: mosaico de 1,2 m (2x2)
    ctx.fillStyle = '#d6cbb0';
    ctx.fillRect(0, 0, n, n);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      ctx.fillStyle = mezclar(COLORES.piso, (Math.random() - 0.5) * 0.05);
      ctx.fillRect(i * n / 2 + 2, j * n / 2 + 2, n / 2 - 4, n / 2 - 4);
    }
    for (let k = 0; k < 14; k++) {
      ctx.fillStyle = `rgba(216,168,112,${0.08 + Math.random() * 0.14})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * n, Math.random() * n, 6 + Math.random() * 18, 4 + Math.random() * 10, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  alambre: (ctx, n) => {                     // tejido romboidal: rombos de 6 cm en un mosaico de 0,5 m
    ctx.clearRect(0, 0, n, n);
    ctx.strokeStyle = 'rgba(200,205,208,0.9)';
    ctx.lineWidth = 1.5;
    const paso = n / 8;
    for (let i = -8; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo(i * paso, 0);
      ctx.lineTo(i * paso + n, n);
      ctx.moveTo(i * paso, 0);
      ctx.lineTo(i * paso - n, n);
      ctx.stroke();
    }
  },
};

const METROS_POR_MOSAICO = {
  piso: 1.2, ladrillo: 2.0, cesped: 3.0, tierraLisa: 3.0, tierra: 1.5, piedra: 1.1, pared: 0.8, madera: 1.3, techo: 1.0,
  hormigon: 0.45, chapaNegra: 1.0, interior: 1.5, revoqueViejo: 1.5, revoqueGris: 1.5, arena: 1.0,
  techoGalpon: 1.0, alambre: 0.5,
};

const TEXTURAS_FOTO = new Set(['piedra', 'madera', 'ladrillo', 'hormigon', 'tierra']);
const CON_NORMALES = new Set(['piedra', 'madera', 'ladrillo']);
const RUGOSIDAD = { techo: 0.55, piso: 0.35, vidrio: 0.04, granito: 0.3, acero: 0.3, heladera: 0.4, farol: 0.6, marco: 0.5, cenefa: 0.5, interior: 0.6 };
const METALICIDAD = { techo: 0.1, acero: 0.8, vidrio: 0.85, farol: 0.3, marco: 0.3 };
const INTENSIDAD_ENTORNO = { vidrio: 1.8, techo: 1.2, farol: 1.2, acero: 1.5 };
const TRANSPARENTES = { vidrio: 0.62, vidrioEsmerilado: 0.7, agua: 0.8, alambre: 1.0, farolVidrio: 0.6 };

const cargadorTexturas = new THREE.TextureLoader();

function cargarTexturaFotografica(nombre) {
  if (!TEXTURAS_FOTO.has(nombre)) return null;
  const escala = METROS_POR_MOSAICO[nombre] ?? 1.0;
  const preparar = (tex, esColor) => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1 / escala, 1 / escala);
    if (esColor) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  };
  const map = preparar(cargadorTexturas.load(`texturas/${nombre}.jpg`), true);
  const normalMap = CON_NORMALES.has(nombre) ? preparar(cargadorTexturas.load(`texturas/${nombre}_normal.jpg`), false) : null;
  return { map, normalMap };
}

/**
 * Devuelve una función `material(nombre, extra)` con caché, según el modo.
 */
export function crearFabricaMateriales(modo = 'maqueta') {
  const cache = new Map();
  const texturasProcedurales = new Map();
  const texturasFotograficas = new Map();

  const obtenerProcedural = (nombre) => {
    if (!texturasProcedurales.has(nombre) && DIBUJOS[nombre]) {
      texturasProcedurales.set(nombre, textura(METROS_POR_MOSAICO[nombre] ?? 1, DIBUJOS[nombre], nombre === 'alambre'));
    }
    return texturasProcedurales.get(nombre) ?? null;
  };

  const obtenerFotografica = (nombre) => {
    if (!texturasFotograficas.has(nombre)) texturasFotograficas.set(nombre, cargarTexturaFotografica(nombre));
    return texturasFotograficas.get(nombre);
  };

  return function material(nombre, extra = {}) {
    if (!(nombre in COLORES)) throw new Error(`Material desconocido: ${nombre}`);
    const clave = nombre + JSON.stringify(extra);
    if (cache.has(clave)) return cache.get(clave);

    const foto = obtenerFotografica(nombre);
    const map = foto?.map ?? obtenerProcedural(nombre);
    const color = map ? (TINTE_TEXTURA[nombre] ?? 0xffffff) : COLORES[nombre];
    const opacidad = TRANSPARENTES[nombre];
    const comunes = {
      color, map: map ?? null, side: THREE.DoubleSide,
      transparent: opacidad !== undefined, opacity: opacidad ?? 1,
      alphaTest: nombre === 'alambre' ? 0.3 : 0,
      ...extra,
    };
    let m;
    if (modo === 'relleno') {
      m = new THREE.MeshLambertMaterial({
        ...comunes,
        polygonOffset: true,
        polygonOffsetFactor: DESPLAZAMIENTO_PROFUNDIDAD.factor,
        polygonOffsetUnits: DESPLAZAMIENTO_PROFUNDIDAD.unidades,
      });
    } else {
      m = new THREE.MeshStandardMaterial({
        ...comunes,
        normalMap: foto?.normalMap ?? null,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: RUGOSIDAD[nombre] ?? 0.85,
        metalness: METALICIDAD[nombre] ?? 0,
        envMapIntensity: INTENSIDAD_ENTORNO[nombre] ?? 1,
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
