# ia/ - vistas completadas con IA (Canva, imagen a imagen)

Estado (2026-10-19 07:00 -03): **6 de 16 vistas distintas logradas** (foto-1, foto-2, foto-3, foto-6, foto-9, foto-10) mas destino-galeria, que equivale a foto-1. Las otras 7 siguen pendientes: Canva volvio a responder `quota_exceeded` ("You have exceeded your credit quota.") al intentar foto-8.

| id | estado | archivo |
|---|---|---|
| foto-1 | ok | ia/foto-1.jpg (1088x1456) |
| foto-2 | ok | ia/foto-2.jpg (1088x1456) |
| foto-3 | ok | ia/foto-3.jpg (1456x1088) |
| foto-6 | ok | ia/foto-6.jpg (1456x1088) |
| foto-9 | ok | ia/foto-9.jpg (1456x1088) |
| foto-10 | ok | ia/foto-10.jpg (1456x1088) |
| destino-galeria | ok | = foto-1 (campo `equivale_a`) |
| foto-8, foto-4, foto-5, foto-7, destino-sala, destino-dormitorio, destino-banio | pendiente (cuota) | - |
| destino-calle, destino-porton, destino-arboleda | pendiente: equivalen a foto-5, foto-4, foto-8 | - |

## Registro de intentos

- 2026-10-18 (noche): foto-6, foto-3, foto-2, foto-1 logradas; foto-10 fallo con `quota_exceeded`.
- 2026-10-19 ~06:50-07:00 (-03): foto-10 y foto-9 logradas (los creditos alcanzaron para 2 generaciones); foto-8 devolvio `quota_exceeded` de inmediato. No se reintento. Las subidas para foto-8 (render `MAHYcN0yxC8`, foto `MAHYcLORURk`) ya estan hechas; los intentos de subida de foto-4/5/7 y destinos no se usaron (las URLs de un solo uso vencen).

Pendientes en orden de prioridad: foto-8, foto-4, foto-5, foto-7, destino-sala (ref. foto-1), destino-dormitorio (ref. foto-6), destino-banio (ref. foto-9). Aspecto LANDSCAPE_4_3 para todas.

## Procedimiento que funciona

1. `create-upload-url` por archivo + `curl -X POST -H "Content-Type: application/octet-stream" --data-binary @archivo <uploadUrl>` (HTTP 201 con `mediaId`). Las fotos de referencia compartidas se suben una sola vez. MediaIds ya subidos (reutilizables, Canva los conserva): foto-6 render `MAHYagvvdRs` / foto `MAHYanIU2Ko`; foto-3 `MAHYapNZ4EM`/`MAHYaj7Mbfg`; foto-2 `MAHYalbapIg`/`MAHYau1FNwU`; foto-1 `MAHYakPJ1YY`/`MAHYaiXsjOE`; foto-10 `MAHYav384sM`/`MAHYav_zPU0`; foto-9 `MAHYcHKX2_g`/`MAHYcNsy4XA`; foto-8 `MAHYcN0yxC8`/`MAHYcLORURk`.
2. `generate-image` con `imageReferences` = [render, foto] (dos MEDIA), `aspectRatio` PORTRAIT_3_4 (foto-1, foto-2) o LANDSCAPE_4_3 (resto) y el prompt base de abajo. Tarda ~30 s; `get-generate-image-job` devuelve SUCCESS con un media id y solo una miniatura de ~200 px.
3. El media id **no se puede exportar directamente** (`export-design` y `get-export-formats` exigen un design id `D...`) y `create-design` **no acepta imagenes de referencia**. Camino que funciona: un unico diseno de Canva con una pagina por vista. Con `read-design` (open_transaction) + `edit-design`: `add_page` con el tamano exacto de la imagen, `insert_fill` con el media id a pantalla completa (left 0, top 0, ancho/alto de la imagen), `commit`.
4. `export-design` formato `jpg`, `quality` 100, `export_quality` "pro", `pages` = [n] (sin width/height sale al tamano de la pagina) y `curl` de la URL devuelta a `ia/<id>.jpg`. Verificado con `sips` (1456x1088 o 1088x1456) y revision visual.

Canva (cuenta del usuario): carpeta **"Recorrido 3D casa - vistas IA"** (id `FAHYajLaYnU`, https://www.canva.com/folder/FAHYajLaYnU) con un solo diseno `DAHYapI_RKw`. Paginas: 1 = borrador descartable (casa generica), 2 = foto-6, 3 = foto-3, 4 = foto-2, 5 = foto-1, 6 = foto-10, 7 = foto-9. Para nuevas vistas basta agregar paginas a ese diseno.

## Prompt base (la ultima frase cambia por vista)

```
Photorealistic completion of a 3D scan render. The FIRST reference image is the render: keep its exact camera viewpoint, composition, perspective and geometry. The SECOND reference image is a real photo of the same house: use it only as the reference for materials, colours and light. The house: white rendered walls, grey corrugated metal single-slope roof with a wide eave and exposed dark timber beams, black aluminium sliding glass doors and windows, a taller stone-clad gable volume at one end, beige tiled gallery with three steps, black lantern wall lights, a chimney. Surroundings: lawn with tall grass, red laterite soil, wire fence with concrete posts, a weathered wooden shed, trees and a palm tree, sunny day with blue sky and cumulus clouds. Fill in blurry or missing areas with plausible, consistent detail. No people, no text, no watermark. This view shows: <descripcion de la vista>
```

Las frases usadas por vista estan en el campo `prompt` de `indice.json`.

## Problemas y que fallo

- **Cuota**: `generate-image` devuelve `status: failed, code: quota_exceeded`; los creditos alcanzan para pocas generaciones por tanda. Cuando pasa, frenar y reintentar mas tarde.
- **Solo miniatura**: `generate-image`/`get-generate-image-job`/`get-assets` entregan unicamente una URL firmada de 200 px; no se altero la firma. Solucion: paso 3.
- **`create-design` no sirve para meter una imagen propia**: solo recibe un texto; genero una casa generica (pagina 1 del diseno). Esa exportacion se descarto y NO esta en `ia/`.
- **Errores de red transitorios** (`net::ERR_NETWORK_CHANGED`) en `edit-design` y `export-design`: la operacion se habia aplicado igual (se comprueba con `read-design`); el export fallido se repitio sin problema.
- No se pueden borrar paginas ni disenos con las herramientas disponibles: la pagina 1 queda para borrar a mano.

## Calidad (6 imagenes, revisadas a tamano completo)

- Nitidas, fotorrealistas, sin artefactos de escaneo; luz, cielo con cumulos, cesped, laterita, estuco blanco, techo gris, carpinteria negra, galeria beige, faroles, chimenea y piedra coinciden con las fotos reales.
- Encuadre: **el modelo sigue la composicion de la foto real mas que la del render** cuando difieren. foto-6 y foto-3: deriva pequena (~5 %). foto-2: la casa queda mas lejana que en el render. foto-9: angulo distinto del render (el render muestra la ventana negra y los faroles en primer plano; el resultado muestra troncos al frente y la pared blanca a la derecha). foto-10: el render no tiene auto; el prompt (escrito mirando la foto real) pidio un sedan plateado y arboles al frente, y el resultado los incluye, con la casa mas a la izquierda y el galpon mas chico que en el render. Para respetar mejor el render habria que regenerar sin describir elementos de la foto que el render no tiene.
- Son reconstrucciones plausibles, no fotos: conviene revisar que no aparezcan elementos inexistentes (mesada de piedra interior, faroles extra, etc.).
