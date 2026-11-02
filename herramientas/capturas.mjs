#!/usr/bin/env node
/**
 * Capturas cuadradas de la maqueta desde vistas fijas (para compartir). Las poses están en el marco de la
 * casa (a, b) y se convierten al mundo con la misma rotación que usa modelo.js.
 * Uso: node herramientas/capturas.mjs [--salida carpeta] [--ancho 1080]
 */
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { servirCarpeta, cargarPlaywright, ARGS_CHROMIUM } from './lib/servidor.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ESPERA_MAXIMA_MS = 90000;
// [nombre, a, b, altura, giro respecto de +a (rad, positivo a la izquierda), pitch, fov, parámetros extra de la URL]
const VISTAS = [
  ['1-desde-la-calle', -13, -2, 1.5, -0.1, 0.08, 60],
  ['2-porton-y-entrada', -12.5, -9.5, 1.5, 0.2, 0.06, 68, 'arboles=0'],
  ['3-esquina-sur', -5.8, -1.5, 1.4, -0.15, 0.1, 72],
  ['4-fachada-jardin', 5.5, -9, 1.5, -Math.PI / 2, 0.07, 62],
  ['5-galeria', 3.5, -3.5, 1.5, -Math.PI / 2 + 0.35, 0.08, 66],
  ['6-aerea', -26, -20, 24, -0.41, -0.57, 58],
  ['7-planta', 8.5, -5.1, 50, 0, -1.5707, 46],
];

function leerArgumentos(argv) {
  const args = { salida: 'visor/renders/capturas', ancho: 1080 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i].replace(/^--/, '');
    const igual = arg.indexOf('=');
    const clave = igual < 0 ? arg : arg.slice(0, igual);
    const valor = igual < 0 ? argv[++i] : arg.slice(igual + 1);
    if (clave === 'salida') args.salida = valor;
    else if (clave === 'ancho') args.ancho = Number(valor);
    else throw new Error(`Argumento desconocido: ${argv[i]}`);
  }
  return args;
}

async function main() {
  const args = leerArgumentos(process.argv.slice(2));
  const { MEDIDAS: M } = await import(pathToFileURL(path.join(RAIZ, 'visor/js/medidas.js')).href);
  const ang = Math.atan2(-M.direccionFachada.z, M.direccionFachada.x);
  const aMundo = (a, b) => ({ x: M.esquinaSur.x + a * Math.cos(ang) + b * Math.sin(ang), z: M.esquinaSur.z - a * Math.sin(ang) + b * Math.cos(ang) });
  // yaw de three (0 = mirando a -Z): mirar hacia +a es yaw = atan2(-ax, -az) con (ax, az) = dirección a.
  const yawA = Math.atan2(-M.direccionFachada.x, -M.direccionFachada.z);
  const salida = path.resolve(RAIZ, args.salida);
  await mkdir(salida, { recursive: true });
  const { chromium } = await cargarPlaywright(createRequire(import.meta.url));
  const { server, puerto } = await servirCarpeta(RAIZ);
  const browser = await chromium.launch({ args: ARGS_CHROMIUM });
  try {
    for (const [nombre, a, b, y, giro, pitch, fov, extra = ''] of VISTAS) {
      const p = aMundo(a, b);
      const page = await browser.newPage({ viewport: { width: args.ancho, height: args.ancho } });
      try {
        const q = `x=${p.x.toFixed(2)}&z=${p.z.toFixed(2)}&y=${y}&yaw=${(yawA + giro).toFixed(3)}&pitch=${pitch}&fov=${fov}`;
        await page.goto(`http://127.0.0.1:${puerto}/visor/comparar.html?ui=0&${q}${extra ? `&${extra}` : ''}`);
        await page.waitForFunction(() => window.comparar?.listo, null, { timeout: ESPERA_MAXIMA_MS });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(salida, `${nombre}.jpg`), type: 'jpeg', quality: 88 });
        console.log(`${nombre} → ${path.relative(RAIZ, salida)}/${nombre}.jpg`);
      } finally {
        await page.close();
      }
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
