# Ficha de la casa y el lote

Relevamiento hecho a partir de las 10 fotos reales (`visor/fotos/foto-1.jpg` a `foto-10.jpg`) y de las coordenadas que ya tiene el visor. Es la misma información que `ficha-casa.json`, pero para leer de corrido.

## Cómo leer esta ficha

- **Coordenadas:** metros. X a la derecha, Y arriba, Z hacia abajo del plano. La calle queda hacia +Z.
- **Alturas:** salvo que diga "sobre piso", están medidas **sobre el césped**. El piso interior está a 0,5 m del césped y la terraza exterior a unos 0,2 m (estimado).
- **Estimado (est.):** medida sacada a ojo de las fotos, con un error típico de ±15 a 25 %. Lo que no tiene "est." viene de lo que ya sabíamos o se ve directo.
- **Confianza:** alta = se ve claro en varias fotos; media = se ve pero escorzado u ocluido; baja = inferido.
- **Fachadas:** SO es el lado largo vidriado (S a W, da al césped). SE es el lado corto del hastial (S a E, da a la calle). NO es el lado corto (W a N). NE es el lado largo de atrás (N a E) y **no sale en ninguna foto**.
- **Posición sobre la fachada SO ("s"):** distancia desde la esquina O (W) hacia la esquina S. Punto de mundo = W + s·(0,4665 ; 0,8843).

### Tres cosas que conviene saber antes de modelar

1. Las cuatro esquinas que nos pasaron forman un paralelogramo un poco sesgado (el ángulo en S da unos 99°, no 90°). Usalas tal cual, no las "enderecés".
2. La "puerta vidriada con faroles" que se ve a la derecha de la foto 9 **no** es una abertura de la pared NO. Es la puerta-ventana del dormitorio (fachada SO) vista de canto. Se confirma en la foto 8, donde la terraza está justo delante de ella.
3. Las poses de cámara de `js/lugares.js` son aproximadas. Todo lo que deduje de ellas (posición de árboles, arena, árbol seco) tiene confianza baja.

---

## Casa

### Planta y alturas

| Dato | Valor |
|---|---|
| Esquinas | S (10, -1,6) · E (15,2, -5,5) · N (10,4, -14,6) · W (5,2, -10,7) |
| Largo x ancho | 10,3 x 6,5 m |
| Alero SO | 3,3 m sobre césped (2,8 m sobre piso) (est.) |
| Borde alto del techo (lado NE) | 4,3 m (est.) |
| Cumbrera del hastial (punto más alto) | 5,2 m (est.) |
| Nivel del piso interior | 0,5 m |
| Nivel de la terraza | ≈0,2 m (est.) |

### Paredes

- **Material:** mampostería revocada y pintada de blanco.
- **Color:** `#EEEEEA` a pleno sol, `#D3D6D5` en sombra.
- **Textura:** revoque fino texturado de grano medio, tipo salpicado, con puntitos oscuros muy chicos. La pilastra y el marco del hastial se ven **más rugosos** (revoque grueso a la llana) y un poco más grises (`#E8E8E4`). La pared NO se ve más lisa y verdosa por la sombra del arbolado.
- **Zócalo:** unos 0,12 m, color `#CFC8B8`, apenas retranqueado. Se ve bien al pie de la pilastra y del muro SO (est.).
- **Manchas:** humedad verdosa (`#8E9A86`) hasta 0,4 m de alto en el tramito de muro junto a la pilastra y en la esquina O. Salpicaduras de tierra colorada (`#C79068`) al pie.
- **Espesor de muro:** no se mide en las fotos. El marco del hastial sobresale unos 0,25 m del plano del muro SO.

### Despiece de la fachada SO (de la esquina O a la S)

| s (m) | Elemento |
|---|---|
| 0 a 1,8 | Muro ciego con el farol F1 (en s=1,5). En el extremo O hay una junta o pilastra angosta de unos 0,3 m. |
| 1,8 a 3,75 | Puerta-ventana corrediza del dormitorio (2 hojas), marco negro. |
| 3,75 a 4,7 | Muro ciego con el farol F2 (en s=4,3). |
| 4,7 a 9,0 | Ventanal de 4 paños, con 2 escalones adelante. |
| 9,0 a 9,4 | Tramito de muro con el farol F3 (en s=9,2) y cadena de lluvia. |
| 9,4 a 10,3 | Pilastra blanca rugosa del hastial (~0,9 m), sube hasta 4,4 m. |

