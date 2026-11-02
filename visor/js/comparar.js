import * as THREE from 'three';
import { crearMaqueta } from './modelo.js';
import { crearLuces, crearArboles } from './escena-maqueta.js';
import { FOTOS } from './lugares.js';

/**
 * Comparador de la maqueta paramétrica con las fotos reales: pone la cámara en la pose de una
 * foto (o en la que diga la URL) y superpone la foto con opacidad ajustable. Sirve para calibrar
 * medidas de js/modelo.js y poses de js/lugares.js, y para renderizar vistas desde la terminal
 * con herramientas/render-vistas.mjs.
 *
 * Parámetros de URL: foto=N | x,z,yaw,pitch,fov (y opcional) · op=0..1 · ui=0 oculta los paneles ·
 * lado=1 pone la maqueta y la foto una al lado de la otra con una grilla (la ventana debe tener el doble de ancho) ·
 * arboles=0 no dibuja los árboles (tapan la casa en varias vistas).
 */

const RUTA_TERRENO = 'datos/terreno.json';
const RUTA_ARBOLES = 'datos/arboles.json';
const ALTURA_OJOS = 1.6;
const NIVEL_SUELO_POR_DEFECTO = -0.35;
const PASO_METROS = 0.1;
const PASO_GRADOS = 0.5;
const PASO_FOV = 0.5;
const FACTOR_SHIFT = 5;
const PIXEL_RATIO_MAXIMO = 2;

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const leerNumero = (clave, porDefecto) => {
  const texto = params.get(clave);
  if (texto === null || texto.trim() === '') return porDefecto;
  const v = Number(texto);
  return Number.isFinite(v) ? v : porDefecto;
};

async function cargarJson(ruta, porDefecto) {
  try {
    const r = await fetch(ruta);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    console.warn(`No se pudo cargar ${ruta}`, e);
    return porDefecto;
  }
}

/** Altura del césped interpolada desde la grilla del escaneo (misma lógica que terreno.js). */
function alturaSuelo(terreno, x, z) {
  if (!terreno) return NIVEL_SUELO_POR_DEFECTO;
  const ix = Math.floor((x - terreno.x0) / terreno.celda);
  const iz = Math.floor((z - terreno.z0) / terreno.celda);
  for (let r = 0; r <= 6; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const cx = ix + dx;
        const cz = iz + dz;
        if (cx < 0 || cz < 0 || cx >= terreno.nx || cz >= terreno.nz) continue;
        const h = terreno.alturas[cz * terreno.nx + cx];
        if (h !== null) return h;
      }
    }
  }
  return NIVEL_SUELO_POR_DEFECTO;
}

function poseInicial(terreno) {
  const n = leerNumero('foto', null);
  const foto = FOTOS.find((f) => f.n === n) ?? null;
  const base = foto ?? { x: 0, z: 6, yaw: -0.6, pitch: 0.05, fov: 58 };
  const x = leerNumero('x', base.x);
  const z = leerNumero('z', base.z);
  return {
    foto,
    x,
    z,
    y: leerNumero('y', alturaSuelo(terreno, x, z) + ALTURA_OJOS),
    yaw: leerNumero('yaw', base.yaw),
    pitch: leerNumero('pitch', base.pitch),
    fov: leerNumero('fov', base.fov),
  };
}

function crearRenderer(contenedor) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PIXEL_RATIO_MAXIMO));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setSize(contenedor.clientWidth, contenedor.clientHeight, false);
  contenedor.appendChild(renderer.domElement);
  return renderer;
}

function texturasCargadas() {
  return new Promise((resolver) => {
    const manager = THREE.DefaultLoadingManager;
    const anterior = manager.onLoad;
    manager.onLoad = () => { anterior?.(); resolver(); };
    setTimeout(resolver, 4000);   // red de seguridad si ya estaba todo cargado
  });
}

function formatearPose(p) {
  const f = (v, d = 2) => Number(v.toFixed(d));
  return `x: ${f(p.x)}, z: ${f(p.z)}, yaw: ${f(p.yaw, 3)}, pitch: ${f(p.pitch, 3)}  (y ${f(p.y)}, fov ${f(p.fov, 1)})`;
}

