/**
 * Grilla de terreno generada a partir del escaneo: altura del piso por celda y
 * celdas bloqueadas (paredes, árboles, muebles). Coordenadas de mundo: X derecha,
 * Y arriba, Z hacia abajo del plano.
 */
const RADIO_BUSQUEDA = 6;   // celdas (3 m con celda de 0,5 m)

export class Terreno {
  constructor(datos) {
    const campos = ['x0', 'z0', 'celda', 'nx', 'nz', 'alturas', 'bloqueadas'];
    for (const campo of campos) {
      if (datos[campo] === undefined) throw new Error(`terreno.json sin el campo "${campo}"`);
    }
    if (datos.alturas.length !== datos.nx * datos.nz) throw new Error('terreno.json: tamaño de "alturas" inconsistente');
    if (datos.bloqueadas.length !== datos.nx * datos.nz) throw new Error('terreno.json: tamaño de "bloqueadas" inconsistente');
    if (!(datos.celda > 0)) throw new Error('terreno.json: "celda" debe ser positiva');
    this.x0 = datos.x0;
    this.z0 = datos.z0;
    this.celda = datos.celda;
    this.nx = datos.nx;
    this.nz = datos.nz;
    this.alturas = datos.alturas;
    this.bloqueadas = datos.bloqueadas;
  }

  get limites() {
    return {
      x0: this.x0,
      z0: this.z0,
      x1: this.x0 + this.nx * this.celda,
      z1: this.z0 + this.nz * this.celda,
    };
  }

  indice(x, z) {
    const ix = Math.floor((x - this.x0) / this.celda);
    const iz = Math.floor((z - this.z0) / this.celda);
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return -1;
    return iz * this.nx + ix;
  }

  alturaCelda(ix, iz) {
    if (ix < 0 || iz < 0 || ix >= this.nx || iz >= this.nz) return null;
    return this.alturas[iz * this.nx + ix];
  }

  /** Altura del piso interpolada entre los centros de celda conocidos; null si no hay datos. */
  altura(x, z) {
    const fx = (x - this.x0) / this.celda - 0.5;
    const fz = (z - this.z0) / this.celda - 0.5;
    const ix = Math.floor(fx);
    const iz = Math.floor(fz);
    const tx = fx - ix;
    const tz = fz - iz;
    const pesos = [
      [0, 0, (1 - tx) * (1 - tz)],
      [1, 0, tx * (1 - tz)],
      [0, 1, (1 - tx) * tz],
      [1, 1, tx * tz],
    ];
    let suma = 0;
    let peso = 0;
    for (const [dx, dz, w] of pesos) {
      const h = this.alturaCelda(ix + dx, iz + dz);
      if (h === null) continue;
      suma += h * w;
      peso += w;
    }
    if (peso > 0) return suma / peso;
    return this.alturaMasCercana(ix, iz);
  }

  /** Altura de la celda con datos más cercana (hasta RADIO_BUSQUEDA celdas); null si no hay ninguna. */
  alturaMasCercana(ix, iz) {
    for (let r = 1; r <= RADIO_BUSQUEDA; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const h = this.alturaCelda(ix + dx, iz + dz);
          if (h !== null) return h;
        }
      }
    }
    return null;
  }

  esCaminable(x, z) {
    const i = this.indice(x, z);
    return i >= 0 && this.alturas[i] !== null && !this.bloqueadas[i];
  }
}
