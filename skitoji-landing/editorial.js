/* Process notes, a selectable filmstrip and deliberate clipboard actions. */
(() => {
  'use strict';
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (root.dataset.editorialReady === 'true') return;
  root.dataset.editorialReady = 'true';
  const $ = id => document.getElementById(id);
  let language = root.lang === 'en' ? 'en' : 'es';
  const dialog = $('noteDialog');
  const dialogTitle = $('noteDialogTitle');
  const dialogBody = $('noteDialogBody');
  const dialogClose = $('noteDialogClose');
  let returnFocus;

  function translate(container) {
    if (!container) return;
    const elements = Array.from(container.querySelectorAll('[data-es][data-en]'));
    if (container.dataset.es && container.dataset.en) elements.unshift(container);
    elements.forEach(element => { element.textContent = element.dataset[language]; });
  }
  const canUseDialog = !!(dialog && dialogTitle && dialogBody && dialogClose && typeof dialog.showModal === 'function');
  if (canUseDialog) {
    document.querySelectorAll('.process-note').forEach(note => {
      const summary = note.querySelector('summary');
      const heading = summary?.querySelector('h3');
      const body = note.querySelector('.note-body');
      if (!summary || !heading || !body) return;
      summary.setAttribute('aria-haspopup', 'dialog');
      summary.setAttribute('aria-controls', 'noteDialog');
      summary.addEventListener('click', event => {
        const content = body.cloneNode(true);
        content.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
        content.removeAttribute('id');
        dialogTitle.textContent = heading.textContent;
        for (const key of ['es', 'en']) {
          if (heading.dataset[key]) dialogTitle.dataset[key] = heading.dataset[key];
          else delete dialogTitle.dataset[key];
        }
        dialogBody.replaceChildren(content);
        translate(dialogTitle); translate(dialogBody);
        try {
          if (!dialog.open) dialog.showModal();
          returnFocus = summary;
          event.preventDefault();
          dialogClose.focus();
        } catch {
          // If the native dialog cannot open, the native details still work.
          summary.removeAttribute('aria-haspopup');
          summary.removeAttribute('aria-controls');
        }
      });
    });
    dialogClose.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      if (returnFocus?.isConnected !== false) returnFocus?.focus();
      returnFocus = undefined;
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    // Escape uses the browser's native cancel/close behavior and focus handling.
  }

  const filmstrip = $('footerFilmstrip');
  const stage = filmstrip?.closest('.footer-stage') || document.querySelector('.footer-stage');
  const frameTitle = $('footerFrameTitle');
  const frameCopy = $('footerFrameCopy');
  const frames = filmstrip ? Array.from(filmstrip.querySelectorAll('button[data-footer-frame]')) : [];
  const frameWords = {
    es: {
      vision: ['Una idea antes del primer plano.', 'La intención guía el encuadre, el tono y el punto de vista.'],
      light: ['La luz también cuenta.', 'Contraste, textura y color construyen la atmósfera de una imagen.'],
      edit: ['Encontrar el ritmo.', 'El montaje conecta imágenes y sonido para dar sentido al recorrido.']
    },
    en: {
      vision: ['An idea before the first frame.', 'Intention guides the framing, the tone and the point of view.'],
      light: ['Light tells a story, too.', 'Contrast, texture and colour build the atmosphere of an image.'],
      edit: ['Finding the rhythm.', 'Editing connects images and sound to give the journey meaning.']
    }
  };
  let currentFrame = 'vision';
  function refreshFrame() {
    if (!stage || !frameTitle || !frameCopy || !frames.length) return;
    stage.dataset.frame = currentFrame;
    frameTitle.textContent = frameWords[language][currentFrame][0];
    frameCopy.textContent = frameWords[language][currentFrame][1];
    frames.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.footerFrame === currentFrame)));
    filmstrip.setAttribute('aria-label', language === 'es' ? 'Explora el proceso audiovisual' : 'Explore the audiovisual process');
  }
  frames.forEach(button => {
    if (!Object.hasOwn(frameWords.es, button.dataset.footerFrame)) return;
    button.addEventListener('click', () => { currentFrame = button.dataset.footerFrame; refreshFrame(); });
  });
  refreshFrame();

  const copyButton = $('copyEmail');
  const copyStatus = $('copyEmailStatus');
  const copyLabel = copyButton?.querySelector('[data-copy-label]') || copyButton;
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null;
  let copyState = '';
  const clipboardWords = {
    es: { button: 'Copiar correo', copied: 'Correo copiado.', error: 'No se pudo copiar. Puedes seleccionar el correo del enlace.' },
    en: { button: 'Copy email', copied: 'Email copied.', error: 'Could not copy. You can select the address from the email link.' }
  };
  function refreshClipboard() {
    if (copyLabel) copyLabel.textContent = clipboardWords[language].button;
    copyButton?.setAttribute('aria-label', clipboardWords[language].button);
    if (copyStatus) copyStatus.textContent = copyState ? clipboardWords[language][copyState] : '';
    dialogClose?.setAttribute('aria-label', language === 'es' ? 'Cerrar nota' : 'Close note');
  }
  if (copyButton && typeof clipboard?.writeText === 'function') {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      if (copyButton.disabled) return;
      copyButton.disabled = true;
      try {
        await clipboard.writeText('smonroysalas@skitoji.cloud');
        copyState = 'copied';
      } catch { copyState = 'error'; }
      finally { copyButton.disabled = false; refreshClipboard(); }
    });
  } else if (copyButton) copyButton.hidden = true;
  refreshClipboard();
  document.addEventListener('skitoji:language', event => {
    const requested = typeof event.detail === 'string' ? event.detail : event.detail?.language;
    language = requested === 'en' ? 'en' : 'es';
    translate(dialogTitle); translate(dialogBody);
    refreshFrame(); refreshClipboard();
  });
})();
