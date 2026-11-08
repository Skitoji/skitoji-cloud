# Publicar el rediseño en la VPS

El cambio es estático: no requiere `npm install`, compilación ni reiniciar el backend. Publicar desde la rama `codex/portfolio-redesign` o desde `main` después de integrar el PR.

## Instrucción para el asistente de la VPS

> Revisa el PR de rediseño en Skitoji/skitoji-cloud y actualiza primero el preview del puerto 8099. Localiza su directorio real servido por Caddy y sus bind mounts: /srv/skitoji es solo un ejemplo del README. Haz un respaldo de los archivos estáticos actuales. Copia el contenido completo de skitoji-landing/ de esta rama al preview, incluidas fonts/, assets/, style.css, interactive.css, scene.js, camera.js, workbench.js, studio.js, projector.js, editorial.js, studio-media.json y favicon.svg. Retira los archivos obsoletos sound.js y delight.js del preview. No reemplaces el .env ni modifiques portfolio-form/, behance-sync/, otros dominios o servicios. Conserva medios propios y el works.json actual si es más reciente que el del repositorio. Revisa el preview en móvil y escritorio con la lista siguiente y facilita su URL al propietario antes de actualizar el dominio público. Conserva el respaldo para volver atrás.

## Antes de publicar

1. Identificar `root` de Caddy, volumen o bind mount del sitio y directorio de checkout. El sincronizador actual escribe `/home/skitoji/docker/skitoji-landing/works.json`; comprobar que sigue llegando al directorio servido.
2. Respaldar los archivos estáticos actuales fuera del directorio público, incluyendo el `works.json` más reciente.
3. Preparar staging sirviendo la carpeta `skitoji-landing/` en la raíz. Si staging necesita probar envíos reales, configurar su propio proxy same-origin `/api/contact`; un servidor estático aislado no entrega correo.
4. Mantener la CSP actual y comprobar sus errores en consola. Se necesitan CSS/JS/fuentes del mismo origen, `connect-src 'self'` y las imágenes HTTPS de Behance ya usadas. Los modelos se dibujan con geometría 3D proyectada en Canvas 2D; no requieren WebGL, CDN, `unsafe-inline` ni `unsafe-eval`.
5. No copiar las carpetas de tests ni documentos al directorio público. No usar una copia con `--delete` contra un directorio sin verificar su contenido y hacer respaldo.

## Revisión de staging

- Escritorio: 1440 y 1024 px. Móvil: 390 y 360 px. Comprobar que no hay scroll horizontal y que títulos, portadas y controles caben.
- Recargar con JavaScript deshabilitado: navegación, About me, Skills y proyectos iniciales siguen visibles; contacto por correo disponible.
- Cambiar ES/EN, recargar y navegar por teclado. Abrir/cerrar el menú con botón y Escape; recorrer filtros y servicios.
- Verificar que /about, /skills, /work, /services y /contact, también sus variantes .html, llegan al ancla correspondiente de la página principal.
- Filtrar Branding y Tipografía, volver a Todos y confirmar ambos proyectos. Simular fallo de /works.json: no debe desaparecer la selección inicial.
- En la escultura, confirmar que gira automáticamente al cargar, incluso sin hacer clic en la página. Probar pausa/reanudar y malla/sólido. Con reducción de movimiento del sistema debe girar más despacio y sin inclinación por puntero. Ocultar/mostrar la pestaña y salir/entrar de la sección: debe reanudarse salvo que el visitante la haya pausado manualmente.
- Con permiso del propietario para el mensaje de prueba, enviar un contacto real por /api/contact y comprobar la entrega en correo o Discord. Verificar errores y límites sin borrar el texto escrito. No considerar suficiente un HTTP 200 sin canal de entrega.
- Confirmar la S en favicon, menú, About me y pie. El símbolo debe conservar la proporción y no mover la navegación mientras carga.
- En el laboratorio de encuadre, comparar 16:9, 4:3 y 9:16; cambiar el ancho y comprobar el cálculo de altura. Probar 1920×1080 para 16:9 y 1080×1920 para 9:16, guía de tercios y entradas fuera de rango. Los mensajes deben ser comprensibles y conservar el último valor válido. Cambiar ES/EN sin perder el estado.
- Pulsar las 18 herramientas con ratón, toque y teclado. Cada selección debe actualizar nombre, uso, capacidades y etapa; solo una debe quedar seleccionada. El enlace a la etapa debe activar el capítulo real de la cámara y llevar al proceso. Sin JS deben mantenerse los nombres y el contenido inicial.
- Confirmar el movimiento continuo de la franja FILM / EDITING / MOTION / 3D & VISUAL STORIES, sin salto de bucle ni desbordamiento de página. Probar pausa/reanudar, foco y puntero. Con movimiento reducido debe empezar estática y moverse solo por una acción explícita.
- En el hero, confirmar el nudo en malla con giro automático. En la cámara cinematográfica, recorrer Visión/Óptica/Rodaje/Montaje y comprobar acercamiento, separación de piezas y recomposición. Probar el deslizador sin mover la página, las cuatro piezas, pausa y malla. El modelo completo y controles deben caber en 360 px y en landscape bajo. Con movimiento reducido, la cámara de proceso debe empezar estática y responder sin interpolar a las acciones explícitas; el hero conserva su giro suave acordado.
- Abrir y cerrar las tres notas con clic y teclado, Escape y clic en el fondo; verificar la restauración de foco y ES/EN dentro del lector. Sin JS deben funcionar como detalles desplegables.
- En el footer, confirmar el proyector 3D completo y sus bobinas en escritorio y móvil. Pausar/reanudar el modelo y cambiar la intensidad de luz: el haz debe responder incluso con el movimiento pausado. Fuera de pantalla o con la pestaña oculta debe suspender la animación. Con movimiento reducido debe comenzar estático.
- Copiar el correo; verificar la confirmación real y el enlace mailto cuando Clipboard API no esté disponible.
- Confirmar que no aparecen el botón de sonido ni el experimento anterior, que no se solicitan sound.js o delight.js y que las interacciones no crean AudioContext ni reproducen audio. El reel opcional solo utiliza sus controles nativos y no tiene autoplay.
- Probar el diario con flechas, teclado y tacto. Las fotos/reel se configuran en studio-media.json (ver MEDIA.md). Los placeholders deben seguir presentes ante medios ausentes o fallidos. El reel no tiene autoplay.
- Revisar consola y respuestas de fuentes, estilos, scripts y portadas. Confirmar cabeceras CSP y caché. Invalidar caché de HTML/CSS/JS cuando corresponda.

## Publicación y vuelta atrás

Aplicar únicamente los archivos estáticos validados, conservando backend, secretos y sync. Una vez publicados, comprobar https://skitoji.cloud, sus rutas anteriores y el formulario. No anunciar publicación hasta verificar el dominio.

Para volver atrás, restaurar el respaldo de los archivos estáticos; no modificar el backend ni las variables SMTP. Mantener el `works.json` más reciente.