Error aproximado de ±0,3 m, medido sobre la foto 6 (casi de frente).

### Pared NO (corta, W a N)

Casi ciega, revoque blanco liso y en sombra. Se ve:

- Una junta o relieve vertical a 1 o 2 m de la esquina O (confianza baja).
- Un farol a unos 3 m de la esquina O y unos 2,1 m sobre piso (≈ (7,5 ; -12,7)).
- La **ventana alta** (probablemente del baño) cerca de la esquina N, a 1 o 1,5 m de ella.
- El borde superior sigue la pendiente del techo: bajo hacia la O (alero a 3,3 m), alto hacia la N (4,3 m). No se ve alero lateral: la chapa termina casi a ras del muro con la cenefa negra.
- Al pie hay tierra, hojarasca, tachos de pintura y una malla de alambre apoyada. Son objetos temporales, no hay que modelarlos.

### Fachada NE (la de atrás)

No sale en ninguna foto. Lo único que se sabe es indirecto: a través del ventanal SO (fotos 6 y 10) se ve al fondo un segundo marco negro vidriado de unos 2,0 x 2,0 m y, detrás, ladrillo visto del vecino. O sea que ahí hay una puerta o ventanal corredizo. Del resto no tengo datos (confianza baja).

### Interior visible

Se ve solo a través del vidrio. El ambiente es **abierto**: cocina y sala sin tabiques.

- **Cocina:** en la mitad NO del ambiente, detrás del paño fijo izquierdo del ventanal. Mesada de acero inoxidable con pileta y canilla, a la izquierda de la isla, contra la pared del fondo. Esa pared es blanca y tiene un hueco oscuro rectangular (~0,7 x 0,6 m) que podría ser un hogar o parrilla bajo la chimenea. **No está confirmado.**
- **Isla:** exenta, revestida en la misma piedra laja irregular del hastial (`#CDBBA0`), con tapa gris oscuro (`#48494C`, granito o piedra con leve brillo). Unos 1,1 x 0,7 m y 0,9 m de alto (est.). Centro aprox. (8,9 ; -6,5).
- **Heladera:** electrodoméstico blanco (`#F2F2F0`), alto, de esquinas superiores redondeadas, contra el vidrio fijo cerca del extremo NO del ventanal. Unos 0,6 x 0,65 x 1,8 m (est.), centro aprox. (8,3 ; -6,9). Puede ser heladera o freezer vertical; no se distingue.
- **Dormitorio:** extremo O, detrás de la puerta-ventana. Cama con cobertor amarillo mostaza (`#D8B648`) y cortina fina gris azulada (`#98A9B3`), corrida hacia el lado derecho de la puerta.
- **Sala:** no hay muebles claros. A través de las hojas corredizas se ve algo que podría ser una silla o banqueta blanca (muy poco claro).
- **Pisos interiores:** porcelanato o cerámico claro, liso y brillante, `#ECE8DF`.
- **Cielorraso:** no se ve en ninguna foto.

---

## Techo

- **Tipo:** una sola agua (monopitch) sobre el cuerpo principal. Cae hacia el SO (el césped); el lado alto queda al NE.
- **Material y color:** chapa acanalada o trapezoidal prepintada, gris grafito `#3A3E43`, con brillos `#808890`. Los nervios corren en el sentido de la pendiente y se ven cada ~0,2 m (aparente).
- **Pendiente:** unos 9° (≈15 %), con una subida de ~1,0 m entre el alero (3,3 m) y el borde alto (4,3 m). (est., confianza media-baja; según el ángulo de toma puede estar entre 7° y 12°.)
- **Alero:** 0,7 m en la fachada SO (est.). En el lateral NO es casi cero (la chapa termina a ras). El lado NE no se ve.
- **Cenefa:** chapa negra `#15171A`, ~0,25 m de alto. Corre a todo lo largo del alero SO y termina contra la pilastra del hastial. Probablemente sea la canaleta: hay cadenas de lluvia en los extremos.
- **Vigas a la vista:** 5 cabezas de viga negras (`#1A1A1A`) que asoman por debajo de la cenefa. Sección ~0,12 x 0,10 m, asoman ~0,1 m bajo la cenefa y se ven ~0,4 m de largo (est.). Aproximadamente en s = 1,4 / 3,9 / 4,9 / 7,4 / 9,7: un par cercano (~1 m entre sí) sobre el tramo entre puerta-ventana y ventanal, otras sobre el ventanal cada 2,3 a 2,5 m, y una en el extremo S junto a la pilastra.
- **Chimenea:** prisma cuadrado de ~0,65 m de lado, revoque blanco como las paredes, con tapa de chapa negra que sobresale unos 5 cm por lado. Sobresale ~0,8 m de la chapa y la punta queda a unos 5,1 m. Está pegada al borde alto del techo (NE), en s ≈ 3,4 m y a ~1,2 m del borde NE: centro aprox. (11,0 ; -10,9). Confianza media.
- **Pretil blanco:** bloque blanco bajo, detrás del faldón, que sobresale unos 0,5 m del borde alto, a continuación de la chimenea hacia el NO (entre s ≈ 1,2 y 3,0 m). Tapa negra. Otro bloque blanco con tapa negra inclinada asoma en el extremo NO de la cubierta (fotos 1, 6, 10); no se entiende qué es (confianza baja).
- **Cadenas de lluvia:** cadena fina de eslabones negros (`#1F1F1F`) que cuelga del extremo del alero hasta el piso, al lado de los faroles F1 (s=1,5) y F3 (s=9,2). Se ven clarísimas en la foto 1.

