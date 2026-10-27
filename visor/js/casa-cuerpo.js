import { MEDIDAS as M } from './medidas.js';

/**
 * Cuerpo principal de la casa: pisos y terraza, paredes con aberturas, techo a dos aguas con
 * cenefa y vigas, chimenea, pretil noroeste e interior. Todo en el marco local (a, y, b).
 */

const T = M.techo;
const A = M.aberturas;
const E = M.espesorMuro;
const ESCALON = (M.nivelPiso - M.nivelTerraza) / 3;   // tres contrahuellas: dos escalones y el umbral
const ANCHO_VIGA = 0.12;
const ALTO_VIGA = 0.16;
const RADIO_CADENA = 0.012;

/** Altura de la cara inferior de la chapa en b (perfil del techo principal). */
export function alturaTecho(b) {
  const yCumbrera = T.aleroSO.y + T.pendienteSO * (T.cumbrera.b - T.aleroSO.b);
  if (b <= T.cumbrera.b) return T.aleroSO.y + T.pendienteSO * (b - T.aleroSO.b);
  return yCumbrera - T.pendienteNE * (b - T.cumbrera.b);
}

/** Pared a lo largo de a (plano b0..b1) con huecos [a0, a1, y0, y1] recortados y el tope siguiendo el techo. */
function paredA(h, grupo, a0, a1, b0, b1, huecos = [], nombre = 'pared') {
  const yTope = alturaTecho((b0 + b1) / 2) + 0.02;
  let cursor = a0;
  for (const u of [...huecos].sort((p, q) => p[0] - q[0])) {
    if (u[0] > cursor) h.bloque(grupo, nombre, cursor, u[0], M.nivelPiso - 0.4, yTope, b0, b1);
    if (u[2] > M.nivelPiso - 0.4) h.bloque(grupo, nombre, u[0], u[1], M.nivelPiso - 0.4, u[2], b0, b1);
    if (u[3] < yTope) h.bloque(grupo, nombre, u[0], u[1], u[3], yTope, b0, b1);
    cursor = u[1];
  }
  if (cursor < a1) h.bloque(grupo, nombre, cursor, a1, M.nivelPiso - 0.4, yTope, b0, b1);
}

/** Pared transversal (plano a0..a1) de b0 a b1 con el tope siguiendo el techo, con huecos [b0, b1, y0, y1]. */
function paredB(h, grupo, a0, a1, b0, b1, huecos = [], nombre = 'pared', extraArriba = 0) {
  const perfil = [[M.nivelPiso - 0.4, b0], [alturaTecho(b0) + extraArriba, b0]];
  if (T.cumbrera.b > b0 && T.cumbrera.b < b1) perfil.push([alturaTecho(T.cumbrera.b) + extraArriba, T.cumbrera.b]);
  perfil.push([alturaTecho(b1) + extraArriba, b1], [M.nivelPiso - 0.4, b1]);
  const agujeros = huecos.map(([hb0, hb1, y0, y1]) => [[y0, hb0], [y1, hb0], [y1, hb1], [y0, hb1]]);
  h.prismaA(grupo, nombre, perfil, a0, a1, agujeros);
}

export function construirPisos(h, casa) {
  const P = M.portal;
  const Z = M.terraza;
  // Losa interior y contrapiso.
  h.bloque(casa, 'interior', P.a0, M.largo, M.nivelSuelo - 0.2, M.nivelPiso, P.b0, M.paredNE);
  // Terraza en L: franja frente a la fachada suroeste (pasa 0,4 m la esquina oeste) y explanada frente al portal.
  const bFrente = M.paredSO - Z.fondoSO;
  const aFrente = P.a0 - Z.fondoSE;
  const contorno = [
    [M.largo + Z.pasadaOeste, M.paredSO + 0.05], [M.largo + Z.pasadaOeste, bFrente], [aFrente, bFrente],
    [aFrente, Z.hastaMuroE], [P.a1 + 0.1, Z.hastaMuroE], [P.a1 + 0.1, M.paredNE], [P.a0, M.paredNE], [P.a0, M.paredSO + 0.05],
  ];
  h.prismaY(casa, 'piso', contorno, M.nivelSuelo - 0.25, M.nivelTerraza);
  // Franja angosta al pie de la pared noroeste.
  h.bloque(casa, 'piso', M.largo, M.largo + Z.franjaNO, M.nivelSuelo - 0.25, M.nivelTerraza, bFrente, 3.0);
  // Dos escalones frente al ventanal: el de abajo es más ancho y se extiende más hacia el oeste.
  const V = A.ventanal;
  h.bloque(casa, 'piso', V.a0 - 0.25, V.a1 + 0.3, M.nivelTerraza, M.nivelTerraza + ESCALON, M.paredSO - 0.95, M.paredSO);
  h.bloque(casa, 'piso', V.a0 - 0.25, V.a1 + 0.9, M.nivelTerraza + ESCALON, M.nivelTerraza + 2 * ESCALON, M.paredSO - 0.6, M.paredSO);
  // Dos escalones frente a la puerta del portal.
  const [vb0, vb1] = P.vidrio;
  h.bloque(casa, 'piso', P.a0 - 0.75, P.a0, M.nivelTerraza, M.nivelTerraza + ESCALON, vb0 - 0.3, vb1 + 0.35);
  h.bloque(casa, 'piso', P.a0 - 0.45, P.a0, M.nivelTerraza + ESCALON, M.nivelTerraza + 2 * ESCALON, vb0 - 0.15, vb1 + 0.15);
}

