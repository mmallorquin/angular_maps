# Ver y recorrer el modelo 3D del lote a partir del archivo .ply

Este documento explica cómo abrir, recorrer y publicar el escaneo del lote exportado desde Scaniverse como **splat (.ply)**. Hay tres niveles, de más rápido a más completo. Todos los comandos están listos para copiar y pegar.

- **Nivel 1:** verlo en 2 minutos, sin instalar nada.
- **Nivel 2:** visor propio en tu computadora, recorrible con teclado y mouse.
- **Nivel 3:** entregarle el archivo a Claude para que arme el recorrido final con comparador de fotos.

---

## Qué es el archivo .ply que exportaste

Scaniverse en modo **Splat** genera un *gaussian splat*: millones de puntos con color, tamaño y transparencia que, vistos juntos, reproducen la escena con realismo fotográfico. No es una malla con paredes, por eso:

- se ve mucho más real que una malla,
- no sirve para "chocar" contra paredes (eso se agrega con la malla GLB),
- pesa entre 50 y 500 MB.

Si además exportaste el **GLB** (modo Mesh), guardalo: es el que da colisiones y escala.

---

## Nivel 1: verlo ya, sin instalar nada

1. Abrí en el navegador de la computadora **https://superspl.at/editor** (editor gratuito de PlayCanvas, corre en el navegador, no sube el archivo a ningún servidor).
2. Arrastrá el archivo `.ply` a la ventana.
3. Navegación: botón izquierdo del mouse orbita, rueda acerca, botón derecho desplaza. Tecla `F` centra la vista.
4. Si la escena está dada vuelta o inclinada, en el panel derecho usá **Transform** para rotarla hasta que el piso quede horizontal. Después **File → Export → Compressed .ply**: ese archivo pesa 4 a 6 veces menos y es el ideal para los niveles 2 y 3.

Alternativa igual de simple: **https://antimatter15.com/splat/** acepta arrastrar un `.ply` y se recorre con WASD.

---

## Nivel 2: visor propio recorrible en primera persona

