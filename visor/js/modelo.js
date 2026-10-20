import * as THREE from 'three';
import { crearFabricaMateriales, escalarUVsCaja } from './materiales.js';

/**
 * Modelo paramétrico de la casa y el lote. Las medidas salen de la nube de puntos (planos de pared,
 * alero, cumbrera, piso) y los materiales de las fotos (datos/ficha-casa.md). Dos usos:
 *  - crearModeloRelleno(): colores planos, asoma solo en los huecos del splat (visor).
 *  - crearMaqueta(): texturas y sombras, techo desmontable e interior amueblado (maqueta 3D).
 *
 * Marco local de la casa: origen en la esquina sur S=(10,-1.6); a corre por la fachada suroeste
 * hacia la esquina oeste; b cruza hacia el noreste; Y arriba.
 */

export const MEDIDAS = {
  esquinaSur: { x: 10.0, z: -1.6 },
  direccionFachada: { x: -0.466, z: -0.884 },   // S → W, unitario
  largo: 10.35,            // a de la pared noroeste
  paredSO: 0.45,           // b del plano de la fachada suroeste (vidriada)
  paredNE: 6.2,            // b de la fachada noreste (estimada: no está escaneada)
  caraSE: 0.5,             // a de la cara sureste del hastial
  nivelPiso: 0.3,          // piso interior y plataforma de entrada
  nivelSuelo: -0.35,       // césped escaneado (-0.3 .. -0.4)
  aleroSO: { b: -0.15, y: 2.75 },
  cumbrera: { b: 3.2, y: 3.75 },
  aleroNE: { b: 6.5, y: 2.9 },
  largoHastial: 4.0,
  hastial: { bFrente: 0.1, ySO: 3.1, bPico: 1.6, yPico: 3.9, yNE: 3.3 },
  tabiqueCruzado: 6.5,     // a del tabique entre la sala y los dormitorios (estimado)
  tabiqueLargo: 3.4,       // b del tabique del fondo (estimado)
};
const M = MEDIDAS;
const RETIRO_RELLENO = 0.1;
const ESPESOR = 0.15;
const ESPESOR_TECHO = 0.12;
const RETROCESO_PORTON = 0.3;

export function anguloCasa() {
  return Math.atan2(-M.direccionFachada.z, M.direccionFachada.x);
}

/** Convierte coordenadas locales de la casa (a, y, b) a mundo. */
export function localAMundo(a, y, b) {
  const v = new THREE.Vector3(a, y, b);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), anguloCasa());
  v.x += M.esquinaSur.x;
  v.z += M.esquinaSur.z;
  return v;
}

/** Herramientas de construcción atadas a una fábrica de materiales. */
function herramientas(mat, conTexturas) {
  const bloque = (grupo, nombre, a0, a1, y0, y1, b0, b1, extra) => {
    const geo = new THREE.BoxGeometry(a1 - a0, y1 - y0, b1 - b0);
    if (conTexturas) escalarUVsCaja(geo, a1 - a0, y1 - y0, b1 - b0);
    const m = new THREE.Mesh(geo, mat(nombre, extra));
    m.position.set((a0 + a1) / 2, (y0 + y1) / 2, (b0 + b1) / 2);
    m.castShadow = m.receiveShadow = conTexturas;
    grupo.add(m);
    return m;
  };
  const prismaA = (grupo, nombre, puntosYB, a0, a1) => {
    const forma = new THREE.Shape(puntosYB.map(([y, b]) => new THREE.Vector2(b, y)));
    const geo = new THREE.ExtrudeGeometry(forma, { depth: a1 - a0, bevelEnabled: false });
    geo.rotateY(-Math.PI / 2);   // la extrusión pasa a -X conservando el signo de b
    geo.translate(a1, 0, 0);
    const m = new THREE.Mesh(geo, mat(nombre));
    m.castShadow = m.receiveShadow = conTexturas;
    grupo.add(m);
    return m;
  };
  const abertura = (grupo, a0, a1, y0, y1, b, hacia) => {
    const marco = b + hacia * 0.04;
    bloque(grupo, 'marco', a0, a1, y0, y1, marco - 0.02, marco + 0.02);
    bloque(grupo, 'vidrio', a0 + 0.08, a1 - 0.08, y0 + 0.08, y1 - 0.08, marco + hacia * 0.02 - 0.01, marco + hacia * 0.02 + 0.01);
    const hojas = Math.max(1, Math.round((a1 - a0) / 1.2));
    for (let i = 1; i < hojas; i++) {
      const a = a0 + ((a1 - a0) * i) / hojas;
      bloque(grupo, 'marco', a - 0.03, a + 0.03, y0, y1, marco + hacia * 0.03 - 0.02, marco + hacia * 0.03 + 0.02);
    }
  };
  const farol = (grupo, a, y, b, hacia) => bloque(grupo, 'farol', a - 0.12, a + 0.12, y - 0.18, y + 0.18, b + hacia * 0.02, b + hacia * 0.26);
  return { bloque, prismaA, abertura, farol };
}

