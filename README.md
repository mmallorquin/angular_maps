# Casa & Lote · Simulación 3D & Mapas

Recorrido y simulación 3D interactiva en primera persona del lote y la casa a partir del escaneo **Gaussian Splatting (.ply / .ksplat)** con **Three.js**, mini plano cenital, comparador de fotos reales, maqueta volumétrica y mapas interactivos.

---

## 🚀 Inicio Rápido

Para ver el recorrido o la maqueta hace falta un servidor local (los navegadores bloquean la carga de modelos grandes desde `file://`):

```bash
# Opción 1: con Node.js
npm install
npm start

# Opción 2: con Python 3
python3 -m http.server 8080
```

Luego abre en el navegador:
- **Página principal / Menú:** [http://localhost:8080/](http://localhost:8080/)
- **Recorrido 3D en primera persona:** [http://localhost:8080/visor/index.html](http://localhost:8080/visor/index.html)
- **Maqueta 3D volumétrica:** [http://localhost:8080/visor/maqueta.html](http://localhost:8080/visor/maqueta.html)

---

## 🎮 Controles del Recorrido 3D

- **Escritorio:**
  - `W A S D` o flechas para caminar.
  - Arrastrar con el ratón o botón **🖱️ Capturar mouse** para rotar la mirada (`Esc` para soltar).
  - `Shift` para correr.
- **Móvil / Tablet:**
  - Pulgar izquierdo: joystick de desplazamiento.
  - Pulgar derecho: rotación de cámara.
- **Mini plano:** haz clic en cualquier punto caminable para volar automáticamente allí.
- **Destinos rápidos:** Calle, Portón, Galería, Sala, Dormitorio, Baño y Arboleda.
- **Comparador con fotos reales:** transporta la cámara al ángulo exacto de cada toma (10 fotos) con control de opacidad (3D ↔ Foto) o vistas asistidas por IA.
- **Completar casa:** activa un modelo paramétrico Three.js que rellena paredes, aberturas, techo con alero, vigas y hastial de piedra en las zonas no captadas por el escaneo.
- **Cargar .PLY:** botón en la cabecera o arrastrar directamente cualquier archivo `.ply` o `.ksplat` a la ventana.

---

## 📦 Archivo .PLY y Reensamblado

El escaneo original de Scaniverse pesa ~114.8 MB. Debido al límite estricto de 100 MB por archivo de GitHub, el archivo se versiona dividido en partes en `escaneo/`:

- `escaneo/casa.ply.part00` (90 MB)
- `escaneo/casa.ply.part01` (19 MB)
- `escaneo/casa.ply.sha256` (suma de verificación SHA-256)

Para reconstruir el archivo `.ply` completo:

```bash
./escaneo/unir-ply.sh
# o con npm:
npm run assemble:ply
```

El script verificará la integridad con la suma SHA-256 y creará `escaneo/casa.ply`.

---

## 📁 Estructura del Proyecto

```
.
├── index.html                   # Menú principal y mapa interactivo
├── package.json                 # Dependencias (three, @mkkellogg/gaussian-splats-3d)
├── MODELO-3D-PLY.md             # Guía detallada de uso y publicación del .ply
├── PROMPT-completar-modelo.md   # Prompt de especificación del modelo 3D
├── escaneo/                     # Splat crudo dividido en partes < 90 MB
│   ├── casa.ply.part00
│   ├── casa.ply.part01
│   ├── casa.ply.sha256
│   └── unir-ply.sh
├── visor/                       # Visor 3D Three.js + Gaussian Splatting
│   ├── index.html               # Recorrido 3D en primera persona
│   ├── maqueta.html             # Maqueta 3D volumétrica con OrbitControls
│   ├── css/                     # Estilos de interfaz
│   ├── datos/                   # Terreno caminable, mapa cenital, ficha técnica
│   ├── fotos/                   # 10 fotos reales de referencia
│   ├── ia/                      # Renders completados con IA
│   ├── js/                      # Lógica de Three.js, controles, modelo, terreno
│   ├── lib/                     # three.module.js, gaussian-splats-3d.module.js
│   ├── modelo/                  # casa.ksplat (10.8 MB optimizado)
│   └── renders/                 # Renders base para comparación
└── herramientas/                # Pipeline de procesamiento (Python + Node.js)
    ├── clean_ply.py             # Limpia outliers y splats transparentes
    ├── convert.mjs              # Convierte .ply a .ksplat comprimido
    ├── terrain.py               # Genera grilla caminable (terreno.json)
    └── minimapa.py              # Genera mapa cenital (mapa.png)
```

---

## 🛠️ Herramientas de Conversión y Mantenimiento

```bash
# Limpiar el PLY de puntos flotantes lejanos y niebla:
npm run clean:ply

# Convertir a .ksplat optimizado de alta velocidad:
npm run convert:ksplat
```
