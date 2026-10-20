const COLOR_POSICION = '#ffd166';
const COLOR_CONO = 'rgba(255, 209, 102, 0.28)';
const COLOR_FOTO = '#8fd3ff';
const COLOR_DESTINO = '#9bd98a';
const RADIO_MARCADOR = 5;
const LARGO_CONO = 34;
const ANGULO_CONO = 0.5;

/**
 * Mini plano cenital con la posición del visitante, el cono de visión y
 * los puntos de las fotos y destinos. Un clic/toque teletransporta.
 */
export class MiniMapa {
  constructor({ contenedor, imagenUrl, x0, z0, pxPorMetro, alClick }) {
    this.contenedor = contenedor;
    this.x0 = x0;
    this.z0 = z0;
    this.pxPorMetro = pxPorMetro;
    this.alClick = alClick;
    this.lienzo = document.createElement('canvas');
    this.ctx = this.lienzo.getContext('2d');
    contenedor.appendChild(this.lienzo);
    this.imagen = new Image();
    this.imagen.onload = () => this.redimensionar();
    this.imagen.onerror = () => {
      console.error('No se pudo cargar el mini plano', imagenUrl);
      contenedor.hidden = true;
    };
    this.lienzo.setAttribute('role', 'img');
    this.lienzo.setAttribute('aria-label', 'Mini plano del lote con tu posición; tocá para ir a un punto');
    this.imagen.src = imagenUrl;
    this.pose = { x: 0, z: 0, yaw: 0 };
    this.marcadores = [];
    new ResizeObserver(() => this.redimensionar()).observe(contenedor);
    this.lienzo.addEventListener('pointerdown', (e) => this.alPulsar(e));
  }

  redimensionar() {
    const ancho = this.contenedor.clientWidth;
    const alto = this.contenedor.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.lienzo.width = Math.round(ancho * dpr);
    this.lienzo.height = Math.round(alto * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ancho = ancho;
    this.alto = alto;
    this.escala = this.imagen.width ? Math.min(ancho / this.imagen.width, alto / this.imagen.height) : 1;
    this.dx = (ancho - this.imagen.width * this.escala) / 2;
    this.dy = (alto - this.imagen.height * this.escala) / 2;
    this.dibujar();
  }

  aPantalla(x, z) {
    return {
      px: this.dx + (x - this.x0) * this.pxPorMetro * this.escala,
      py: this.dy + (z - this.z0) * this.pxPorMetro * this.escala,
    };
  }

  aMundo(px, py) {
    return {
      x: (px - this.dx) / (this.pxPorMetro * this.escala) + this.x0,
      z: (py - this.dy) / (this.pxPorMetro * this.escala) + this.z0,
    };
  }

  alPulsar(e) {
    e.stopPropagation();
    const r = this.lienzo.getBoundingClientRect();
    this.alClick?.(this.aMundo(e.clientX - r.left, e.clientY - r.top));
  }

  fijarMarcadores(marcadores) {
    this.marcadores = marcadores;
    this.dibujar();
  }

  actualizar(pose) {
    this.pose = pose;
    this.dibujar();
  }

  dibujar() {
    const ctx = this.ctx;
    if (!this.ancho || !this.imagen.width) return;
    ctx.clearRect(0, 0, this.ancho, this.alto);
    ctx.drawImage(this.imagen, this.dx, this.dy, this.imagen.width * this.escala, this.imagen.height * this.escala);
    for (const m of this.marcadores) this.dibujarMarcador(m);
    this.dibujarVisitante();
  }

  dibujarMarcador(m) {
    const ctx = this.ctx;
    const { px, py } = this.aPantalla(m.x, m.z);
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = m.tipo === 'foto' ? COLOR_FOTO : COLOR_DESTINO;
    ctx.fill();
    if (m.etiqueta) {
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(m.etiqueta, px + 5, py + 3);
    }
  }

  dibujarVisitante() {
    const ctx = this.ctx;
    const { px, py } = this.aPantalla(this.pose.x, this.pose.z);
    // El frente de la cámara es (-sin yaw, -cos yaw) en el plano XZ.
    const ang = Math.atan2(-Math.cos(this.pose.yaw), -Math.sin(this.pose.yaw));
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, LARGO_CONO * this.escala * 1.4, ang - ANGULO_CONO, ang + ANGULO_CONO);
    ctx.closePath();
    ctx.fillStyle = COLOR_CONO;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, RADIO_MARCADOR, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_POSICION;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#1a1a1a';
    ctx.stroke();
  }
}
