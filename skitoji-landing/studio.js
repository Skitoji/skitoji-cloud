/* Scroll chapters and an optional visual journal. No content depends on this script. */
(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  function studyProgress(top, height, viewport) {
    const travel = height - viewport;
    return travel > 0 ? clamp(-top / travel) : 0;
  }
  function chapterTarget(top, scroll, height, viewport, index) {
    return Math.max(0, scroll + top + Math.max(0, height - viewport) * clamp(index / 3));
  }
  function safeMediaPath(value, type = 'image') {
    if (typeof value !== 'string' || !value.startsWith('/assets/')) return '';
    if (!/^\/assets\/[a-z0-9_.~/-]+$/i.test(value)) return '';
    if (value.slice(1).split('/').some(segment => segment === '.' || segment === '..' || segment === '')) return '';
    const extension = value.split('.').at(-1).toLowerCase();
    return (type === 'video' ? ['mp4', 'webm', 'ogg'] : ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif']).includes(extension) ? value : '';
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { studyProgress, chapterTarget, safeMediaPath };
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id);
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let language = document.documentElement.lang === 'en' ? 'en' : 'es';
  const copy = {
    es: [
      ['Visión', 'Todo empieza con una intención. Del concepto al storyboard, decido qué contar y cómo hacer que se sienta.'],
      ['Óptica', 'La luz, la lente y el encuadre construyen una mirada. Cada decisión visual acerca la historia a quien la ve.'],
      ['Rodaje', 'La idea toma cuerpo en el set. Cámara, dirección y movimiento trabajan juntos para capturar cada momento con intención.'],
      ['Montaje', 'Imagen y sonido encuentran su ritmo. Edición, color y animación reúnen las piezas en un relato que conecta.']
    ],
    en: [
      ['Vision', 'Everything starts with intent. From concept to storyboard, I decide what to tell and how it should feel.'],
      ['Optics', 'Light, lens and framing shape a point of view. Every visual choice brings the story closer to its audience.'],
      ['Production', 'The idea takes shape on set. Camera, direction and movement work together to capture each moment with purpose.'],
      ['Editing', 'Image and sound find their rhythm. Editing, color and animation bring the pieces together into a story that connects.']
    ]
  };
  const partCopy = {
    es: {
      lens: ['Lente · La mirada', 'La distancia focal y el enfoque dirigen la atención. Elijo la óptica para dar profundidad, cercanía y una intención a cada plano.'],
      sensor: ['Sensor · La luz', 'Aquí la luz se convierte en imagen. Exposición, rango dinámico y color ayudan a conservar la atmósfera y los detalles que después trabajaré en postproducción.'],
      body: ['Cuerpo · El rodaje', 'La herramienta reúne las decisiones del set. Preparar la cámara, el movimiento y la captura permite concentrarse en la dirección y en lo que sucede frente a ella.'],
      monitor: ['Monitor · El encuadre', 'Una ventana para revisar la historia mientras ocurre. Composición, foco y continuidad se comprueban en cada toma para que las imágenes funcionen juntas en el montaje.']
    },
    en: {
      lens: ['Lens · The perspective', 'Focal length and focus guide attention. I choose the lens to give each shot depth, intimacy and intent.'],
      sensor: ['Sensor · The light', 'This is where light becomes an image. Exposure, dynamic range and color preserve the atmosphere and detail I will shape in post-production.'],
      body: ['Body · The production', 'The tool brings the decisions on set together. Preparing the camera, movement and capture leaves room to focus on direction and what happens in front of the lens.'],
      monitor: ['Monitor · The frame', 'A window into the story as it happens. Composition, focus and continuity are checked on every take so the images work together in the edit.']
    }
  };
  const study = $('motionStudy');
  const nav = $('chapterNav');
  const title = $('motionChapterTitle');
  const description = $('motionChapterCopy');
  const progress = $('motionProgress');
  const announcement = $('motionAnnouncement');
  const scrub = $('cameraScrub');
  const chapters = nav ? Array.from(nav.querySelectorAll('button[data-chapter]')) : [];
  const validStudy = !!(study && nav && title && description && progress && chapters.length === 4
    && [0, 1, 2, 3].every(index => chapters.some(button => button.dataset.chapter === String(index))));
  let activeChapter = -1;
  let frame = 0;
  let manualProgress = null;
  function isFlowStudy() {
    const stage = study?.querySelector?.('.motion-stage');
    if (stage && typeof window.getComputedStyle === 'function') return window.getComputedStyle(stage).position !== 'sticky';
    return !study || study.offsetHeight - window.innerHeight <= 1;
  }

  function refreshStudy(force = false) {
    if (!validStudy) return;
    const value = manualProgress ?? (isFlowStudy() ? 0 : studyProgress(study.getBoundingClientRect().top, study.offsetHeight, window.innerHeight));
    const chapter = Math.min(3, Math.floor(value * 4));
    progress.value = value;
    if (scrub) {
      scrub.value = String(Math.round(value * 100));
      scrub.setAttribute('aria-valuetext', Math.round(value * 100) + '% · ' + copy[language][chapter][0]);
    }
    if (chapter === activeChapter && !force) return;
    activeChapter = chapter;
    study.dataset.chapter = String(chapter);
    title.textContent = copy[language][chapter][0];
    description.textContent = copy[language][chapter][1];
    chapters.forEach(button => {
      if (Number(button.dataset.chapter) === chapter) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function scheduleStudy() {
    if (frame) return;
    frame = window.requestAnimationFrame(() => { frame = 0; refreshStudy(); });
  }
  if (validStudy) {
    chapters.forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.chapter);
      clearInspection();
      const top = chapterTarget(study.getBoundingClientRect().top, window.scrollY, study.offsetHeight, window.innerHeight, index);
      const compactStudy = isFlowStudy();
      manualProgress = compactStudy ? index / 3 : null;
      if (compactStudy) refreshStudy(true);
      if (announcement) announcement.textContent = copy[language][index][0] + '. ' + copy[language][index][1];
      document.dispatchEvent(new CustomEvent('skitoji:chapter', { detail: { chapter: index } }));
      if (!compactStudy) window.scrollTo({ top, behavior: preference.matches ? 'auto' : 'smooth' });
    }));
    if (scrub) {
      scrub.disabled = false;
      scrub.addEventListener('input', () => {
        const value = Number(scrub.value);
        if (!Number.isFinite(value)) return;
        clearInspection();
        manualProgress = clamp(value / 100);
        refreshStudy();
        document.dispatchEvent(new CustomEvent('skitoji:camera-progress', { detail: { progress: manualProgress } }));
      });
      scrub.addEventListener('change', () => {
        if (announcement && activeChapter >= 0) announcement.textContent = copy[language][activeChapter][0] + '. ' + copy[language][activeChapter][1];
      });
    }
    refreshStudy();
    nav.hidden = false;
    window.addEventListener('scroll', () => { if (!isFlowStudy()) { clearInspection(); manualProgress = null; } scheduleStudy(); }, { passive: true });
  }

  const parts = $('cameraParts');
  const partTitle = $('cameraPartTitle');
  const partDescription = $('cameraPartCopy');
  const partButtons = parts ? Array.from(parts.querySelectorAll('button[data-camera-part]')) : [];
  const validParts = !!(parts && partTitle && partDescription && partButtons.length === 4
    && Object.keys(partCopy.es).every(part => partButtons.some(button => button.dataset.cameraPart === part)));
  let selectedPart = null;
  function clearInspection() {
    if (!validParts || selectedPart === null) return;
    selectedPart = null;
    refreshPart();
    document.dispatchEvent(new CustomEvent('skitoji:inspect-camera', { detail: { part: null } }));
  }
  function refreshPart() {
    if (!validParts) return;
    const words = selectedPart ? partCopy[language][selectedPart] : (language === 'es'
      ? ['Explora la cámara', 'Elige una pieza para descubrir cómo participa en la imagen. El recorrido vuelve a montar la cámara al terminar.']
      : ['Explore the camera', 'Choose a part to discover its role in the image. The sequence reassembles the camera at the end.']);
    partTitle.textContent = words[0];
    partDescription.textContent = words[1];
    partButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cameraPart === selectedPart)));
  }
  if (validParts) {
    partButtons.forEach(button => {
      if (!Object.hasOwn(partCopy.es, button.dataset.cameraPart)) return;
      button.addEventListener('click', () => {
        selectedPart = button.dataset.cameraPart;
        refreshPart();
        document.dispatchEvent(new CustomEvent('skitoji:inspect-camera', { detail: { part: selectedPart } }));
      });
    });
    refreshPart();
    parts.hidden = false;
  }

  const track = $('journalTrack');
  const previous = $('journalPrev');
  const next = $('journalNext');
  const position = $('journalPosition');
  function refreshJournal() {
    if (!track || !previous || !next) return;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    if (position) {
      const cards = Array.from(track.children || []);
      if (cards.length) {
        const origin = cards[0].offsetLeft;
        const index = next.disabled && !previous.disabled ? cards.length - 1 : cards.reduce((nearest, card, current) =>
          Math.abs(card.offsetLeft - origin - track.scrollLeft) < Math.abs(cards[nearest].offsetLeft - origin - track.scrollLeft) ? current : nearest, 0);
        position.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
      }
    }
  }
  if (track && previous && next) {
    previous.hidden = next.hidden = false;
    previous.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: preference.matches ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: preference.matches ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', refreshJournal, { passive: true });
    refreshJournal();
  }
  window.addEventListener('resize', () => { scheduleStudy(); refreshJournal(); }, { passive: true });
  document.addEventListener('skitoji:language', event => {
    const requested = typeof event.detail === 'string' ? event.detail : event.detail?.language;
    language = requested === 'en' ? 'en' : 'es';
    refreshStudy(true);
    refreshPart();
  });

  function attachMedia(config) {
    const photo = $('studioPhoto');
    const photoFallback = $('photoPlaceholder');
    const photoPath = safeMediaPath(config?.photo?.src);
    if (photo && photoFallback && photoPath) {
      photo.addEventListener('load', () => { photo.hidden = false; photoFallback.hidden = true; refreshJournal(); }, { once: true });
      photo.addEventListener('error', () => { photo.hidden = true; photoFallback.hidden = false; });
      photo.alt = typeof config.photo.alt === 'string' ? config.photo.alt : (language === 'en' ? 'A glimpse into the creative process' : 'Una mirada al proceso creativo');
      photo.loading = 'eager'; // Hidden lazy images cannot trigger their own load/reveal.
      photo.src = photoPath;
    }
    const video = $('studioVideo');
    const videoFallback = $('videoPlaceholder');
    const videoPath = safeMediaPath(config?.video?.src, 'video');
    if (video && videoFallback && videoPath) {
      video.addEventListener('loadedmetadata', () => { video.hidden = false; videoFallback.hidden = true; refreshJournal(); }, { once: true });
      video.addEventListener('error', () => { video.hidden = true; videoFallback.hidden = false; });
      const poster = safeMediaPath(config?.video?.poster);
      if (poster) video.poster = poster;
      video.src = videoPath;
    }
  }
  if (track) fetch('/studio-media.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error('Optional journal media unavailable'); return response.json(); })
    .then(attachMedia).catch(() => { /* Intentional placeholders remain useful and visible. */ });
})();
