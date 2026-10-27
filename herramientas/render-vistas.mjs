#!/usr/bin/env node
/**
 * Renderiza la maqueta paramétrica desde la pose de cada foto (visor/comparar.html) y guarda,
 * por foto, la vista 3D sola, la mezcla al 50 % con la foto y la foto sola, para revisar la
 * fidelidad del modelo ángulo por ángulo sin abrir el navegador.
 *
 * Uso:  node herramientas/render-vistas.mjs [--fotos 1,2,11] [--salida visor/renders/maqueta] [--ancho 900]
 *       [--pose x=..,z=..,yaw=..,pitch=..,fov=..]   (prueba otra pose para las fotos elegidas)
 * Requiere Playwright (npm i -D playwright && npx playwright install chromium). Si está instalado en
 * otra carpeta, PLAYWRIGHT_DIR=/ruta/a/node_modules/playwright.
 */
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { servirCarpeta, cargarPlaywright, ARGS_CHROMIUM } from './lib/servidor.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANCHO_POR_DEFECTO = 900;
const SALIDA_POR_DEFECTO = 'visor/renders/maqueta';
const ESPERA_MAXIMA_MS = 60000;
const VISTAS = [['3d', 0], ['mezcla', 0.5], ['foto', 1]];

function leerArgumentos(argv) {
  const args = { fotos: null, salida: SALIDA_POR_DEFECTO, ancho: ANCHO_POR_DEFECTO, pose: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i].replace(/^--/, '');
    const igual = arg.indexOf('=');
    const clave = igual < 0 ? arg : arg.slice(0, igual);
    const valor = igual < 0 ? argv[++i] : arg.slice(igual + 1);
    if (clave === 'fotos') args.fotos = valor.split(',').map(Number).filter(Number.isFinite);
    else if (clave === 'salida') args.salida = valor;
    else if (clave === 'ancho') args.ancho = Number(valor);
    else if (clave === 'pose') args.pose = valor.split(',').map((p) => p.trim()).filter(Boolean).join('&');
    else throw new Error(`Argumento desconocido: ${argv[i]}`);
  }
  if (!(args.ancho > 100)) throw new Error('--ancho debe ser un número mayor a 100');
  return args;
}

async function leerFotos() {
  const modulo = await import(pathToFileURL(path.join(RAIZ, 'visor/js/lugares.js')).href);
  return modulo.FOTOS;
}

async function renderizarFoto({ browser, puerto, foto, ancho, salida, pose }) {
  const alto = Math.round((ancho * foto.alto) / foto.ancho);
  const page = await browser.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  try {
    await page.goto(`http://127.0.0.1:${puerto}/visor/comparar.html?foto=${foto.n}&ui=0${pose ? `&${pose}` : ''}`);
    await page.waitForFunction(() => window.comparar?.listo, null, { timeout: ESPERA_MAXIMA_MS });
    const estado = await page.evaluate(() => window.comparar);
    if (estado.error) throw new Error(`comparar.html falló: ${estado.error}`);
    await page.evaluate(() => document.querySelector('#foto').decode());
    await capturarVistas(page, foto, salida, ancho, alto);
  } catch (e) {
    throw new Error(`foto ${foto.n}: ${e.message}${errores.length ? ` | ${errores.join(' | ')}` : ''}`);
  } finally {
    await page.close();
  }
  return errores;
}

async function capturarVistas(page, foto, salida, ancho, alto) {
  for (const [nombre, opacidad] of VISTAS) {
    await page.evaluate((op) => { const img = document.querySelector('#foto'); img.style.opacity = String(op); }, opacidad);
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(salida, `foto-${foto.n}-${nombre}.png`) });
  }
  // Lado a lado con grilla: la maqueta a la izquierda y la foto a la derecha, al mismo tamaño.
  await page.setViewportSize({ width: ancho * 2, height: alto });
  await page.evaluate(() => document.body.classList.add('lado'));
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(salida, `foto-${foto.n}-lado.png`) });
}

async function main() {
  const args = leerArgumentos(process.argv.slice(2));
  const { chromium } = await cargarPlaywright(createRequire(import.meta.url));
  const fotos = (await leerFotos()).filter((f) => !args.fotos || args.fotos.includes(f.n));
  if (!fotos.length) throw new Error('Ninguna foto coincide con --fotos');
  const salida = path.resolve(RAIZ, args.salida);
  await mkdir(salida, { recursive: true });
  const { server, puerto } = await servirCarpeta(RAIZ);
  const browser = await chromium.launch({ args: ARGS_CHROMIUM });
  try {
    for (const foto of fotos) {
      const errores = await renderizarFoto({ browser, puerto, foto, ancho: args.ancho, salida, pose: args.pose });
      console.log(`foto ${foto.n}: ${path.relative(RAIZ, salida)}/foto-${foto.n}-{3d,mezcla,foto,lado}.png${errores.length ? `  ⚠ ${errores.join(' | ')}` : ''}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