Requisitos: una computadora con **Node.js** (https://nodejs.org, versión LTS) y el archivo `.ply`. Funciona en Windows, Mac y Linux.

### 2.1 Crear la carpeta del visor

En Git Bash (Windows) o Terminal (Mac/Linux):

```bash
mkdir -p ~/visor-lote/modelo
cd ~/visor-lote
```

Copiá tu archivo `.ply` dentro de `~/visor-lote/modelo/` y renombralo a `lote.ply`:

```bash
cp ~/Downloads/NOMBRE-DE-TU-ARCHIVO.ply ~/visor-lote/modelo/lote.ply
ls -lh modelo/
```

### 2.2 Crear la página del visor

Creá el archivo `~/visor-lote/index.html` con este contenido exacto:

```html
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lote 24 × 30 · recorrido 3D</title>
<style>
  html, body { margin: 0; height: 100%; background: #0f1512; color: #eef1ea; font: 14px system-ui, sans-serif; overflow: hidden; }
  #ayuda { position: fixed; left: 12px; bottom: 12px; background: rgba(0,0,0,.6); padding: 8px 12px; border-radius: 6px; }
  #carga { position: fixed; inset: 0; display: grid; place-items: center; font-size: 18px; }
  kbd { border: 1px solid #777; border-radius: 3px; padding: 0 4px; }
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "@mkkellogg/gaussian-splats-3d": "https://cdn.jsdelivr.net/npm/@mkkellogg/gaussian-splats-3d@0.4.7/build/gaussian-splats-3d.module.js"
  }
}
</script>
</head>
<body>
<div id="carga">Cargando el escaneo…</div>
<div id="ayuda"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> caminar · mouse mirar · <kbd>Q</kbd>/<kbd>E</kbd> subir y bajar · <kbd>Shift</kbd> correr</div>
<script type="module">
import * as THREE from 'three';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

const viewer = new GaussianSplats3D.Viewer({
  cameraUp: [0, 1, 0],
  initialCameraPosition: [0, 1.6, 6],
  initialCameraLookAt: [0, 1.2, 0],
  sharedMemoryForWorkers: false,   // evita exigir cabeceras especiales del servidor
  gpuAcceleratedSort: true,
  useBuiltInControls: false,       // usamos controles propios en primera persona
});

viewer.addSplatScene('modelo/lote.ply', {
  showLoadingUI: true,
  progressiveLoad: true,
  // Si el modelo aparece dado vuelta, probá rotation: [1, 0, 0, 0] (180° en X) o ajustá en SuperSplat y exportá de nuevo.
  rotation: [0, 0, 0, 1],
  scale: [1, 1, 1],
  position: [0, 0, 0],
}).then(() => {
  document.getElementById('carga').remove();
  viewer.start();
});

// --- Controles en primera persona ---
const cam = viewer.camera;
const teclas = {};
let yaw = 0, pitch = 0, correr = false;
addEventListener('keydown', e => { teclas[e.key.toLowerCase()] = true; if (e.key === 'Shift') correr = true; });
addEventListener('keyup',   e => { teclas[e.key.toLowerCase()] = false; if (e.key === 'Shift') correr = false; });
const lienzo = viewer.renderer.domElement;
lienzo.addEventListener('click', () => lienzo.requestPointerLock());
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== lienzo) return;
  yaw   -= e.movementX * 0.0025;
  pitch  = Math.max(-1.4, Math.min(1.4, pitch - e.movementY * 0.0025));
});
let ultimo = performance.now();
function paso(ahora) {
  requestAnimationFrame(paso);
  const dt = Math.min(0.05, (ahora - ultimo) / 1000); ultimo = ahora;
  const v = (correr ? 4.5 : 2.2) * dt;
  const adelante = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const derecha  = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  if (teclas['w'] || teclas['arrowup'])    cam.position.addScaledVector(adelante,  v);
  if (teclas['s'] || teclas['arrowdown'])  cam.position.addScaledVector(adelante, -v);
  if (teclas['d'] || teclas['arrowright']) cam.position.addScaledVector(derecha,   v);
  if (teclas['a'] || teclas['arrowleft'])  cam.position.addScaledVector(derecha,  -v);
  if (teclas['e']) cam.position.y += v;
  if (teclas['q']) cam.position.y -= v;
  cam.rotation.set(0, 0, 0, 'YXZ');
  cam.rotation.y = yaw;
  cam.rotation.x = pitch;
}
requestAnimationFrame(paso);
</script>
</body>
</html>
```

### 2.3 Servir la carpeta y abrir el visor

Los navegadores no cargan archivos grandes desde `file://`, hace falta un servidor local. Con Node instalado:

```bash
cd ~/visor-lote
npx --yes http-server . -p 8080 -c-1
```

Abrí **http://localhost:8080** en Chrome o Edge. La primera carga de un `.ply` de 150 MB tarda entre 20 y 60 segundos. Hacé clic en la escena para capturar el mouse y caminá con WASD. `Esc` libera el mouse.

### 2.4 Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| La escena aparece boca abajo o de costado | El escaneo guardó otro eje "arriba" | Rotá en SuperSplat (Nivel 1) y exportá de nuevo, o cambiá `rotation` en `addSplatScene` por `[1, 0, 0, 0]` |
| Carga muy lenta o el navegador se congela | Archivo sin comprimir | Exportá desde SuperSplat como **Compressed .ply**, o convertí a `.ksplat` (ver 2.5) |
| Pantalla negra sin error | Ruta del archivo incorrecta | Confirmá que exista `modelo/lote.ply` con `ls modelo/` |
| Error de `SharedArrayBuffer` | Falta `sharedMemoryForWorkers: false` | Ya está puesto en el HTML; verificá que no lo hayas borrado |
| Se ve con "nubes" flotando alrededor | Puntos sueltos del escaneo | Recortalos en SuperSplat con la herramienta de selección y borrado |

### 2.5 Opcional: convertir a .ksplat para que cargue más rápido

```bash
cd ~/visor-lote
npm init -y >/dev/null
npm install @mkkellogg/gaussian-splats-3d@0.4.7
node node_modules/@mkkellogg/gaussian-splats-3d/util/create-ksplat.js modelo/lote.ply modelo/lote.ksplat 1 5
```

Después cambiá en `index.html` la línea `viewer.addSplatScene('modelo/lote.ply'` por `viewer.addSplatScene('modelo/lote.ksplat'`. El `.ksplat` pesa alrededor de un tercio y abre en segundos.

---

## Nivel 3: entregarle el archivo a Claude para el recorrido final

Claude no puede recibir el `.ply` por el chat (límite de tamaño) ni descargarlo de Drive o Dropbox desde su sesión. La vía que funciona es el repositorio de GitHub `mmallorquin/angular_maps`, al que su sesión tiene acceso.

### 3.1 Subir el archivo en partes de 90 MB

```bash
cd ~/Downloads
git clone https://github.com/mmallorquin/angular_maps.git
cd angular_maps
git checkout -b escaneo-3d
mkdir -p escaneo

# Partir el splat (reemplazá la ruta por la de tu archivo; usá el Compressed .ply si lo tenés)
split -b 90m -d ~/visor-lote/modelo/lote.ply escaneo/lote.ply.part

# Si también exportaste la malla:
# split -b 90m -d ~/Downloads/lote.glb escaneo/lote.glb.part

# Suma de verificación para confirmar que llegó entero
shasum -a 256 ~/visor-lote/modelo/lote.ply > escaneo/lote.ply.sha256

ls -lh escaneo/
git add escaneo/
git commit -m "Escaneo 3D del lote (splat) en partes"
git push -u origin escaneo-3d
```

En Windows, si `shasum` no existe, usá `sha256sum`. Si el `push` pide usuario y contraseña, cerrá esa ventana y volvé a ejecutar el `push`: GitHub abre el inicio de sesión en el navegador.

### 3.2 Prompt para Claude

Cuando el `push` termine, pegale esto a Claude en la misma conversación del modelo del lote:

```
Subí el escaneo del lote a la rama escaneo-3d del repositorio mmallorquin/angular_maps,
en la carpeta escaneo/, partido en archivos lote.ply.part00, part01, ... con su suma
en lote.ply.sha256. [Si corresponde: también está la malla en lote.glb.partNN.]

Uní las partes, verificá la suma y armá el visor web en primera persona con ese
modelo real, sin modelar nada a mano:
- caminar con WASD y mouse, táctil en celular, ojos a 1,6 m;
- colisiones usando la malla GLB si está; si no, limitá el recorrido al área escaneada;
- destinos: calle, portón, galería, sala, dormitorio, baño, arboleda;
- mini plano con mi posición;
- botones "Comparar con la foto N" con las 19 fotos que ya tenés, en el punto de cada toma.
Si el archivo supera 15 MB, comprimilo o partilo para publicarlo, sin perder detalle visible.
```

---

## Resumen

| Quiero… | Hago… |
|---|---|
| Verlo ahora mismo | Nivel 1: arrastrar el `.ply` a superspl.at/editor |
| Recorrerlo en mi computadora | Nivel 2: carpeta `visor-lote`, `index.html` de arriba, `npx http-server` |
| Que Claude arme el recorrido final | Nivel 3: subir en partes a la rama `escaneo-3d` y pegar el prompt |
