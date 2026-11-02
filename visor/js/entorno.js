import * as THREE from 'three';
import { MEDIDAS as M } from './medidas.js';

/**
 * Entorno del lote: galpón, portón con pilares de hormigón, tejido perimetral, muros de los vecinos,
 * suelo (césped, entrada de tierra, arena) y luces del visor.
 *
 * El lote está alineado con la casa (marco local a, b: a va de la calle hacia el fondo, b de izquierda a
 * derecha mirando desde la calle). Cada grupo se construye en ese marco y se gira al mundo con
 * `enMarcoCasa()`, igual que la casa.
 */

const ALTO_ALAMBRADO = 1.6;
const PASO_POSTES = 2.8;
const L = M.lote;

/** Grupo vacío ya posicionado en el marco local de la casa (a → x, b → z). */
export function enMarcoCasa(nombre) {
  const g = new THREE.Group();
  g.name = nombre;
  g.rotation.y = Math.atan2(-M.direccionFachada.z, M.direccionFachada.x);
  g.position.set(M.esquinaSur.x, 0, M.esquinaSur.z);
  return g;
}

export function construirGalpon(h) {
  const g = enMarcoCasa('galpon');
  const caja = new THREE.Group();
  h.bloque(caja, 'madera', -1.5, 1.5, 0, 2.5, -1.25, 1.25);
  h.bloque(caja, 'techoGalpon', -1.6, 1.6, 2.5, 2.56, -1.35, 1.35);
  h.bloque(caja, 'cenefa', -1.62, 1.62, 2.44, 2.5, -1.37, 1.37);
  caja.rotation.y = L.galpon.giro;
  caja.position.set(L.galpon.a, M.nivelSuelo, L.galpon.b);
  g.add(caja);
  return g;
}

/** Tejido romboidal con postes y alambre tensor entre dos puntos del marco local. */
function alambrado(h, grupo, desde, hasta) {
  const d = new THREE.Vector3().subVectors(hasta, desde);
  const largo = d.length();
  const angulo = Math.atan2(-d.z, d.x);
  const malla = h.bloque(grupo, 'alambre', 0, largo, 0.05, ALTO_ALAMBRADO, -0.005, 0.005);
  malla.position.copy(desde).add(d.clone().multiplyScalar(0.5)).setY(M.nivelSuelo + ALTO_ALAMBRADO / 2);
  malla.rotation.y = angulo;
  const tensor = h.bloque(grupo, 'acero', 0, largo, -0.015, 0.015, -0.015, 0.015);
  tensor.position.copy(malla.position).setY(M.nivelSuelo + ALTO_ALAMBRADO);
  tensor.rotation.y = angulo;
  const postes = Math.max(1, Math.round(largo / PASO_POSTES));
  for (let i = 0; i <= postes; i++) {
    const p = desde.clone().add(d.clone().multiplyScalar(i / postes));
    h.cilindro(grupo, 'hormigon', p.x, M.nivelSuelo, M.nivelSuelo + ALTO_ALAMBRADO + 0.15, p.z, 0.05, 6);
  }
}

export function construirPorton(h) {
  const p = enMarcoCasa('porton');
  const a = L.aFrente;
  const o = L.bPorton;   // b del extremo izquierdo del portón
  const y0 = M.nivelSuelo;
  const pilar = (b) => h.bloque(p, 'hormigon', a - 0.225, a + 0.225, y0, y0 + 2.4, b - 0.225, b + 0.225);
  // De izquierda a derecha: panel negro fijo, pilar, hoja de chapa negra abierta hacia adentro, vano, tablas, pilar con losita.
  h.bloque(p, 'chapaNegra', a + 0.25, a + 0.31, y0 + 0.05, y0 + 2.3, o, o + 1.5);
  pilar(o + 1.7);
  h.bloque(p, 'chapaNegra', a + 0.1, a + 1.2, y0 + 0.08, y0 + 2.3, o + 1.92, o + 1.98);
  h.bloque(p, 'madera', a - 0.03, a + 0.03, y0 + 0.05, y0 + 2.2, o + 3.85, o + 4.65);
  pilar(o + 4.95);
  h.bloque(p, 'hormigon', a - 0.3, a + 0.3, y0 + 2.4, y0 + 2.5, o + 4.7, o + 5.5);
  // Tejido por todo el perímetro, salvo el vano del portón.
  const v = (aa, bb) => new THREE.Vector3(aa, 0, bb);
  alambrado(h, p, v(a, o + 5.2), v(a, L.bDer));
  alambrado(h, p, v(a, o - 0.2), v(a, L.bIzq));
  alambrado(h, p, v(a, L.bIzq), v(L.aFondo, L.bIzq));
  alambrado(h, p, v(a, L.bDer), v(L.aFondo, L.bDer));
  alambrado(h, p, v(L.aFondo, L.bIzq), v(L.aFondo, L.bDer));
  return p;
}

