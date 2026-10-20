import * as THREE from 'three';
import { MEDIDAS, anguloCasa, localAMundo } from './modelo.js';
import { crearEtiqueta } from './escena-maqueta.js';

/**
 * Volúmenes de propuesta para pensar ampliaciones: se muestran u ocultan, se arrastran por el
 * lote con el mouse o el dedo y se giran. La posición se recuerda en este navegador (localStorage).
 */

const CLAVE_GUARDADO = 'maqueta.propuestas.v1';
const PASO_GIRO = Math.PI / 12;   // 15°

export const PROPUESTAS = [
  { id: 'pileta', nombre: 'Pileta 8 × 4 m', ancho: 8, largo: 4, x: -2.5, z: -5.5, visible: true },
  { id: 'quincho', nombre: 'Quincho 5 × 4 m', ancho: 5, largo: 4, x: 12, z: -12, visible: true },
  { id: 'cochera', nombre: 'Cochera 6 × 3 m', ancho: 6, largo: 3, x: 8.5, z: 8.5, visible: false },
  { id: 'ampliacion', nombre: 'Ampliación 6 × 4 m (fondo)', ancho: 6, largo: 4, x: null, z: null, visible: false },
];

function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GUARDADO) ?? '{}');
  } catch (e) {
    return {};
  }
}

function guardar(estado) {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(estado));
  } catch (e) {
    /* almacenamiento no disponible: la posición solo dura esta visita */
  }
}

function construirPileta(h, g, ancho, largo) {
  const y = MEDIDAS.nivelSuelo;
  h.bloque(g, 'piso', -ancho / 2 - 0.5, ancho / 2 + 0.5, y - 0.1, y + 0.12, -largo / 2 - 0.5, largo / 2 + 0.5);
  h.bloque(g, 'vidrio', -ancho / 2, ancho / 2, y - 0.3, y + 0.13, -largo / 2, largo / 2);   // vaso
  h.bloque(g, 'agua', -ancho / 2 + 0.05, ancho / 2 - 0.05, y - 0.25, y + 0.08, -largo / 2 + 0.05, largo / 2 - 0.05);
}

function construirQuincho(h, g, ancho, largo) {
  const y = MEDIDAS.nivelSuelo;
  h.bloque(g, 'piso', -ancho / 2, ancho / 2, y - 0.1, y + 0.15, -largo / 2, largo / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    h.bloque(g, 'madera', sx * (ancho / 2 - 0.2) - 0.1, sx * (ancho / 2 - 0.2) + 0.1, y + 0.15, y + 2.7, sz * (largo / 2 - 0.2) - 0.1, sz * (largo / 2 - 0.2) + 0.1);
  }
  h.bloque(g, 'techo', -ancho / 2 - 0.4, ancho / 2 + 0.4, y + 2.7, y + 2.82, -largo / 2 - 0.4, largo / 2 + 0.4);
  h.bloque(g, 'ladrillo', -ancho / 2 + 0.3, -ancho / 2 + 2.3, y + 0.15, y + 1.05, largo / 2 - 0.8, largo / 2 - 0.2);   // parrilla / mesada
  h.bloque(g, 'ladrillo', -ancho / 2 + 0.3, -ancho / 2 + 1.5, y + 1.05, y + 2.7, largo / 2 - 0.8, largo / 2 - 0.2);   // chimenea
}

function construirCochera(h, g, ancho, largo) {
  const y = MEDIDAS.nivelSuelo;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    h.bloque(g, 'hormigon', sx * (ancho / 2 - 0.15) - 0.08, sx * (ancho / 2 - 0.15) + 0.08, y, y + 2.5, sz * (largo / 2 - 0.15) - 0.08, sz * (largo / 2 - 0.15) + 0.08);
  }
  h.bloque(g, 'techo', -ancho / 2 - 0.3, ancho / 2 + 0.3, y + 2.5, y + 2.62, -largo / 2 - 0.3, largo / 2 + 0.3);
  h.bloque(g, 'hormigon', -ancho / 2, ancho / 2, y - 0.1, y + 0.02, -largo / 2, largo / 2);
}

function construirAmpliacion(h, g, ancho, largo) {
  const y = MEDIDAS.nivelPiso;
  h.bloque(g, 'interior', -ancho / 2, ancho / 2, MEDIDAS.nivelSuelo, y, -largo / 2, largo / 2);
  h.bloque(g, 'pared', -ancho / 2, ancho / 2, y, y + 2.7, -largo / 2, -largo / 2 + 0.15);
  h.bloque(g, 'pared', -ancho / 2, ancho / 2, y, y + 2.7, largo / 2 - 0.15, largo / 2);
  h.bloque(g, 'pared', -ancho / 2, -ancho / 2 + 0.15, y, y + 2.7, -largo / 2, largo / 2);
  h.bloque(g, 'pared', ancho / 2 - 0.15, ancho / 2, y, y + 2.7, -largo / 2, largo / 2);
  h.bloque(g, 'techo', -ancho / 2 - 0.4, ancho / 2 + 0.4, y + 2.7, y + 2.82, -largo / 2 - 0.4, largo / 2 + 0.4);
  h.abertura(g, -1.5, 1.5, y, y + 2.2, -largo / 2, -1);
}