---

## Hastial

Es el volumen alto de la esquina S. En planta ocupa todo el frente SE de 6,5 m y mira a la calle.

- **Forma:** marco blanco en forma de casita (pentágono). Dos laterales verticales hasta 4,4 m y dos faldones a ~16° que se juntan en la cumbrera, en el centro del frente (5,2 m). (est.)
- **Espesor del marco en planta:** ~1,0 m. De costado se ve como la pilastra de ~0,9 m, y el techo principal choca contra su pared NO. No se ve cuánto se mete hacia adentro. Confianza media.
- **Marco:** revoque grueso blanco, más rugoso que las paredes (`#E8E8E4`). Pilar SO de ~1,0 m de ancho, pilar E de ~0,55 m, banda superior de ~0,55 m. Tapa o babeta de chapa negra (`#15171A`) sobre los faldones. Zócalo igual que las paredes.
- **Cielorraso visible:** panel liso gris muy claro (`#D8DADB`) bajo la banda superior, sobre el vidrio fijo. Se ve desde abajo porque el vidrio está retranqueado.

### Despiece de la cara SE (desde la esquina S hacia la E)

| d (m) | Elemento |
|---|---|
| 0 a 1,0 | Pilar blanco SO (el que de costado se ve como pilastra). |
| 1,0 a 3,2 | Vidrio retranqueado ~0,4 m: puerta corrediza + paño fijo trapezoidal. |
| 3,2 a 4,4 | Franja negra acanalada. |
| 4,4 a 5,9 | Panel de piedra con 2 faroles (en d = 4,9 y 5,4). |
| 5,9 a 6,5 | Pilar blanco E. |

Proporciones tomadas de la foto 3, error ±0,3 m.

### Revestimiento

- **Piedra:** panel de ~1,5 m de ancho, de piso a faldón. Alto ~4,1 m junto a la franja negra y ~3,5 m en el borde E (sigue el faldón). Piedra laja irregular tipo mosaico, con juntas finas grises. Color base `#CDBBA0`, con variaciones `#D9C3AA` (rosado claro), `#BFA886` (ocre) y `#E0D2BC` (crema). Junta `#8F8A80`. Relieve ~3 cm. Es la misma piedra que la de la isla de la cocina. Confianza alta en material y color, media en medidas.
- **Franja negra:** ~1,2 m de ancho, de piso a faldón. Chapa o madera acanalada vertical, mate, `#1C1E21`, con nervios cada ~0,10 m. Parece sobresalir un poco del vidrio y quedar al ras de la piedra (est.).

### Carpintería

- **Puerta:** corrediza de 2 hojas, marco negro `#17181A`, ~2,2 m de ancho x 2,4 m de alto, retranqueada ~0,4 m del marco blanco. Se ve un herraje negro chico en el borde derecho (fotos 1 y 2).
- **Vidrio fijo superior:** paño trapezoidal sobre la puerta, de ~2,2 m de ancho, que sube de 3,2 m (lado del pilar) a 3,6 m (lado de la franja negra), siguiendo el faldón. Mismo vidrio gris oscuro reflectante que el ventanal.
- **Escalones:** 2 peldaños del mismo porcelanato crema (`#E6D9BE`), contrahuella ~0,14 m y huella ~0,3 m. El de arriba (~2,4 m) queda alineado con el umbral y el de abajo (~2,9 m) es más ancho y avanza más. En la foto 1 se ve una cuña oscura (tierra o hueco) entre el escalón y el piso.
- **Faroles:** 2 sobre la piedra, lado a lado (~0,5 m), a unos 2,3 m sobre piso. Centro aprox. (14,2 ; -4,5).