function alturaTecho(b) {
  if (b <= M.cumbrera.b) return M.aleroSO.y + ((M.cumbrera.y - M.aleroSO.y) * (b - M.aleroSO.b)) / (M.cumbrera.b - M.aleroSO.b);
  return M.cumbrera.y + ((M.aleroNE.y - M.cumbrera.y) * (b - M.cumbrera.b)) / (M.aleroNE.b - M.cumbrera.b);
}

/** Pared a lo largo de a con huecos [a0, a1, y0, y1] recortados. */
function paredConHuecos(h, casa, a0, a1, y0, y1, b0, b1, huecos) {
  let cursor = a0;
  for (const u of [...huecos].sort((p, q) => p[0] - q[0])) {
    if (u[0] > cursor) h.bloque(casa, 'pared', cursor, u[0], y0, y1, b0, b1);
    if (u[2] > y0) h.bloque(casa, 'pared', u[0], u[1], y0, u[2], b0, b1);
    if (u[3] < y1) h.bloque(casa, 'pared', u[0], u[1], u[3], y1, b0, b1);
    cursor = u[1];
  }
  if (cursor < a1) h.bloque(casa, 'pared', cursor, a1, y0, y1, b0, b1);
}

function construirPisos(h, casa, r) {
  const y = M.nivelPiso;
  h.bloque(casa, 'interior', M.caraSE, M.largo, M.nivelSuelo, y, M.hastial.bFrente, M.paredNE);
  h.bloque(casa, 'piso', -1.4, M.caraSE, M.nivelSuelo, y, -0.3, 5.5);          // plataforma de entrada
  h.bloque(casa, 'piso', -2.0, -1.4, M.nivelSuelo, y - 0.2, -0.3, 5.5);
  h.bloque(casa, 'piso', -2.6, -2.0, M.nivelSuelo, y - 0.4, -0.3, 5.5);
  h.bloque(casa, 'piso', M.caraSE, 4.5, M.nivelSuelo, y, -1.0, M.hastial.bFrente);
  h.bloque(casa, 'piso', M.caraSE, 4.5, M.nivelSuelo, y - 0.2, -1.5, -1.0);
  h.bloque(casa, 'piso', M.caraSE, 4.5, M.nivelSuelo, y - 0.4, -2.0, -1.5);
  h.bloque(casa, 'piso', 4.5, M.largo + 0.3, M.nivelSuelo, -0.28, -1.2, M.paredSO + r);   // vereda a nivel del césped
}

function construirParedes(h, casa, r) {
  const y0 = M.nivelPiso;
  const bSO = M.paredSO + r;
  paredConHuecos(h, casa, M.largoHastial, M.largo, y0, alturaTecho(bSO) + 0.1, bSO, bSO + ESPESOR,
    [[4.3, 8.0, y0, y0 + 2.3], [8.6, 10.0, y0 + 0.9, y0 + 2.2]]);
  paredConHuecos(h, casa, M.caraSE, M.largo, y0, alturaTecho(M.paredNE) + 0.1, M.paredNE - r - ESPESOR, M.paredNE - r,
    [[4.3, 8.0, y0, y0 + 2.3]]);
  h.bloque(casa, 'pared', M.largo - r - ESPESOR, M.largo - r, y0, M.cumbrera.y + 0.1, bSO, M.paredNE);
  h.abertura(casa, 8.6, 10.0, y0 + 0.9, y0 + 2.2, bSO, -1);
  h.abertura(casa, 4.3, 8.0, y0, y0 + 2.3, bSO, -1);
  h.abertura(casa, 4.3, 8.0, y0, y0 + 2.3, M.paredNE - r, 1);
  h.farol(casa, 8.3, y0 + 2.2, bSO, -1);
  h.farol(casa, 4.1, y0 + 2.2, bSO, -1);
}

