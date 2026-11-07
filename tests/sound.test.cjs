'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = readFileSync(path.join(__dirname, '../skitoji-landing/sound.js'), 'utf8');

function element() {
  const listeners = {}, attrs = {};
  return { dataset: {}, hidden: true, disabled: false, textContent: '',
    setAttribute(key, value) { attrs[key] = value; },
    getAttribute(key) { return attrs[key]; },
    addEventListener(key, fn) { (listeners[key] ||= []).push(fn); },
    emit(key, detail = {}) { (listeners[key] || []).forEach(fn => fn(detail)); }
  };
}
function target(type) {
  return { disabled: false,
    matches(selector) { return selector.split(',').some(part => part.trim() === type); },
    closest(selector) { return this.matches(selector) ? this : null; }
  };
}
function setup({ supported = true, language = 'es', missing = false, reject = false, deferred = false } = {}) {
  const button = element(), label = element(), document = element(), contexts = [];
  let now = 0, resolveResume;
  button.querySelector = () => label;
  document.documentElement = { lang: language };
  document.hidden = false;
  document.getElementById = () => missing ? null : button;
  const parameter = () => ({ values: [],
    setValueAtTime(value, at) { this.values.push({ method: 'set', value, at }); },
    linearRampToValueAtTime(value, at) { this.values.push({ method: 'linear', value, at }); },
    exponentialRampToValueAtTime(value, at) { this.values.push({ method: 'exp', value, at }); },
    cancelScheduledValues(at) { this.cancelled = at; }
  });
  class Audio {
    constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.oscillators = []; this.gains = []; this.resumes = 0; this.suspends = 0; contexts.push(this); }
    async resume() {
      this.resumes++;
      if (reject) throw new Error('Permission denied');
      if (deferred) await new Promise(resolve => { resolveResume = resolve; });
      this.state = 'running';
    }
    async suspend() { this.suspends++; this.state = 'suspended'; }
    createOscillator() {
      const oscillator = { frequency: parameter(), stops: [], starts: [], connect() {}, disconnect() {},
        start(at) { this.starts.push(at); }, stop(at) { this.stops.push(at); } };
      this.oscillators.push(oscillator); return oscillator;
    }
    createGain() { const gain = { gain: parameter(), connect() {}, disconnect() {} }; this.gains.push(gain); return gain; }
  }
  const context = vm.createContext({ document, window: supported ? { AudioContext: Audio } : {}, performance: { now: () => now } });
  vm.runInContext(source, context);
  return { button, label, document, contexts,
    advance(ms) { now += ms; },
    click(type) { document.emit('click', { target: target(type) }); },
    flush: () => new Promise(setImmediate),
    resolve() { resolveResume?.(); },
    reload() { vm.runInContext(source, context); }
  };
}

test('arrival stays silent, creates no AudioContext and offers an unselected toggle', async () => {
  const h = setup();
  h.click('button[data-filter]'); await h.flush();
  assert.equal(h.contexts.length, 0);
  assert.equal(h.button.hidden, false);
  assert.equal(h.button.getAttribute('aria-pressed'), 'false');
  assert.equal(h.label.textContent, 'Sonido OFF');
});

test('explicit enable creates quiet short original tones; mute stops every voice', async () => {
  const h = setup(); h.button.emit('click'); await h.flush();
  assert.equal(h.contexts.length, 1);
  const audio = h.contexts[0];
  assert.equal(audio.resumes, 1);
  assert.equal(audio.oscillators.length, 2);
  assert.equal(h.button.getAttribute('aria-pressed'), 'true');
  assert.match(h.label.textContent, /ON/);
  for (const gain of audio.gains) assert.ok(gain.gain.values.every(v => v.value <= 0.06));
  for (const oscillator of audio.oscillators) assert.ok(oscillator.stops[0] - oscillator.starts[0] < 0.6);
  h.button.emit('click'); await h.flush();
  assert.equal(h.button.getAttribute('aria-pressed'), 'false');
  assert.ok(audio.oscillators.every(voice => voice.stops.length === 2));
  assert.equal(audio.state, 'suspended');
});

test('eligible clicks are throttled and typing, hover and scroll never create sounds', async () => {
  const h = setup(); h.button.emit('click'); await h.flush();
  const audio = h.contexts[0];
  h.advance(100); h.click('button[data-filter]'); await h.flush();
  assert.equal(audio.oscillators.length, 2);
  h.advance(50); h.click('#storySceneMode'); await h.flush();
  assert.equal(audio.oscillators.length, 3);
  h.advance(200); h.click('input'); h.document.emit('mousemove'); h.document.emit('scroll'); await h.flush();
  assert.equal(audio.oscillators.length, 3);
});

test('hidden tabs cancel and suspend sound; showing resumes only after another interaction', async () => {
  const h = setup(); h.button.emit('click'); await h.flush();
  const audio = h.contexts[0];
  h.document.hidden = true; h.document.emit('visibilitychange'); await h.flush();
  assert.equal(audio.state, 'suspended');
  const count = audio.oscillators.length;
  h.advance(200); h.click('summary'); await h.flush();
  assert.equal(audio.oscillators.length, count);
  h.document.hidden = false; h.document.emit('visibilitychange'); await h.flush();
  assert.equal(audio.resumes, 1);
  h.click('button[data-chapter]'); await h.flush();
  assert.equal(audio.resumes, 2);
  assert.equal(audio.oscillators.length, count + 1);
});

test('language changes preserve preference and duplicate initialization adds no listeners', async () => {
  const h = setup({ language: 'en' }); h.reload();
  assert.equal(h.label.textContent, 'Sound OFF');
  h.button.emit('click'); await h.flush();
  assert.equal(h.contexts.length, 1);
  assert.equal(h.button.getAttribute('aria-pressed'), 'true');
  h.document.emit('skitoji:language', { detail: { language: 'es' } });
  assert.equal(h.label.textContent, 'Sonido ON');
  assert.match(h.button.getAttribute('aria-label'), /Silenciar/);
});

test('missing support, missing markup and resume rejection degrade without errors', async () => {
  const unsupported = setup({ supported: false });
  assert.equal(unsupported.button.hidden, true);
  assert.equal(unsupported.button.disabled, true);
  assert.doesNotThrow(() => setup({ missing: true }));
  const rejected = setup({ reject: true }); rejected.button.emit('click'); await rejected.flush();
  assert.equal(rejected.button.getAttribute('aria-pressed'), 'false');
  assert.equal(rejected.contexts[0].oscillators.length, 0);
});

test('rapid enable then mute cannot play a delayed welcome sound', async () => {
  const h = setup({ deferred: true }); h.button.emit('click'); await h.flush();
  h.button.emit('click'); h.resolve(); await h.flush();
  assert.equal(h.button.getAttribute('aria-pressed'), 'false');
  assert.equal(h.contexts[0].oscillators.length, 0);
  assert.equal(h.contexts[0].state, 'suspended');
});