---

## Galería

La "galería" es una **terraza sin cubierta propia**, salvo el alero de 0,7 m.

- **Piso:** porcelanato crema tipo travertino, formato grande (~0,6 x 0,6 m, est.), junta fina clara. Color `#E9DCC0` (`#D7C7A5` en sombra). Tiene manchas anaranjadas de tierra colorada repartidas (`#D8A870`), sobre todo cerca del borde y al pie de los escalones.
- **Fondo (profundidad desde el muro SO):** 1,5 a 2,5 m incluyendo escalones (est.).
- **Forma:** polígono irregular, no rectangular. Se prolonga alrededor de la esquina S y ocupa también el frente del hastial (2 a 3 m de fondo) hasta el muro vecino del E. En la esquina O termina unos 0,4 m pasada la esquina. El borde tiene un canto de hormigón de ~0,1 m, apenas sobre el césped. **El contorno exacto hay que sacarlo del escaneo.**
- **Escalones frente al ventanal:** 2 peldaños del mismo porcelanato, ~4,5 a 5,0 m de ancho, contrahuella ~0,14 m, huella ~0,3 m. El de abajo se extiende unos 0,5 m más hacia el O que el de arriba (queda escalonado). Delante de la puerta-ventana del dormitorio no se ve escalón: el umbral queda unos 0,25 m sobre la terraza (confianza baja).

---

## Aberturas

Todas con **marco de aluminio negro** (`#17181A`, perfil de 7 a 8 cm).

| Nombre | Fachada | Tipo | Ancho x alto (est.) | Detalle |
|---|---|---|---|---|
| Puerta-ventana del dormitorio | SO | Corrediza, 2 hojas, sin escalón visible | 1,95 x 2,1 m | s = 1,8 a 3,75, centro aprox. (6,5 ; -8,2). Vidrio gris oscuro reflectante. Cortina gris azulada, cama con cobertor amarillo. |
| Ventanal de cocina y sala | SO | 4 paños: 1 fijo ancho (~1,8 m) + 3 hojas corredizas de ~0,85 m | 4,3 x 2,2 m | s = 4,7 a 9,0, centro aprox. (8,4 ; -4,6). Vidrio incoloro con tinte gris, bastante reflectante (opacidad sugerida 0,3 a 0,4). |
| Puerta vidriada del hastial | SE | Corrediza de 2 hojas + paño fijo trapezoidal arriba | 2,2 x 3,4 m (puerta de 2,4 m) | Retranqueada ~0,4 m. Vidrio oscuro reflectante. |
| Ventana alta del baño | NO | Banderola horizontal | 0,7 x 0,35 m | Alféizar a ~1,8 m sobre piso, cerca de la esquina N. Oscura con marco claro; no se distingue si el vidrio es repartido o esmerilado. El ancho está muy escorzado en la foto 9: el real puede ir de 0,5 a 0,8 m. Confianza media-baja. |
| Puerta o ventanal trasero | NE | Corrediza | ~2,0 x 2,0 m | Solo visto a través del ventanal SO, con ladrillo del vecino detrás. Confianza baja. |

### Faroles

Son **6** en total. Farol colonial de pared: cuerpo trapezoidal con vidrio, techito piramidal y remate, ménsula al muro. ~0,18 x 0,18 x 0,38 m (est.), color `#1A1A1A`. El vidrio es incoloro o muy tenue y **no se ve ninguno encendido** en ninguna foto.

| Id | Dónde | Centro aprox. (mundo) |
|---|---|---|
| F1 | Fachada SO, a la izquierda de la puerta-ventana, s=1,5, ~2,0 m sobre piso | (5,7 ; -9,3) |
| F2 | Fachada SO, entre puerta-ventana y ventanal, s=4,3, ~2,0 m sobre piso | (7,0 ; -6,8) |
| F3 | Fachada SO, tramito junto a la pilastra, s=9,2, ~2,0 m sobre piso, con cadena de lluvia al lado | (9,3 ; -2,5) |
| F4 | Pared NO, a ~3 m de la esquina O, ~2,1 m sobre piso (en fotos 6 y 7 aparece en pareja por el escorzo) | (7,5 ; -12,7) |
| F5 | Cara SE, sobre la piedra, izquierda del par, ~2,3 m sobre piso | (14,0 ; -4,4) |
| F6 | Cara SE, sobre la piedra, derecha del par (~0,5 m de F5) | (14,4 ; -4,7) |

