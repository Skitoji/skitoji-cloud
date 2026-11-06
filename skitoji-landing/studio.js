/* Scroll chapters and an optional visual journal. No content depends on this script. */
(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  function studyProgress(top, height, viewport) {
    const travel = height - viewport;
    return travel > 0 ? clamp(-top / travel) : 0;
  }
  function chapterTarget(top, scroll, height, viewport, index) {
    return Math.max(0, scroll + top + Math.max(0, height - viewport) * clamp(index / 2));
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
      ['Forma', 'Una idea encuentra su identidad en la forma. Cambia de perspectiva y descubre sus detalles.'],
      ['Ritmo', 'La forma se transforma cuando entra en movimiento. El ritmo conecta cada gesto.'],
      ['Relato', 'Diseño, cine y tecnología se encuentran para contar una historia con intención.']
    ],
    en: [
      ['Form', 'An idea finds its identity through form. Change perspective and discover its details.'],
      ['Rhythm', 'Form transforms when it starts moving. Rhythm connects every gesture.'],
      ['Story', 'Design, film and technology come together to tell a purposeful story.']
    ]
  };
  const study = $('motionStudy');
  const nav = $('chapterNav');
  const title = $('motionChapterTitle');
  const description = $('motionChapterCopy');
  const progress = $('motionProgress');
  const announcement = $('motionAnnouncement');
  const chapters = nav ? Array.from(nav.querySelectorAll('button[data-chapter]')) : [];
  const validStudy = !!(study && nav && title && description && progress && chapters.length === 3
    && [0, 1, 2].every(index => chapters.some(button => button.dataset.chapter === String(index))));
  let activeChapter = -1;
  let frame = 0;

  function refreshStudy(force = false) {
    if (!validStudy) return;
    const value = studyProgress(study.getBoundingClientRect().top, study.offsetHeight, window.innerHeight);
    const chapter = Math.min(2, Math.floor(value * 3));
    progress.value = value;
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
      const top = chapterTarget(study.getBoundingClientRect().top, window.scrollY, study.offsetHeight, window.innerHeight, index);
      if (announcement) announcement.textContent = copy[language][index][0] + '. ' + copy[language][index][1];
      window.scrollTo({ top, behavior: preference.matches ? 'auto' : 'smooth' });
    }));
    refreshStudy();
    nav.hidden = false;
    window.addEventListener('scroll', scheduleStudy, { passive: true });
  }

  const track = $('journalTrack');
  const previous = $('journalPrev');
  const next = $('journalNext');
  function refreshJournal() {
    if (!track || !previous || !next) return;
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
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
