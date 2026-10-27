# Casa · recorrido 3D

Visor web en primera persona del escaneo del lote (gaussian splat exportado desde
Scaniverse), con mini plano, destinos y comparación contra las fotos reales.

## Cómo abrirlo

Hace falta un servidor local (los navegadores no cargan archivos grandes desde `file://`).
Con Node instalado, desde la carpeta `3d casa`:

```bash
npx --yes http-server visor -p 8080 -c-1
```

y abrir **http://localhost:8080** en Chrome, Edge o Safari. También funciona con Python:

```bash
python3 -m http.server 8080 --directory visor
```

## Controles

- **Escritorio:** `W A S D` o flechas para caminar, arrastrar con el mouse para mirar
  (o "Capturar mouse" para girar sin arrastrar; `Esc` suelta), `Shift` corre.
- **Celular:** pulgar izquierdo camina (joystick), pulgar derecho mira.
- **Mini plano:** tocá un punto para ir hasta ahí.
- **Ir a:** vuela hasta calle, portón, galería, sala, dormitorio, baño y arboleda.
- **Comparar con la foto N:** lleva la cámara al punto de la toma, recorta la vista al
  encuadre de la foto y la superpone con un control de opacidad (3D ↔ Foto). Si esa vista tiene
  una versión completada con IA, el botón **Vista IA** la superpone en lugar de la foto real.
- **Completar casa:** activa un modelo paramétrico de relleno (paredes, techo con alero y vigas,
  hastial de piedra, aberturas, galería) que asoma solo donde el escaneo tiene huecos. El entorno
  de relleno (plano de suelo, galpón, portón, muros vecinos) está siempre activo.

## Carpetas

| Carpeta | Contenido |
|---|---|
| `modelo/casa.ksplat` | Escaneo limpio y comprimido (448 k splats, 10,8 MB) generado a partir de `casa3d.ply` |
| `datos/terreno.json` | Grilla de 0,5 m con la altura del piso y las celdas bloqueadas (paredes, árboles) |
| `datos/mapa.png` | Imagen cenital para el mini plano (10 px por metro, origen en X=-8, Z=-22) |
| `fotos/` | Las 13 fotos reales (11: hastial de cerca, 12: ventanal y chimenea, 13: fachada de noche) |
| `js/lugares.js` | Coordenadas de los destinos y de cada foto, con el FOV sacado del EXIF de cada toma (se calibran con `comparar.html`) |
| `js/medidas.js` | Todas las medidas de la casa y el lote en metros (planta del escaneo; alturas y despieces de las fotos) |
| `js/modelo.js` | Arma el modelo con `geometria.js` (bloques, prismas, aberturas, faroles), `casa-cuerpo.js` (pisos, paredes, techo, interior), `casa-hastial.js` (portal pentagonal) y `entorno.js` (galpón, portón, alambrado, muros, suelo) |
| `comparar.html` | Calibrador: maqueta en primera persona superpuesta a cada foto (ver abajo) |
| `datos/ficha-casa.json` / `.md` | Características de la casa y el lote extraídas de las fotos |
| `renders/` | Capturas base del escaneo en cada vista (insumo para las imágenes IA) |
| `ia/` | Vistas completadas con IA (`indice.json` dice cuáles están y cuáles faltan) |
| `lib/` | three.js 0.160 y @mkkellogg/gaussian-splats-3d 0.4.7 |

## Sistema de coordenadas

Metros. X hacia la derecha del plano, Y hacia arriba, Z hacia abajo del plano. El escaneo
original guarda Y hacia abajo, por eso el visor lo rota 180° alrededor de X al cargarlo.
Referencias: esquina sur de la casa (hastial de piedra) en (10, -1.6); fachada vidriada hacia
el suroeste hasta (5.2, -10.7); galpón de madera en (3.2, 1.6); portón en (0.5..4, 9.5).

## Ajustar un punto

Abrí la consola del navegador y usá `visor.pose()` para leer la posición actual,
`visor.ir(x, z, yaw, pitch)` para saltar a una pose y `visor.hud()` para ver las
coordenadas en pantalla. Después copiá los valores a `js/lugares.js`.

## Comparar la maqueta con las fotos (`comparar.html`)

Abre la maqueta paramétrica con la cámara en la pose de una foto y la foto superpuesta con
opacidad ajustable. Sirve para que el modelo sea fiel desde todos los ángulos: si un borde del 3D no
cae sobre el de la foto, se corrige la medida en `js/medidas.js` o la pose en `js/lugares.js`.

- `comparar.html?foto=6` abre la foto 6; `&op=0.5` fija la opacidad; `&lado=1` pone maqueta y foto
  una al lado de la otra con una grilla; `&arboles=0` oculta los árboles; `&ui=0` esconde los paneles.
- `W A S D` mueve la cámara, `Q`/`E` baja y sube, las flechas giran, `[`/`]` cambian el FOV,
  `Shift` da pasos grandes, `1`/`2`/`3` muestran 3D, mezcla o foto. **Copiar pose** deja en el
  portapapeles la línea lista para pegar en `js/lugares.js`.
- Desde la terminal, `npm run render:vistas -- --fotos 1,6,11` guarda en `renders/maqueta/` las
  vistas 3D, mezcla, foto y lado a lado de cada toma (requiere Playwright: `npm i -D playwright &&
  npx playwright install chromium`). `npm run verificar` abre el recorrido, la maqueta y el
  comparador sin cabeza y falla si hay errores de consola o de red.

## Maqueta 3D (`maqueta.html`)

Representación en three.js con las medidas calibradas contra las 13 fotos y los materiales de la ficha:
casa con techo desmontable e interior (sala/cocina, dormitorio, baño), hastial de piedra,
galería, galpón, portón y alambrado, muros vecinos, árboles en las posiciones detectadas en el
escaneo (`datos/arboles.json`) y contorno aproximado del lote de 24 × 30 m. Vistas Aérea / Frente /
Calle / Planta, capas (techo, árboles, etiquetas, lote, propuestas) y **propuestas a futuro**
(pileta, quincho, cochera, ampliación) que se arrastran por el lote y se giran con `R`; quedan
guardadas en el navegador. Las medidas salen de la nube de puntos; lo que no está escaneado
(fachada noreste, interior) es estimado.

## Vistas completadas con IA

Se generan con la herramienta de imágenes de Canva (imagen a imagen): el render del escaneo fija el
encuadre y la foto real da los materiales y la luz. El prompt base está en `ia/README.md`. Para
generar las que faltan (o regenerar alguna), pegá en Claude el contenido de
`../PROMPT-completar-modelo.md` o pedí solo el paso 4 con las vistas pendientes de `ia/indice.json`.