Esas coordenadas salen de calcular sobre la planta; tomalas con ±0,5 m.

---

## Lote

### Portón (x 0,5 a 4,0 ; z = 9,5; abre hacia la calle, +Z)

Visto desde la calle, de izquierda (O) a derecha (E):

1. **Panel negro fijo** (hoja ciega o cerco), ~1,5 m de ancho y 2,3 m de alto, `#1A1A1C`. Algo más atrás que los pilares, y se ve detrás de la malla del alambrado.
2. **Pilar de hormigón visto**, sección ~0,45 x 0,45 m, 2,4 m de alto, `#8C8C86` con manchas `#6E6E68`. Marcas de encofrado y manchas de humedad.
3. **Hoja negra de chapa acanalada vertical**, ~1,2 m de ancho x 2,3 m de alto. En las fotos está abierta o a mitad de camino, pegada al pilar central.
4. **Vano libre**, ~1,5 m. Por ahí se ve el auto en las fotos 4, 5 y 8.
5. **Panel de tablas de madera gris**, verticales, ~0,8 m de ancho, `#837D72`, desgastadas. Pegado al pilar de la derecha.
6. **Pilar de hormigón (E)**, igual al otro, con una pieza horizontal plana o losita en la cabeza que sale hacia el E (foto 5).

Si sumás las medidas dan más que los 3,5 m del escaneo. Usá el ancho del escaneo y repartí en estas proporciones: pilar 17 %, hoja 22 %, vano 31 %, madera 14 %, pilar 16 %. Confianza media en orden y materiales, baja en medidas.

**Entrada de autos:** tierra colorada compactada y lisa entre el portón y el hastial (~4 m x 2,5 m delante de los pilares, foto 4).

### Galpón (3,2 ; 1,6)

- **Medidas:** ~3,0 m de ancho x 2,5 m de fondo x 2,9 m de alto (est.).
- **Paredes:** tablas de madera verticales sin pintar, desgastadas, `#837D72`, de ~0,18 m de ancho.
- **Techo:** chapa acanalada gris `#6B7076`, una agua con muy poca pendiente (~5°), sobresale unos 0,1 m.
- **Aberturas:** no se ve ninguna en las caras visibles (foto 10: frente y un lateral angosto).
- El auto plateado de las fotos 8 y 10 estaba apoyado contra su lado SO.

### Alambrado

- **Tipo:** tejido romboidal galvanizado, ~1,6 m de alto, malla de ~6 cm, `#AEB3B6`. Casi translúcido: dibujalo como un plano con textura de rombos y alpha bajo.
- **Postes:** de hormigón o madera dura, finos (~10 cm), cada ~2,8 m, `#B2B1AA`.
- **Recorrido:** línea de calle (frente, z ≈ 9,5, de la que forma parte el portón) y costados O y E. Se ve delante de la casa en la foto 3 y a lo largo del lado O en las fotos 4 y 5.

### Muros de vecinos

- **Este, junto al hastial (≈ (18 ; 0)):** muro de bloques con revoque grueso gris ocre (`#9A958A`), con parches caídos y manchas de humedad, y un tramo de ladrillo visto a la derecha (`#B4553B`). ~2,3 m de alto y ~4,5 m de largo. Parabólica blanca sobre un mástil en el borde superior (fotos 2 y 3).
- **Este lejano:** muro de bloques revocado gris azulado (`#727C88`) con tapa oscura, ~1,9 m, detrás del alambrado (fotos 6 y 10). Confianza baja.
- **Norte y noroeste:** ladrillo común visto (`#B4553B`, junta `#C9BFB0`), obra a medio hacer con pilares de hormigón y alambrado delante. ~2,0 m de alto. Está pegado al extremo NO de la casa (fotos 6 a 9) y sigue a lo largo del lado O hasta la calle (fotos 4 y 5). Una parte tiene revoque marrón ocre sucio (`#8F6F55`). Del otro lado se ven montones de ladrillo y grava (foto 8).

### Pilares y servicios del vecino