const CONSTRUCTORES = { pileta: construirPileta, quincho: construirQuincho, cochera: construirCochera, ampliacion: construirAmpliacion };

export class Propuestas {
  constructor({ escena, camara, elemento, controlesOrbita, herramientas, alCambiar }) {
    this.camara = camara;
    this.elemento = elemento;
    this.controlesOrbita = controlesOrbita;
    this.alCambiar = alCambiar;
    this.grupo = new THREE.Group();
    this.grupo.name = 'propuestas';
    this.raycaster = new THREE.Raycaster();
    this.planoSuelo = new THREE.Plane(new THREE.Vector3(0, 1, 0), -MEDIDAS.nivelSuelo);
    this.arrastre = null;
    this.estado = leerGuardado();
    this.items = new Map();
    for (const def of PROPUESTAS) this.items.set(def.id, this.construir(def, herramientas));
    escena.add(this.grupo);
    elemento.addEventListener('pointerdown', (e) => this.alBajar(e));
    elemento.addEventListener('pointermove', (e) => this.alMover(e));
    for (const t of ['pointerup', 'pointercancel']) elemento.addEventListener(t, () => this.alSoltar());
    addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'r' && this.ultima) this.girar(this.ultima); });
  }

  construir(def, h) {
    const g = new THREE.Group();
    g.name = `propuesta-${def.id}`;
    CONSTRUCTORES[def.id](h, g, def.ancho, def.largo);
    const guardado = this.estado[def.id] ?? {};
    const inicial = def.x === null ? localAMundo(4.5, 0, MEDIDAS.paredNE + def.largo / 2 + 0.8) : new THREE.Vector3(def.x, 0, def.z);
    g.position.set(guardado.x ?? inicial.x, 0, guardado.z ?? inicial.z);
    g.rotation.y = guardado.rot ?? anguloCasa();
    g.visible = guardado.visible ?? def.visible;
    const etiqueta = crearEtiqueta(def.nombre, new THREE.Vector3(0, 3.4, 0), { tamanio: 0.8, color: '#dff5d0', fondo: 'rgba(40,80,30,0.8)' });
    g.add(etiqueta);
    g.userData.def = def;
    this.grupo.add(g);
    return g;
  }

  get lista() {
    return [...this.items.values()].map((g) => ({ ...g.userData.def, visible: g.visible }));
  }

  mostrar(id, visible) {
    const g = this.items.get(id);
    if (!g) return;
    g.visible = visible;
    this.persistir();
  }

  girar(id, delta = PASO_GIRO) {
    const g = this.items.get(id);
    if (!g) return;
    g.rotation.y += delta;
    this.persistir();
  }

  restablecer() {
    for (const [id, g] of this.items) {
      const def = g.userData.def;
      const inicial = def.x === null ? localAMundo(4.5, 0, MEDIDAS.paredNE + def.largo / 2 + 0.8) : new THREE.Vector3(def.x, 0, def.z);
      g.position.set(inicial.x, 0, inicial.z);
      g.rotation.y = anguloCasa();
      g.visible = def.visible;
    }
    this.estado = {};
    guardar(this.estado);
    this.alCambiar?.();
  }

  persistir() {
    for (const [id, g] of this.items) {
      this.estado[id] = { x: Number(g.position.x.toFixed(2)), z: Number(g.position.z.toFixed(2)), rot: Number(g.rotation.y.toFixed(3)), visible: g.visible };
    }
    guardar(this.estado);
    this.alCambiar?.();
  }

  puntero(e) {
    const r = this.elemento.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  puntoEnSuelo(e) {
    this.raycaster.setFromCamera(this.puntero(e), this.camara);
    const punto = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.planoSuelo, punto) ? punto : null;
  }

  alBajar(e) {
    if (e.button !== undefined && e.button !== 0) return;
    this.raycaster.setFromCamera(this.puntero(e), this.camara);
    const visibles = [...this.items.values()].filter((g) => g.visible);
    const impactos = this.raycaster.intersectObjects(visibles, true);
    if (!impactos.length) return;
    let objetivo = impactos[0].object;
    while (objetivo.parent && objetivo.parent !== this.grupo) objetivo = objetivo.parent;
    const punto = this.puntoEnSuelo(e);
    if (!punto) return;
    this.arrastre = { grupo: objetivo, desplazamiento: objetivo.position.clone().sub(punto) };
    this.ultima = objetivo.userData.def.id;
    this.controlesOrbita.enabled = false;
    this.elemento.setPointerCapture?.(e.pointerId);
    this.elemento.style.cursor = 'grabbing';
  }

  alMover(e) {
    if (!this.arrastre) return;
    const punto = this.puntoEnSuelo(e);
    if (!punto) return;
    const destino = punto.add(this.arrastre.desplazamiento);
    this.arrastre.grupo.position.set(destino.x, 0, destino.z);
  }

  alSoltar() {
    if (!this.arrastre) return;
    this.arrastre = null;
    this.controlesOrbita.enabled = true;
    this.elemento.style.cursor = '';
    this.persistir();
  }
}
