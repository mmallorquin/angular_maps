import * as THREE from 'three';
import { escalarUVsCaja } from './materiales.js';

/**
 * Herramientas de construcción en el marco local de la casa: a corre a lo largo de la fachada
 * suroeste (desde la esquina sur hacia la oeste), b cruza hacia el noreste e y va hacia arriba.
 * Todas devuelven la malla creada y la agregan al grupo indicado.
 */
export function crearHerramientas(mat, conSombras) {
  const terminar = (malla, grupo) => {
    malla.castShadow = conSombras;
    malla.receiveShadow = conSombras;
    grupo.add(malla);
    return malla;
  };

  /** Caja alineada a los ejes entre [a0,a1] x [y0,y1] x [b0,b1]. */
  const bloque = (grupo, nombre, a0, a1, y0, y1, b0, b1, extra) => {
    const geo = new THREE.BoxGeometry(Math.abs(a1 - a0), Math.abs(y1 - y0), Math.abs(b1 - b0));
    escalarUVsCaja(geo, Math.abs(a1 - a0), Math.abs(y1 - y0), Math.abs(b1 - b0));
    const m = new THREE.Mesh(geo, mat(nombre, extra));
    m.position.set((a0 + a1) / 2, (y0 + y1) / 2, (b0 + b1) / 2);
    return terminar(m, grupo);
  };

  /** Perfil en el plano (y, b) extruido a lo largo de a, de a0 a a1. `agujeros` son perfiles interiores. */
  const prismaA = (grupo, nombre, puntosYB, a0, a1, agujeros = [], extra) => {
    const forma = new THREE.Shape(puntosYB.map(([y, b]) => new THREE.Vector2(b, y)));
    for (const h of agujeros) forma.holes.push(new THREE.Path(h.map(([y, b]) => new THREE.Vector2(b, y))));
    const geo = new THREE.ExtrudeGeometry(forma, { depth: a1 - a0, bevelEnabled: false });
    geo.rotateY(-Math.PI / 2);   // la extrusión (z) pasa a -a y el eje x de la forma (b) queda en z
    geo.translate(a1, 0, 0);
    return terminar(new THREE.Mesh(geo, mat(nombre, extra)), grupo);
  };

  /** Polígono en planta (a, b) extruido en altura, de y0 a y1 (terrazas, escalones). */
  const prismaY = (grupo, nombre, puntosAB, y0, y1, extra) => {
    const forma = new THREE.Shape(puntosAB.map(([a, b]) => new THREE.Vector2(a, b)));
    const geo = new THREE.ExtrudeGeometry(forma, { depth: y1 - y0, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);    // la extrusión (z) pasa a -y y el eje y de la forma (b) queda en z
    geo.translate(0, y1, 0);
    return terminar(new THREE.Mesh(geo, mat(nombre, extra)), grupo);
  };

  /** Cilindro vertical (postes, cadenas) centrado en (a, b). */
  const cilindro = (grupo, nombre, a, y0, y1, b, radio, segmentos = 8) => {
    const geo = new THREE.CylinderGeometry(radio, radio, y1 - y0, segmentos);
    const m = new THREE.Mesh(geo, mat(nombre));
    m.position.set(a, (y0 + y1) / 2, b);
    return terminar(m, grupo);
  };

  /** Carpintería de aluminio negro con vidrio: marco perimetral, hojas y vidrio en el plano b. */
  const abertura = (grupo, { a0, a1, y0, y1, b, hojas = 2, perfil = 0.07, espesor = 0.08 }) => {
    const g = new THREE.Group();
    const bc = b;
    bloque(g, 'marco', a0, a1, y0, y0 + perfil, bc - espesor / 2, bc + espesor / 2);
    bloque(g, 'marco', a0, a1, y1 - perfil, y1, bc - espesor / 2, bc + espesor / 2);
    bloque(g, 'marco', a0, a0 + perfil, y0, y1, bc - espesor / 2, bc + espesor / 2);
    bloque(g, 'marco', a1 - perfil, a1, y0, y1, bc - espesor / 2, bc + espesor / 2);
    for (let i = 1; i < hojas; i++) {
      const a = a0 + ((a1 - a0) * i) / hojas;
      bloque(g, 'marco', a - perfil / 2, a + perfil / 2, y0, y1, bc - espesor / 2 - 0.005, bc + espesor / 2 + 0.005);
    }
    bloque(g, 'vidrio', a0 + perfil, a1 - perfil, y0 + perfil, y1 - perfil, bc - 0.004, bc + 0.004);
    grupo.add(g);
    return g;
  };

  /** Farol colonial de pared: ménsula, cuerpo trapezoidal con vidrio y techito. `hacia` = ±1 en b, o 'a±'. */
  const farol = (grupo, a, y, b, hacia) => {
    const g = new THREE.Group();
    const n = hacia === 'a-' ? new THREE.Vector3(-1, 0, 0) : hacia === 'a+' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, hacia);
    const d = (k) => n.clone().multiplyScalar(k);
    const ancho = 0.16;
    const salir = 0.2;
    const base = new THREE.Vector3(a, y, b).add(d(salir));
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.26, ancho), mat('farol'));
    cuerpo.position.copy(base);
    const vidrio = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.8, 0.2, ancho * 0.8), mat('farolVidrio'));
    vidrio.position.copy(base);
    const techo = new THREE.Mesh(new THREE.ConeGeometry(ancho * 0.85, 0.12, 4), mat('farol'));
    techo.position.copy(base).add(new THREE.Vector3(0, 0.19, 0));
    techo.rotation.y = Math.PI / 4;
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(n.x) ? salir : 0.03, 0.03, Math.abs(n.z) ? salir : 0.03), mat('farol'));
    brazo.position.set(a, y + 0.08, b).add(d(salir / 2));
    for (const m of [cuerpo, vidrio, techo, brazo]) {
      m.castShadow = conSombras;
      g.add(m);
    }
    grupo.add(g);
    return g;
  };

  return { bloque, prismaA, prismaY, cilindro, abertura, farol, mat };
}
