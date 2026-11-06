# SKITOJI — S Frame

Símbolo original para Samuel Monroy / Skitoji. Dos cintas forman una S; el corte diagonal alude al montaje audiovisual y al paso de una idea a otra. Se preparó un concepto con generación de imagen y se reconstruyó la versión final como geometría SVG limpia, sin raster ni dependencias.

## Archivos

- `skitoji-landing/assets/skitoji-symbol.svg`: azul cobalto `#3049e8`, uso principal sobre fondos claros.
- `skitoji-landing/assets/skitoji-symbol-dark.svg`: tinta `#20231f`, uso monocromo sobre fondos claros.
- `skitoji-landing/assets/skitoji-symbol-white.svg`: marfil `#f7f7f2`, uso sobre fondos oscuros.
- `skitoji-landing/favicon.svg`: el mismo símbolo, sin fondo.

Conservar las proporciones del viewBox `0 0 100 104`. Tamaño recomendado: 24 px o más; dejar alrededor al menos el ancho del corte diagonal. No añadir sombras, contornos ni degradados, ni estirar o modificar los trazos. El nombre SKITOJI usa la tipografía local Space Grotesk del sitio, no texto incrustado en el símbolo.

## Integración e interacción

El símbolo se usa en navegación, About me y pie de página. Hay una entrada de 600 ms en la marca, sin pantalla que bloquee contenido, tiempos de espera ni progreso ficticio. Se omite con movimiento reducido.

El experimento opcional en About me permite conectar Forma, Movimiento e Historia. Tres botones nativos funcionan con ratón, tacto, Enter y Espacio. Al activar los tres, el símbolo responde una sola vez. Los estados son reversibles, están disponibles a lectores de pantalla y se traducen con ES/EN. Sin JS, el contenido estático sigue visible. Sin sonido, partículas ni almacenamiento adicional.

La animación 3D conserva el inicio automático acordado y sus controles. No se modifica el backend ni la sincronización de Behance.
