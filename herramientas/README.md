# Herramientas del pipeline (de `.ply` a visor)

Orden de uso cuando haya un escaneo nuevo (`casa3d.ply` en esta carpeta):

```bash
cd herramientas
python3 clean_ply.py ../casa3d.ply casa_limpio.ply          # saca puntos lejanos, splats gigantes y transparentes
npm init -y && npm install @mkkellogg/gaussian-splats-3d@0.4.7 three@0.160.0
node --max-old-space-size=8192 convert.mjs casa_limpio.ply ../visor/modelo/casa.ksplat 1 5 0
python3 maps.py ../casa3d.ply ./map 12                        # genera map_pts.npy / map_rgb.npy (puntos sólidos en coordenadas de mundo)
python3 terrain.py ../visor                                   # datos/terreno.json (grilla caminable) y terreno_debug.png
python3 minimapa.py ../visor/datos/mapa.png                   # imagen del mini plano
python3 extraer_texturas.py                                   # extrae texturas fotográficas PBR (difuso y normal) de las fotos
```

`plan_maps.py` y `zoom_maps.py` dibujan planos cenitales con grilla (piso, paredes, techo) para
medir posiciones y ajustar `visor/js/lugares.js` y `visor/js/modelo.js`. Requieren `numpy`.
