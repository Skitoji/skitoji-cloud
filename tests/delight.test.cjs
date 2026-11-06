'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../skitoji-landing/delight.js'), 'utf8');

function element(dataset = {}) {
  const events = {};
  const attrs = {};
  const classes = new Set();
  return { dataset, hidden: true, textContent: '',
    setAttribute(key, value) { attrs[key] = value; },
    getAttribute(key) { return attrs[key]; },
    classList: { toggle(key, enabled) { enabled ? classes.add(key) : classes.delete(key); }, contains(key) { return classes.has(key); } },
    addEventListener(key, fn) { (events[key] ||= []).push(fn); },
    emit(key, event = {}) { (events[key] || []).forEach(fn => fn(event)); }
  };
}
function setup({ language = 'es', missing = false, buttonKeys = ['shape', 'motion', 'story'] } = {}) {
  const group = element();
  const message = element();
  const buttons = buttonKeys.map(key => element({ spark: key }));
  group.querySelectorAll = () => buttons;
  const document = element();
  document.documentElement = { lang: language };
  document.getElementById = id => missing ? null : id === 'studioPlay' ? group : id === 'studioMessage' ? message : null;
  const context = vm.createContext({ document });
  vm.runInContext(source, context);
  return { group, message, buttons, document, reload: () => vm.runInContext(source, context) };
}

test('optional interaction becomes available with unselected native buttons and useful copy', () => {
  const { group, message, buttons } = setup();
  assert.equal(group.hidden, false);
  assert.equal(group.dataset.active, '0');
  assert.match(message.textContent, /Explora los tres puntos/);
  assert.ok(buttons.every(button => button.getAttribute('aria-pressed') === 'false'));
});

test('each spark toggles, all three reveal the final state and can be reset', () => {
  const { group, message, buttons } = setup();
  buttons[0].emit('click');
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'true');
  assert.equal(buttons[0].classList.contains('is-lit'), true);
  assert.match(message.textContent, /Forma:.*1 de 3/);
  buttons[1].emit('click');
  assert.match(message.textContent, /Movimiento:.*2 de 3/);
  buttons[2].emit('click');
  assert.equal(group.classList.contains('is-awake'), true);
  assert.match(message.textContent, /La idea cobra vida/);
  buttons[0].emit('click');
  assert.equal(group.classList.contains('is-awake'), false);
  assert.equal(group.dataset.active, '2');
  assert.match(message.textContent, /Historia:.*2 de 3/);
  buttons[1].emit('click'); buttons[2].emit('click');
  assert.equal(group.dataset.active, '0');
  assert.match(message.textContent, /Explora los tres puntos/);
});

test('language changes preserve selections and translate status immediately', () => {
  const { document, message, buttons, group } = setup({ language: 'en' });
  assert.match(message.textContent, /An idea starts/);
  buttons[2].emit('click');
  assert.match(message.textContent, /Story:.*1 of 3/);
  document.emit('skitoji:language', { detail: { language: 'es' } });
  assert.match(message.textContent, /Historia:.*1 de 3/);
  assert.equal(group.dataset.active, '1');
  assert.equal(buttons[2].getAttribute('aria-pressed'), 'true');
});

test('loading script twice never installs duplicate click listeners', () => {
  const { reload, group, buttons } = setup();
  reload(); buttons[0].emit('click');
  assert.equal(group.dataset.active, '1');
});

test('absent or incomplete markup preserves the static fallback without errors', () => {
  assert.doesNotThrow(() => setup({ missing: true }));
  const { group } = setup({ buttonKeys: ['shape', 'motion'] });
  assert.equal(group.hidden, true);
  assert.equal(group.dataset.delightReady, undefined);
});