function construirInterior(h, grupo, r, conMobiliario) {
  const y0 = M.nivelPiso;
  const bSO = M.paredSO + r;
  h.bloque(grupo, 'interior', M.tabiqueCruzado, M.tabiqueCruzado + ESPESOR, y0, M.cumbrera.y, bSO, M.paredNE - r);
  h.bloque(grupo, 'interior', M.tabiqueCruzado + ESPESOR, M.largo - r, y0, M.cumbrera.y, M.tabiqueLargo, M.tabiqueLargo + ESPESOR);
  if (!conMobiliario) return;
  h.bloque(grupo, 'piedra', 4.1, 6.3, y0, y0 + 0.9, 1.6, 2.5);        // isla de la cocina revestida en piedra
  h.bloque(grupo, 'pared', 2.6, 3.3, y0, y0 + 1.8, 5.3, M.paredNE - r - ESPESOR);   // heladera
  h.bloque(grupo, 'madera', 7.0, 9.0, y0, y0 + 0.5, 0.9, 2.5);        // cama
  h.bloque(grupo, 'pared', 8.6, 9.6, y0, y0 + 0.85, 4.6, 5.2);        // vanitory del baño
}

function construirTecho(h, techo, r) {
  const seccion = [
    [M.aleroSO.y - r, M.aleroSO.b], [M.cumbrera.y - r, M.cumbrera.b], [M.aleroNE.y - r, M.aleroNE.b],
    [M.aleroNE.y - r + ESPESOR_TECHO, M.aleroNE.b], [M.cumbrera.y - r + ESPESOR_TECHO, M.cumbrera.b],
    [M.aleroSO.y - r + ESPESOR_TECHO, M.aleroSO.b],
  ];
  h.prismaA(techo, 'techo', seccion, M.largoHastial - 0.2, M.largo + 0.3);
  const pendiente = (M.cumbrera.y - M.aleroSO.y) / (M.cumbrera.b - M.aleroSO.b);
  const cielorraso = new THREE.Mesh(new THREE.PlaneGeometry(M.largo - M.largoHastial + 0.4, M.paredSO - M.aleroSO.b + 0.1), h.mat('cielorraso'));
  cielorraso.rotation.x = Math.PI / 2 - Math.atan(pendiente);
  cielorraso.position.set((M.largoHastial + M.largo) / 2, M.aleroSO.y - r - 0.02 + (pendiente * (M.paredSO - M.aleroSO.b)) / 2, (M.aleroSO.b + M.paredSO) / 2);
  techo.add(cielorraso);
  const largoViga = M.paredSO - M.aleroSO.b + 0.3;
  for (let i = 0; i < 6; i++) {
    const a = M.largoHastial + 0.3 + (i * (M.largo - M.largoHastial - 0.6)) / 5;
    const viga = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, largoViga), h.mat('viga'));
    viga.position.set(a, M.aleroSO.y - r - 0.1 + (pendiente * largoViga) / 2, M.aleroSO.b + largoViga / 2);
    viga.rotation.x = -Math.atan(pendiente);
    viga.castShadow = true;
    techo.add(viga);
  }
  h.bloque(techo, 'pared', 6.2, 6.9, M.cumbrera.y - 0.5, M.cumbrera.y + 0.7, 2.0, 2.7);   // chimenea
}