Al E del muro vecino, hacia la calle: una columna de hormigón alta (~3 m), un poste de caño delgado de ~6 m, otro de caño con un tubo naranja, y un pilar bajo de hormigón de medidor con una caja chica arriba. Colores: hormigón `#A9A9A3`, caños `#9AA0A5`. Poste de luz con cables del lado E (fotos 6 y 10). Posición aproximada x 19 a 21, z entre 0 y 3 (confianza baja).

### Suelo

- **Césped:** verde intenso `#5C9A3A` (claro `#7DB84A`, oscuro `#3E7329`). Corto cerca de la casa y alto (30 a 60 cm) con yuyos hacia el frente y los costados. Asoman parches de tierra colorada entre el pasto (fotos 2 y 3).
- **Tierra colorada:** `#9E4A2E` (seca `#B5623F`, húmeda `#7E3B26`). Entrada de autos compactada, manchas sueltas por el lote y suelo pelado bajo el arbolado.
- **Arena:** montículo de arena clara `#D8C7A3`, de ~3 m de diámetro y ~0,4 m de alto, cerca del frente entre el portón y el hastial hacia la calle (x 4 a 8, z 8 a 11; confianza baja).
- **Terreno:** se ve casi plano. No hay veredas ni caminos construidos aparte de la terraza.

### Objetos que no hay que modelar (temporales)

El auto plateado (fotos 4, 5, 8 y 10), la mesa y los bancos de tablas sobre ladrillos en la arboleda, el palo con la bolsa azul y las sogas, el tendedero de metal colgado de un árbol, los tachos de pintura al pie de la pared NO, la malla de alambre aplastada contra esa pared y las pilas de ladrillo y grava. Lo único fijo de este grupo es una **maceta negra** (~0,3 x 0,3 x 0,25 m) cerca de la esquina O, al pie de la pared (fotos 6 y 7).

---

## Vegetación

| Qué | Descripción | Posición |
|---|---|---|
| **Palmera pindó** (1) | ~9 m de alto, copa de ~4,5 m de diámetro, pencas largas y caídas en arco (`#3F7A3A`), tronco recto gris claro (`#9A9488`) de ~0,3 m. | Al O/NO de la casa, detrás del arbolado. Se ve detrás del techo en las fotos 1, 2, 3, 4, 6 y 7. Aprox. (0,5 ; -12,3), confianza **baja**. |
| **Arboleda** (~20 árboles) | Árboles finos y medianos de 6 a 9 m. Troncos de 0,10 a 0,25 m, corteza gris con liquen (`#7C746A`, liquen `#A39F94`), primeras ramas a ~2,5 m. Follaje de hoja lanceolada brillante `#2F6B2A` / `#3F8A35`, copas de 3 a 5 m. Suelo con tierra colorada y hojarasca. | Franja al O y NO de la casa que sigue hacia el N: x -4 a 3, z -16 a -6 (la zona "Arboleda" del visor). |
| **Árbol de copa densa** | Copa redonda y baja (~6 m de alto y 6 m de copa), `#2A5E24`. Algunas ramas llegan sobre el techo (fotos 1, 2, 3). | Justo detrás del extremo NO de la casa. Confianza baja. |
| **Árbol grande de hoja fina** | ~11 m de alto, copa de ~9 m, `#3C7A33`, aspecto de leguminosa. Copa sobre la calle (fotos 4 y 5). | A la izquierda (O) del portón. |
| **Árbol seco** | ~8 m, sin hojas, ramas finas, `#6E665B`. | Atrás de la casa, hacia el E/NE, aprox. (19 ; -10), triangulado a ojo con fotos 3 y 6. Confianza baja. |
| **Árboles del vecino (E)** | Uno frondoso de ~9 m y copa de ~8 m detrás del muro vecino, y vegetación alta más atrás (foto 3). | Al E. Confianza baja. |
| **Cañas** | Tallos finos y rectos, amarillentos (`#8C8A4E`), con hojas solo arriba, ~5 m (tipo tacuara o bambú). | Junto a la esquina O (foto 1, izquierda). Confianza baja. |
| **Pasto y yuyos** | Matas de gramíneas altas y plantas de hoja ancha de 30 a 60 cm, `#4F8A2F`. | Frente, costados del portón y pie del alambrado. |

---

## Luz

