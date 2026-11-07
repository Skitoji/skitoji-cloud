/* A small, optional discovery interaction. It never gates portfolio content. */
(() => {
  'use strict';
  const group = document.getElementById('studioPlay');
  const message = document.getElementById('studioMessage');
  if (!group || !message || group.dataset.delightReady === 'true') return;
  const buttons = Array.from(group.querySelectorAll('button[data-spark]'));
  const keys = ['shape', 'motion', 'story'];
  if (buttons.length !== keys.length || !keys.every(key => buttons.some(button => button.dataset.spark === key))) return;

  const copy = {
    es: {
      initial: 'Una idea empieza con una chispa. Explora los tres puntos.',
      shape: 'Forma: encontrar la expresión visual de una idea.',
      motion: 'Movimiento: darle ritmo y vida al diseño.',
      story: 'Historia: conectar cada detalle con una intención.',
      complete: 'Forma, movimiento e historia. La idea cobra vida.',
      count: count => `${count} de 3 chispas activas.`
    },
    en: {
      initial: 'An idea starts with a spark. Explore the three points.',
      shape: 'Form: finding the visual expression of an idea.',
      motion: 'Motion: bringing rhythm and life to design.',
      story: 'Story: connecting every detail with a purpose.',
      complete: 'Form, motion and story. The idea comes to life.',
      count: count => `${count} of 3 sparks active.`
    }
  };
  const active = new Set();
  let lastSpark = '';
  let language = document.documentElement.lang === 'en' ? 'en' : 'es';

  function render() {
    const words = copy[language];
    buttons.forEach(button => {
      const selected = active.has(button.dataset.spark);
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-lit', selected);
    });
    group.classList.toggle('is-awake', active.size === keys.length);
    group.dataset.active = String(active.size);
    message.textContent = active.size === keys.length ? words.complete
      : active.size ? `${words[lastSpark]} ${words.count(active.size)}` : words.initial;
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.spark;
    if (active.has(key)) active.delete(key);
    else active.add(key);
    lastSpark = active.has(key) ? key : Array.from(active).at(-1) || '';
    render();
  }));
  document.addEventListener('skitoji:language', event => {
    const next = typeof event.detail === 'string' ? event.detail : event.detail?.language;
    language = next === 'en' ? 'en' : 'es';
    render();
  });
  group.dataset.delightReady = 'true';
  render();
  group.hidden = false;
})();
