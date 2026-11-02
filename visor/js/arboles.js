import * as THREE from 'three';
import { MEDIDAS } from './medidas.js';

/**
 * Árboles de la maqueta: copas con textura de hojas recortada (alpha) en dos capas, troncos con
 * corteza y palmera pindó con pencas arqueadas. Posiciones de datos/arboles.json (del escaneo).
 */

const COLOR_TRONCO = 0x6b5440;
const COLOR_COPA = 0x3f7f32;
const COLOR_HOJA_PALMERA = 0x3e7d34;
const SEGMENTOS_COPA = 14;
const PENCAS = 11;

let texturaHojas = null;
let texturaCorteza = null;
let texturaPenca = null;

function hex(c) {
  return `#${new THREE.Color(c).getHexString()}`;
}

function crearTexturaHojas() {
  const n = 256;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = n;
  const ctx = lienzo.getContext('2d');
  ctx.clearRect(0, 0, n, n);
  for (let i = 0; i < 1500; i++) {
    const c = new THREE.Color(COLOR_COPA).offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.15, (Math.random() - 0.45) * 0.28);
    ctx.fillStyle = `#${c.getHexString()}`;
    const x = Math.random() * n;
    const y = Math.random() * n;
    const r = 3 + Math.random() * 5;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(lienzo);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function crearTexturaCorteza() {
  const n = 128;
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = n;
  const ctx = lienzo.getContext('2d');
  ctx.fillStyle = hex(COLOR_TRONCO);
  ctx.fillRect(0, 0, n, n);
  for (let i = 0; i < 140; i++) {
    const c = new THREE.Color(COLOR_TRONCO).offsetHSL(0, 0, (Math.random() - 0.5) * 0.25);
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(Math.random() * n, Math.random() * n, 2 + Math.random() * 4, 10 + Math.random() * 30);
  }
  const tex = new THREE.CanvasTexture(lienzo);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function crearTexturaPenca() {
  const n = 256;
  const lienzo = document.createElement('canvas');
  lienzo.width = n;
  lienzo.height = 64;
  const ctx = lienzo.getContext('2d');
  ctx.clearRect(0, 0, n, 64);
  ctx.strokeStyle = hex(COLOR_HOJA_PALMERA);
  ctx.lineWidth = 2;
  for (let x = 4; x < n; x += 4) {
    const largo = 26 * (1 - x / n) + 4;
    ctx.beginPath();
    ctx.moveTo(x, 32);
    ctx.lineTo(x + 6, 32 - largo);
    ctx.moveTo(x, 32);
    ctx.lineTo(x + 6, 32 + largo);
    ctx.stroke();
  }
  ctx.strokeStyle = '#8c8a4e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(n, 32);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function texturas() {
  texturaHojas ??= crearTexturaHojas();
  texturaCorteza ??= crearTexturaCorteza();
  texturaPenca ??= crearTexturaPenca();
  return { hojas: texturaHojas, corteza: texturaCorteza, penca: texturaPenca };
}

function materialCopa(tono, hojas) {
  const m = new THREE.MeshStandardMaterial({
    map: hojas, color: new THREE.Color(0xffffff).offsetHSL(0, 0, tono), roughness: 0.9,
    alphaTest: 0.45, side: THREE.DoubleSide,
  });
  return m;
}

function crearPalmera(g, altura, t) {
  const altoTronco = altura - 1.5;
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, altoTronco, 10), new THREE.MeshStandardMaterial({ map: t.corteza, color: 0xb9b2a4, roughness: 0.95 }));
  tronco.position.y = altoTronco / 2;
  tronco.castShadow = true;
  g.add(tronco);
  const mat = new THREE.MeshStandardMaterial({ map: t.penca, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 });
  for (let i = 0; i < PENCAS; i++) {
    const geo = new THREE.PlaneGeometry(3.4, 0.8, 8, 1);
    const pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k) + 1.7;            // 0 en la base, 3,4 en la punta
      pos.setY(k, pos.getY(k) - 0.55 * (x / 3.4) ** 2 * 3.4);   // arco hacia abajo
    }
    geo.translate(1.7, 0, 0);
    const penca = new THREE.Mesh(geo, mat);
    penca.position.set(0, altoTronco + 0.1, 0);
    penca.rotation.y = (i / PENCAS) * Math.PI * 2 + Math.random() * 0.3;
    penca.rotation.z = 0.35 + Math.random() * 0.3;
    penca.castShadow = true;
    g.add(penca);
  }
}

function crearArbolHojas(g, altura, radioCopa, vecino, t) {
  const altoTronco = Math.min(3.2, altura * 0.42);
  const radio = Math.min(2.6, Math.max(1.2, radioCopa * 0.65));
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, altoTronco + radio, 8), new THREE.MeshStandardMaterial({ map: t.corteza, roughness: 0.95 }));
  tronco.position.y = (altoTronco + radio) / 2;
  tronco.castShadow = true;
  g.add(tronco);
  const yCopa = Math.max(altoTronco + radio * 0.8, altura * 0.62);
  const capas = [[1.0, 0.0], [0.78, -0.18]];
  for (const [escala, tono] of capas) {
    const copa = new THREE.Mesh(new THREE.SphereGeometry(radio * escala, SEGMENTOS_COPA, SEGMENTOS_COPA - 2), materialCopa(tono, t.hojas));
    copa.scale.set(1 + (Math.random() - 0.5) * 0.25, 0.85, 1 + (Math.random() - 0.5) * 0.25);
    copa.position.set((Math.random() - 0.5) * 0.4, yCopa, (Math.random() - 0.5) * 0.4);
    copa.rotation.y = Math.random() * Math.PI;
    copa.castShadow = true;
    g.add(copa);
  }
  if (vecino) g.traverse((o) => { if (o.isMesh && o.material.map === t.hojas) o.material.opacity = 0.9; });
  // Ramas cortas que asoman entre las hojas.
  for (let i = 0; i < 3; i++) {
    const rama = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.07, radio * 1.2, 5), tronco.material);
    rama.position.set(0, altoTronco + radio * 0.5, 0);
    rama.rotation.set((Math.random() - 0.5) * 1.6, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 1.6);
    rama.translateY(radio * 0.5);
    g.add(rama);
  }
}

export function crearArbol({ x, z, altura, radioCopa, tipo, vecino }) {
  const g = new THREE.Group();
  const t = texturas();
  if (tipo === 'palmera') crearPalmera(g, altura, t);
  else crearArbolHojas(g, altura, radioCopa, vecino, t);
  g.position.set(x, MEDIDAS.nivelSuelo, z);
  return g;
}

export function crearArboles(lista) {
  const g = new THREE.Group();
  g.name = 'arboles';
  for (const a of lista) g.add(crearArbol(a));
  return g;
}
