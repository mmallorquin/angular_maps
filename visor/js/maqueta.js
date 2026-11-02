import * as THREE from 'three';
import { OrbitControls } from 'orbit-controls';
import { crearMaqueta } from './modelo.js';
import { COLORES } from './materiales.js';
import { crearLuces, crearLote, crearArboles, crearEtiquetas, vistas } from './escena-maqueta.js';
import { Propuestas } from './propuestas.js';

const RUTA_ARBOLES = 'datos/arboles.json';
const DURACION_VUELO_MS = 900;
const PIXEL_RATIO_MAXIMO = 2;
const LEYENDA = [
  ['pared', 'Revoque blanco'], ['techo', 'Chapa gris grafito'], ['piedra', 'Piedra laja crema'],
  ['piso', 'Porcelanato crema'], ['marco', 'Aluminio negro'], ['madera', 'Madera gris'],
  ['ladrillo', 'Ladrillo visto'], ['hormigon', 'Hormigón'], ['cesped', 'Césped'], ['tierra', 'Tierra colorada'],
];

const $ = (sel) => document.querySelector(sel);

function mostrarError(mensaje, detalle) {
  console.error(mensaje, detalle);
  const aviso = $('#aviso');
  aviso.textContent = String(mensaje).slice(0, 300);
  aviso.hidden = false;
}

async function cargarArboles() {
  try {
    const r = await fetch(RUTA_ARBOLES);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const datos = await r.json();
    return Array.isArray(datos.arboles) ? datos.arboles : [];
  } catch (e) {
    mostrarError('No se pudieron cargar los árboles; la maqueta sigue sin ellos.', e);
    return [];
  }
}

function crearRenderer(contenedor) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PIXEL_RATIO_MAXIMO));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setSize(contenedor.clientWidth, contenedor.clientHeight, false);
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    mostrarError('Se perdió el contexto gráfico. Recargá la página.');
  });
  contenedor.appendChild(renderer.domElement);
  return renderer;
}

function crearCapa(contenedor, etiqueta, inicial, alCambiar) {
  const fila = document.createElement('label');
  fila.className = 'capa';
  const caja = document.createElement('input');
  caja.type = 'checkbox';
  caja.checked = inicial;
  caja.addEventListener('change', () => alCambiar(caja.checked));
  fila.append(caja, document.createTextNode(` ${etiqueta}`));
  contenedor.appendChild(fila);
  return caja;
}

function crearLeyenda(contenedor) {
  for (const [nombre, texto] of LEYENDA) {
    const fila = document.createElement('div');
    fila.className = 'muestra';
    const color = document.createElement('span');
    color.style.background = `#${COLORES[nombre].toString(16).padStart(6, '0')}`;
    fila.append(color, document.createTextNode(texto));
    contenedor.appendChild(fila);
  }
}

function crearFilasPropuestas(contenedor, propuestas) {
  contenedor.replaceChildren();
  for (const p of propuestas.lista) {
    const fila = document.createElement('div');
    fila.className = 'propuesta';
    const caja = document.createElement('input');
    caja.type = 'checkbox';
    caja.id = `propuesta-${p.id}`;
    caja.checked = p.visible;
    caja.addEventListener('change', () => propuestas.mostrar(p.id, caja.checked));
    const etiqueta = document.createElement('label');
    etiqueta.htmlFor = caja.id;
    etiqueta.textContent = p.nombre;
    const girar = document.createElement('button');
    girar.textContent = '↻';
    girar.title = 'Girar 15°';
    girar.setAttribute('aria-label', `Girar ${p.nombre}`);
    girar.addEventListener('click', () => propuestas.girar(p.id));
    fila.append(caja, etiqueta, girar);
    contenedor.appendChild(fila);
  }
}

async function iniciar() {
  const contenedor = $('#escena');
  const renderer = crearRenderer(contenedor);
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(48, contenedor.clientWidth / contenedor.clientHeight, 0.3, 400);
  const orbita = new OrbitControls(camara, renderer.domElement);
  orbita.enableDamping = true;
  orbita.dampingFactor = 0.08;
  orbita.maxPolarAngle = Math.PI / 2 - 0.03;
  orbita.minDistance = 3;
  orbita.maxDistance = 140;
  orbita.screenSpacePanning = false;

  crearLuces(escena, renderer);
  const maqueta = crearMaqueta();
  escena.add(maqueta.grupo);
  const lote = crearLote();
  escena.add(lote);
  const etiquetas = crearEtiquetas(lote);
  escena.add(etiquetas);
  const arboles = crearArboles(await cargarArboles());
  escena.add(arboles);
  const propuestas = new Propuestas({
    escena, camara, elemento: renderer.domElement, controlesOrbita: orbita, herramientas: maqueta.herramientas,
    alCambiar: () => crearFilasPropuestas($('#lista-propuestas'), propuestas),
  });

  const capas = $('#capas');
  crearCapa(capas, 'Techo de la casa', true, (v) => { maqueta.techo.visible = v; });
  crearCapa(capas, 'Árboles', true, (v) => { arboles.visible = v; });
  crearCapa(capas, 'Etiquetas', true, (v) => { etiquetas.visible = v; });
  crearCapa(capas, 'Contorno del lote', true, (v) => { lote.visible = v; });
  crearCapa(capas, 'Propuestas', true, (v) => { propuestas.grupo.visible = v; });
  crearFilasPropuestas($('#lista-propuestas'), propuestas);
  $('#restablecer-propuestas').addEventListener('click', () => propuestas.restablecer());
  crearLeyenda($('#leyenda'));

  const puntos = vistas();
  let vuelo = null;
  const irA = (nombre) => {
    const v = puntos[nombre];
    if (!v) return;
    vuelo = { desdePos: camara.position.clone(), desdeObj: orbita.target.clone(), hastaPos: v.posicion.clone(), hastaObj: v.objetivo.clone(), inicio: performance.now() };
    for (const b of document.querySelectorAll('[data-vista]')) b.classList.toggle('activo', b.dataset.vista === nombre);
  };
  for (const b of document.querySelectorAll('[data-vista]')) b.addEventListener('click', () => irA(b.dataset.vista));
  camara.position.copy(puntos.aerea.posicion);
  orbita.target.copy(puntos.aerea.objetivo);
  $('[data-vista="aerea"]').classList.add('activo');

  const ajustar = () => {
    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;
    if (!ancho || !alto) return;
    renderer.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
  };
  new ResizeObserver(ajustar).observe(contenedor);

  const suavizar = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const paso = (ahora) => {
    requestAnimationFrame(paso);
    if (vuelo) {
      const t = Math.min(1, (ahora - vuelo.inicio) / DURACION_VUELO_MS);
      const s = suavizar(t);
      camara.position.lerpVectors(vuelo.desdePos, vuelo.hastaPos, s);
      orbita.target.lerpVectors(vuelo.desdeObj, vuelo.hastaObj, s);
      if (t >= 1) vuelo = null;
    }
    orbita.update();
    renderer.render(escena, camara);
  };
  requestAnimationFrame(paso);
  $('#carga').hidden = true;

  window.maqueta = { escena, camara, orbita, maqueta, propuestas, irA };
}

iniciar().catch((e) => mostrarError(e?.message ?? String(e), e));
