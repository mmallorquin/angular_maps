import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { Terreno } from './terreno.js';
import { ControlesPrimeraPersona } from './controles.js';
import { MiniMapa } from './minimapa.js';
import { Comparador } from './comparador.js';
import { crearModeloRelleno } from './modelo.js';
import { DESTINOS, FOTOS, POSE_INICIAL } from './lugares.js';

// Al publicarlo como artefacto el archivo lleva otra extensión, por eso la ruta se puede inyectar desde la página.
const PARAMS_URL = new URLSearchParams(window.location.search);
const RUTA_MODELO = PARAMS_URL.get('modelo') ?? globalThis.CONFIG_VISOR?.modelo ?? 'modelo/casa.ksplat';
const RUTA_TERRENO = 'datos/terreno.json';
const RUTA_MAPA = 'datos/mapa.png';
const RUTA_INDICE_IA = 'ia/indice.json';
const FOV_VISTA_IA = { ancho: 4, alto: 3 };   // las vistas IA de los destinos se generaron con el encuadre 4:3 del paseo
const MAPA_PX_POR_METRO = 10;
// El escaneo guarda Y hacia abajo: 180° alrededor de X lo pone de pie (cuaternión x,y,z,w).
const ROTACION_ESCENA = [1, 0, 0, 0];
const FOV_PASEO = 62;
const CONSULTA_MOVIL = '(max-width: 760px), (max-height: 520px)';
const DURACION_VUELO_MS = 1800;
const PIXEL_RATIO_MAXIMO = 2;
const ETAPA_PROCESANDO = 1;   // LoaderStatus.Processing de la librería (no se exporta)
const LARGO_MAXIMO_ERROR = 300;

const $ = (sel) => document.querySelector(sel);

function mostrarError(mensaje, detalle) {
  console.error(mensaje, detalle);
  const carga = $('#carga');
  const caja = document.createElement('div');
  const titulo = document.createElement('h1');
  titulo.textContent = 'No se pudo abrir el recorrido';
  const texto = document.createElement('p');
  texto.className = 'error';
  texto.setAttribute('role', 'alert');
  texto.textContent = String(mensaje).slice(0, LARGO_MAXIMO_ERROR);
  caja.append(titulo, texto);
  carga.replaceChildren(caja);
  carga.hidden = false;
}

/** Índice de vistas generadas por IA (opcional): devuelve un mapa id → ruta de imagen. */
async function cargarVistasIA() {
  try {
    const r = await fetch(RUTA_INDICE_IA);
    if (!r.ok) return new Map();
    const entradas = await r.json();
    const porId = new Map(entradas.filter((e) => e.estado === 'ok' && e.archivo).map((e) => [e.id, { archivo: e.archivo }]));
    for (const e of entradas) {
      if (e.equivale_a && porId.has(e.equivale_a)) porId.set(e.id, { archivo: porId.get(e.equivale_a).archivo, equivaleA: e.equivale_a });
    }
    return porId;
  } catch (e) {
    console.warn('Sin vistas IA', e);
    return new Map();
  }
}

function asignarVistasIA(vistasIA) {
  for (const f of FOTOS) f.ia = vistasIA.get(`foto-${f.n}`)?.archivo ?? null;
  for (const d of DESTINOS) {
    const vista = vistasIA.get(`destino-${d.id}`);
    d.ia = vista?.archivo ?? null;
    // Si la vista IA es la de una foto, el destino usa esa foto (su encuadre y su pose) para no deformarla.
    d.fotoIA = vista?.equivaleA ? FOTOS.find((f) => `foto-${f.n}` === vista.equivaleA) ?? null : null;
  }
}

async function cargarTerreno() {
  const r = await fetch(RUTA_TERRENO);
  if (!r.ok) throw new Error(`No se encontró ${RUTA_TERRENO} (HTTP ${r.status})`);
  return new Terreno(await r.json());
}

function crearRenderer(contenedor) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    mostrarError('Se perdió el contexto gráfico (poca memoria). Recargá la página.');
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PIXEL_RATIO_MAXIMO));
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(contenedor.clientWidth, contenedor.clientHeight, false);
  contenedor.appendChild(renderer.domElement);
  return renderer;
}

function ajustarTamanio(renderer, camara, contenedor) {
  const ancho = contenedor.clientWidth;
  const alto = contenedor.clientHeight;
  if (!ancho || !alto) return;
  renderer.setSize(ancho, alto, false);
  camara.aspect = ancho / alto;
  camara.updateProjectionMatrix();
}

function crearFichas(contenedor, items, etiqueta, alElegir) {
  for (const item of items) {
    const b = document.createElement('button');
    b.textContent = etiqueta(item);
    b.dataset.id = item.id ?? String(item.n);
    b.addEventListener('click', () => alElegir(item, b));
    contenedor.appendChild(b);
  }
}

