import * as THREE from 'three';
import { MEDIDAS, anguloCasa, localAMundo } from './modelo.js';
import { crearCupula, crearNubes, crearEntorno } from './cielo.js';
export { crearArboles } from './arboles.js';

/** Entorno de la maqueta: cielo, luces con sombra, lote y etiquetas (los árboles están en arboles.js). */

const RADIO_SOMBRA = 40;
const COLOR_NIEBLA = 0xc9dcee;
const DIRECCION_SOL = new THREE.Vector3(-8, 34, 24);   // sol alto desde el sur-suroeste del plano (ficha, sección Luz)

/** Cielo, mapa de entorno (si hay renderer) y sol con sombras. */
export function crearLuces(escena, renderer = null) {
  escena.fog = new THREE.Fog(COLOR_NIEBLA, 120, 300);
  escena.add(crearCupula(DIRECCION_SOL), crearNubes());
  if (renderer) {
    escena.environment = crearEntorno(renderer, DIRECCION_SOL);
    escena.environmentIntensity = 0.7;
  }
  escena.add(new THREE.HemisphereLight(0xdfeeff, 0x8d8a76, renderer ? 0.6 : 1.6));
  const sol = new THREE.DirectionalLight(0xfff3dd, 2.2);
  sol.position.copy(DIRECCION_SOL);
  sol.castShadow = true;
  sol.shadow.mapSize.set(4096, 4096);
  sol.shadow.radius = 3;
  sol.shadow.camera.left = sol.shadow.camera.bottom = -RADIO_SOMBRA;
  sol.shadow.camera.right = sol.shadow.camera.top = RADIO_SOMBRA;
  sol.shadow.camera.near = 1;
  sol.shadow.camera.far = 120;
  sol.shadow.bias = -0.0005;
  sol.target.position.set(8, 0, -5);
  escena.add(sol, sol.target);
  return sol;
}

/** Contorno del lote (24 x 30 m) en el marco de la casa; las esquinas salen de MEDIDAS.lote. */
export function crearLote() {
  const L = MEDIDAS.lote;
  const y = MEDIDAS.nivelSuelo + 0.03;
  const esquinas = [[L.aFrente, L.bIzq], [L.aFrente, L.bDer], [L.aFondo, L.bDer], [L.aFondo, L.bIzq], [L.aFrente, L.bIzq]].map(([a, b]) => localAMundo(a, y, b));
  const geo = new THREE.BufferGeometry().setFromPoints(esquinas);
  const linea = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: 0xfff0a0, dashSize: 0.8, gapSize: 0.4, linewidth: 2 }));
  linea.computeLineDistances();
  const grupo = new THREE.Group();
  grupo.name = 'lote';
  grupo.add(linea);
  grupo.userData.centro = localAMundo((L.aFrente + L.aFondo) / 2, y, (L.bIzq + L.bDer) / 2);
  grupo.userData.esquinas = esquinas.slice(0, 4);
  return grupo;
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
    ['Galpón', localAMundo(MEDIDAS.lote.galpon.a, 3.4, MEDIDAS.lote.galpon.b)],
    ['Portón', localAMundo(MEDIDAS.lote.aFrente, 3.2, MEDIDAS.lote.bPorton + 2.7)],
    ['Calle', localAMundo(MEDIDAS.lote.aFrente - 4, 1.6, -4)],
    ['Entrada de tierra', localAMundo(-4.5, 1.2, -8)],
    ['Arboleda', localAMundo(13, 1.6, -5)],
    ['Muro vecino', localAMundo(-1, 3.2, MEDIDAS.lote.bDer + 0.5)],
  ];
  for (const [texto, pos] of items) g.add(crearEtiqueta(texto, pos, { tamanio: texto.length > 10 ? 0.75 : 0.9 }));
  if (lote) g.add(crearEtiqueta('Lote 24 × 30 m', lote.userData.centro.clone().setY(0.8), { tamanio: 0.8, color: '#fff0a0' }));
  return g;
}

/** Puntos de vista predefinidos en el marco de la casa: [posición de cámara, objetivo]. */
export function vistas() {
  const L = MEDIDAS.lote;
  const centroLote = localAMundo((L.aFrente + L.aFondo) / 2, 0, (L.bIzq + L.bDer) / 2);
  const centroCasa = localAMundo(5.2, 1.5, 3.1);
  return {
    aerea: { posicion: localAMundo(L.aFrente - 22, 26, L.bIzq - 10), objetivo: centroLote },
    frente: { posicion: localAMundo(5, 2.2, -16), objetivo: centroCasa },
    calle: { posicion: localAMundo(L.aFrente - 9, 3, -9), objetivo: localAMundo(3, 1.5, -1) },
    planta: { posicion: centroLote.clone().setY(58).add(new THREE.Vector3(0.01, 0, 0)), objetivo: centroLote },
    angulo: anguloCasa(),
  };
}
