import { MEDIDAS as M } from './medidas.js';

/**
 * Portal del hastial: la losa blanca en forma de pentágono (asimétrico, con el pico sobre la franja
 * negra) que remata el extremo sureste de la casa. Dentro del marco, de la esquina sur hacia el este:
 * puerta vidriada retranqueada con paño fijo trapezoidal arriba, franja negra acanalada y panel de
 * piedra laja con dos faroles. El marco sobresale 0,25 m del plano de la fachada suroeste (pilastra).
 */

const P = M.portal;
const ESPESOR_INFILL = 0.06;
const PROFUNDIDAD_BABETA = 0.06;

/** Altura del borde exterior del pentágono en b. */
export function alturaPortal(b) {
  if (b <= P.bPico) return P.yPilares + ((P.yPico - P.yPilares) * (b - P.b0)) / (P.bPico - P.b0);
  return P.yPico - ((P.yPico - P.yPilares) * (b - P.bPico)) / (P.b1 - P.bPico);
}

/** Altura del borde interior del hueco (banda superior descontada). */
export function alturaHueco(b) {
  return alturaPortal(b) - P.banda;
}

function perfilExterior() {
  return [[M.nivelSuelo - 0.1, P.b0], [P.yPilares, P.b0], [P.yPico, P.bPico], [P.yPilares, P.b1], [M.nivelSuelo - 0.1, P.b1]];
}

function perfilHueco() {
  const bI = P.b0 + P.pilarSO;
  const bD = P.b1 - P.pilarNE;
  const puntos = [[M.nivelPiso, bI], [alturaHueco(bI), bI]];
  if (P.bPico > bI && P.bPico < bD) puntos.push([alturaHueco(P.bPico), P.bPico]);
  puntos.push([alturaHueco(bD), bD], [M.nivelPiso, bD]);
  return puntos;
}

/** Franja vertical dentro del hueco entre b0 y b1, desde el piso hasta el borde interior. */
function franja(h, grupo, nombre, b0, b1, a0, a1, extra) {
  const puntos = [[M.nivelPiso, b0], [alturaHueco(b0), b0]];
  if (P.bPico > b0 && P.bPico < b1) puntos.push([alturaHueco(P.bPico), P.bPico]);
  puntos.push([alturaHueco(b1), b1], [M.nivelPiso, b1]);
  return h.prismaA(grupo, nombre, puntos, a0, a1, [], extra);
}

function construirVidrio(h, grupo) {
  const [b0, b1] = P.vidrio;
  const aV = P.a0 + P.retiroVidrio;
  const yPuerta = M.nivelPiso + P.puertaAlto;
  // Puerta corrediza de 2 hojas, en el plano a = aV (el marco corre a lo largo de b).
  const g = grupo;
  const perfil = 0.07;
  h.bloque(g, 'marco', aV - 0.04, aV + 0.04, M.nivelPiso, M.nivelPiso + perfil, b0, b1);
  h.bloque(g, 'marco', aV - 0.04, aV + 0.04, yPuerta - perfil, yPuerta + perfil, b0, b1);
  h.bloque(g, 'marco', aV - 0.04, aV + 0.04, M.nivelPiso, yPuerta, b0, b0 + perfil);
  h.bloque(g, 'marco', aV - 0.04, aV + 0.04, M.nivelPiso, yPuerta, b1 - perfil, b1);
  const bMedio = (b0 + b1) / 2;
  h.bloque(g, 'marco', aV - 0.045, aV + 0.045, M.nivelPiso, yPuerta, bMedio - perfil / 2, bMedio + perfil / 2);
  h.bloque(g, 'vidrio', aV - 0.004, aV + 0.004, M.nivelPiso + perfil, yPuerta - perfil, b0 + perfil, b1 - perfil);
  // Paño fijo trapezoidal sobre la puerta, hasta la banda.
  const fijo = [[yPuerta + perfil, b0 + perfil], [alturaHueco(b0) - 0.02, b0 + perfil], [alturaHueco(b1) - 0.02, b1 - perfil], [yPuerta + perfil, b1 - perfil]];
  h.prismaA(g, 'vidrio', fijo, aV - 0.004, aV + 0.004);
  h.prismaA(g, 'marco', [[alturaHueco(b0) - 0.07, b0], [alturaHueco(b0), b0], [alturaHueco(b1), b1], [alturaHueco(b1) - 0.07, b1]], aV - 0.04, aV + 0.04);
  h.bloque(g, 'marco', aV - 0.04, aV + 0.04, yPuerta, alturaHueco(b0) - 0.05, b0, b0 + perfil);
  h.bloque(g, 'marco', aV - 0.04, aV + 0.04, yPuerta, alturaHueco(b1) - 0.05, b1 - perfil, b1);
  // Cielorraso gris claro bajo la banda, entre la cara del portal y el vidrio.
  h.prismaA(g, 'cielorraso', [[alturaHueco(b0) - 0.03, b0], [alturaHueco(b0), b0], [alturaHueco(b1), b1], [alturaHueco(b1) - 0.03, b1]], P.a0 + 0.01, aV);
}

/** Construye el portal en `casa` (losa, relleno, carpintería y faroles). */
export function construirHastial(h, casa) {
  // Losa pentagonal con el hueco; la extrusión cubre a0..a1 (1 m de fondo).
  h.prismaA(casa, 'pared', perfilExterior(), P.a0, P.a1, [perfilHueco()]);
  // Babeta negra sobre los dos faldones del pentágono.
  const bab = (bA, bB) => {
    const yA = alturaPortal(bA);
    const yB = alturaPortal(bB);
    h.prismaA(casa, 'cenefa', [[yA, bA], [yA + PROFUNDIDAD_BABETA, bA], [yB + PROFUNDIDAD_BABETA, bB], [yB, bB]], P.a0 - 0.03, P.a1 + 0.03);
  };
  bab(P.b0 - 0.03, P.bPico);
  bab(P.bPico, P.b1 + 0.03);
  // Relleno del hueco en la cara sureste: franja negra (apenas saliente) y piedra (al ras).
  franja(h, casa, 'chapaNegra', P.franja[0], P.franja[1], P.a0 - 0.03, P.a0 + ESPESOR_INFILL);
  franja(h, casa, 'piedra', P.piedra[0], P.piedra[1], P.a0 - 0.005, P.a0 + ESPESOR_INFILL);
  // Pared sureste de la casa detrás del relleno (cierra el interior) y detrás del vidrio queda abierto.
  franja(h, casa, 'interior', P.franja[0], P.b1 - P.pilarNE, P.a0 + ESPESOR_INFILL, P.a1);
  construirVidrio(h, casa);
  h.farol(casa, P.a0 - 0.01, M.nivelPiso + 2.3, P.piedra[0] + 0.45, 'a-');
  h.farol(casa, P.a0 - 0.01, M.nivelPiso + 2.3, P.piedra[0] + 0.95, 'a-');
}
