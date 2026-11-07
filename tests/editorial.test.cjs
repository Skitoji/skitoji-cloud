'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../skitoji-landing/editorial.js'), 'utf8');

function element(tag = 'div', dataset = {}) {
  const events = {};
  const attributes = {};
  const el = { tagName: tag.toUpperCase(), dataset: { ...dataset }, children: [], hidden: true,
    textContent: '', className: '', disabled: false, isConnected: true,
    setAttribute(key, value) { attributes[key] = value; },
    removeAttribute(key) { delete attributes[key]; },
    getAttribute(key) { return attributes[key] ?? null; },
    addEventListener(key, callback) { (events[key] ||= []).push(callback); },
    emit(key, event = {}) { return (events[key] || []).map(callback => callback(event)); },
    listeners(key) { return (events[key] || []).length; },
    append(...children) { children.forEach(child => { child.parent = el; el.children.push(child); }); },
    replaceChildren(...children) { el.children = []; el.append(...children); },
    focus() { el.focused = true; },
    matches(selector) {
      if (selector === '[data-es][data-en]') return Object.hasOwn(el.dataset, 'es') && Object.hasOwn(el.dataset, 'en');
      if (selector === '[id]') return Object.hasOwn(attributes, 'id');
      if (selector === '[data-copy-label]') return Object.hasOwn(el.dataset, 'copyLabel');
      if (selector === 'button[data-footer-frame]') return tag === 'button' && Object.hasOwn(el.dataset, 'footerFrame');
      if (selector.startsWith('.')) return el.className.split(' ').includes(selector.slice(1));
      return el.tagName === selector.toUpperCase();
    },
    querySelectorAll(selector) {
      const result = [];
      el.children.forEach(child => { if (child.matches(selector)) result.push(child); result.push(...child.querySelectorAll(selector)); });
      return result;
    },
    querySelector(selector) { return el.querySelectorAll(selector)[0] || null; },
    closest(selector) { return el.matches(selector) ? el : el.parent?.closest(selector) || null; },
    cloneNode(deep) {
      const copy = element(tag, el.dataset);
      copy.className = el.className; copy.textContent = el.textContent;
      Object.entries(attributes).forEach(([key, value]) => copy.setAttribute(key, value));
      if (deep) copy.append(...el.children.map(child => child.cloneNode(true)));
      return copy;
    }
  };
  return el;
}

function setup({ nativeDialog = true, rejectDialog = false, clipboardSupport = true, rejectClipboard = false, notesPresent = true } = {}) {
  const document = element();
  document.documentElement = { lang: 'es', dataset: {} };
  const ids = {};
  for (const id of ['noteDialog', 'noteDialogTitle', 'noteDialogBody', 'noteDialogClose', 'footerFilmstrip', 'footerFrameTitle', 'footerFrameCopy', 'copyEmail', 'copyEmailStatus']) ids[id] = element(id === 'copyEmail' ? 'button' : 'div');
  const summary = element('summary');
  const heading = element('h3', { es: 'Pensar antes de grabar', en: 'Think before filming' });
  heading.textContent = heading.dataset.es;
  summary.append(heading);
  const body = element(); body.className = 'note-body'; body.setAttribute('id', 'sourceBody');
  const paragraph = element('p', { es: 'Una idea da sentido a cada plano.', en: 'An idea gives every frame meaning.' });
  paragraph.textContent = paragraph.dataset.es; paragraph.setAttribute('id', 'sourceParagraph'); body.append(paragraph);
  const note = element('details'); note.className = 'process-note'; note.append(summary, body);
  const stage = element(); stage.className = 'footer-stage'; stage.append(ids.footerFilmstrip);
  const frames = ['vision', 'light', 'edit'].map(key => element('button', { footerFrame: key }));
  ids.footerFilmstrip.append(...frames);
  const label = element('span', { copyLabel: '' }); ids.copyEmail.append(label);
  ids.noteDialog.open = false;
  ids.noteDialog.getBoundingClientRect = () => ({ left: 100, right: 500, top: 100, bottom: 500 });
  if (nativeDialog) ids.noteDialog.showModal = () => { if (rejectDialog) throw Error('Unsupported context'); ids.noteDialog.open = true; };
  ids.noteDialog.close = () => { ids.noteDialog.open = false; ids.noteDialog.emit('close'); };
  document.append(stage, ...(notesPresent ? [note] : []));
  document.getElementById = id => ids[id] || null;
  const copied = [];
  const navigator = clipboardSupport ? { clipboard: { async writeText(value) { copied.push(value); if (rejectClipboard) throw Error('Denied'); } } } : {};
  const context = vm.createContext({ document, navigator });
  vm.runInContext(source, context);
  return { document, ids, note, summary, body, paragraph, frames, stage, copied, label, reload: () => vm.runInContext(source, context) };
}

