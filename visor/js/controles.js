import * as THREE from 'three';

const VELOCIDAD_CAMINAR = 2.2;   // m/s
const VELOCIDAD_CORRER = 4.5;    // m/s
const SENSIBILIDAD_MOUSE = 0.0025;
const SENSIBILIDAD_ARRASTRE = 0.004;
const SENSIBILIDAD_TACTIL = 0.005;
const PITCH_MAXIMO = 1.4;
const ALTURA_OJOS = 1.6;         // m sobre el piso
const SUAVIZADO_ALTURA = 7;      // 1/s
const RADIO_JOYSTICK = 50;       // px
const FRACCION_ZONA_JOYSTICK = 0.5;
const PASO_MAXIMO = 0.05;        // s, evita saltos tras una pestaña inactiva

const TECLAS_ADELANTE = ['w', 'arrowup'];
const TECLAS_ATRAS = ['s', 'arrowdown'];
const TECLAS_IZQUIERDA = ['a', 'arrowleft'];
const TECLAS_DERECHA = ['d', 'arrowright'];

function suavizar(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function anguloMasCorto(desde, hasta) {
  let d = (hasta - desde) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Controles en primera persona: WASD + mouse en escritorio, joystick + arrastre en táctil.
 * La cámara camina sobre el terreno con los ojos a 1,6 m y no sale del área escaneada.
 */
export class ControlesPrimeraPersona {
  constructor({ camara, elemento, terreno, joystick }) {
    this.camara = camara;
    this.elemento = elemento;
    this.terreno = terreno;
    this.joystick = joystick;
    this.posicion = new THREE.Vector3(0, ALTURA_OJOS, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.modoLibre = false;
    this.teclas = new Set();
    this.correr = false;
    this.vuelo = null;
    this.punteros = new Map();
    this.ejeJoystick = { x: 0, y: 0 };
    this.ultimoPiso = 0;
    this.alCambiar = null;
    this.registrarEventos();
  }

  registrarEventos() {
    addEventListener('keydown', (e) => {
      // Con Cmd/Ctrl/Alt apretados el navegador no manda el keyup y la tecla quedaría "pegada".
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      this.teclas.add(e.key.toLowerCase());
      if (e.key === 'Shift') this.correr = true;
    });
    addEventListener('keyup', (e) => {
      this.teclas.delete(e.key.toLowerCase());
      if (e.key === 'Shift') this.correr = false;
      if (e.key === 'Meta') this.teclas.clear();
    });
    addEventListener('blur', () => this.soltarTodo());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.soltarTodo(); });

    const el = this.elemento;
    el.addEventListener('pointerdown', (e) => this.alBajarPuntero(e));
    el.addEventListener('pointermove', (e) => this.alMoverPuntero(e));
    for (const tipo of ['pointerup', 'pointercancel']) {
      el.addEventListener(tipo, (e) => this.alSoltarPuntero(e));
    }
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== el) return;
      this.girar(e.movementX * SENSIBILIDAD_MOUSE, e.movementY * SENSIBILIDAD_MOUSE);
    });
  }

  /** Suelta teclas, punteros y joystick (al perder el foco o esconder la pestaña). */
  soltarTodo() {
    this.teclas.clear();
    this.correr = false;
    this.punteros.clear();
    this.ejeJoystick = { x: 0, y: 0 };
    this.joystick?.classList.remove('visible');
  }

  capturarMouse() {
    const resultado = this.elemento.requestPointerLock?.();
    if (resultado && typeof resultado.catch === 'function') resultado.catch(() => {});
  }

  alBajarPuntero(e) {
    if (document.pointerLockElement === this.elemento) return;
    const esTactil = e.pointerType === 'touch';
    const zonaJoystick = esTactil && e.clientX < innerWidth * FRACCION_ZONA_JOYSTICK
      && ![...this.punteros.values()].some((p) => p.rol === 'joystick');
    this.punteros.set(e.pointerId, { rol: zonaJoystick ? 'joystick' : 'mirar', x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY });
    this.elemento.setPointerCapture?.(e.pointerId);
    if (zonaJoystick) this.mostrarJoystick(e.clientX, e.clientY, 0, 0);
  }

  alMoverPuntero(e) {
    const p = this.punteros.get(e.pointerId);
    if (!p) return;
    if (p.rol === 'joystick') {
      const dx = e.clientX - p.ox;
      const dy = e.clientY - p.oy;
      const d = Math.hypot(dx, dy);
      const k = d > RADIO_JOYSTICK ? RADIO_JOYSTICK / d : 1;
      this.ejeJoystick = { x: (dx * k) / RADIO_JOYSTICK, y: (dy * k) / RADIO_JOYSTICK };
      this.mostrarJoystick(p.ox, p.oy, dx * k, dy * k);
      return;
    }
    const sens = e.pointerType === 'touch' ? SENSIBILIDAD_TACTIL : SENSIBILIDAD_ARRASTRE;
    this.girar((e.clientX - p.x) * sens, (e.clientY - p.y) * sens);
    p.x = e.clientX;
    p.y = e.clientY;
  }

  alSoltarPuntero(e) {
    const p = this.punteros.get(e.pointerId);
    if (!p) return;
    this.punteros.delete(e.pointerId);
    if (p.rol === 'joystick') {
      this.ejeJoystick = { x: 0, y: 0 };
      this.joystick?.classList.remove('visible');
    }
  }

  mostrarJoystick(x, y, dx, dy) {
    if (!this.joystick) return;
    this.joystick.style.left = `${x}px`;
    this.joystick.style.top = `${y}px`;
    this.joystick.style.setProperty('--jx', `${dx}px`);
    this.joystick.style.setProperty('--jy', `${dy}px`);
    this.joystick.classList.add('visible');
  }

  girar(dYaw, dPitch) {
    if (this.vuelo) return;
    this.yaw -= dYaw;
    this.pitch = Math.max(-PITCH_MAXIMO, Math.min(PITCH_MAXIMO, this.pitch - dPitch));
  }

  get pose() {
    return { x: this.posicion.x, y: this.posicion.y, z: this.posicion.z, yaw: this.yaw, pitch: this.pitch };
  }

  /** Salto inmediato a una pose (x, z, yaw, pitch; y opcional en modo libre). */
  teletransportar({ x, z, yaw, pitch, y }) {
    this.cancelarVuelo();
    this.posicion.x = x;
    this.posicion.z = z;
    this.yaw = yaw ?? this.yaw;
    this.pitch = pitch ?? this.pitch;
    if (this.modoLibre && y !== undefined) {
      this.posicion.y = y;
    } else {
      const piso = this.pisoEn(x, z);
      this.posicion.y = piso + ALTURA_OJOS;
    }
    this.aplicarCamara();
  }

  /** Vuelo suave hasta una pose. Devuelve una promesa que se resuelve al llegar. */
  volarA({ x, z, yaw, pitch }, duracionMs = 1800) {
    const desde = { x: this.posicion.x, z: this.posicion.z, yaw: this.yaw, pitch: this.pitch };
    const dYaw = anguloMasCorto(desde.yaw, yaw ?? desde.yaw);
    const dPitch = (pitch ?? desde.pitch) - desde.pitch;
    this.cancelarVuelo();
    return new Promise((resolver) => {
      this.vuelo = { desde, hasta: { x, z }, dYaw, dPitch, inicio: performance.now(), duracionMs, resolver };
    });
  }

  /** Corta el vuelo en curso resolviendo su promesa, para no dejarla colgada. */
  cancelarVuelo() {
    if (!this.vuelo) return;
    const { resolver } = this.vuelo;
    this.vuelo = null;
    resolver();
  }

  pisoEn(x, z) {
    const h = this.terreno?.altura(x, z);
    if (h !== null && h !== undefined) this.ultimoPiso = h;
    return this.ultimoPiso;
  }

  direccionDeseada() {
    let adelante = 0;
    let lateral = 0;
    if (TECLAS_ADELANTE.some((t) => this.teclas.has(t))) adelante += 1;
    if (TECLAS_ATRAS.some((t) => this.teclas.has(t))) adelante -= 1;
    if (TECLAS_DERECHA.some((t) => this.teclas.has(t))) lateral += 1;
    if (TECLAS_IZQUIERDA.some((t) => this.teclas.has(t))) lateral -= 1;
    adelante -= this.ejeJoystick.y;
    lateral += this.ejeJoystick.x;
    const largo = Math.hypot(adelante, lateral);
    if (largo > 1) { adelante /= largo; lateral /= largo; }
    return { adelante, lateral };
  }

  actualizar(ahoraMs, dt) {
    dt = Math.min(PASO_MAXIMO, dt);
    if (this.vuelo) {
      this.avanzarVuelo(ahoraMs);
    } else {
      this.caminar(dt);
    }
    this.seguirPiso(dt);
    this.aplicarCamara();
  }

  avanzarVuelo(ahoraMs) {
    const v = this.vuelo;
    const t = Math.min(1, (ahoraMs - v.inicio) / v.duracionMs);
    const s = suavizar(t);
    this.posicion.x = v.desde.x + (v.hasta.x - v.desde.x) * s;
    this.posicion.z = v.desde.z + (v.hasta.z - v.desde.z) * s;
    this.yaw = v.desde.yaw + v.dYaw * s;
    this.pitch = v.desde.pitch + v.dPitch * s;
    if (t >= 1) {
      this.vuelo = null;
      v.resolver();
    }
  }

  caminar(dt) {
    const { adelante, lateral } = this.direccionDeseada();
    if (adelante === 0 && lateral === 0) {
      if (this.modoLibre) this.subirBajar(dt);
      return;
    }
    const v = (this.correr ? VELOCIDAD_CORRER : VELOCIDAD_CAMINAR) * dt;
    const dirAdelante = new THREE.Vector2(-Math.sin(this.yaw), -Math.cos(this.yaw));
    const dirDerecha = new THREE.Vector2(Math.cos(this.yaw), -Math.sin(this.yaw));
    const paso = dirAdelante.multiplyScalar(adelante * v).add(dirDerecha.multiplyScalar(lateral * v));
    this.moverCon(paso);
    if (this.modoLibre) this.subirBajar(dt);
  }

  subirBajar(dt) {
    const v = VELOCIDAD_CAMINAR * dt;
    if (this.teclas.has('e')) this.posicion.y += v;
    if (this.teclas.has('q')) this.posicion.y -= v;
  }

  moverCon(paso) {
    const x = this.posicion.x;
    const z = this.posicion.z;
    if (this.modoLibre || !this.terreno) {
      this.posicion.x += paso.x;
      this.posicion.z += paso.y;
      return;
    }
    // Si ya estamos fuera del área caminable (p. ej. tras un salto a una foto), dejamos salir.
    const estabaFuera = !this.terreno.esCaminable(x, z);
    const candidatos = [[x + paso.x, z + paso.y], [x + paso.x, z], [x, z + paso.y]];
    for (const [cx, cz] of candidatos) {
      if (estabaFuera || this.terreno.esCaminable(cx, cz)) {
        this.posicion.x = cx;
        this.posicion.z = cz;
        return;
      }
    }
  }

  seguirPiso(dt) {
    if (this.modoLibre) return;
    const objetivo = this.pisoEn(this.posicion.x, this.posicion.z) + ALTURA_OJOS;
    const k = Math.min(1, SUAVIZADO_ALTURA * dt);
    this.posicion.y += (objetivo - this.posicion.y) * k;
  }

  aplicarCamara() {
    this.camara.position.copy(this.posicion);
    this.camara.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    const pose = this.pose;
    const u = this.ultimaPoseAvisada;
    if (u && u.x === pose.x && u.y === pose.y && u.z === pose.z && u.yaw === pose.yaw && u.pitch === pose.pitch) return;
    this.ultimaPoseAvisada = pose;
    this.alCambiar?.(pose);
  }
}