function marcarActiva(contenedor, boton) {
  for (const b of contenedor.querySelectorAll('button')) b.classList.toggle('activo', b === boton);
}

async function iniciar() {
  const escena = $('#escena');
  const progreso = $('#carga .barra > div');
  const textoCarga = $('#carga p');

  const [terreno, vistasIA] = await Promise.all([cargarTerreno(), cargarVistasIA()]);
  asignarVistasIA(vistasIA);
  const camara = new THREE.PerspectiveCamera(FOV_PASEO, 1, 0.1, 400);
  const renderer = crearRenderer(escena);
  ajustarTamanio(renderer, camara, escena);
  new ResizeObserver(() => ajustarTamanio(renderer, camara, escena)).observe(escena);

  const controles = new ControlesPrimeraPersona({ camara, elemento: escena, terreno, joystick: $('#joystick') });
  controles.teletransportar(POSE_INICIAL);

  const minimapa = new MiniMapa({
    contenedor: $('#minimapa'),
    imagenUrl: RUTA_MAPA,
    x0: terreno.x0,
    z0: terreno.z0,
    pxPorMetro: MAPA_PX_POR_METRO,
    alClick: ({ x, z }) => {
      if (terreno.esCaminable(x, z)) controles.volarA({ x, z }, DURACION_VUELO_MS);
    },
  });
  minimapa.fijarMarcadores([
    ...DESTINOS.map((d) => ({ tipo: 'destino', x: d.x, z: d.z })),
    ...FOTOS.map((f) => ({ tipo: 'foto', x: f.x, z: f.z, etiqueta: String(f.n) })),
  ]);

  const fichasDestinos = $('#fichas-destinos');
  const fichasFotos = $('#fichas-fotos');
  const comparador = new Comparador({
    panel: $('#comparador'),
    escena,
    imagen: $('#foto-superpuesta'),
    marco: $('#marco-foto'),
    camara,
    panelesVecinos: [$('#cabecera'), $('#lugares')],
    alCerrar: () => marcarActiva(fichasFotos, null),
    alCambiarEncuadre: () => ajustarTamanio(renderer, camara, escena),
  });

  crearFichas(fichasDestinos, DESTINOS, (d) => d.nombre, async (d, b) => {
    comparador.cerrar();
    marcarActiva(fichasDestinos, b);
    marcarActiva(fichasFotos, null);
    if (d.fotoIA) {
      comparador.abrir(d.fotoIA, 'ia');
      await controles.volarA(d.fotoIA, DURACION_VUELO_MS);
      return;
    }
    if (d.ia) {
      comparador.abrir({ n: null, titulo: d.nombre, archivo: null, ia: d.ia, ancho: FOV_VISTA_IA.ancho, alto: FOV_VISTA_IA.alto, fov: FOV_PASEO }, 'ia');
    }
    await controles.volarA(d, DURACION_VUELO_MS);
  });
  crearFichas(fichasFotos, FOTOS, (f) => `Foto ${f.n}`, async (f, b) => {
    marcarActiva(fichasDestinos, null);
    marcarActiva(fichasFotos, b);
    comparador.abrir(f);
    await controles.volarA(f, DURACION_VUELO_MS);
  });

  $('#boton-mouse').addEventListener('click', () => controles.capturarMouse());
  const botonCompletar = $('#boton-completar');
  const modelo = crearModeloRelleno();
  const casaRelleno = modelo.getObjectByName('casa');
  casaRelleno.visible = botonCompletar.classList.contains('activo');
  botonCompletar.setAttribute('aria-pressed', String(casaRelleno.visible));
  botonCompletar.addEventListener('click', () => {
    casaRelleno.visible = !casaRelleno.visible;
    botonCompletar.classList.toggle('activo', casaRelleno.visible);
    botonCompletar.setAttribute('aria-pressed', String(casaRelleno.visible));
  });
  const ayuda = $('#ayuda');
  const botonAyuda = $('#boton-ayuda');
  if (matchMedia(CONSULTA_MOVIL).matches) ayuda.classList.add('oculto');
  botonAyuda.setAttribute('aria-expanded', String(!ayuda.classList.contains('oculto')));
  botonAyuda.addEventListener('click', () => {
    const visible = ayuda.classList.toggle('oculto') === false;
    botonAyuda.setAttribute('aria-expanded', String(visible));
  });

  const hud = $('#hud');
  controles.alCambiar = (pose) => {
    minimapa.actualizar(pose);
    if (hud.classList.contains('visible')) {
      hud.textContent = `x ${pose.x.toFixed(2)}  y ${pose.y.toFixed(2)}  z ${pose.z.toFixed(2)}  yaw ${pose.yaw.toFixed(3)}  pitch ${pose.pitch.toFixed(3)}`;
    }
  };

  const viewer = new GaussianSplats3D.Viewer({
    rootElement: escena,
    renderer,
    camera: camara,
    cameraUp: [0, 1, 0],
    selfDrivenMode: true,
    useBuiltInControls: false,
    sharedMemoryForWorkers: false,
    gpuAcceleratedSort: false,
    sphericalHarmonicsDegree: 0,
    ignoreDevicePixelRatio: false,
    halfPrecisionCovariancesOnGPU: false,
  });

  const esPlyInicial = RUTA_MODELO.toLowerCase().split('?')[0].endsWith('.ply');
  const formatoInicial = esPlyInicial ? GaussianSplats3D.SceneFormat.Ply : GaussianSplats3D.SceneFormat.KSplat;

  try {
    await viewer.addSplatScene(RUTA_MODELO, {
      showLoadingUI: false,
      // Sin carga progresiva: con 11 MB alcanza, la barra es fiel y un fallo de descarga llega al catch.
      progressiveLoad: false,
      format: formatoInicial,
      rotation: ROTACION_ESCENA,
      onProgress: (porcentaje, etiqueta, etapa) => {
        const p = Number.isFinite(porcentaje) ? Math.min(100, Math.round(porcentaje)) : null;
        if (p !== null) progreso.style.width = `${p}%`;
        textoCarga.textContent = etapa === ETAPA_PROCESANDO
          ? 'Preparando el escaneo…'
          : `Descargando el escaneo…${p !== null ? ` ${p}%` : ''}`;
      },
    });
  } catch (e) {
    mostrarError(`No se pudo cargar ${RUTA_MODELO}. ${e?.message ?? e}`, e);
    return;
  }
  viewer.threeScene.add(modelo);
  viewer.start();
  $('#carga').hidden = true;

  async function cargarArchivoSplat(archivo) {
    const esPly = archivo.name.toLowerCase().endsWith('.ply');
    const formato = esPly ? GaussianSplats3D.SceneFormat.Ply : GaussianSplats3D.SceneFormat.KSplat;
    const url = URL.createObjectURL(archivo);
    $('#carga').hidden = false;
    textoCarga.textContent = `Cargando ${archivo.name}…`;
    progreso.style.width = '0%';
    try {
      while (viewer.splatMesh && viewer.splatMesh.scenes && viewer.splatMesh.scenes.length > 0) {
        await viewer.removeSplatScene(0);
      }
      await viewer.addSplatScene(url, {
        showLoadingUI: false,
        progressiveLoad: false,
        format: formato,
        rotation: ROTACION_ESCENA,
        onProgress: (porcentaje, etiqueta, etapa) => {
          const p = Number.isFinite(porcentaje) ? Math.min(100, Math.round(porcentaje)) : null;
          if (p !== null) progreso.style.width = `${p}%`;
          textoCarga.textContent = etapa === ETAPA_PROCESANDO
            ? 'Preparando el escaneo…'
            : `Procesando ${archivo.name}…${p !== null ? ` ${p}%` : ''}`;
        },
      });
      $('#carga').hidden = true;
    } catch (err) {
      mostrarError(`Error al cargar ${archivo.name}: ${err?.message ?? err}`);
    }
  }

  const botonCargarPly = $('#boton-cargar-ply');
  const inputPly = $('#input-archivo-ply');
  if (botonCargarPly && inputPly) {
    botonCargarPly.addEventListener('click', () => inputPly.click());
    inputPly.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) cargarArchivoSplat(f);
    });
  }

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f && (f.name.endsWith('.ply') || f.name.endsWith('.ksplat'))) {
      cargarArchivoSplat(f);
    }
  });

  let ultimo = performance.now();
  const paso = (ahora) => {
    requestAnimationFrame(paso);
    const dt = (ahora - ultimo) / 1000;
    ultimo = ahora;
    controles.actualizar(ahora, dt);
  };
  requestAnimationFrame(paso);

  // Utilidades para ajustar poses desde la consola del navegador.
  window.visor = {
    pose: () => controles.pose,
    ir: (x, z, yaw = 0, pitch = 0) => controles.teletransportar({ x, z, yaw, pitch }),
    libre: (x, y, z, yaw = 0, pitch = 0) => { controles.modoLibre = true; controles.teletransportar({ x, y, z, yaw, pitch }); },
    caminar: () => { controles.modoLibre = false; },
    hud: (visible = true) => hud.classList.toggle('visible', visible),
    comparar: (n) => { const f = FOTOS.find((x) => x.n === n); if (f) comparador.abrir(f); },
    opacidad: (v) => comparador.fijarOpacidad(v),
    cerrar: () => comparador.cerrar(),
    viewer,
    terreno,
    fotos: FOTOS,
    destinos: DESTINOS,
    modelo,
  };
}

iniciar().catch((e) => mostrarError(e?.message ?? String(e), e));
