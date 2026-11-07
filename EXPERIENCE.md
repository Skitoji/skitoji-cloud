# Skitoji — edición audiovisual

El foco de Samuel es el diseño hipermedia orientado a lo audiovisual. La presentación, About me, orden de skills y servicios reflejan cine, animación, montaje y 3D. Los proyectos de Behance se conservan tal como existen; no se inventan rodajes, clientes ni showreels.

## Dos modelos con funciones diferentes

- **Hero:** conserva el nudo inicial, ahora en malla por defecto. Gira al cargar como pidió el propietario; permite alternar sólido/malla y pausar. La preferencia de movimiento reducido disminuye el giro y omite la inclinación por puntero.
- **Proceso:** cámara cinematográfica procedural 3D que se acerca, separa sus componentes y vuelve a montarse durante el recorrido. La óptica, sensor, cuerpo y monitor son piezas independientes. El renderer proyecta geometría con profundidad en Canvas 2D, sin descargar modelos, librerías ni texturas externas.

Visión, Óptica, Rodaje y Montaje forman los cuatro capítulos. Se pueden recorrer por scroll, mediante botones o con un deslizador nativo. El deslizador permite inspeccionar el recorrido sin mover la página; el siguiente scroll vuelve a sincronizarlo. La selección de piezas muestra una explicación y resalta su función en la cámara. Pausar congela el estado, incluidos cambios por scroll; reanudar recupera el recorrido.

Con movimiento reducido, la cámara del proceso comienza estática y los cambios solicitados explícitamente se muestran sin interpolación. Las pantallas bajas usan un bloque en flujo normal; el resto utiliza una escena sticky. Controles y texto ocupan celdas distintas de la composición para evitar superposiciones.

## Diario y notas

El diario tiene desplazamiento horizontal nativo, flechas y posición actual. Mantiene espacios configurables para foto y reel; ver MEDIA.md. No hay videos ni rodajes ficticios. El video real solo aparece tras cargar sus metadatos y nunca arranca automáticamente.

Las tres notas de proceso son textos editoriales nuevos sobre preproducción, luz y montaje. No se presentan como publicaciones históricas, casos de cliente ni experiencia no verificada. Usan `details` si falla JavaScript y un diálogo nativo cuando está disponible, con Escape, cierre por fondo y restauración del foco. El idioma también se actualiza dentro del lector.

## Escena final y sonido

El footer invita al contacto y permite elegir entre Mirada, Luz y Ritmo: cada fotograma cambia la composición y su explicación. Copiar correo solo aparece si Clipboard API está disponible y confirma el resultado real; el enlace de correo funciona siempre.

Los sonidos originales sintetizados siguen siendo voluntarios. El sitio inicia en silencio y no crea AudioContext hasta pulsar el control. Los nuevos botones de capítulos, piezas y fotogramas reciben respuestas breves cuando el sonido está activo. No se sonoriza el scroll ni la escritura.

## Referencia y límites de la revisión

Se consultaron [Studio KARO en Awwwards](https://www.awwwards.com/sites/studio-karo) y [Karoverse](https://www.karocrafts.com/karoverse): alternancia de introducción 3D, carrusel, contenido editorial, galería y cierre de marca. No se usan su código, imágenes, música ni videos. La herramienta de consulta permitió revisar estructura y páginas de elementos, pero no reproducir los clips de Awwwards.

La revisión local se realizó con Chromium y Playwright en 1440×1000, 1024×768, 390×844, 360×740 y 844×390. Se comprobaron desbordamiento horizontal, separación de texto/modelo/controles, capítulos, deslizador, inspección, pausa, malla, lector de notas, foco, diario, footer, portapapeles, idiomas y menú. Se probaron movimiento normal y reducido, sin errores JavaScript en ese recorrido. Las portadas reales de Behance se sirvieron desde una copia local durante la prueba. El formulario utilizó una respuesta local simulada; no se envió ningún correo.

Las pruebas de lógica, geometría, estados y estructura también pasan. Quedan para staging la CSP y caché reales del host, entrega de correo, percepción del sonido y revisión en dispositivos físicos. No se ha accedido por SSH ni publicado esta edición en la VPS.
