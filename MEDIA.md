# Diario visual: fotografía y video

La sección Diario visual contiene un proyecto real de Behance y dos espacios reservados para fotografía y reel. Los espacios no solicitan archivos inexistentes ni muestran controles de reproducción hasta cargar un video real.

Para completarlos, copiar los medios a `skitoji-landing/assets/` y editar `skitoji-landing/studio-media.json`:

```json
{
  "photo": {
    "src": "/assets/proceso.webp",
    "alt": "Describe de forma concreta la fotografía que se muestra"
  },
  "video": {
    "src": "/assets/showreel.mp4",
    "poster": "/assets/showreel-poster.webp"
  }
}
```

Solo se admiten rutas del mismo origen bajo `/assets/`, sin parámetros ni segmentos `..`. Imágenes: JPG, JPEG, PNG, WebP, AVIF, GIF. Video: MP4, WebM, OGG. Comprobar compatibilidad real del códec en los navegadores usados; MP4 H.264 suele ser una opción práctica. `null` conserva el espacio reservado.

El video utiliza controles nativos, `playsinline` y precarga de metadatos; no tiene autoplay. Preparar medios optimizados y una imagen de portada. Si el video contiene diálogo o información sonora necesaria, añadir subtítulos WebVTT y su `<track>` en el HTML antes de publicarlo. No insertar video como sustituto de contenido textual esencial.

Mantener el proxy same-origin de `/api/contact`, las fuentes locales y la sincronización de `works.json`. El audio de interfaz usa Web Audio y no requiere ningún archivo de sonido externo ni cambiar la CSP.

La referencia consultada fue [Studio KARO](https://www.karocrafts.com/): su presentación combina imagen, video, música y diseño editorial. Los modelos, medios, código de interacción y sonidos de este portafolio son propios; no se usan los assets ni la música de esa web.