export function construirParedes(h, casa) {
  const P = M.portal;
  const y0 = M.nivelPiso;
  const V = A.ventanal;
  const D = A.dormitorio;
  // Fachada suroeste, desde la cara noroeste del portal hasta la esquina oeste.
  paredA(h, casa, P.a1, M.largo, M.paredSO, M.paredSO + E,
    [[V.a0, V.a1, y0, y0 + V.alto], [D.a0, D.a1, y0, y0 + D.alto]]);
  h.abertura(casa, { a0: V.a0, a1: V.a1, y0, y1: y0 + V.alto, b: M.paredSO + 0.04, hojas: V.hojas });
  h.abertura(casa, { a0: D.a0, a1: D.a1, y0, y1: y0 + D.alto, b: M.paredSO + 0.04, hojas: D.hojas });
  // Fachada noreste con la corrediza trasera.
  const R = A.trasera;
  paredA(h, casa, P.a1, M.largo, M.paredNE - E, M.paredNE, [[R.a0, R.a1, y0, y0 + R.alto]]);
  h.abertura(casa, { a0: R.a0, a1: R.a1, y0, y1: y0 + R.alto, b: M.paredNE - 0.04, hojas: R.hojas });
  // Pared noroeste (corta) con la banderola del baño y el pretil que asoma sobre la chapa.
  const B = A.banio;
  paredB(h, casa, M.largo - E, M.largo, M.paredSO, M.paredNE, [[B.b0, B.b1, B.y0, B.y1]], 'pared', T.pretilNO);
  h.bloque(casa, 'marco', M.largo - 0.05, M.largo + 0.02, B.y0, B.y1, B.b0, B.b1);
  h.bloque(casa, 'vidrioEsmerilado', M.largo - 0.03, M.largo - 0.02, B.y0 + 0.04, B.y1 - 0.04, B.b0 + 0.04, B.b1 - 0.04);
  // Tapa negra sobre el pretil: una tira que sigue el perfil del techo (dos tramos, uno por faldón).
  const tapa = (b0, b1) => h.prismaA(casa, 'cenefa', [
    [alturaTecho(b0) + T.pretilNO, b0], [alturaTecho(b0) + T.pretilNO + 0.04, b0],
    [alturaTecho(b1) + T.pretilNO + 0.04, b1], [alturaTecho(b1) + T.pretilNO, b1],
  ], M.largo - E - 0.02, M.largo + 0.03);
  tapa(M.paredSO - 0.03, T.cumbrera.b);
  tapa(T.cumbrera.b, M.paredNE + 0.03);
  // Pared sureste detrás del portal (ya la cierra el relleno del hastial) y zócalo.
  h.bloque(casa, 'zocalo', P.a1, M.largo + 0.01, M.nivelTerraza, M.nivelTerraza + 0.12, M.paredSO - 0.01, M.paredSO + 0.02);
  // Faroles de la fachada suroeste y de la pared noroeste.
  for (const a of M.faroles.fachadaSO) h.farol(casa, a, y0 + M.faroles.alturaSobrePiso, M.paredSO, -1);
  for (const b of M.faroles.paredNO) h.farol(casa, M.largo, y0 + M.faroles.alturaSobrePiso, b, 'a+');
  // Cadenas de lluvia desde el alero hasta la terraza.
  for (const a of M.cadenasLluvia) h.cilindro(casa, 'farol', a, M.nivelTerraza, T.aleroSO.y - 0.02, T.aleroSO.b + 0.12, RADIO_CADENA, 6);
}