export function construirMurosVecinos(h) {
  const m = enMarcoCasa('muros');
  const y0 = M.nivelSuelo;
  // Derecha (este), junto al portal: bloques revocados con manchas y un tramo de ladrillo; parabólica arriba.
  const bE = L.bDer + 0.35;
  h.bloque(m, 'revoqueViejo', -3.5, 0.5, y0, y0 + 2.3, bE - 0.1, bE + 0.1);
  h.bloque(m, 'ladrillo', 0.5, 4.0, y0, y0 + 2.1, bE - 0.1, bE + 0.1);
  h.cilindro(m, 'hormigon', -1.5, y0 + 2.3, y0 + 3.3, bE, 0.03, 6);
  const plato = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), h.mat('antena'));
  plato.position.set(-1.5, y0 + 3.3, bE - 0.1);
  plato.rotation.y = Math.PI;
  m.add(plato);
  h.bloque(m, 'revoqueGris', 5.0, 24.0, y0, y0 + 1.9, bE - 0.1, bE + 0.1);   // muro gris azulado más atrás
  // Fondo y lado izquierdo: ladrillo visto a medio hacer con pilares.
  const aF = L.aFondo + 0.4;
  h.bloque(m, 'ladrillo', aF - 0.1, aF + 0.1, y0, y0 + 2.0, L.bIzq - 0.4, L.bDer + 0.4);
  for (let i = 0; i <= 6; i++) h.bloque(m, 'hormigon', aF - 0.15, aF + 0.15, y0, y0 + 2.2, L.bIzq + i * 4 - 0.15, L.bIzq + i * 4 + 0.15);
  const bO = L.bIzq - 0.4;
  h.bloque(m, 'ladrillo', L.aFrente, L.aFondo + 0.5, y0, y0 + 2.0, bO - 0.1, bO + 0.1);
  for (let i = 0; i <= 7; i++) h.bloque(m, 'hormigon', L.aFrente + i * 4 - 0.15, L.aFrente + i * 4 + 0.15, y0, y0 + 2.2, bO - 0.15, bO + 0.15);
  return m;
}

export function construirSuelo(mat) {
  const s = new THREE.Group();
  s.name = 'suelo';
  const cesped = new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 1, 1), mat('cesped'));
  cesped.rotation.x = -Math.PI / 2;
  cesped.position.y = M.nivelSuelo;
  cesped.receiveShadow = true;
  const uv = cesped.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 160, uv.getY(i) * 160);
  s.add(cesped);
  const local = enMarcoCasa('suelo-lote');
  // Entrada de autos de tierra colorada, del portón hacia el portal.
  const E = L.entrada;
  const forma = new THREE.Shape(E.map(([a, b]) => new THREE.Vector2(a, b)));
  const tierra = new THREE.Mesh(new THREE.ShapeGeometry(forma), mat('tierra'));
  const uvT = tierra.geometry.attributes.uv;
  for (let i = 0; i < uvT.count; i++) uvT.setXY(i, uvT.getX(i), uvT.getY(i));   // ShapeGeometry ya da 1 UV = 1 m
  tierra.rotation.x = Math.PI / 2;
  tierra.position.y = M.nivelSuelo + 0.012;
  tierra.receiveShadow = true;
  local.add(tierra);
  // Calle de tierra delante del lote.
  const calle = new THREE.Mesh(new THREE.PlaneGeometry(60, 7), mat('tierraLisa'));
  const uvC = calle.geometry.attributes.uv;
  for (let i = 0; i < uvC.count; i++) uvC.setXY(i, uvC.getX(i) * 60, uvC.getY(i) * 7);
  calle.rotation.x = -Math.PI / 2;
  calle.rotation.z = Math.PI / 2;
  calle.position.set(L.aFrente - 4.0, M.nivelSuelo + 0.01, (L.bIzq + L.bDer) / 2);
  calle.receiveShadow = true;
  local.add(calle);
  // Montículo de arena entre el portón y el portal.
  const arena = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('arena'));
  arena.scale.set(1, 0.25, 1);
  arena.position.set(L.arena.a, M.nivelSuelo, L.arena.b);
  arena.castShadow = true;
  local.add(arena);
  s.add(local);
  return s;
}

export function construirLuces() {
  const g = new THREE.Group();
  g.name = 'luces';
  g.add(new THREE.HemisphereLight(0xd8e8ff, 0x8d8a76, 2.6));
  const sol = new THREE.DirectionalLight(0xfff2dc, 2.4);
  sol.position.set(-8, 34, 24);   // misma dirección que en la maqueta
  g.add(sol);
  return g;
}
