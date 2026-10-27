import * as THREE from 'three';
import { MEDIDAS, anguloCasa, localAMundo } from './modelo.js';

/** Entorno de la maqueta: cielo, luces con sombra, lote, árboles y etiquetas. */

const RADIO_SOMBRA = 40;
const COLOR_CIELO = 0xcfe3f6;
const COLOR_TRONCO = 0x6b5440;
const COLOR_COPA = 0x4f8a3a;
const COLOR_HOJA_PALMERA = 0x3e7d34;

export function crearLuces(escena) {
  escena.background = new THREE.Color(COLOR_CIELO);
  escena.fog = new THREE.Fog(COLOR_CIELO, 90, 220);
  escena.add(new THREE.HemisphereLight(0xdfeeff, 0x8d8a76, 1.6));
  const sol = new THREE.DirectionalLight(0xfff3dd, 2.6);
  sol.position.set(-8, 34, 24);   // sol alto desde el sur-suroeste del plano: ilumina la fachada vidriada y el frente de piedra (ficha, sección Luz)
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = sol.shadow.camera.bottom = -RADIO_SOMBRA;
  sol.shadow.camera.right = sol.shadow.camera.top = RADIO_SOMBRA;
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 120;
  sol.shadow.bias = -0.0005;
  sol.target.position.set(8, 0, -5);
  escena.add(sol, sol.target);
  return sol;
}

/** Contorno del lote (24 x 30 m) alineado con la casa; posición aproximada: el portón queda sobre el frente. */
export function crearLote() {
  const u = new THREE.Vector3(MEDIDAS.direccionFachada.x, 0, MEDIDAS.direccionFachada.z).normalize();   // hacia el fondo
  const v = new THREE.Vector3(-u.z, 0, u.x);   // a lo largo del frente, hacia el este
  const frente = 24;
  const fondo = 30;
  const p0 = new THREE.Vector3(2, MEDIDAS.nivelSuelo + 0.03, 9.5).addScaledVector(v, -4);   // esquina suroeste (calle)
  const esquinas = [p0, p0.clone().addScaledVector(v, frente), p0.clone().addScaledVector(v, frente).addScaledVector(u, fondo), p0.clone().addScaledVector(u, fondo), p0];
  const geo = new THREE.BufferGeometry().setFromPoints(esquinas);
  const linea = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xfff0a0, dashSize: 0.8, gapSize: 0.4, linewidth: 2 }));
  linea.computeLineDistances();
  const grupo = new THREE.Group();
  grupo.name = 'lote';
  grupo.add(linea);
  grupo.userData.centro = p0.clone().addScaledVector(v, frente / 2).addScaledVector(u, fondo / 2);
  grupo.userData.esquinas = esquinas.slice(0, 4);
  return grupo;
}

function crearArbol({ x, z, altura, radioCopa, tipo, vecino }) {
  const g = new THREE.Group();
  const troncoMat = new THREE.MeshStandardMaterial({ color: COLOR_TRONCO, roughness: 0.95 });
  if (tipo === 'palmera') {
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, altura - 1.5, 10), troncoMat);
    tronco.position.y = (altura - 1.5) / 2;
    tronco.castShadow = true;
    g.add(tronco);
    const hojaMat = new THREE.MeshStandardMaterial({ color: COLOR_HOJA_PALMERA, roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 9; i++) {
      const hoja = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.7), hojaMat);
      hoja.position.set(0, altura - 1.4, 0);
      hoja.rotation.y = (i / 9) * Math.PI * 2;
      hoja.rotation.z = -0.55;
      hoja.translateX(1.4);
      hoja.castShadow = true;
      g.add(hoja);
    }
  } else {
    const altoTronco = Math.min(3, altura * 0.4);
    radioCopa = Math.min(2.4, Math.max(1.0, radioCopa * 0.6));   // copas más chicas para no tapar la maqueta
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, altoTronco, 8), troncoMat);
    tronco.position.y = altoTronco / 2;
    tronco.castShadow = true;
    g.add(tronco);
    const copa = new THREE.Mesh(new THREE.SphereGeometry(radioCopa, 12, 10), new THREE.MeshStandardMaterial({
      color: new THREE.Color(COLOR_COPA).offsetHSL((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.12), roughness: 0.9,
      transparent: true, opacity: vecino ? 0.55 : 0.88,
    }));
    copa.scale.y = 0.85;
    copa.position.y = Math.max(altoTronco + radioCopa * 0.7, altura * 0.65);
    copa.castShadow = true;
    g.add(copa);
  }
  g.position.set(x, MEDIDAS.nivelSuelo, z);
  return g;
}

