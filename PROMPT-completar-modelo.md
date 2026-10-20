# Prompt: completar el modelo 3D de la casa con IA

Copiá y pegá este texto en Claude (en la carpeta `3d casa`, donde está el visor).

---

Tengo un visor 3D en primera persona de mi lote en `visor/` (gaussian splat de Scaniverse
convertido a `modelo/casa.ksplat`, mini plano, destinos y comparador con 10 fotos reales en
`visor/fotos/`). Las poses están en `visor/js/lugares.js` y el README explica el sistema de
coordenadas: esquina sur de la casa (hastial de piedra) en (10, -1.6), fachada vidriada hacia el
suroeste hasta (5.2, -10.7), galpón en (3.2, 1.6), portón en (0.5..4, 9.5), calle hacia +Z.

Quiero que el recorrido se vea completo, sin huecos ni zonas borrosas. Hacé esto, delegando en
subagentes lo que convenga (análisis de fotos, investigación de herramientas, revisión de código):

1. **Verificar** el visor en el navegador (escritorio y celular) y anotar qué zonas del escaneo
   faltan o están mal (interior del dormitorio y baño, lado noreste, calle, cielo, puntos sueltos).

2. **Extraer las características de la casa y el lote a partir de las fotos** y guardarlas en
   `visor/datos/ficha-casa.json` y `visor/datos/ficha-casa.md`: materiales y colores (revoque
   blanco, piedra del hastial, chapa gris del techo, carpintería negra, piso de la galería),
   proporciones y medidas estimadas, aberturas (ventanas, puertas corredizas), techo (pendiente,
   alero con vigas, chimenea), galería y escalones, faroles, portón (pilares de hormigón, panel
   negro, portón de madera), galpón, alambrado, muros de ladrillo vecinos, vegetación (palmera,
   arboleda), suelo (césped, tierra colorada).

3. **Completar lo que el escaneo no captó con un modelo paramétrico** en `visor/js/modelo.js`,
   activable con un botón "Completar": paredes, techo a un agua con alero, volumen del hastial con
   piedra, carpinterías negras con vidrio, galería y escalones, galpón, pilares y paneles del portón,
   muros vecinos, plano de suelo (césped / tierra) y cúpula de cielo. Usar las medidas del escaneo y
   los colores de la ficha. Tiene que convivir con el splat (profundidad correcta) y poder apagarse.

4. **Generar con IA imágenes mejoradas de cada vista** (los 7 destinos y los 10 puntos de foto):
   tomar el render del splat como base y las fotos reales como referencia de materiales y luz, y
   producir una imagen nítida y completa de cada vista. Guardarlas en `visor/ia/` e integrarlas en el
   comparador como "Vista IA", con el mismo control de opacidad que las fotos. Si no hay
   herramienta de imagen disponible en la sesión, dejar los renders base y el prompt listo para cada vista.

5. **Revisar el código** con un subagente revisor (seguridad, errores, tamaño de archivos) y corregir.

6. **Verificar de nuevo** en el navegador, actualizar el README y republicar el artefacto.

Al terminar, contame qué quedó completo, qué sigue aproximado y qué haría falta volver a escanear.
