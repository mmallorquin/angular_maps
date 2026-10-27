#!/usr/bin/env node
/**
 * Abre el recorrido (visor/index.html), la maqueta (visor/maqueta.html) y el comparador en un
 * Chromium sin cabeza, espera a que terminen de cargar, saca una captura de cada uno y falla si
 * hubo errores de JavaScript o de red. Uso: node herramientas/verificar-paginas.mjs [--salida /tmp/capturas]
 */
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { servirCarpeta, cargarPlaywright, ARGS_CHROMIUM } from './lib/servidor.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ESPERA_MAXIMA_MS = 180000;
const PAGINAS = [
  { nombre: 'recorrido', ruta: 'visor/index.html', listo: () => document.querySelector('#carga').hidden, accion: async (page) => { await page.click('#boton-completar'); await page.waitForTimeout(500); } },
  { nombre: 'maqueta', ruta: 'visor/maqueta.html', listo: () => document.querySelector('#carga').hidden },
  { nombre: 'comparar', ruta: 'visor/comparar.html?foto=6', listo: () => window.comparar?.listo },
];

async function verificar(browser, puerto, pagina, salida) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const problemas = [];
  page.on('pageerror', (e) => problemas.push(`error JS: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problemas.push(`consola: ${m.text()}`); });
  page.on('requestfailed', (r) => problemas.push(`red: ${r.url()} ${r.failure()?.errorText ?? ''}`));
  page.on('response', (r) => { if (r.status() >= 400) problemas.push(`HTTP ${r.status()}: ${r.url()}`); });
  try {
    await page.goto(`http://127.0.0.1:${puerto}/${pagina.ruta}`);
    await page.waitForFunction(pagina.listo, null, { timeout: ESPERA_MAXIMA_MS });
    await page.waitForTimeout(1500);
    if (pagina.accion) await pagina.accion(page);
    await page.screenshot({ path: path.join(salida, `${pagina.nombre}.png`) });
  } catch (e) {
    problemas.push(`fallo: ${e.message}`);
  } finally {
    await page.close();
  }
  return problemas;
}

async function main() {
  const salida = path.resolve(process.argv.includes('--salida') ? process.argv[process.argv.indexOf('--salida') + 1] : '/tmp/casa3d-verificacion');
  await mkdir(salida, { recursive: true });
  const { chromium } = await cargarPlaywright(createRequire(import.meta.url));
  const { server, puerto } = await servirCarpeta(RAIZ);
  const browser = await chromium.launch({ args: ARGS_CHROMIUM });
  let fallos = 0;
  try {
    for (const pagina of PAGINAS) {
      const problemas = await verificar(browser, puerto, pagina, salida);
      fallos += problemas.length;
      console.log(`${problemas.length ? '✗' : '✓'} ${pagina.nombre} → ${path.join(salida, `${pagina.nombre}.png`)}${problemas.map((p) => `\n    ${p}`).join('')}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  process.exit(fallos ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
