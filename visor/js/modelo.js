import * as THREE from 'three';
import { MEDIDAS } from './medidas.js';
import { crearFabricaMateriales } from './materiales.js';
import { crearHerramientas } from './geometria.js';
import { construirPisos, construirParedes, construirTecho, construirInterior } from './casa-cuerpo.js';
import { construirHastial } from './casa-hastial.js';
import { construirGalpon, construirPorton, construirMurosVecinos, construirSuelo, construirLuces } from './entorno.js';

/**
 * Modelo paramétrico de la casa y el lote. Las medidas están en medidas.js y los materiales en
 * materiales.js. Dos usos:
 *  - crearModeloRelleno(): asoma en los huecos del splat (visor en primera persona).
 *  - crearMaqueta(): maqueta completa con sombras, techo desmontable e interior amueblado.
 *
 * Marco local de la casa: origen en la esquina sur S=(10,-1.6); a corre por la fachada suroeste
 * hacia la esquina oeste; b cruza hacia el noreste; Y arriba.
 */

export { MEDIDAS };
const M = MEDIDAS;

export function anguloCasa() {
  return Math.atan2(-M.direccionFachada.z, M.direccionFachada.x);
}

/** Convierte coordenadas locales de la casa (a, y, b) a mundo. */
export function localAMundo(a, y, b) {
  const v = new THREE.Vector3(a, y, b);
  v.applyAxisAngle(new THREE.Vector3(0, 1, 0), anguloCasa());
  v.x += M.esquinaSur.x;
  v.z += M.esquinaSur.z;
  return v;
}

/** Casa completa en su marco local; devuelve { casa, techo, interior } ya posicionados en el mundo. */
function construirCasa(mat, { conSombras, conMobiliario }) {
  const h = crearHerramientas(mat, conSombras);
  const casa = new THREE.Group();
  casa.name = 'casa';
  const techo = new THREE.Group();
  techo.name = 'techo';
  const interior = new THREE.Group();
  interior.name = 'interior';
  construirPisos(h, casa);
  construirParedes(h, casa);
  construirHastial(h, casa);
  construirTecho(h, techo);
  construirInterior(h, interior, conMobiliario);
  casa.add(techo, interior);
  casa.rotation.y = anguloCasa();
  casa.position.set(M.esquinaSur.x, 0, M.esquinaSur.z);
  return { casa, techo, interior };
}

/**
 * Modelo de relleno para el visor: 'entorno' siempre visible y 'casa' conmutable.
 */
export function crearModeloRelleno() {
  const mat = crearFabricaMateriales('relleno');
  const h = crearHerramientas(mat, false);
  const modelo = new THREE.Group();
  modelo.name = 'modelo-relleno';
  const entorno = new THREE.Group();
  entorno.name = 'entorno';
  entorno.add(construirSuelo(mat), construirGalpon(h), construirPorton(h), construirMurosVecinos(h), construirLuces());
  const { casa } = construirCasa(mat, { conSombras: false, conMobiliario: false });   // el interior es estimado: no se mezcla con el escaneo
  modelo.add(entorno, casa);
  return modelo;
}

/**
 * Maqueta texturada para maqueta.html y comparar.html. Devuelve el grupo y accesos a las capas.
 */
export function crearMaqueta() {
  const mat = crearFabricaMateriales('maqueta');
  const h = crearHerramientas(mat, true);
  const grupo = new THREE.Group();
  grupo.name = 'maqueta';
  const { casa, techo, interior } = construirCasa(mat, { conSombras: true, conMobiliario: true });
  const galpon = construirGalpon(h);
  const porton = construirPorton(h);
  const muros = construirMurosVecinos(h);
  const suelo = construirSuelo(mat);
  grupo.add(suelo, casa, galpon, porton, muros);
  return { grupo, casa, techo, interior, galpon, porton, muros, suelo, mat, herramientas: h };
}
