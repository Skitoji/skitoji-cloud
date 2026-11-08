'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { calculateFrame, toolKeys } = require('../skitoji-landing/workbench.js');
const source = fs.readFileSync(path.join(__dirname, '../skitoji-landing/workbench.js'), 'utf8');

function element(dataset = {}) {
  const events = new Map(), attributes = new Map(), classes = new Set();
  return {
    dataset: { ...dataset }, hidden: false, disabled: true, textContent: '', children: [], value: '',
    setAttribute(key, value) { attributes.set(key, String(value)); },
    getAttribute(key) { return attributes.get(key) ?? null; },
    addEventListener(type, callback) { events.set(type, [...(events.get(type) || []), callback]); },
    emit(type, event = {}) { return (events.get(type) || []).map(callback => callback(event)); },
    listeners(type) { return (events.get(type) || []).length; },
    replaceChildren(...children) { this.children = children; },
    querySelectorAll() { return []; }, querySelector() { return null; },
    classList: { toggle(key, value) { if (value) classes.add(key); else classes.delete(key); }, contains: key => classes.has(key) }
  };
}

function boot({ missing = [], reduced = false, navHidden = false, scenePosition = 'sticky' } = {}) {
  const ids = {};
  for (const key of ['framePlanner', 'frameWidth', 'frameDimensions', 'framePreview', 'frameGrid', 'framePlannerStatus',
    'skills', 'toolDetail', 'toolName', 'toolStage', 'toolDescription', 'toolCapabilities', 'toolProcessLink',
    'chapterNav', 'motionStudy', 'disciplineStrip', 'marqueeToggle']) ids[key] = element();
  ids.frameWidth.value = '1920';
  const ratios = ['16:9', '4:3', '9:16'].map(ratio => element({ frameRatio: ratio }));
  ids.framePlanner.querySelectorAll = selector => selector === 'button[data-frame-ratio]' ? ratios : [];
  const tools = toolKeys.map(tool => element({ tool }));
  ids.skills.querySelectorAll = selector => selector === 'button[data-tool]' ? tools : [];
  const groups = Array.from({ length: 4 }, () => element());
  const placements = [];
  groups.forEach(group => {
    group.insertAdjacentElement = (position, child) => {
      placements.push({ group, position, child });
      groups.forEach(other => { if (other.nextElementSibling === child) other.nextElementSibling = null; });
      group.nextElementSibling = child;
    };
  });
  tools.forEach((button, index) => { button.closest = () => groups[index < 5 ? 0 : index < 9 ? 1 : index < 14 ? 2 : 3]; });
  const processLabel = element(), arrow = element();
  arrow.tagName = 'SVG';
  ids.toolProcessLink.children = [processLabel, arrow];
  ids.toolProcessLink.querySelector = selector => selector === '[data-process-label]' ? processLabel : null;
  ids.motionStudy.querySelector = () => element();
  const chapterClicks = [];
  const chapters = [0, 1, 2, 3].map(chapter => ({ disabled: false, click: () => chapterClicks.push(chapter) }));
  ids.chapterNav.querySelector = selector => chapters[Number(selector.match(/\d/)[0])];
  ids.chapterNav.hidden = navHidden;
  const marqueeLabel = element();
  ids.marqueeToggle.hidden = true;
  ids.marqueeToggle.querySelector = () => marqueeLabel;
  const document = element();
  document.documentElement = { lang: 'es', dataset: {} };
  document.getElementById = id => missing.includes(id) ? null : ids[id] || null;
  document.createElement = () => element();
  const preference = element(); preference.matches = reduced;
  const context = vm.createContext({ document, window: { matchMedia: () => preference, getComputedStyle: () => ({ position: scenePosition }) } });
  vm.runInContext(source, context);
  return { ids, ratios, tools, document, chapterClicks, preference, marqueeLabel, groups, placements, processLabel, arrow, reload: () => vm.runInContext(source, context) };
}

test('frame dimensions match landscape, classic and portrait delivery ratios', () => {
  assert.deepEqual(calculateFrame(1920, '16:9'), { width: 1920, height: 1080, ratio: '16:9' });
  assert.deepEqual(calculateFrame('1920', '4:3'), { width: 1920, height: 1440, ratio: '4:3' });
  assert.deepEqual(calculateFrame(1080, '9:16'), { width: 1080, height: 1920, ratio: '9:16' });
  assert.equal(calculateFrame(1921, '16:9').height, 1081);
});