async function iniciar() {
  const [terreno, arbolesDatos] = await Promise.all([cargarJson(RUTA_TERRENO, null), cargarJson(RUTA_ARBOLES, { arboles: [] })]);
  const pose = poseInicial(terreno);
  const contenedor = $('#escena');
  const renderer = crearRenderer(contenedor);
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(pose.fov, contenedor.clientWidth / contenedor.clientHeight, 0.1, 400);
  crearLuces(escena, renderer);
  const maqueta = crearMaqueta();
  escena.add(maqueta.grupo);
  if (params.get('arboles') !== '0') escena.add(crearArboles(Array.isArray(arbolesDatos.arboles) ? arbolesDatos.arboles : []));

  const imagen = $('#foto');
  const control = $('#opacidad');
  const etiqueta = $('#opacidad-valor');
  const hud = $('#hud');
  const selector = $('#selector-foto');
  if (params.get('ui') === '0') document.body.classList.add('sin-ui');
  if (params.get('lado') === '1') document.body.classList.add('lado');

  const fijarOpacidad = (valor) => {
    const v = THREE.MathUtils.clamp(valor, 0, 1);
    control.value = String(Math.round(v * 100));
    imagen.style.opacity = String(v);
    etiqueta.textContent = `${Math.round(v * 100)}%`;
  };
  control.addEventListener('input', () => fijarOpacidad(Number(control.value) / 100));

  const mostrarFoto = (foto) => {
    imagen.hidden = !foto;
    if (foto) {
      imagen.src = foto.archivo;
      imagen.alt = foto.titulo;
    }
  };
  for (const f of [{ n: 0, titulo: 'ninguna' }, ...FOTOS]) {
    const op = document.createElement('option');
    op.value = String(f.n);
    op.textContent = f.n ? `${f.n} · ${f.titulo}` : f.titulo;
    op.selected = pose.foto?.n === f.n;
    selector.appendChild(op);
  }
  selector.addEventListener('change', () => {
    const f = FOTOS.find((x) => x.n === Number(selector.value)) ?? null;
    mostrarFoto(f);
    if (f) Object.assign(pose, { x: f.x, z: f.z, yaw: f.yaw, pitch: f.pitch, fov: f.fov, y: alturaSuelo(terreno, f.x, f.z) + ALTURA_OJOS });
  });
  mostrarFoto(pose.foto);
  fijarOpacidad(leerNumero('op', pose.foto ? 0.5 : 0));
  $('#boton-copiar').addEventListener('click', () => navigator.clipboard?.writeText(formatearPose(pose)));

  const teclas = new Set();
  addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === '1') fijarOpacidad(0);
    if (e.key === '2') fijarOpacidad(0.5);
    if (e.key === '3') fijarOpacidad(1);
    teclas.add(e.code);   // e.code no cambia con Shift ([ sigue siendo BracketLeft)
  });
  addEventListener('keyup', (e) => teclas.delete(e.code));
  addEventListener('blur', () => teclas.clear());

  const mover = () => {
    const k = teclas.has('ShiftLeft') || teclas.has('ShiftRight') ? FACTOR_SHIFT : 1;
    const paso = PASO_METROS * k;
    const giro = THREE.MathUtils.degToRad(PASO_GRADOS * k);
    const adelante = new THREE.Vector2(-Math.sin(pose.yaw), -Math.cos(pose.yaw));
    const derecha = new THREE.Vector2(Math.cos(pose.yaw), -Math.sin(pose.yaw));
    const d = new THREE.Vector2();
    if (teclas.has('KeyW')) d.add(adelante);
    if (teclas.has('KeyS')) d.sub(adelante);
    if (teclas.has('KeyD')) d.add(derecha);
    if (teclas.has('KeyA')) d.sub(derecha);
    pose.x += d.x * paso;
    pose.z += d.y * paso;
    if (teclas.has('KeyE')) pose.y += paso * 0.5;
    if (teclas.has('KeyQ')) pose.y -= paso * 0.5;
    if (teclas.has('ArrowLeft')) pose.yaw += giro;
    if (teclas.has('ArrowRight')) pose.yaw -= giro;
    if (teclas.has('ArrowUp')) pose.pitch += giro;
    if (teclas.has('ArrowDown')) pose.pitch -= giro;
    if (teclas.has('BracketRight')) pose.fov += PASO_FOV * k;
    if (teclas.has('BracketLeft')) pose.fov -= PASO_FOV * k;
    pose.fov = THREE.MathUtils.clamp(pose.fov, 20, 120);
  };

  const ajustar = () => {
    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  };
  new ResizeObserver(ajustar).observe(contenedor);

  let cuadros = 0;
  const paso = () => {
    requestAnimationFrame(paso);
    mover();
    camara.position.set(pose.x, pose.y, pose.z);
    camara.rotation.set(pose.pitch, pose.yaw, 0, 'YXZ');
    if (camara.fov !== pose.fov) {
      camara.fov = pose.fov;
      camara.updateProjectionMatrix();
    }
    renderer.render(escena, camara);
    hud.textContent = formatearPose(pose);
    cuadros++;
  };
  requestAnimationFrame(paso);

  await texturasCargadas();
  await new Promise((r) => { const esperar = () => (cuadros > 3 ? r() : requestAnimationFrame(esperar)); esperar(); });
  window.comparar = { pose, camara, escena, maqueta, listo: true };
}

iniciar().catch((e) => {
  console.error(e);
  $('#hud').textContent = `Error: ${e?.message ?? e}`;
  window.comparar = { listo: true, error: String(e?.message ?? e) };
});
