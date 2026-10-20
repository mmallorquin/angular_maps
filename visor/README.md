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
| `fotos/` | Las 10 fotos reales |
| `js/lugares.js` | Coordenadas de los destinos y de cada foto (se ajustan a mano) |
| `js/modelo.js` | Modelo de relleno: medidas tomadas de la nube de puntos (plano de fachada, alero, cumbrera, piso) |
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

## Maqueta 3D (`maqueta.html`)

Representación en three.js de formas y posiciones (no exacta) con los materiales de la ficha:
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