test('empty, non-integer, unsupported and out-of-range framing values cannot produce misleading dimensions', () => {
  for (const width of ['', ' ', 0, 319, 7681, Infinity, NaN, 320.5, null, {}, 'oops']) {
    assert.equal(calculateFrame(width, '16:9'), null);
  }
  assert.equal(calculateFrame(320, '16:9').width, 320);
  assert.equal(calculateFrame(7680, '16:9').width, 7680);
  assert.equal(calculateFrame(1920, 'constructor'), null);
});

test('framing controls change the actual crop and pixel output without changing the requested width', () => {
  const { ids, ratios } = boot();
  assert.equal(ids.frameWidth.disabled, false);
  assert.equal(ids.frameDimensions.textContent, '1920 × 1080 px');
  ratios[1].emit('click');
  assert.equal(ids.framePreview.dataset.ratio, '4:3');
  assert.equal(ids.frameDimensions.textContent, '1920 × 1440 px');
  assert.equal(ratios.filter(button => button.getAttribute('aria-pressed') === 'true').length, 1);
  ids.frameWidth.value = '1080'; ids.frameWidth.emit('input'); ratios[2].emit('click');
  assert.equal(ids.frameDimensions.textContent, '1080 × 1920 px');
  ids.frameGrid.emit('click');
  assert.equal(ids.framePreview.dataset.grid, 'off');
  assert.equal(ids.frameGrid.getAttribute('aria-pressed'), 'false');
});

test('invalid typing preserves the last valid delivery, announces errors only on change and recovers', () => {
  const { ids } = boot();
  ids.frameWidth.value = ''; ids.frameWidth.emit('input');
  assert.equal(ids.frameDimensions.textContent, '1920 × 1080 px');
  assert.equal(ids.frameWidth.getAttribute('aria-invalid'), 'true');
  assert.equal(ids.framePlannerStatus.textContent, '');
  ids.frameWidth.emit('change');
  assert.match(ids.framePlannerStatus.textContent, /320 y 7680/);
  ids.frameWidth.value = '3840'; ids.frameWidth.emit('input');
  assert.equal(ids.frameDimensions.textContent, '3840 × 2160 px');
  assert.equal(ids.framePlannerStatus.textContent, '');
  assert.equal(ids.frameWidth.getAttribute('aria-invalid'), 'false');
  ids.frameWidth.emit('change');
  assert.match(ids.framePlannerStatus.textContent, /3840 × 2160/);
});

