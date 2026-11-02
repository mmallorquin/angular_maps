import * as THREE from 'three';

/**
 * Cielo de la maqueta: cúpula con degradado (cenit azul, horizonte claro y halo del sol), nubes como
 * sprites y mapa de entorno generado de esa misma cúpula para que vidrios, chapa y faroles reflejen
 * el cielo. Colores de datos/ficha-casa.md (sección Luz).
 */

const RADIO_CUPULA = 320;
const COLOR_CENIT = 0x2f6fd0;
const COLOR_HORIZONTE = 0xbfd9f2;
const COLOR_SUELO_LEJANO = 0x9fb98a;
const CANTIDAD_NUBES = 14;
const ALTURA_NUBES = 120;

const VERTEX = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
  }
`;
const FRAGMENT = `
  uniform vec3 cenit;
  uniform vec3 horizonte;
  uniform vec3 suelo;
  uniform vec3 sol;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 c = h >= 0.0 ? mix(horizonte, cenit, pow(h, 0.55)) : mix(horizonte, suelo, clamp(-h * 6.0, 0.0, 1.0));
    float d = max(dot(vDir, sol), 0.0);
    c += vec3(1.0, 0.95, 0.85) * (pow(d, 220.0) * 1.2 + pow(d, 8.0) * 0.12);
    gl_FragColor = vec4(c, 1.0);
  }
`;

export function crearCupula(direccionSol) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      cenit: { value: new THREE.Color(COLOR_CENIT) },
      horizonte: { value: new THREE.Color(COLOR_HORIZONTE) },
      suelo: { value: new THREE.Color(COLOR_SUELO_LEJANO) },
      sol: { value: direccionSol.clone().normalize() },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(RADIO_CUPULA, 32, 16), material);
  cupula.name = 'cielo';
  cupula.renderOrder = -1;
  return cupula;
}

function texturaNube() {
  const n = 256;
  const lienzo = document.createElement('canvas');
  lienzo.width = n;
  lienzo.height = n;
  const ctx = lienzo.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const r = n * (0.08 + Math.random() * 0.14);
    const x = n * (0.25 + Math.random() * 0.5);
    const y = n * (0.35 + Math.random() * 0.3);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.6, 'rgba(245,248,252,0.35)');
    g.addColorStop(1, 'rgba(230,236,245,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, n, n);
  }
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function crearNubes() {
  const g = new THREE.Group();
  g.name = 'nubes';
  const tex = texturaNube();
  for (let i = 0; i < CANTIDAD_NUBES; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85, fog: false }));
    const ang = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 150;
    const ancho = 40 + Math.random() * 60;
    s.position.set(Math.cos(ang) * dist, ALTURA_NUBES + Math.random() * 40, Math.sin(ang) * dist);
    s.scale.set(ancho, ancho * 0.45, 1);
    g.add(s);
  }
  return g;
}

/** Mapa de entorno a partir de la cúpula, para reflejos en vidrios y metales. */
export function crearEntorno(renderer, direccionSol) {
  const escenaCielo = new THREE.Scene();
  escenaCielo.add(crearCupula(direccionSol));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const entorno = pmrem.fromScene(escenaCielo, 0.02).texture;
  pmrem.dispose();
  return entorno;
}
