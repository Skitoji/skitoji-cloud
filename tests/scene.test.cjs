const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../skitoji-landing/scene.js'), 'utf8');

function eventTarget(extra = {}) {
  const listeners = new Map();
  return Object.assign({
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    listenerCount(type) { return (listeners.get(type) || []).length; },
    emit(type, detail = {}) {
      for (const handler of listeners.get(type) || []) handler(detail);
    }
  }, extra);
}

function button() {
  const label = { textContent: '' };
  const attributes = new Map();
  return eventTarget({
    label,
    querySelector: () => label,
    setAttribute: (key, value) => attributes.set(key, value),
    getAttribute: (key) => attributes.get(key)
  });
}

function boot({ reducedMotion = false, focused = true, width = 280, contextAvailable = true, includeStory = false } = {}) {
  const callbacks = new Map();
  let nextFrameId = 0;
  let observer;
  function makeView() {
    const classes = new Set();
    const controls = { hidden: true };
    const motion = button();
    const mode = button();
    let renderCount = 0;
    let firstPoint;
    let bounds;
    function capture(x, y) {
      if (!firstPoint) firstPoint = [x, y];
      bounds = bounds || { minX: x, maxX: x, minY: y, maxY: y };
      bounds.minX = Math.min(bounds.minX, x);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
    const ctx = {
      clearRect() { renderCount++; firstPoint = undefined; bounds = undefined; },
      createRadialGradient: () => ({ addColorStop() {} }),
      save() {}, restore() {}, translate() {}, scale() {}, fillRect() {},
      setTransform() {}, beginPath() {}, closePath() {}, fill() {}, stroke() {},
      moveTo: capture, lineTo: capture
    };
    const container = eventTarget({
      classList: { add: (name) => classes.add(name) },
      querySelector: (selector) => selector === '.scene-controls' ? controls : null
    });
    const canvas = {
      parentElement: container,
      closest: () => container,
      getContext: () => contextAvailable ? ctx : null,
      getBoundingClientRect: () => ({ left: 0, top: 0, width, height: width })
    };
    return {
      container, canvas, motion, mode, controls, classes,
      get renderCount() { return renderCount; },
      get firstPoint() { return firstPoint && [...firstPoint]; },
      get bounds() { return bounds && { ...bounds }; }
    };
  }
  const hero = makeView();
  const story = includeStory ? makeView() : null;
  let sectionRect = { top: 88, height: 1600 };
  const section = { getBoundingClientRect: () => ({ ...sectionRect }) };
  const preference = eventTarget({ matches: reducedMotion });
  const elements = {
    heroCanvas: hero.canvas, motionToggle: hero.motion, sceneMode: hero.mode,
    motionCanvas: story?.canvas, storyMotionToggle: story?.motion, storySceneMode: story?.mode,
    motionStudy: includeStory ? section : null
  };
  const document = eventTarget({
    documentElement: { lang: 'en' },
    hidden: false,
    hasFocus: () => focused,
    getElementById: (id) => elements[id]
  });
  const window = eventTarget({
    innerHeight: 800,
    devicePixelRatio: 2,
    matchMedia: (query) => query.includes('reduced-motion') ? preference : { matches: false },
    requestAnimationFrame: (callback) => { callbacks.set(++nextFrameId, callback); return nextFrameId; },
    cancelAnimationFrame: (id) => callbacks.delete(id),
    IntersectionObserver: class {}
  });
  class IntersectionObserver {
    constructor(callback) { observer = callback; }
    observe() {}
  }
  vm.runInNewContext(source, { document, window, IntersectionObserver }, { filename: 'scene.js' });

  return {
    motion: hero.motion, mode: hero.mode, document, window, controls: hero.controls, classes: hero.classes,
    hero, story,
    get pendingFrames() { return callbacks.size; },
    get renderCount() { return hero.renderCount; },
    get firstPoint() { return hero.firstPoint; },
    step(time) {
      const scheduled = [...callbacks.entries()];
      callbacks.clear();
      for (const [, callback] of scheduled) callback(time);
    },
    preference(matches) {
      preference.matches = matches;
      preference.emit('change', { matches });
    },
    hidden(value) {
      document.hidden = value;
      document.emit('visibilitychange');
    },
    intersect(value, view = hero) { observer([{ target: view.container, isIntersecting: value }]); },
    language(language) { document.emit('skitoji:language', { detail: { language } }); },
    scroll(top, height = 1600) {
      sectionRect = { top, height };
      window.emit('scroll');
    }
  };
}

for (const reducedMotion of [false, true]) {
  test(`autoplays on startup and advances the sculpture (reduced motion: ${reducedMotion})`, () => {
    const scene = boot({ reducedMotion });
    assert.equal(scene.pendingFrames, 1, 'startup should schedule rotation');
    assert.equal(scene.motion.label.textContent, 'Pause');
    assert.equal(scene.motion.getAttribute('aria-pressed'), 'false');
    assert.equal(scene.controls.hidden, false);
    assert.ok(scene.classes.has('scene-ready'));
    scene.step(1000);
    const before = scene.firstPoint;
    const renders = scene.renderCount;
    scene.step(1040);
    assert.ok(scene.renderCount > renders, 'a later frame should render');
    assert.notDeepEqual(scene.firstPoint, before, 'projected geometry should rotate');
    assert.equal(scene.pendingFrames, 1, 'rotation should continue after rendering');
  });
}

test('starts in an unfocused embedded page; blur and language selection do not stop motion', () => {
  const scene = boot({ focused: false });
  assert.equal(scene.pendingFrames, 1);
  scene.window.emit('blur');
  assert.equal(scene.pendingFrames, 1, 'visible embedded page should keep animating');
  scene.language('es');
  assert.equal(scene.motion.label.textContent, 'Pausar');
  assert.equal(scene.motion.getAttribute('aria-label'), 'Pausar animación');
  assert.equal(scene.pendingFrames, 1);
  scene.step(1000);
  scene.step(1040);
  assert.ok(scene.renderCount >= 3);
});

test('manual pause survives preference, language, visibility, and mesh changes', () => {
  const scene = boot();
  scene.motion.emit('click');
  assert.equal(scene.pendingFrames, 0);
  assert.equal(scene.motion.getAttribute('aria-pressed'), 'true');
  assert.equal(scene.motion.label.textContent, 'Resume');
  scene.preference(true);
  scene.preference(false);
  scene.language('es');
  scene.hidden(true);
  scene.hidden(false);
  scene.intersect(false);
  scene.intersect(true);
  scene.mode.emit('click');
  assert.equal(scene.pendingFrames, 0, 'only explicit resume should undo manual pause');
  assert.equal(scene.motion.label.textContent, 'Reanudar');
  assert.equal(scene.mode.label.textContent, 'Ver malla');
  assert.equal(scene.mode.getAttribute('aria-pressed'), 'false');
  scene.motion.emit('click');
  assert.equal(scene.pendingFrames, 1);
  assert.equal(scene.motion.getAttribute('aria-pressed'), 'false');
  scene.preference(true);
  assert.equal(scene.pendingFrames, 1, 'preference change should preserve manual play');
});

test('hidden or offscreen pages suspend rotation and resume when visible again', () => {
  const scene = boot();
  scene.step(1000);
  scene.hidden(true);
  assert.equal(scene.pendingFrames, 0);
  scene.hidden(false);
  assert.equal(scene.pendingFrames, 1);
  scene.intersect(false);
  assert.equal(scene.pendingFrames, 0);
  scene.hidden(true);
  scene.intersect(true);
  assert.equal(scene.pendingFrames, 0, 'intersection cannot animate a hidden document');
  scene.hidden(false);
  assert.equal(scene.pendingFrames, 1);
  scene.step(2000);
  const before = scene.firstPoint;
  scene.step(2040);
  assert.notDeepEqual(scene.firstPoint, before);
});

test('keeps the fallback visible when canvas cannot render or has no size', () => {
  for (const options of [{ contextAvailable: false }, { width: 0 }]) {
    const scene = boot(options);
    assert.equal(scene.classes.has('scene-ready'), false);
    assert.equal(scene.controls.hidden, true);
    assert.equal(scene.renderCount, 0);
    assert.equal(scene.pendingFrames, 0);
  }
});

test('starts with the mesh the visitor liked and only initializes the hero', () => {
  const scene = boot({ includeStory: true });
  assert.equal(scene.mode.getAttribute('aria-pressed'), 'true');
  assert.equal(scene.mode.label.textContent, 'Solid');
  assert.equal(scene.pendingFrames, 1);
  assert.equal(scene.story.controls.hidden, true, 'camera.js owns the separate story canvas');
  assert.equal(scene.story.renderCount, 0);
  scene.mode.emit('click');
  assert.equal(scene.mode.getAttribute('aria-pressed'), 'false');
  assert.equal(scene.mode.label.textContent, 'Wireframe');
});
