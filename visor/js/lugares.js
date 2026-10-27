/**
 * Puntos de interés del recorrido, en coordenadas de mundo del visor
 * (X derecha, Y arriba, Z hacia abajo del mini plano; yaw en radianes, 0 = mirando a -Z,
 * positivo gira a la izquierda). Ajustados a mano comparando el escaneo con las fotos.
 *
 * Referencias del escaneo: esquina sur de la casa (hastial de piedra) en (10, -1.6);
 * fachada vidriada hacia el suroeste hasta (5.2, -10.7); galpón de madera en (3.2, 1.6);
 * portón en (0.5..4, 9.5) con la calle hacia +Z; tierra colorada entre el portón y el hastial.
 */

// FOV vertical (el que usa three.js) según la lente que dice el EXIF (FocalLengthIn35mmFilm) y la
// orientación: se calcula como 2·atan(mitad del lado / focal equiv.) con el lado largo = 34,6 mm (4:3)
// o 37,6 mm (16:9) y el lado corto = 26 mm (4:3) o 21,2 mm (16:9).
const FOV_RETRATO = 72;        // 24 mm, vertical 3:4 (lado largo)
const FOV_PAISAJE = 57;        // 24 mm, horizontal 4:3 (lado corto)
const FOV_RETRATO_ANCHO = 102; // 14 mm (gran angular), vertical 3:4
const FOV_RETRATO_16_9 = 92;   // 16 mm (gran angular), vertical 9:16 (ajustado contra la maqueta)
const FOV_RETRATO_28 = 68;     // 28 mm, vertical 9:16

export const POSE_INICIAL = { x: -2, z: 1.5, yaw: -0.85, pitch: 0.05 };

export const DESTINOS = [
  { id: 'calle', nombre: 'Calle', x: 2.5, z: 12, yaw: 0.3, pitch: 0.03 },
  { id: 'porton', nombre: 'Portón', x: 2.5, z: 6.5, yaw: 3.1416, pitch: 0 },
  { id: 'galeria', nombre: 'Galería', x: 6.6, z: -5.5, yaw: -1.085, pitch: 0.05 },
  { id: 'sala', nombre: 'Sala', x: 9.5, z: -6.5, yaw: 0.5, pitch: 0 },
  { id: 'dormitorio', nombre: 'Dormitorio (ventana)', x: 4.0, z: -8.0, yaw: -1.085, pitch: 0 },
  { id: 'banio', nombre: 'Baño (pared noroeste)', x: 1.0, z: -12.5, yaw: -2.1, pitch: 0.1 },
  { id: 'arboleda', nombre: 'Arboleda', x: 0.5, z: -10, yaw: 3.0, pitch: 0.05 },
];

export const FOTOS = [
  { n: 1, archivo: 'fotos/foto-1.jpg', titulo: 'Galería y ventanal, de cerca', ancho: 1125, alto: 1500, fov: FOV_RETRATO, x: -0.2, z: -2.2, yaw: -1.3, pitch: 0.14 },
  { n: 2, archivo: 'fotos/foto-2.jpg', titulo: 'Frente con el hastial, desde la tierra colorada', ancho: 1125, alto: 1500, fov: FOV_RETRATO_ANCHO, x: 8.5, z: 5.0, yaw: -0.2, pitch: 0.1 },
  { n: 3, archivo: 'fotos/foto-3.jpg', titulo: 'Casa desde la calle, con el alambrado', ancho: 1500, alto: 1125, fov: FOV_PAISAJE, x: 13.4, z: 11.0, yaw: 0.06, pitch: 0.05 },
  { n: 4, archivo: 'fotos/foto-4.jpg', titulo: 'Portón de entrada, desde la calle', ancho: 1500, alto: 1125, fov: FOV_PAISAJE, x: 2.5, z: 18.5, yaw: 0.12, pitch: 0.03 },
  { n: 5, archivo: 'fotos/foto-5.jpg', titulo: 'Portón, pilares y arboleda, desde la calle', ancho: 1500, alto: 1125, fov: FOV_PAISAJE, x: 1.5, z: 14, yaw: 0.1, pitch: 0.03 },
  { n: 6, archivo: 'fotos/foto-6.jpg', titulo: 'Fachada completa desde el jardín', ancho: 1500, alto: 1125, fov: FOV_PAISAJE, x: -6.3, z: -1.1, yaw: -1.18, pitch: 0.065 },
  { n: 7, archivo: 'fotos/foto-7.jpg', titulo: 'Arboleda junto a la casa', ancho: 1125, alto: 844, fov: FOV_PAISAJE, x: -1.5, z: -7, yaw: -0.55, pitch: 0.12 },
  { n: 8, archivo: 'fotos/foto-8.jpg', titulo: 'Desde la arboleda hacia el galpón y el portón', ancho: 1500, alto: 1125, fov: FOV_PAISAJE, x: 3.0, z: -13, yaw: 3.25, pitch: 0.05 },
  { n: 9, archivo: 'fotos/foto-9.jpg', titulo: 'Lateral noroeste de la casa entre los árboles', ancho: 1500, alto: 1125, fov: FOV_PAISAJE, x: 4.5, z: -17.5, yaw: -2.35, pitch: 0.05 },
  { n: 10, archivo: 'fotos/foto-10.jpg', titulo: 'Galería y galpón (el auto estaba afuera al escanear)', ancho: 2000, alto: 1500, fov: FOV_PAISAJE, x: -2, z: 1.5, yaw: -0.85, pitch: 0.08 },
  { n: 11, archivo: 'fotos/foto-11.jpg', titulo: 'Hastial de cerca, desde la terraza del frente', ancho: 844, alto: 1500, fov: FOV_RETRATO_16_9, x: 12.0, z: 2.75, yaw: -0.04, pitch: 0.05 },
  { n: 12, archivo: 'fotos/foto-12.jpg', titulo: 'Ventanal y chimenea, desde la terraza', ancho: 844, alto: 1500, fov: FOV_RETRATO_28, x: 2.6, z: -0.75, yaw: -0.445, pitch: 0.12 },
  { n: 13, archivo: 'fotos/foto-13.jpg', titulo: 'Fachada y hastial de noche, con los faroles encendidos', ancho: 1500, alto: 1126, fov: FOV_PAISAJE, x: 6.3, z: 6.9, yaw: -0.4, pitch: 0.06 },
];
