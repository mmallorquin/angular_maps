import * as THREE from 'three';
import { MEDIDAS as M } from './medidas.js';

/**
 * Entorno del lote en coordenadas de mundo: galpón de tablas, portón con pilares de hormigón,
 * alambrado, muros de los vecinos, suelo (césped y tierra colorada) y luces del visor.
 */

const Z_PORTON = 9.5;
const RETROCESO_PORTON = 0.3;
const ALTO_ALAMBRADO = 1.6;
const PASO_POSTES = 2.8;

export function construirGalpon(h) {
  const g = new THREE.Group();
  g.name = 'galpon';
  h.bloque(g, 'madera', -1.5, 1.5, 0, 2.5, -1.25, 1.25);
  h.bloque(g, 'techoGalpon', -1.6, 1.6, 2.5, 2.56, -1.35, 1.35);
  h.bloque(g, 'cenefa', -1.62, 1.62, 2.44, 2.5, -1.37, 1.37);
  g.rotation.y = -0.55;
  g.position.set(3.2, M.nivelSuelo, 1.6);
  return g;
}

function alambrado(h, grupo, desde, hasta) {
  const d = new THREE.Vector3().subVectors(hasta, desde);
  const largo = d.length();
  const angulo = Math.atan2(-d.z, d.x);
  const malla = h.bloque(grupo, 'alambre', 0, largo, 0.05, ALTO_ALAMBRADO, -0.005, 0.005);
  malla.position.copy(desde).add(d.clone().multiplyScalar(0.5)).setY(M.nivelSuelo + ALTO_ALAMBRADO / 2);
  malla.rotation.y = angulo;
  // Alambre tensor superior: hace visible el cerco también de lejos, donde el tejido se vuelve transparente.
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
  const p = new THREE.Group();
  p.name = 'porton';
  const z = Z_PORTON;
  const pilar = (x, ancho, alto) => h.bloque(p, 'hormigon', x - ancho / 2, x + ancho / 2, M.nivelSuelo, M.nivelSuelo + alto, z - ancho / 2, z + ancho / 2);
  // De oeste a este: panel negro fijo, pilar, hoja de chapa negra (abierta contra el pilar), vano, tablas de madera, pilar con losita.
  h.bloque(p, 'chapaNegra', -1.2, 0.3, M.nivelSuelo + 0.05, M.nivelSuelo + 2.3, z + 0.25, z + 0.31);
  pilar(0.5, 0.45, 2.4);
  h.bloque(p, 'chapaNegra', 0.72, 0.78, M.nivelSuelo + 0.08, M.nivelSuelo + 2.3, z - 1.2, z - 0.1);
  h.bloque(p, 'madera', 2.65, 3.45, M.nivelSuelo + 0.05, M.nivelSuelo + 2.2, z - 0.03, z + 0.03);
  pilar(3.75, 0.45, 2.4);
  h.bloque(p, 'hormigon', 3.5, 4.3, M.nivelSuelo + 2.4, M.nivelSuelo + 2.5, z - 0.3, z + 0.3);
  // Tejido romboidal por todo el perímetro del lote, salvo el vano del portón.
  const L = M.lote;
  const v = (x, zz) => new THREE.Vector3(x, 0, zz);
  alambrado(h, p, v(4.0, z), v(L.x1, z));
  alambrado(h, p, v(-1.4, z), v(L.x0, z));
  alambrado(h, p, v(L.x1, z), v(L.x1, L.zFondo));
  alambrado(h, p, v(L.x0, z), v(L.x0, L.zFondo));
  alambrado(h, p, v(L.x0, L.zFondo), v(L.x1, L.zFondo));
  // Entrada de autos de tierra compactada.
  const entrada = h.bloque(p, 'tierra', 0.7, 3.5, M.nivelSuelo - 0.02, M.nivelSuelo + 0.01, z - 4.5, z + 0.5);
  entrada.receiveShadow = true;
  p.position.z = RETROCESO_PORTON;
  return p;
}