test('notes open in a native modal, clone translated content and restore focus on close', () => {
  const { ids, summary, body, document } = setup();
  let prevented = false;
  summary.emit('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ids.noteDialog.open, true);
  assert.equal(summary.getAttribute('aria-haspopup'), 'dialog');
  assert.equal(ids.noteDialogTitle.textContent, 'Pensar antes de grabar');
  assert.notEqual(ids.noteDialogBody.children[0], body);
  assert.equal(ids.noteDialogBody.children[0].getAttribute('id'), null);
  assert.equal(ids.noteDialogBody.querySelectorAll('[id]').length, 0);
  assert.equal(ids.noteDialogClose.focused, true);
  document.emit('skitoji:language', { detail: { language: 'en' } });
  assert.equal(ids.noteDialogTitle.textContent, 'Think before filming');
  assert.equal(ids.noteDialogBody.querySelector('p').textContent, 'An idea gives every frame meaning.');
  assert.equal(ids.noteDialogClose.getAttribute('aria-label'), 'Close note');
  ids.noteDialogClose.emit('click');
  assert.equal(ids.noteDialog.open, false);
  assert.equal(summary.focused, true);
});

test('native Escape close restores focus and backdrop dismissal ignores interior padding', () => {
  const { ids, summary } = setup();
  summary.emit('click', { preventDefault() {} });
  ids.noteDialog.emit('click', { target: ids.noteDialog, clientX: 150, clientY: 150 });
  assert.equal(ids.noteDialog.open, true);
  ids.noteDialog.emit('click', { target: ids.noteDialog, clientX: 20, clientY: 20 });
  assert.equal(ids.noteDialog.open, false);
  assert.equal(summary.focused, true);
  summary.focused = false;
  summary.emit('click', { preventDefault() {} });
  ids.noteDialog.emit('cancel'); ids.noteDialog.close(); // Browser default for Escape.
  assert.equal(summary.focused, true);
});

test('unsupported native dialog preserves details and failed opening never prevents the fallback', () => {
  const missing = setup({ nativeDialog: false });
  assert.equal(missing.summary.listeners('click'), 0);
  const rejected = setup({ rejectDialog: true });
  let prevented = false;
  rejected.summary.emit('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.equal(rejected.summary.getAttribute('aria-haspopup'), null);
  assert.doesNotThrow(() => setup({ notesPresent: false }));
});

test('footer frame selection is reversible and retains its state when language changes', () => {
  const { ids, frames, stage, document } = setup();
  assert.equal(stage.dataset.frame, 'vision');
  assert.equal(frames[0].getAttribute('aria-pressed'), 'true');
  frames[1].emit('click');
  assert.equal(stage.dataset.frame, 'light');
  assert.equal(frames[0].getAttribute('aria-pressed'), 'false');
  assert.equal(frames[1].getAttribute('aria-pressed'), 'true');
  assert.equal(ids.footerFrameTitle.textContent, 'La luz también cuenta.');
  document.emit('skitoji:language', { detail: 'en' });
  assert.equal(stage.dataset.frame, 'light');
  assert.equal(ids.footerFrameTitle.textContent, 'Light tells a story, too.');
  frames[2].emit('click'); frames[0].emit('click');
  assert.equal(stage.dataset.frame, 'vision');
});

test('clipboard activates only after a deliberate click and reports real success', async () => {
  const { ids, copied, document } = setup();
  assert.equal(ids.copyEmail.hidden, false);
  assert.deepEqual(copied, []);
  const pending = ids.copyEmail.emit('click')[0];
  assert.equal(ids.copyEmail.disabled, true);
  await pending;
  assert.deepEqual(copied, ['smonroysalas@skitoji.cloud']);
  assert.equal(ids.copyEmail.disabled, false);
  assert.equal(ids.copyEmailStatus.textContent, 'Correo copiado.');
  document.emit('skitoji:language', { detail: { language: 'en' } });
  assert.equal(ids.copyEmailStatus.textContent, 'Email copied.');
});

test('clipboard denial is announced without claiming success, and missing API keeps the control hidden', async () => {
  const denied = setup({ rejectClipboard: true });
  await denied.ids.copyEmail.emit('click')[0];
  assert.match(denied.ids.copyEmailStatus.textContent, /No se pudo copiar/);
  assert.equal(denied.ids.copyEmail.disabled, false);
  const missing = setup({ clipboardSupport: false });
  assert.equal(missing.ids.copyEmail.hidden, true);
});

test('loading the enhancement twice never doubles modal, footer or clipboard listeners', () => {
  const { reload, summary, frames, ids } = setup();
  reload();
  assert.equal(summary.listeners('click'), 1);
  assert.equal(frames[0].listeners('click'), 1);
  assert.equal(ids.copyEmail.listeners('click'), 1);
});