function construirHastial(h, casa, techo, r) {
  const y0 = M.nivelPiso;
  const H = M.hastial;
  const bF = H.bFrente + r;
  const aSE = M.caraSE + r;
  const cubierta = [[H.ySO - r, bF], [H.yPico - r, H.bPico], [H.yNE - r, M.paredNE - r],
    [H.yNE - r + ESPESOR_TECHO, M.paredNE - r], [H.yPico - r + ESPESOR_TECHO, H.bPico], [H.ySO - r + ESPESOR_TECHO, bF]];
  h.prismaA(techo, 'techo', cubierta, aSE, M.largoHastial);
  h.bloque(casa, 'pared', aSE, M.largoHastial, y0, H.yNE - r, M.paredNE - r - ESPESOR, M.paredNE - r);
  const fronton = [[y0, bF], [H.ySO - r, bF], [H.yPico - r, H.bPico], [H.yNE - r, M.paredNE - r], [y0, M.paredNE - r]];
  h.prismaA(casa, 'pared', fronton, aSE, aSE + ESPESOR);
  h.bloque(casa, 'pared', M.largoHastial - ESPESOR, M.largoHastial, H.ySO - r - 0.3, H.yPico - r, bF, M.paredNE - r);
  h.bloque(casa, 'piedra', aSE - 0.05, aSE + 0.02, y0, H.yNE - r - 0.1, 3.2, M.paredNE - r);
  h.bloque(casa, 'marco', aSE - 0.04, aSE + 0.02, y0, H.ySO + 0.3, 2.3, 3.2);
  h.bloque(casa, 'marco', aSE - 0.04, aSE + 0.01, y0, H.ySO - 0.2, bF + 0.15, 2.3);
  h.bloque(casa, 'vidrio', aSE - 0.03, aSE, y0 + 0.08, H.ySO - 0.3, bF + 0.25, 2.2);
  h.abertura(casa, aSE + 0.2, M.largoHastial - 0.2, y0, H.ySO - r - 0.3, bF, -1);
  h.farol(casa, aSE - 0.1, y0 + 2.1, 2.0, -1);
  h.farol(casa, aSE - 0.1, y0 + 2.1, 3.8, -1);
}

/** Casa completa en su marco local; devuelve { casa, techo, interior } ya posicionados en el mundo. */
function construirCasa(mat, { retiro, conTexturas, conMobiliario }) {
  const h = { ...herramientas(mat, conTexturas), mat };
  const casa = new THREE.Group();
  casa.name = 'casa';
  const techo = new THREE.Group();
  techo.name = 'techo';
  const interior = new THREE.Group();
  interior.name = 'interior';
  construirPisos(h, casa, retiro);
  construirParedes(h, casa, retiro);
  construirInterior(h, interior, retiro, conMobiliario);
  construirTecho(h, techo, retiro);
  construirHastial(h, casa, techo, retiro);
  casa.add(techo, interior);
  casa.rotation.y = anguloCasa();
  casa.position.set(M.esquinaSur.x, 0, M.esquinaSur.z);
  return { casa, techo, interior };
}

function construirGalpon(h) {
  const g = new THREE.Group();
  g.name = 'galpon';
  h.bloque(g, 'madera', -1.9, 1.9, 0, 2.3, -1.1, 1.1);
  h.bloque(g, 'techo', -2.05, 2.05, 2.3, 2.42, -1.25, 1.25);
  g.rotation.y = -0.55;
  g.scale.setScalar(0.9);
  g.position.set(3.2, -0.1, 1.6);
  return g;
}

function construirPorton(h) {
  const p = new THREE.Group();
  p.name = 'porton';
  const z = 9.5;
  const pilar = (x, zz, ancho, alto) => h.bloque(p, 'hormigon', x - ancho / 2, x + ancho / 2, 0, alto, zz - ancho / 2, zz + ancho / 2);
  for (const x of [-1.8, 0.6, 3.3, 5.4]) pilar(x, z, 0.36, 2.3);
  h.bloque(p, 'chapaNegra', -1.6, 0.4, 0.1, 2.1, z - 0.03, z + 0.03);   // panel de chapa negra (oeste)
  h.bloque(p, 'madera', 3.5, 5.2, 0.1, 2.1, z - 0.04, z + 0.04);        // portón de madera (este)
  h.bloque(p, 'techo', 3.3, 5.5, 2.1, 2.2, z - 0.25, z + 0.25);
  for (let i = 1; i <= 5; i++) pilar(5.4 + i * 2.0, z - i * 1.5, 0.14, 1.8);   // alambrado hacia el este
  for (let i = 1; i <= 3; i++) pilar(-1.8 - i * 2.2, z, 0.14, 1.8);          // alambrado hacia el oeste
  p.position.set(0, -0.1, RETROCESO_PORTON);
  return p;
}