- **Hora aproximada:** entre las 10:30 y las 14:30 (sol alto, sombras cortas). Las fotos no permiten afinar más.
- **Estación:** primavera o verano, por la vegetación frondosa y el pasto alto (inferido).
- **Condición:** día soleado, cielo azul intenso y cúmulos dispersos. Las fotos 6, 8 y 9 tienen más nubes o sombra de arboleda.
- **Dirección del sol:** el frente SE de piedra y la fachada SO están bien iluminados y la pared NO queda en sombra (aunque también la tapa el arbolado). Eso indica sol alto desde el sector S-SO **del plano** (hacia la calle, un poco hacia el O). Vector hacia el sol ≈ (-0,15 ; 0,85 ; 0,5), elevación ≈ 58°. Está en coordenadas del plano, no es el norte geográfico. Confianza media-baja.
- **Sombras:** bajo el alero hay una banda de sombra corta y suave sobre el muro, y la pilastra del hastial proyecta poca sombra.
- **Cielo:** cenit `#1D58C4`, horizonte `#8DB9EA`, nubes blancas `#FFFFFF` con base gris `#B5BDC9` (más marcada en la foto 6).
- **Luz ambiente:** de día, limpia y neutra, con rebote verde bajo el arbolado (`#3F6B35` en sombras).

---

## Foto por foto

**Foto 1.** Vertical. Desde el césped, muy cerca del extremo S, mirando al NE sobre la fachada SO. Fachada en perspectiva fuerte: pasto y yuyos adelante, terraza crema con manchas anaranjadas, escalones frente al ventanal (cocina visible con heladera e isla de piedra), puerta-ventana del dormitorio a la izquierda con cortina, y la pilastra blanca rugosa del hastial a la derecha con farol y cadena de lluvia. Asoman el vidrio del hastial y sus escalones. Arriba, techo oscuro con cenefa, cabezas de viga y chimenea. Pindó y arboleda a la izquierda.

**Foto 2.** Vertical. Desde el frente del lote, sobre césped con parches de tierra colorada, mirando al N-NE hacia el hastial. Fachada SO a la izquierda y hastial a la derecha: marco blanco, franja negra y panel de piedra con dos faroles. Escalones y terraza adelante. Muro vecino con parabólica a la derecha. Pindó detrás del techo, arboleda a ambos lados.

**Foto 3.** Apaisada. Desde la calle, al SE, mirando al NO, con el alambrado romboidal delante de la cámara. El frente SE del hastial casi de frente (se aprecia la pendiente de los faldones, el paño trapezoidal, la puerta y los faroles), y de escorzo la fachada SO a la izquierda. Muro vecino con parabólica y ladrillo a la derecha, postes y pilar de medidor al fondo. Árbol seco a la derecha. Arena clara y tierra colorada en primer plano.

**Foto 4.** Apaisada. Desde la calle, delante del portón, mirando al NO. Se ve el portón entero: panel negro, pilar, hoja negra de chapa, vano libre con el auto detrás, panel de tablas grises y segundo pilar con losita. Entrada de tierra colorada. A la derecha, el extremo de la fachada SO y el pindó. Árbol grande a la izquierda, muro de ladrillo vecino, alambrado y arena abajo a la derecha.

**Foto 5.** Apaisada. Desde la calle, un poco más a la izquierda y más atrás que la foto 4. Mismo portón con otra perspectiva: se ve mejor la hoja negra con el pilar, el panel de madera y la losita sobre el pilar derecho. A la izquierda, muro de ladrillo con pilares y una obra vecina con techo azul al fondo. Árbol grande a la izquierda y arena a la derecha.

**Foto 6.** Apaisada. Desde el césped, al O de la casa y a unos 15 m, casi de frente a la fachada SO. **La mejor vista de la fachada completa**: muro con farol, puerta-ventana del dormitorio (cama amarilla y cortina), ventanal de 4 paños con la isla de piedra y el segundo marco negro del fondo, y la pilastra del hastial a la derecha. Techo con cenefa, cabezas de viga, chimenea y bloques blancos detrás; se ve el lado NO del hastial por encima del techo. Muro de ladrillo vecino a la izquierda, muro gris azulado y poste de luz a la derecha, árbol seco, pindó y nubes grandes.

**Foto 7.** Apaisada (1125 x 844). Dentro de la arboleda, al O de la casa, mirando al NE. Troncos finos grises, mesa y bancos de madera, bolsa azul colgada, ladrillos sueltos. A la derecha, la esquina O de la casa: pared blanca con faroles, una pilastra, una franja de terraza al pie y una maceta negra; muro de ladrillo vecino detrás. Pindó arriba a la derecha.