test('application choices reveal specific capabilities and drive the matching real process chapter', () => {
  const { ids, tools, chapterClicks } = boot();
  assert.equal(tools.length, 18);
  assert.equal(ids.toolName.textContent, 'Premiere Pro');
  assert.equal(ids.toolStage.textContent, '04 / MONTAJE');
  const expected = { 'after-effects': 3, 'davinci-resolve': 3, maya: 2, figma: 0 };
  for (const [name, chapter] of Object.entries(expected)) {
    tools.find(button => button.dataset.tool === name).emit('click');
    assert.equal(ids.toolDetail.dataset.tool, name);
    assert.equal(ids.toolCapabilities.children.length, 3);
    assert.ok(ids.toolDescription.textContent.length > 30);
    assert.equal(tools.filter(button => button.getAttribute('aria-pressed') === 'true').length, 1);
    let prevented = false;
    ids.toolProcessLink.emit('click', { preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(chapterClicks.at(-1), chapter);
  }
});

test('without a ready camera chapter navigation, the ordinary process link remains available', () => {
  const { ids, chapterClicks } = boot({ navHidden: true });
  let prevented = false;
  ids.toolProcessLink.emit('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.deepEqual(chapterClicks, []);
});

test('a flow-layout process link changes the camera chapter and preserves the native anchor navigation', () => {
  const { ids, tools, chapterClicks } = boot({ scenePosition: 'relative' });
  tools.find(button => button.dataset.tool === 'maya').emit('click');
  let prevented = false;
  ids.toolProcessLink.emit('click', { preventDefault() { prevented = true; } });
  assert.equal(prevented, false);
  assert.deepEqual(chapterClicks, [2]);
});

test('tool details follow the selected skill row without moving focus or removing the link icon', () => {
  const { ids, tools, groups, placements, processLabel, arrow, document } = boot();
  assert.equal(groups[0].nextElementSibling, ids.toolDetail);
  tools.find(button => button.dataset.tool === 'maya').emit('click');
  assert.equal(groups[1].nextElementSibling, ids.toolDetail);
  assert.equal(placements.at(-1).position, 'afterend');
  assert.equal(placements.length, 2);
  document.emit('skitoji:language', { detail: 'en' });
  assert.equal(placements.length, 2); // Translating does not detach an already placed, potentially focused panel.
  assert.equal(processLabel.textContent, 'Explore this stage');
  assert.equal(ids.toolProcessLink.children[1], arrow);
});

test('language updates preserve the selected tool, frame size and guide state', () => {
  const { ids, tools, document, ratios, processLabel } = boot();
  tools.find(button => button.dataset.tool === 'after-effects').emit('click');
  ratios[2].emit('click'); ids.frameGrid.emit('click');
  document.emit('skitoji:language', { detail: { language: 'en' } });
  assert.equal(ids.toolName.textContent, 'After Effects');
  assert.equal(ids.toolStage.textContent, '04 / EDITING');
  assert.match(ids.toolDescription.textContent, /Compositing/);
  assert.equal(ids.framePreview.dataset.ratio, '9:16');
  assert.equal(ids.framePreview.dataset.grid, 'off');
  assert.match(ids.framePlannerStatus.textContent, /guide off/);
  assert.equal(processLabel.textContent, 'Explore this stage');
});

test('incomplete enhancement markup keeps inactive controls and static content intact', () => {
  const missingPlanner = boot({ missing: ['frameDimensions'] });
  assert.equal(missingPlanner.ids.frameWidth.disabled, true);
  assert.equal(missingPlanner.ratios[0].listeners('click'), 0);
  const missingTools = boot({ missing: ['toolCapabilities'] });
  assert.equal(missingTools.tools[0].disabled, true);
  assert.equal(missingTools.tools[0].listeners('click'), 0);
  assert.doesNotThrow(() => boot({ missing: ['framePlanner', 'skills', 'disciplineStrip'] }));
});

test('moving strip starts in motion, supports manual pause and keeps that choice after a preference change', () => {
  const { ids, preference, document } = boot();
  assert.equal(ids.marqueeToggle.hidden, false);
  assert.equal(ids.marqueeToggle.getAttribute('aria-pressed'), 'false');
  ids.marqueeToggle.emit('click');
  assert.equal(ids.disciplineStrip.classList.contains('is-paused'), true);
  preference.matches = true; preference.emit('change');
  preference.matches = false; preference.emit('change');
  assert.equal(ids.marqueeToggle.getAttribute('aria-pressed'), 'true');
  document.emit('skitoji:language', { detail: 'en' });
  assert.equal(ids.marqueeToggle.getAttribute('aria-label'), 'Resume strip');
});

test('reduced motion starts static, permits explicit play and pauses if reduced motion is requested again', () => {
  const { ids, preference } = boot({ reduced: true });
  assert.equal(ids.disciplineStrip.classList.contains('is-paused'), true);
  ids.marqueeToggle.emit('click');
  assert.equal(ids.disciplineStrip.classList.contains('is-playing'), true);
  assert.equal(ids.disciplineStrip.dataset.marqueeActivated, 'true');
  preference.matches = false; preference.emit('change');
  preference.matches = true; preference.emit('change');
  assert.equal(ids.disciplineStrip.classList.contains('is-paused'), true);
  assert.equal(ids.disciplineStrip.classList.contains('is-playing'), false);
});

test('reloading never adds duplicate handlers or resets state', () => {
  const { ids, tools, ratios, reload } = boot();
  ratios[2].emit('click'); tools.find(button => button.dataset.tool === 'maya').emit('click');
  reload();
  assert.equal(ratios[0].listeners('click'), 1);
  assert.equal(tools[0].listeners('click'), 1);
  assert.equal(ids.marqueeToggle.listeners('click'), 1);
  assert.equal(ids.framePreview.dataset.ratio, '9:16');
  assert.equal(ids.toolName.textContent, 'Autodesk Maya');
});
