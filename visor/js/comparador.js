const MARGEN_PX = 16;
const SEPARACION_PX = 8;
const ALTO_RESERVADO_PX = 96;   // espacio para el panel del comparador cuando está abajo
const OPACIDAD_INICIAL = 0.5;
const FRACCION_ANCHO_PANEL_APILADO = 0.5;   // solo los paneles que ocupan media pantalla o más (celular) empujan la caja

/** Borde superior y altura disponibles entre los paneles que estén arriba y abajo de la pantalla. */
function espacioLibre(paneles) {
  let top = MARGEN_PX;
  let bottom = innerHeight - MARGEN_PX - ALTO_RESERVADO_PX;
  for (const panel of paneles) {
    if (!panel || panel.hidden || getComputedStyle(panel).display === 'none') continue;
    const r = panel.getBoundingClientRect();
    if (r.height === 0 || r.width < innerWidth * FRACCION_ANCHO_PANEL_APILADO) continue;
    if (r.top < innerHeight / 2) top = Math.max(top, r.bottom + SEPARACION_PX);
    else bottom = Math.min(bottom, r.top - SEPARACION_PX);
  }
  return { top, alto: Math.max(120, bottom - top) };
}

/**
 * Compara el escaneo con una foto real: lleva la cámara al punto de la toma,
 * recorta la vista al encuadre de la foto y superpone la imagen con opacidad ajustable.
 */
export class Comparador {
  constructor({ panel, escena, imagen, marco, camara, panelesVecinos = [], alCerrar, alCambiarEncuadre }) {
    this.panel = panel;
    this.panelesVecinos = panelesVecinos;
    this.escena = escena;
    this.imagen = imagen;
    this.marco = marco;
    this.camara = camara;
    this.alCerrar = alCerrar;
    this.alCambiarEncuadre = alCambiarEncuadre;
    this.foto = null;
    this.fovOriginal = camara.fov;
    this.titulo = panel.querySelector('.titulo');
    this.fuente = 'foto';
    this.botonesFuente = [...panel.querySelectorAll('[data-fuente]')];
    for (const b of this.botonesFuente) b.addEventListener('click', () => this.cambiarFuente(b.dataset.fuente));
    this.control = panel.querySelector('input[type="range"]');
    this.etiqueta = panel.querySelector('.etiqueta');
    this.control.addEventListener('input', () => this.aplicarOpacidad());
    panel.querySelector('[data-accion="foto"]').addEventListener('click', () => this.fijarOpacidad(1));
    panel.querySelector('[data-accion="mitad"]').addEventListener('click', () => this.fijarOpacidad(OPACIDAD_INICIAL));
    panel.querySelector('[data-accion="3d"]').addEventListener('click', () => this.fijarOpacidad(0));
    panel.querySelector('[data-accion="cerrar"]').addEventListener('click', () => this.cerrar());
    addEventListener('resize', () => this.encuadrar());
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.activo) this.cerrar(); });
    this.imagen.addEventListener('load', () => this.alCargarImagen());
    this.imagen.addEventListener('error', () => {
      this.titulo.textContent += ' (no se pudo cargar la imagen)';
      this.imagen.classList.remove('visible');
    });
  }

  /** Si la imagen real no tiene la proporción declarada, se usa la real para no deformarla. */
  alCargarImagen() {
    if (!this.foto) return;
    this.imagen.classList.add('visible');
    const { naturalWidth: w, naturalHeight: h } = this.imagen;
    if (!w || !h) return;
    const declarada = this.foto.ancho / this.foto.alto;
    if (Math.abs(w / h - declarada) / declarada > 0.02) {
      this.foto = { ...this.foto, ancho: w, alto: h };
      this.encuadrar();
    }
  }

  get activo() {
    return this.foto !== null;
  }

  abrir(foto, fuente = 'foto') {
    this.foto = foto;
    this.cambiarFuente(foto[fuente === 'ia' ? 'ia' : 'archivo'] ? fuente : (foto.archivo ? 'foto' : 'ia'));
    this.camara.fov = foto.fov;
    this.camara.updateProjectionMatrix();
    this.panel.hidden = false;
    this.marco.classList.add('visible');
    this.fijarOpacidad(OPACIDAD_INICIAL);
    this.encuadrar();
  }

  /** Elige qué imagen se superpone: la foto real ('foto') o la vista completada con IA ('ia'). */
  cambiarFuente(fuente) {
    if (!this.foto) return;
    const ruta = fuente === 'ia' ? this.foto.ia : this.foto.archivo;
    if (!ruta) return;
    this.fuente = fuente;
    this.imagen.classList.remove('visible');
    this.imagen.src = ruta;
    this.imagen.alt = this.foto.titulo;
    const prefijo = this.foto.n ? `Foto ${this.foto.n} · ` : '';
    this.titulo.textContent = `${prefijo}${this.foto.titulo}${fuente === 'ia' ? ' (vista IA)' : ''}`;
    for (const b of this.botonesFuente) {
      const disponible = Boolean(b.dataset.fuente === 'ia' ? this.foto.ia : this.foto.archivo);
      b.hidden = !disponible;
      b.classList.toggle('activo', b.dataset.fuente === fuente);
    }
  }

  cerrar() {
    if (!this.foto) return;
    this.foto = null;
    this.panel.hidden = true;
    this.imagen.classList.remove('visible');
    this.marco.classList.remove('visible');
    this.camara.fov = this.fovOriginal;
    this.camara.updateProjectionMatrix();
    Object.assign(this.escena.style, { left: '', top: '', width: '', height: '' });
    this.alCambiarEncuadre?.();
    this.alCerrar?.();
  }

  fijarOpacidad(valor) {
    this.control.value = String(Math.round(valor * 100));
    this.aplicarOpacidad();
  }

  aplicarOpacidad() {
    const v = Number(this.control.value) / 100;
    this.imagen.style.opacity = String(v);
    this.etiqueta.textContent = `${Math.round(v * 100)}%`;
  }

  /** Recorta la escena a un rectángulo con la proporción de la foto, centrado en la ventana. */
  encuadrar() {
    if (!this.foto) return;
    const proporcion = this.foto.ancho / this.foto.alto;
    const libre = espacioLibre([this.panel, ...this.panelesVecinos]);
    const anchoDisponible = innerWidth - MARGEN_PX * 2;
    let ancho = anchoDisponible;
    let alto = ancho / proporcion;
    if (alto > libre.alto) {
      alto = libre.alto;
      ancho = alto * proporcion;
    }
    const left = (innerWidth - ancho) / 2;
    const top = libre.top;
    const caja = { left: `${left}px`, top: `${top}px`, width: `${ancho}px`, height: `${alto}px` };
    Object.assign(this.escena.style, caja);
    Object.assign(this.imagen.style, caja);
    Object.assign(this.marco.style, caja);
    this.alCambiarEncuadre?.();
  }
}
