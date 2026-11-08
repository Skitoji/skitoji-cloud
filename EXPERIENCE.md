# Skitoji — edición audiovisual

Samuel se presenta como diseñador hipermedia con enfoque audiovisual. Cine, animación, montaje y 3D guían la presentación, About me, herramientas y servicios. Los proyectos de Behance se conservan; no se inventan rodajes, clientes ni showreels.

## De la captura a la pantalla

- **Hero:** conserva el nudo inicial en malla. Gira al cargar, permite alternar sólido/malla y pausar. La preferencia de movimiento reducido disminuye el giro y omite la inclinación por puntero.
- **Proceso:** cámara cinematográfica procedural 3D que se acerca, separa óptica, sensor, cuerpo y monitor y vuelve a montarse. Visión, Óptica, Rodaje y Montaje forman sus cuatro capítulos. Se recorren por scroll, botones o deslizador nativo; las piezas permiten inspeccionar su función.
- **Cierre:** un proyector cinematográfico 3D conecta la captura con la presentación de la pieza. Sus bobinas y movimiento se pueden pausar; el control de luz modifica el haz sin depender de la animación. Con movimiento reducido comienza estático y puede animarse por una acción explícita.

Los modelos proyectan geometría con profundidad en Canvas 2D, sin descargar librerías, modelos ni texturas externas. La animación se suspende fuera de pantalla o al ocultar la pestaña. Se mantiene una ilustración de respaldo si no se puede dibujar el modelo.

En la cámara, pausar congela la pose, incluidos los cambios por scroll. El deslizador permite inspeccionar el recorrido sin mover la página; el siguiente scroll vuelve a sincronizarlo. Con movimiento reducido, la cámara comienza estática y los cambios explícitos se muestran sin interpolar. Las pantallas bajas usan un bloque en flujo normal; el resto utiliza una escena sticky. Texto, modelo y controles ocupan celdas distintas.

## Interacciones con una función concreta

El **laboratorio de encuadre** compara formatos 16:9, 4:3 y 9:16. Al indicar el ancho de entrega calcula la altura correspondiente; el visor cambia de formato y permite alternar la guía de tercios. Las entradas inválidas mantienen el último cálculo válido y muestran una explicación. La vista inicial y sus dimensiones permanecen disponibles sin JavaScript.

Las **18 herramientas** son botones de selección. Cada una muestra su uso, capacidades y etapa del flujo audiovisual, con un enlace que activa el capítulo correspondiente de la cámara. La selección se conserva al cambiar de idioma y no atribuye porcentajes de dominio, clientes o trabajos no documentados.

La **franja de disciplinas** se desplaza en un bucle continuo. El visitante puede pausarla y reanudarla; foco y puntero la detienen temporalmente. Con movimiento reducido empieza estática y solo se mueve tras una acción explícita. El contenido duplicado para el bucle queda fuera del árbol de accesibilidad.

La interfaz no incluye sonidos, botón de audio ni motor Web Audio. El reel opcional conserva sus controles nativos y nunca se reproduce automáticamente.

## Diario, notas y contacto

El diario tiene desplazamiento horizontal nativo, flechas y posición actual. Mantiene espacios configurables para foto y reel; ver [MEDIA.md](MEDIA.md). Los medios reales solo aparecen después de cargar y conservan un respaldo si fallan.

Las tres notas son textos editoriales nuevos sobre preproducción, luz y montaje. Usan `details` sin JavaScript y un diálogo nativo cuando está disponible, con Escape, cierre por fondo, restauración del foco y traducción ES/EN dentro del lector.

Copiar correo solo aparece si Clipboard API está disponible y confirma el resultado real. El enlace de correo funciona siempre. El formulario conserva el contrato del backend existente y solo anuncia entrega cuando la respuesta confirma un canal de envío.

## Referencia y validación

Se consultaron [Studio KARO en Awwwards](https://www.awwwards.com/sites/studio-karo) y [Karoverse](https://www.karocrafts.com/karoverse): introducción 3D, carrusel, contenido editorial, galería y cierre de marca. No se usan su código, imágenes, música ni videos. La consulta permitió revisar su estructura, pero no reproducir los clips de Awwwards.

La edición pasó las pruebas de lógica, geometría, cálculos, estados, traducciones y estructura. La revisión local en Chromium/Playwright cubrió 1440×1000, 1024×768, 390×844, 360×740 y 844×390, con movimiento normal y reducido: cámara, encuadres, herramientas y enlace al proceso, proyector y luz, franja, lector, foco, diario, idiomas y menú. No hubo desbordamiento horizontal ni errores JavaScript en el recorrido probado. También se comprobó el respaldo sin JavaScript. Las portadas reales de Behance se sirvieron desde una copia local y el formulario utilizó una respuesta simulada, sin enviar correo.

La CSP y caché del host, entrega real del formulario y revisión en dispositivos físicos se comprueban en staging. No se debe anunciar esta edición como publicada hasta verificar el preview y el dominio correspondientes.