function construirMurosVecinos(h) {
  const m = new THREE.Group();
  m.name = 'muros';
  const angulo = anguloCasa();
  const este = h.bloque(m, 'ladrillo', -3, 3, 0, 2.2, -0.1, 0.1);
  este.position.set(18.5, 1.1, -0.5);
  este.rotation.y = angulo;
  const norte = h.bloque(m, 'ladrillo', -5.5, 5.5, 0, 2.2, -0.1, 0.1);
  norte.position.set(4.6, 1.1, -16.6);
  norte.rotation.y = angulo + Math.PI / 2;
  m.position.y = -0.1;
  return m;
}

function construirSuelo(mat) {
  const s = new THREE.Group();
  s.name = 'suelo';
  const cesped = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 1, 1), mat('cesped'));
  cesped.rotation.x = -Math.PI / 2;
  cesped.position.y = M.nivelSuelo;
  cesped.receiveShadow = true;
  const uv = cesped.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 120, uv.getY(i) * 120);
  s.add(cesped);
  const tierra = new THREE.Mesh(new THREE.PlaneGeometry(11, 8), mat('tierra'));
  const uvT = tierra.geometry.attributes.uv;
  for (let i = 0; i < uvT.count; i++) uvT.setXY(i, uvT.getX(i) * 11, uvT.getY(i) * 8);
  tierra.rotation.x = -Math.PI / 2;
  tierra.rotation.z = 0.3;
  tierra.position.set(9.5, M.nivelSuelo + 0.01, 4.5);
  tierra.receiveShadow = true;
  s.add(tierra);
  return s;
}

function construirLuces() {
  const g = new THREE.Group();
  g.name = 'luces';
  g.add(new THREE.HemisphereLight(0xd8e8ff, 0x8d8a76, 2.6));   // unidades físicas (r155+): ~π veces
  const sol = new THREE.DirectionalLight(0xfff2dc, 2.4);
  sol.position.set(15, 30, 20);   // sol alto desde el sureste, como en las fotos
  g.add(sol);
  return g;
}

/**
 * Modelo de relleno para el visor: 'entorno' siempre visible y 'casa' conmutable.
 */
export function crearModeloRelleno() {
  const mat = crearFabricaMateriales('relleno');
  const h = herramientas(mat, true);
  const modelo = new THREE.Group();
  modelo.name = 'modelo-relleno';
  const entorno = new THREE.Group();
  entorno.name = 'entorno';
  entorno.add(construirSuelo(mat), construirGalpon(h), construirPorton(h), construirMurosVecinos(h), construirLuces());
  const { casa } = construirCasa(mat, { retiro: RETIRO_RELLENO, conTexturas: true, conMobiliario: false });
  modelo.add(entorno, casa);
  return modelo;
}

/**
 * Maqueta texturada para la página maqueta.html. Devuelve el grupo y accesos a las capas.
 */
export function crearMaqueta() {
  const mat = crearFabricaMateriales('maqueta');
  const h = herramientas(mat, true);
  const grupo = new THREE.Group();
  grupo.name = 'maqueta';
  const { casa, techo, interior } = construirCasa(mat, { retiro: 0, conTexturas: true, conMobiliario: true });
  const galpon = construirGalpon(h);
  const porton = construirPorton(h);
  const muros = construirMurosVecinos(h);
  const suelo = construirSuelo(mat);
  grupo.add(suelo, casa, galpon, porton, muros);
  return { grupo, casa, techo, interior, galpon, porton, muros, suelo, mat, herramientas: h };
}
