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
  assert.equal(scene.mode.label.textContent, 'Ver sólido');
  assert.equal(scene.mode.getAttribute('aria-pressed'), 'true');
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

test('both scenes initialize with independent controls and shared global listeners', () => {
  const scene = boot({ includeStory: true });
  assert.equal(scene.pendingFrames, 2);
  assert.equal(scene.story.controls.hidden, false);
  assert.ok(scene.story.classes.has('scene-ready'));
  assert.equal(scene.window.listenerCount('scroll'), 1);
  assert.equal(scene.document.listenerCount('visibilitychange'), 1);
  assert.equal(scene.document.listenerCount('skitoji:language'), 1);
  scene.story.mode.emit('click');
  assert.equal(scene.story.mode.getAttribute('aria-pressed'), 'true');
  assert.equal(scene.mode.getAttribute('aria-pressed'), 'false');
  scene.language('es');
  assert.equal(scene.motion.label.textContent, 'Pausar');
  assert.equal(scene.story.motion.label.textContent, 'Pausar');
  assert.equal(scene.story.mode.label.textContent, 'Ver sólido');
  scene.intersect(false, scene.story);
  assert.equal(scene.pendingFrames, 1, 'offscreen story should not stop the hero');
  scene.intersect(false);
  assert.equal(scene.pendingFrames, 0);
  scene.intersect(true, scene.story);
  assert.equal(scene.pendingFrames, 1, 'story should resume independently');
});

test('scroll updates the story camera on animation frames without moving the hero', () => {
  const scene = boot({ includeStory: true });
  const control = boot({ includeStory: true });
  const renderCount = scene.story.renderCount;
  scene.scroll(-356);
  assert.equal(scene.story.renderCount, renderCount, 'scroll handler should not draw synchronously');
  for (let i = 0; i < 8; i++) {
    const time = 1000 + i * 40;
    scene.step(time);
    control.step(time);
  }
  assert.notDeepEqual(scene.story.firstPoint, control.story.firstPoint, 'scroll should alter the story composition');
  assert.deepEqual(scene.firstPoint, control.firstPoint, 'hero rotation should be independent of story scroll');
});

test('manual story pause freezes its camera through scrolling until explicit resume', () => {
  const scene = boot({ includeStory: true });
  scene.step(1000);
  scene.step(1040);
  scene.story.motion.emit('click');
  const frozen = scene.story.firstPoint;
  const renderCount = scene.story.renderCount;
  scene.scroll(-800);
  scene.step(1080);
  scene.step(1120);
  assert.equal(scene.story.renderCount, renderCount);
  assert.deepEqual(scene.story.firstPoint, frozen);
  scene.story.motion.emit('click');
  scene.step(1160);
  assert.deepEqual(scene.story.firstPoint, frozen, 'resuming should not snap to the new scroll position');
  scene.step(1200);
  assert.notDeepEqual(scene.story.firstPoint, frozen, 'camera should ease toward the new position after resume');
});

test('reduced motion keeps slower autoplay but disables story scroll and pointer modulation', () => {
  const scene = boot({ includeStory: true, reducedMotion: true });
  const control = boot({ includeStory: true, reducedMotion: true });
  scene.scroll(-800);
  scene.story.container.emit('pointermove', { clientX: 280, clientY: 280 });
  for (let i = 0; i < 4; i++) {
    const time = 1000 + i * 40;
    scene.step(time);
    control.step(time);
  }
  assert.deepEqual(scene.story.firstPoint, control.story.firstPoint);
  assert.equal(scene.pendingFrames, 2, 'autoplay remains active when reduced motion is requested');
});

test('story camera keeps the complete sculpture inside a narrow canvas across chapters', () => {
  const scene = boot({ includeStory: true, width: 280 });
  let time = 1000;
  for (const top of [88, -356, -800]) {
    scene.scroll(top);
    for (let i = 0; i < 12; i++) {
      scene.step(time);
      time += 40;
      const bounds = scene.story.bounds;
      assert.ok(bounds.minX >= 0 && bounds.maxX <= 280, 'sculpture should fit horizontally');
      assert.ok(bounds.minY >= 0 && bounds.maxY <= 280, 'sculpture should fit vertically');
    }
  }
});
