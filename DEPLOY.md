# Publicar el rediseño en la VPS

El cambio es estático: no requiere `npm install`, compilación ni reiniciar el backend. Publicar desde la rama `codex/portfolio-redesign` o desde `main` después de integrar el PR.

## Instrucción para el asistente de la VPS

> Revisa el PR de rediseño en Skitoji/skitoji-cloud y prepara una copia de staging de su rama. Localiza primero el directorio real que Caddy sirve para skitoji.cloud y sus bind mounts: /srv/skitoji es solo un ejemplo del README. Haz un respaldo de los archivos estáticos actuales. Copia el contenido completo de skitoji-landing/ de esta rama al directorio de staging, incluidas fonts/, assets/, scene.js, delight.js y favicon.svg. No reemplaces el .env ni modifiques portfolio-form/, behance-sync/, otros dominios o servicios. Conserva el works.json actual de producción si es más reciente que el del repositorio. Revisa el staging en móvil y escritorio con la lista siguiente y facilita su URL al propietario. Publica el staging cuando el propietario lo indique; conserva el respaldo para volver atrás.

## Antes de publicar

1. Identificar `root` de Caddy, volumen o bind mount del sitio y directorio de checkout. El sincronizador actual escribe `/home/skitoji/docker/skitoji-landing/works.json`; comprobar que sigue llegando al directorio servido.
2. Respaldar los archivos estáticos actuales fuera del directorio público, incluyendo el `works.json` más reciente.
3. Preparar staging sirviendo la carpeta `skitoji-landing/` en la raíz. Si staging necesita probar envíos reales, configurar su propio proxy same-origin `/api/contact`; un servidor estático aislado no entrega correo.
4. Mantener la CSP actual y comprobar sus errores en consola. Se necesitan CSS/JS/fuentes del mismo origen, `connect-src 'self'` y las imágenes HTTPS de Behance ya usadas. La escultura no requiere WebGL, CDN, `unsafe-inline` ni `unsafe-eval`.
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
- Probar Forma, Movimiento e Historia con ratón, toque y teclado: cada botón debe cambiar de estado, los tres juntos deben activar la respuesta del logo y volver a pulsar debe desactivarlo. Cambiar ES/EN conserva la selección. Con movimiento reducido no debe haber rebote; sin JS los controles no aparecen y queda la frase estática.
- Revisar consola y respuestas de fuentes, estilos, scripts y portadas. Confirmar cabeceras CSP y caché. Invalidar caché de HTML/CSS/JS cuando corresponda.

## Publicación y vuelta atrás

Aplicar únicamente los archivos estáticos validados, conservando backend, secretos y sync. Una vez publicados, comprobar https://skitoji.cloud, sus rutas anteriores y el formulario. No anunciar publicación hasta verificar el dominio.

Para volver atrás, restaurar el respaldo de los archivos estáticos; no modificar el backend ni las variables SMTP. Mantener el `works.json` más reciente.