export function construirMurosVecinos(h) {
  const m = new THREE.Group();
  m.name = 'muros';
  // Este, junto al hastial: bloques revocados con manchas y un tramo de ladrillo; parabólica arriba.
  const este = new THREE.Group();
  h.bloque(este, 'revoqueViejo', -0.5, 3.4, M.nivelSuelo, M.nivelSuelo + 2.3, -0.1, 0.1);
  h.bloque(este, 'ladrillo', 3.4, 5.0, M.nivelSuelo, M.nivelSuelo + 2.1, -0.1, 0.1);
  h.cilindro(este, 'hormigon', 2.0, M.nivelSuelo + 2.3, M.nivelSuelo + 3.3, 0, 0.03, 6);
  const plato = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), h.mat('antena'));
  plato.position.set(2.0, M.nivelSuelo + 3.3, -0.1);
  plato.rotation.y = Math.PI;
  este.add(plato);
  este.position.set(M.lote.x1 + 0.3, 0, -3.2);   // del lado de afuera del tejido este, paralelo al límite del lote
  este.rotation.y = Math.PI / 2;
  m.add(este);
  // Norte y noroeste: ladrillo visto a medio hacer, pegado al extremo noroeste de la casa.
  const norte = h.bloque(m, 'ladrillo', -7, 7, M.nivelSuelo, M.nivelSuelo + 2.0, -0.1, 0.1);
  norte.position.set(5, 0, M.lote.zFondo - 0.4);   // detrás del tejido del fondo
  for (let i = -2; i <= 2; i++) {
    const pilar = h.bloque(m, 'hormigon', -0.15, 0.15, M.nivelSuelo, M.nivelSuelo + 2.2, -0.15, 0.15);
    pilar.position.set(5 + i * 3.0, 0, M.lote.zFondo - 0.4);
  }
  // Oeste, a lo largo del lado hacia la calle (ladrillo detrás del alambrado).
  const oeste = h.bloque(m, 'ladrillo', -12, 12, M.nivelSuelo, M.nivelSuelo + 2.0, -0.1, 0.1);
  oeste.position.set(M.lote.x0 - 0.4, 0, -4);   // detrás del tejido oeste
  oeste.rotation.y = Math.PI / 2;
  // Este lejano: muro gris azulado detrás del alambrado.
  const esteLejano = h.bloque(m, 'revoqueGris', -8, 8, M.nivelSuelo, M.nivelSuelo + 1.9, -0.1, 0.1);
  esteLejano.position.set(22, 0, -8);
  esteLejano.rotation.y = Math.PI / 2;
  return m;
}

export function construirSuelo(mat) {
  const s = new THREE.Group();
  s.name = 'suelo';
  const cesped = new THREE.Mesh(new THREE.PlaneGeometry(140, 140, 1, 1), mat('cesped'));
  cesped.rotation.x = -Math.PI / 2;
  cesped.position.y = M.nivelSuelo;
  cesped.receiveShadow = true;
  const uv = cesped.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 140, uv.getY(i) * 140);
  s.add(cesped);
  const parche = (x, z, ancho, largo, giro) => {
    const tierra = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largo), mat('tierra'));
    const uvT = tierra.geometry.attributes.uv;
    for (let i = 0; i < uvT.count; i++) uvT.setXY(i, uvT.getX(i) * ancho, uvT.getY(i) * largo);
    tierra.rotation.x = -Math.PI / 2;
    tierra.rotation.z = giro;
    tierra.position.set(x, M.nivelSuelo + 0.01, z);
    tierra.receiveShadow = true;
    s.add(tierra);
  };
  parche(7.5, 5.0, 6, 5, 0.3);       // entrada de autos entre el portón y el hastial
  // Montículo de arena cerca del frente.
  const arena = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('arena'));
  arena.scale.set(1, 0.25, 1);
  arena.position.set(6.5, M.nivelSuelo, 9.5);
  s.add(arena);
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