export function construirTecho(h, techo) {
  const P = M.portal;
  const a0 = P.a1 - 0.02;
  const a1 = M.largo + 0.05;
  const yC = alturaTecho(T.cumbrera.b);
  const chapa = [
    [T.aleroSO.y, T.aleroSO.b], [yC, T.cumbrera.b], [alturaTecho(T.aleroNE.b), T.aleroNE.b],
    [alturaTecho(T.aleroNE.b) + T.espesor, T.aleroNE.b], [yC + T.espesor, T.cumbrera.b], [T.aleroSO.y + T.espesor, T.aleroSO.b],
  ];
  h.prismaA(techo, 'techo', chapa, a0, a1);
  // Cenefa negra en el alero suroeste y cumbrera.
  h.bloque(techo, 'cenefa', a0, a1, T.aleroSO.y - T.cenefa + 0.03, T.aleroSO.y + T.espesor + 0.02, T.aleroSO.b - 0.03, T.aleroSO.b + 0.01);
  h.bloque(techo, 'cenefa', a0, a1, yC - 0.02, yC + T.espesor + 0.04, T.cumbrera.b - 0.12, T.cumbrera.b + 0.12);
  // Cielorraso del alero (entre la pared y el borde) y vigas a la vista.
  const largoAlero = M.paredSO - T.aleroSO.b;
  const inclinado = Math.atan(T.pendienteSO);
  const cielorraso = h.bloque(techo, 'cielorraso', a0, a1, -0.01, 0.01, 0, largoAlero / Math.cos(inclinado));
  cielorraso.position.set((a0 + a1) / 2, T.aleroSO.y - 0.02 + (T.pendienteSO * largoAlero) / 2, (T.aleroSO.b + M.paredSO) / 2);
  cielorraso.rotation.x = -inclinado;
  for (const a of T.vigas) {
    const viga = h.bloque(techo, 'viga', a - ANCHO_VIGA / 2, a + ANCHO_VIGA / 2, -ALTO_VIGA, 0, 0, (largoAlero + 0.2) / Math.cos(inclinado));
    viga.position.set(a, T.aleroSO.y - 0.03 + (T.pendienteSO * (largoAlero + 0.2)) / 2, T.aleroSO.b - 0.1 + (largoAlero + 0.2) / 2);
    viga.rotation.x = -inclinado;
  }
  // Chimenea blanca con tapa negra, a caballo de la cumbrera.
  const C = T.chimenea;
  h.bloque(techo, 'pared', C.a0, C.a1, yC - 0.3, C.yTope, C.b0, C.b1);
  h.bloque(techo, 'cenefa', C.a0 - 0.05, C.a1 + 0.05, C.yTope, C.yTope + 0.06, C.b0 - 0.05, C.b1 + 0.05);
}

export function construirInterior(h, interior, conMobiliario) {
  const I = M.interior;
  const P = M.portal;
  const y0 = M.nivelPiso;
  const alto = alturaTecho(T.cumbrera.b) - 0.05;
  h.bloque(interior, 'interior', I.tabiqueDormitorio, I.tabiqueDormitorio + 0.12, y0, alto, M.paredSO, M.paredNE - E);
  h.bloque(interior, 'interior', I.tabiqueDormitorio, M.largo - E, y0, alto, I.tabiqueLargo, I.tabiqueLargo + 0.12);
  h.bloque(interior, 'interior', I.tabiqueBanio, I.tabiqueBanio + 0.12, y0, alto, I.tabiqueLargo, M.paredNE - E);
  // Cielorraso interior paralelo a la chapa (para que desde afuera no se vea el cielo por los vidrios).
  const bajo = (b) => alturaTecho(b) - 0.12;
  h.prismaA(interior, 'cielorraso', [
    [bajo(M.paredSO), M.paredSO], [bajo(T.cumbrera.b), T.cumbrera.b], [bajo(M.paredNE), M.paredNE],
    [bajo(M.paredNE) + 0.02, M.paredNE], [bajo(T.cumbrera.b) + 0.02, T.cumbrera.b], [bajo(M.paredSO) + 0.02, M.paredSO],
  ], P.a0 + 0.1, M.largo - E);
  if (!conMobiliario) return;
  h.bloque(interior, 'piedra', 3.0, 4.2, y0, y0 + 0.9, 2.0, 2.8);        // isla de la cocina revestida en piedra
  h.bloque(interior, 'granito', 2.95, 4.25, y0 + 0.9, y0 + 0.94, 1.95, 2.85);
  h.bloque(interior, 'heladera', 5.25, 5.85, y0, y0 + 1.8, 0.7, 1.35);    // heladera blanca junto al vidrio
  h.bloque(interior, 'acero', 1.6, 2.6, y0 + 0.88, y0 + 0.92, M.paredNE - 0.8, M.paredNE - E);   // mesada
  h.bloque(interior, 'madera', 7.0, 9.0, y0, y0 + 0.45, 0.9, 2.5);        // cama
  h.bloque(interior, 'cobertor', 7.05, 8.95, y0 + 0.45, y0 + 0.6, 0.95, 2.45);
  h.bloque(interior, 'cortina', A.dormitorio.a0 + 0.9, A.dormitorio.a1 + 0.1, y0 + 0.05, y0 + A.dormitorio.alto, M.paredSO + E + 0.05, M.paredSO + E + 0.08);
  h.bloque(interior, 'interior', 8.6, 9.6, y0, y0 + 0.85, 4.6, 5.2);      // vanitory del baño
}
