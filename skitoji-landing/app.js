/* Progressive enhancement: all primary content is available without JavaScript. */
(() => {
  'use strict';
  const categories = {
    'works.cat.branding': { es: 'Branding', en: 'Branding' },
    'works.cat.typography': { es: 'Tipografía', en: 'Typography' },
    'works.cat.film': { es: 'Cine', en: 'Film' },
    'works.cat.uiux': { es: 'Diseño UI/UX', en: 'UI/UX design' },
    'works.cat.motion': { es: 'Motion', en: 'Motion' },
    'works.cat.3d': { es: '3D / VFX', en: '3D / VFX' },
    'works.cat.project': { es: 'Proyecto', en: 'Project' }
  };
  function safeURL(value, type = 'project') {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') return '';
      if (type === 'project' && !['www.behance.net', 'behance.net'].includes(url.hostname)) return '';
      if (type === 'image' && !(url.hostname === 'behance.net' || url.hostname.endsWith('.behance.net'))) return '';
      return url.href;
    } catch { return ''; }
  }
  function normalizeProjects(data) {
    if (!data || !Array.isArray(data.projects)) throw new Error('Invalid projects response');
    return data.projects.filter(p => p && typeof p.title === 'string' && safeURL(p.url)).map(p => ({
      title: p.title, url: safeURL(p.url), cover: safeURL(p.cover, 'image'),
      category: Object.hasOwn(categories, p.category) ? p.category : 'works.cat.project',
      year: typeof p.year === 'string' || typeof p.year === 'number' ? String(p.year) : '',
      description: typeof p.description === 'string' ? p.description : ''
    }));
  }
  function contactPayload(fields, elapsed) {
    return { name: String(fields.name || '').trim(), email: String(fields.email || '').trim(),
      projectType: String(fields.projectType || ''), message: String(fields.message || '').trim(),
      website: String(fields.website || ''), form_time: String(Math.floor(elapsed)) };
  }
  function delivered(responseOK, data) {
    return responseOK && data?.ok === true && (data.email === true || data.discord === true);
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { safeURL, normalizeProjects, contactPayload, delivered };
  if (typeof document === 'undefined') return;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const startedAt = performance.now();
  const form = $('#contactForm');
  const status = $('#formStatus');
  const submit = form?.querySelector('[type="submit"]');
  let language = 'es';
  let formBusy = false;
  let statusKey = '';
  let filter = 'all';
  let feedState = '';
  const messages = {
    es: { sending: 'Enviando…', success: 'Mensaje enviado. Gracias por compartir tu idea; pronto estaremos en contacto.', error: 'No se pudo enviar. Intenta de nuevo o escríbeme al correo de la izquierda.', rate: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.', long: 'El mensaje es demasiado largo. Acórtalo un poco o envíamelo por correo.', required: 'Completa los campos sin dejar solo espacios.', offline: 'No pude actualizar los proyectos. Puedes ver la selección guardada o visitar Behance.', empty: 'Todavía no hay proyectos publicados.' },
    en: { sending: 'Sending…', success: 'Message sent. Thanks for sharing your idea; we’ll be in touch soon.', error: 'Could not send. Please try again or email me using the address alongside.', rate: 'Too many attempts. Wait a few minutes and try again.', long: 'This message is too long. Please shorten it or send it by email.', required: 'Please complete the fields without leaving only spaces.', offline: 'Could not refresh the projects. Browse the saved selection or visit Behance.', empty: 'No published projects yet.' }
  };
  document.body.classList.add('js-ready');
  if (submit) submit.disabled = false;
  function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function storageSet(key, value) { try { localStorage.setItem(key, value); } catch { /* Privacy mode still works. */ } }
  function refreshStatus() {
    if (status) status.textContent = statusKey ? messages[language][statusKey] : '';
    if (formBusy && submit) submit.querySelector('[data-submit-label]').textContent = messages[language].sending;
  }
  function setLanguage(next) {
    language = next === 'en' ? 'en' : 'es';
    document.documentElement.lang = language;
    $$('[data-es][data-en]').forEach(el => { el.textContent = el.getAttribute('data-' + language); });
    $$('[data-placeholder-es]').forEach(el => { el.placeholder = el.getAttribute('data-placeholder-' + language); });
    $$('[data-lang]').forEach(el => { el.setAttribute('aria-pressed', String(el.dataset.lang === language)); });
    $('.wordmark')?.setAttribute('aria-label', language === 'es' ? 'Skitoji — Inicio' : 'Skitoji — Home');
    $('.footer-wordmark')?.setAttribute('aria-label', language === 'es' ? 'Skitoji — volver al inicio' : 'Skitoji — back to top');
    $('#mainNav')?.setAttribute('aria-label', language === 'es' ? 'Principal' : 'Main navigation');
    $('#workFilters')?.setAttribute('aria-label', language === 'es' ? 'Filtrar proyectos' : 'Filter projects');
    $('.hero-art')?.setAttribute('aria-label', language === 'es' ? 'Estudio visual 3D interactivo' : 'Interactive 3D form study');
    $('meta[name="description"]')?.setAttribute('content', language === 'es'
      ? 'Samuel Monroy — diseñador hipermedia y filmmaker en Cartagena, Colombia. Diseño, narrativa visual, animación y experiencias digitales.'
      : 'Samuel Monroy — hypermedia designer and filmmaker in Cartagena, Colombia. Design, visual storytelling, animation and digital experiences.');
    updateMenuLabel();
    updateWorks();
    refreshStatus();
    if ($('#workNotice')) $('#workNotice').textContent = feedState ? messages[language][feedState] : '';
    storageSet('skitoji-lang', language);
    document.dispatchEvent(new CustomEvent('skitoji:language', { detail: { language } }));
  }
  $$('[data-lang]').forEach(el => el.addEventListener('click', () => setLanguage(el.dataset.lang)));

  const menuButton = $('#menuToggle');
  const nav = $('#mainNav');
  function updateMenuLabel() {
    const open = menuButton?.getAttribute('aria-expanded') === 'true';
    menuButton?.setAttribute('aria-label', language === 'es' ? (open ? 'Cerrar menú' : 'Abrir menú') : (open ? 'Close menu' : 'Open menu'));
  }
  function setMenu(open) {
    nav?.classList.toggle('is-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    updateMenuLabel();
  }
  menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); } });
  document.addEventListener('click', e => { if (menuButton?.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) setMenu(false); });
  const desktop = window.matchMedia('(min-width: 761px)');
  desktop.addEventListener?.('change', e => { if (e.matches) setMenu(false); });

  const workGrid = $('#worksGrid');
  const filters = $('#workFilters');
  const workCount = $('#workCount');
  function updateWorks() {
    const cards = workGrid ? Array.from(workGrid.children) : [];
    let count = 0;
    cards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
      if (!card.hidden) count++;
      const cover = card.querySelector('.project-image');
      const title = card.querySelector('h3')?.textContent || '';
      cover?.setAttribute('aria-label', (language === 'es' ? 'Ver ' : 'View ') + title + (language === 'es' ? ' en Behance' : ' on Behance'));
    });
    if (workCount) workCount.textContent = String(count).padStart(2, '0') + (language === 'es' ? (count === 1 ? ' PROYECTO' : ' PROYECTOS') : (count === 1 ? ' PROJECT' : ' PROJECTS'));
    if ($('#workEmpty')) $('#workEmpty').hidden = count > 0;
    filters?.querySelectorAll('button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.filter === filter)));
  }
  filters?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    updateWorks();
  });
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function externalLink(className, url) {
    const link = node('a', className);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }
  function translatedCategory(key, className = '') {
    const label = node('span', className, categories[key][language]);
    label.dataset.es = categories[key].es;
    label.dataset.en = categories[key].en;
    return label;
  }
  function renderProjects(projects) {
    const content = document.createDocumentFragment();
    projects.forEach((p, i) => {
      const article = node('article', 'project-card');
      article.dataset.category = p.category;
      const cover = externalLink('project-image', p.url);
      if (p.cover) {
        const image = node('img');
        image.src = p.cover;
        image.alt = p.title;
        image.width = 800;
        image.height = 625;
        image.loading = 'lazy';
        image.decoding = 'async';
        cover.append(image);
      } else cover.append(node('span', 'cover-fallback', p.title));
      const arrow = node('span', 'project-open', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      const index = node('span', 'project-number mono', String(i + 1).padStart(2, '0'));
      index.setAttribute('aria-hidden', 'true');
      cover.append(arrow, index);
      const meta = node('div', 'project-meta mono');
      meta.append(translatedCategory(p.category), node('span', '', p.year));
      const heading = node('h3');
      const titleLink = externalLink('', p.url);
      titleLink.textContent = p.title;
      heading.append(titleLink);
      article.append(cover, meta, heading, node('p', 'project-description', p.description));
      content.append(article);
    });
    workGrid.replaceChildren(content);
    // New categories from the sync automatically become filterable.
    const wanted = new Set(projects.map(p => p.category));
    wanted.forEach(key => {
      if (Array.from(filters.children).some(btn => btn.dataset.filter === key)) return;
      const btn = node('button', 'filter-button', categories[key][language]);
      btn.type = 'button'; btn.dataset.filter = key;
      btn.dataset.es = categories[key].es; btn.dataset.en = categories[key].en;
      btn.setAttribute('aria-pressed', 'false');
      filters.append(btn);
    });
    updateWorks();
  }
  if (workGrid) fetch('/works.json', { cache: 'no-store' })
    .then(res => { if (!res.ok) throw new Error('Projects unavailable'); return res.json(); })
    .then(data => {
      const projects = normalizeProjects(data);
      renderProjects(projects);
      feedState = projects.length ? '' : 'empty';
      $('#workNotice').textContent = feedState ? messages[language][feedState] : '';
    }).catch(() => { feedState = 'offline'; $('#workNotice').textContent = messages[language].offline; });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (formBusy || !form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    if (!String(fields.name || '').trim() || !String(fields.message || '').trim()) {
      statusKey = 'required'; status.dataset.state = 'error'; refreshStatus(); return;
    }
    if (fields.website) { statusKey = 'error'; status.dataset.state = 'error'; refreshStatus(); return; }
    formBusy = true; submit.disabled = true;
    form.setAttribute('aria-busy', 'true');
    statusKey = 'sending'; status.dataset.state = 'sending'; refreshStatus();
    let timer;
    try {
      // The existing backend silently discards forms submitted before 2500 ms.
      const wait = 2600 - (performance.now() - startedAt);
      if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
      const payload = contactPayload(fields, performance.now() - startedAt);
      const body = JSON.stringify(payload);
      if (new TextEncoder().encode(body).length > 32000) {
        statusKey = 'long'; status.dataset.state = 'error'; return;
      }
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 60000);
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (delivered(response.ok, data)) {
        statusKey = 'success'; status.dataset.state = 'success'; form.reset();
      } else {
        statusKey = response.status === 429 ? 'rate' : 'error'; status.dataset.state = 'error';
      }
    } catch {
      statusKey = 'error'; status.dataset.state = 'error';
    } finally {
      clearTimeout(timer);
      formBusy = false; submit.disabled = false;
      form.removeAttribute('aria-busy');
      submit.querySelector('[data-submit-label]').textContent = language === 'es' ? 'Enviar mensaje' : 'Send message';
      refreshStatus();
    }
  });
  // The endpoint expects JSON. Without JS, use the email link rather than a broken native POST.
  form?.addEventListener('formdata', event => { event.formData.set('form_time', String(Math.floor(performance.now() - startedAt))); });

  if ('IntersectionObserver' in window) {
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reduceMotion.matches && !seen.has(entry.target)) entry.target.classList.add('reveal-in');
        seen.add(entry.target); observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    $$('.section-heading, .about-copy, .skills-panel, .services-list, .contact-copy').forEach(el => observer.observe(el));
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const link = nav?.querySelector('a[href="#' + entry.target.id + '"]');
      if (!link) return;
      if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }), { rootMargin: '-20% 0px -50% 0px', threshold: 0 });
    $$('main > section[id]').forEach(el => navObserver.observe(el));
  }
  function updateClock() {
    const clock = $('#localTime');
    if (clock) clock.textContent = 'CARTAGENA · ' + new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  }
  updateClock();
  setInterval(() => { if (!document.hidden) updateClock(); }, 30000);
  if ($('#year')) $('#year').textContent = String(new Date().getFullYear());
  setLanguage(storageGet('skitoji-lang') === 'en' ? 'en' : 'es');
})();