**Foto 8.** Apaisada. Desde la arboleda al NO/O, mirando al S hacia el portón. A la izquierda, la pared NO en sombra y el extremo O de la fachada SO con su puerta-ventana, farol y terraza con peldaño. Al fondo, el galpón, el portón con su hoja negra, el auto plateado y los muros de ladrillo vecinos a ambos lados. Adelante, un tablón con bancos, el tendedero de metal, tachos y ladrillos.

**Foto 9.** Apaisada. Entre los árboles al O/NO, mirando hacia la pared NO. Pared blanca en sombra, casi ciega: farol a mitad de pared, ventana alta chica cerca de la esquina N y una junta vertical cerca de la esquina O. A la derecha, la esquina O con la puerta-ventana del dormitorio vista de canto, su farol, el alero con cabezas de viga y un peldaño de la terraza. Muro de ladrillo y alambre a la izquierda; tachos de pintura y malla de alambre al pie.

**Foto 10.** Apaisada (2000 x 1500). Desde el frente del lote, junto al galpón, mirando al NE hacia la fachada SO. Auto plateado en primer plano y galpón de tablas grises con techo de chapa a la derecha. Detrás, el techo con chimenea y pretil blanco, cenefa y cabezas de viga, faroles F1 y F2, la puerta-ventana del dormitorio (cama amarilla y cortina) y el ventanal con la isla de piedra; al fondo se ve ladrillo a través del segundo marco negro. A la derecha, el muro gris azulado vecino, el alambrado, un poste de luz y tierra colorada.

---

## Qué falta en el escaneo

Esto es lo que las fotos muestran y un escaneo hecho desde el césped probablemente **no captó** (o captó mal):

1. **Toda la parte alta:** la chapa del techo, la chimenea, el pretil blanco, la cumbrera y la tapa negra del hastial. Desde el césped solo se ve el borde bajo, y las superficies oscuras y lisas a contraluz salen mal o desaparecen.
2. **Vidrios y marcos negros finos** del ventanal, de la puerta-ventana del dormitorio y de la puerta del hastial. Los vidrios son reflectantes y transparentes (salen como agujeros o niebla) y los marcos de 7 a 8 cm son demasiado delgados.
3. **El interior** (isla, heladera, mesada, cama, piso interior, segundo marco negro del fondo). Solo se ve a través del vidrio y el escaneo suele mezclarlo con el reflejo del cielo.
4. **Faroles (6), cadenas de lluvia y cabezas de viga:** objetos chicos y oscuros, de 10 a 40 cm.
5. **La franja negra acanalada** del hastial y las **hojas negras del portón:** tan oscuras que casi no dan textura.
6. **El alambrado romboidal y sus postes finos:** alambre de 2 mm.
7. **La cara NE (trasera), la esquina N, la parte alta de la pared NO con su ventana chica** y el lado interior de los muros vecinos: no se ven desde el césped.
8. **El techo y el frente del galpón,** las tablas individuales y la losita sobre el pilar E del portón.
9. **Ramas finas, copa del pindó, árbol seco, cielo y nubes:** el escaneo desde el suelo no las capta o las deja desparramadas.
10. **El color real de la terraza:** tiende a lavarse por el sol directo, y las manchas anaranjadas de tierra colorada pueden perderse.
11. **Muros del vecino al E y al N, pilares de medidor, postes y cables:** quedan lejos del recorrido.
12. **Objetos temporales que SÍ pueden aparecer** en el escaneo y conviene ignorar: mesa, bancos, tendedero, tachos y malla en la arboleda. El auto estaba afuera al escanear.

---

## Los 5 detalles que más pesan para que se vea fiel

1. **El hastial:** marco blanco rugoso en forma de casita, con vidrio retranqueado, franja negra acanalada y panel de piedra laja crema con dos faroles. Es lo que identifica a la casa desde la calle.
2. **El techo de una agua:** chapa gris grafito con cenefa negra, 5 cabezas de viga a la vista y la chimenea blanca con tapa negra pegada al borde alto.
3. **Los marcos de aluminio negro** del ventanal de 4 paños (1 fijo + 3 corredizos) y de la puerta-ventana: son el contraste fuerte contra el muro blanco.
4. **La terraza de porcelanato crema** con manchas anaranjadas y los escalones de 2 peldaños frente al ventanal y frente al hastial.
5. **Los 6 faroles negros y las cadenas de lluvia:** son chicos, pero dan carácter a la fachada y se ven en casi todas las fotos.
