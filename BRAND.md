# SKITOJI — Flujo

Identidad elegida por Samuel Monroy: propuesta 06 / Flujo. S orgánica con extremos afilados y dos espacios negativos diagonales en forma de gota. La versión final se reconstruyó como un trazado SVG de color plano para conservar nitidez a cualquier tamaño.

## Archivos de la web

- `skitoji-landing/assets/skitoji-symbol.svg`: azul `#3049e8`.
- `skitoji-landing/assets/skitoji-symbol-dark.svg`: tinta `#20231f`.
- `skitoji-landing/assets/skitoji-symbol-white.svg`: blanco `#ffffff`.
- `skitoji-landing/assets/skitoji-symbol.png`: PNG transparente de 1024 × 1024.
- `skitoji-landing/favicon.svg`: el mismo símbolo escalable.

Mantener viewBox `0 0 100 100` y proporción cuadrada. No estirar, rellenar los espacios negativos ni añadir sombras, degradados o bordes. Azul/tinta sobre fondos claros; blanco sobre oscuros. Tamaño recomendado: 24 px o más. El nombre SKITOJI usa Space Grotesk local.

## Kit para redes sociales

Descargar [`brand/skitoji-flujo-kit.zip`](brand/skitoji-flujo-kit.zip). Contiene 42 gráficos más guía y manifest:

- 3 SVG y 3 PDF vectoriales: azul, oscuro y blanco.
- 18 PNG cuadrados transparentes: 128, 256, 512, 1024, 2048 y 4096 px en cada color.
- 12 avatares PNG: 400, 800, 1080 y 2048 px con fondo claro, oscuro y azul.
- 3 avatares SVG y 3 JPG de 1080 px.

Los avatares reservan un margen del 16% por lado, validado para recortes circulares. Todos los tamaños se renderizan desde el vector; no se amplían imágenes pequeñas. El manifest registra dimensiones, variantes y SHA-256.

Para regenerar el paquete con Inkscape e ImageMagick:

```bash
python3 scripts/export-brand.py
```

El script permite elegir `--master`, `--output` y `--zip`. No cambia el master.

## Movimiento

El logo tiene una entrada breve; su forma y archivos maestros se conservan. El hero mantiene el nudo inicial en malla. La cámara cinematográfica 3D se desarma y recompone por scroll, con capítulos, deslizador, inspección de piezas, pausa y malla. El cierre muestra un proyector 3D con bobinas y luz graduable. El recorrido de la cámara usa cambios inmediatos al solicitar movimiento reducido; el proyector comienza estático con esa preferencia.

La franja de disciplinas aporta movimiento continuo con control de pausa. El laboratorio de encuadre y las herramientas tienen funciones concretas sin modificar ni deformar el símbolo. La interfaz no reproduce sonidos y no incluye control de audio.
