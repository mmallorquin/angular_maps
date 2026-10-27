import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TIPOS = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ksplat': 'application/octet-stream', '.ply': 'application/octet-stream',
};

/** Servidor estático mínimo sobre `raiz` en un puerto libre de localhost. Devuelve { server, puerto }. */
export function servirCarpeta(raiz) {
  const base = path.resolve(raiz);
  const server = createServer(async (req, res) => {
    let ruta;
    try {
      ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch (e) {
      res.writeHead(400).end();
      return;
    }
    const archivo = path.resolve(base, `.${ruta}`);
    if (archivo !== base && !archivo.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
    try {
      const datos = await readFile(archivo);
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] ?? 'application/octet-stream' });
      res.end(datos);
    } catch (e) {
      res.writeHead(e.code === 'ENOENT' ? 404 : 500).end();
    }
  });
  return new Promise((resolver) => server.listen(0, '127.0.0.1', () => resolver({ server, puerto: server.address().port })));
}

/** Carga Playwright desde node_modules o desde PLAYWRIGHT_DIR. */
export async function cargarPlaywright(require) {
  for (const c of [process.env.PLAYWRIGHT_DIR, 'playwright'].filter(Boolean)) {
    try {
      return require(c);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
  }
  throw new Error('No se encontró Playwright: npm i -D playwright && npx playwright install chromium, o PLAYWRIGHT_DIR=…');
}

export const ARGS_CHROMIUM = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
