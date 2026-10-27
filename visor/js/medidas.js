/**
 * Medidas de la casa y del lote en metros. Marco local de la casa: origen en la esquina sur
 * (hastial), a corre por la fachada suroeste hacia la esquina oeste, b cruza hacia el noreste,
 * y es la altura del mundo (el césped escaneado está en -0,35, el piso interior en 0,3).
 *
 * Las posiciones en planta salen de la nube de puntos; las alturas y los despieces de fachada
 * de las fotos (datos/ficha-casa.md y la comparación con visor/comparar.html).
 */
export const MEDIDAS = {
  esquinaSur: { x: 10.0, z: -1.6 },
  direccionFachada: { x: -0.466, z: -0.884 },   // S → W, unitario
  largo: 10.35,            // a de la cara exterior de la pared noroeste
  paredSO: 0.45,           // b del plano exterior de la fachada suroeste (vidriada)
  paredNE: 6.25,           // b del plano exterior de la fachada noreste (no escaneada; de las fotos del frente)
  nivelPiso: 0.3,          // piso interior
  nivelTerraza: -0.05,     // terraza de porcelanato (dos escalones por debajo del piso)
  nivelSuelo: -0.35,       // césped escaneado (-0,3 .. -0,4)
  espesorMuro: 0.18,

  // Techo a dos aguas asimétrico, paralelo al pentágono del portal y 1 m más bajo.
  techo: {
    aleroSO: { b: -0.25, y: 2.95 },  // cara inferior de la chapa en el borde del alero suroeste
    cumbrera: { b: 3.8 },
    aleroNE: { b: 6.5 },
    pendienteSO: 0.30,     // sube hacia la cumbrera
    pendienteNE: 0.48,     // baja hacia el noreste (más empinada)
    espesor: 0.06,
    cenefa: 0.2,           // chapa negra vertical en el alero suroeste
    vigas: [1.75, 2.95, 5.45, 6.45, 8.95],   // a de las cabezas de viga bajo la cenefa
    chimenea: { a0: 6.55, a1: 7.2, b0: 3.2, b1: 3.85, yTope: 4.9 },
    pretilNO: 0.45,        // la pared noroeste sube por encima de la chapa
  },

  // Portal del hastial (losa pentagonal de 1 m de fondo en el extremo sureste).
  portal: {
    a0: 0.5, a1: 1.5,
    b0: 0.2, b1: 6.25,     // sobresale 0,25 m del plano de la fachada suroeste
    yPilares: 4.1, yPico: 5.2, bPico: 3.8,
    banda: 0.7,            // espesor vertical de la banda superior
    pilarSO: 0.95, pilarNE: 0.6,
    vidrio: [1.15, 3.1], franja: [3.1, 4.35], piedra: [4.35, 5.65],
    retiroVidrio: 0.4, puertaAlto: 2.4,
  },

  // Aberturas de la fachada suroeste (a desde la esquina sur) y del resto.
  aberturas: {
    ventanal: { a0: 1.75, a1: 5.95, alto: 2.2, hojas: 4 },
    dormitorio: { a0: 6.6, a1: 8.55, alto: 2.1, hojas: 2 },
    banio: { b0: 4.9, b1: 5.6, y0: 2.1, y1: 2.45 },             // banderola en la pared noroeste
    trasera: { a0: 3.0, a1: 5.0, alto: 2.2, hojas: 2 },          // corrediza en la fachada noreste (estimada)
  },
  faroles: {
    fachadaSO: [1.62, 6.28, 8.85],   // a; a 2,0 m sobre el piso
    paredNO: [3.0],                   // b
    alturaSobrePiso: 2.0,
  },
  cadenasLluvia: [1.6, 9.1],          // a, cuelgan del alero hasta la terraza

  // Interior (estimado: solo se ve a través de los vidrios).
  interior: {
    tabiqueDormitorio: 6.3,  // a del tabique entre la sala y el dormitorio
    tabiqueBanio: 8.4,       // a del tabique del baño (fondo noreste)
    tabiqueLargo: 3.4,       // b del tabique entre el dormitorio y el baño
  },

  // Terraza: fondo frente a la fachada suroeste y frente al portal.
  terraza: { fondoSO: 2.0, fondoSE: 2.6, pasadaOeste: 0.4, hastaMuroE: 6.8, franjaNO: 0.6 },
};

// Compatibilidad con módulos que leen estas claves planas.
MEDIDAS.largoHastial = MEDIDAS.portal.a1;
MEDIDAS.caraSE = MEDIDAS.portal.a0;