export function crearArboles(lista) {
  const g = new THREE.Group();
  g.name = 'arboles';
  for (const a of lista) g.add(crearArbol(a));
  return g;
}

/** Etiqueta flotante dibujada en un canvas (siempre mira a la cámara). */
export function crearEtiqueta(texto, posicion, { tamanio = 0.9, color = '#ffffff', fondo = 'rgba(15,21,18,0.78)' } = {}) {
  const lienzo = document.createElement('canvas');
  const ctx = lienzo.getContext('2d');
  const fuente = 'bold 40px system-ui, sans-serif';
  ctx.font = fuente;
  const ancho = Math.ceil(ctx.measureText(texto).width) + 40;
  lienzo.width = ancho;
  lienzo.height = 64;
  ctx.font = fuente;
  ctx.fillStyle = fondo;
  ctx.beginPath();
  ctx.roundRect(0, 0, ancho, 64, 16);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, 20, 34);
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.scale.set((tamanio * ancho) / 64, tamanio, 1);
  sprite.position.copy(posicion);
  sprite.renderOrder = 10;
  return sprite;
}

export function crearEtiquetas(lote) {
  const g = new THREE.Group();
  g.name = 'etiquetas';
  const items = [
    ['Casa', localAMundo(7, 5.0, 3.2)],
    ['Hastial de piedra', localAMundo(1.5, 5.4, 3)],
    ['Galería', localAMundo(6, 2.0, -1.4)],
    ['Sala · cocina', localAMundo(4.5, 1.9, 3.3)],
    ['Dormitorio', localAMundo(8.5, 1.9, 1.5)],
    ['Baño', localAMundo(8.5, 1.9, 4.8)],
    ['Galpón', new THREE.Vector3(3.2, 3.4, 1.6)],
    ['Portón', new THREE.Vector3(2.0, 3.2, 9.8)],
    ['Calle', new THREE.Vector3(6, 1.6, 13.5)],
    ['Tierra colorada', new THREE.Vector3(9.5, 1.2, 4.5)],
    ['Arboleda', new THREE.Vector3(-2, 1.6, -7)],
    ['Muro vecino', new THREE.Vector3(18.5, 3.2, -0.5)],
  ];
  for (const [texto, pos] of items) g.add(crearEtiqueta(texto, pos, { tamanio: texto.length > 10 ? 0.75 : 0.9 }));
  if (lote) g.add(crearEtiqueta('Lote 24 × 30 m (aprox.)', lote.userData.centro.clone().setY(0.8), { tamanio: 0.8, color: '#fff0a0' }));
  return g;
}

/** Puntos de vista predefinidos: [posición de cámara, objetivo]. */
export function vistas() {
  const centro = localAMundo(5.2, 1.5, 3.1);
  const ang = anguloCasa();
  return {
    aerea: { posicion: new THREE.Vector3(26, 24, 26), objetivo: new THREE.Vector3(6, 0, -2) },
    frente: { posicion: localAMundo(5, 2.2, -16), objetivo: centro },
    calle: { posicion: new THREE.Vector3(14, 3, 20), objetivo: new THREE.Vector3(6, 1.5, 0) },
    planta: { posicion: new THREE.Vector3(6, 55, -2.01), objetivo: new THREE.Vector3(6, 0, -2) },
    angulo: ang,
  };
}
