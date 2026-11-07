'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { studyProgress, chapterTarget, safeMediaPath } = require('../skitoji-landing/studio.js');
const source = fs.readFileSync(path.join(__dirname, '../skitoji-landing/studio.js'), 'utf8');

test('scroll progress clamps at the beginning and end without dividing by zero', () => {
  assert.equal(studyProgress(20, 2200, 1000), 0);
  assert.equal(studyProgress(-600, 2200, 1000), 0.5);
  assert.equal(studyProgress(-2000, 2200, 1000), 1);
  assert.equal(studyProgress(-50, 600, 1000), 0);
});
test('four chapter targets use document offset and include both endpoints', () => {
  assert.equal(chapterTarget(-200, 1000, 2200, 1000, 0), 800);
  assert.equal(chapterTarget(-200, 1000, 2200, 1000, 1), 1200);
  assert.equal(chapterTarget(-200, 1000, 2200, 1000, 2), 1600);
  assert.equal(chapterTarget(-200, 1000, 2200, 1000, 3), 2000);
  assert.equal(chapterTarget(-200, 1000, 2200, 1000, 9), 2000);
});
test('media accepts only local assets of the correct type and rejects traversal or external URLs', () => {
  for (const value of ['/assets/process.jpg', '/assets/studio/photo.webp', '/assets/frame.AVIF']) assert.equal(safeMediaPath(value), value);
  assert.equal(safeMediaPath('/assets/reel.mp4', 'video'), '/assets/reel.mp4');
  assert.equal(safeMediaPath('/assets/reel.webm', 'video'), '/assets/reel.webm');
  for (const value of ['https://other.test/a.jpg', '//other.test/a.jpg', 'javascript:alert(1)', '/assets/../secret.jpg', '/assets/./x.jpg', '/assets//x.jpg', '/assets/%2e%2e/x.jpg', '/assets/x.jpg?x=1', '/assets/x.svg', '/assets/x.mp4', null]) assert.equal(safeMediaPath(value), '');
  assert.equal(safeMediaPath('/assets/photo.png', 'video'), '');
});

function element(dataset = {}) {
  const events = {};
  const attrs = {};
  return { dataset, hidden: true, textContent: '', disabled: false,
    addEventListener(type, callback) { (events[type] ||= []).push(callback); },
    emit(type, event = {}) { (events[type] || []).forEach(callback => callback(event)); },
    setAttribute(key, value) { attrs[key] = value; },
    removeAttribute(key) { delete attrs[key]; },
    getAttribute(key) { return attrs[key]; }
  };
}
function setup({ media = null, reduced = false, incomplete = false, incompleteParts = false, language = 'es', missing = [] } = {}) {
  const ids = {};
  for (const id of ['motionStudy', 'motionAnnouncement', 'chapterNav', 'motionChapterTitle', 'motionChapterCopy', 'motionProgress', 'cameraScrub', 'cameraParts', 'cameraPartTitle', 'cameraPartCopy', 'journalTrack', 'journalPrev', 'journalNext', 'journalPosition', 'studioPhoto', 'photoPlaceholder', 'studioVideo', 'videoPlaceholder']) ids[id] = element();
  ids.motionStudy.top = 0;
  ids.motionStudy.offsetHeight = 2200;
  ids.motionStudy.getBoundingClientRect = () => ({ top: ids.motionStudy.top });
  const buttons = [0, 1, 2, 3].map(index => element({ chapter: String(index) }));
  ids.chapterNav.querySelectorAll = () => incomplete ? buttons.slice(0, 3) : buttons;
  ids.cameraScrub.disabled = true;
  const parts = ['lens', 'sensor', 'body', 'monitor'].map(part => element({ cameraPart: part }));
  ids.cameraParts.querySelectorAll = () => incompleteParts ? parts.slice(0, 3) : parts;
  ids.journalTrack.scrollLeft = 0; ids.journalTrack.clientWidth = 400; ids.journalTrack.scrollWidth = 1000;
  ids.journalTrack.children = [0, 320, 640].map(offsetLeft => ({ offsetLeft }));
  ids.journalTrack.scrollBy = args => { ids.journalTrack.lastScroll = args; };
  ids.photoPlaceholder.hidden = ids.videoPlaceholder.hidden = false;
  for (const id of missing) delete ids[id];
  const document = element();
  document.getElementById = id => ids[id] || null;
  document.documentElement = { lang: language };
  document.dispatched = [];
  document.dispatchEvent = event => { document.dispatched.push(event); document.emit(event.type, event); };
  class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } }
  const window = element();
  window.innerHeight = 1000; window.scrollY = 800;
  window.matchMedia = () => ({ matches: reduced });
  const callbacks = [];
  window.requestAnimationFrame = callback => { callbacks.push(callback); return callbacks.length; };
  window.scrollTo = args => { window.lastScroll = args; };
  const fetchCalls = [];
  const fetch = async url => { fetchCalls.push(url); return { ok: !!media, json: async () => media }; };
  vm.runInContext(source, vm.createContext({ document, window, fetch, CustomEvent }));
  return { ids, buttons, parts, document, window, fetchCalls, flush: () => { while (callbacks.length) callbacks.shift()(); } };
}

test('four chapters follow scroll thresholds without announcing passive scrolling', () => {
  const { ids, buttons, window, flush } = setup();
  assert.equal(ids.chapterNav.hidden, false);
  for (const [top, index, title] of [[0, 0, 'Visión'], [-300, 1, 'Óptica'], [-600, 2, 'Rodaje'], [-900, 3, 'Montaje'], [-1200, 3, 'Montaje']]) {
    ids.motionStudy.top = top;
    window.emit('scroll'); window.emit('scroll'); flush();
    assert.equal(ids.motionChapterTitle.textContent, title);
    assert.equal(ids.motionStudy.dataset.chapter, String(index));
    assert.equal(buttons[index].getAttribute('aria-current'), 'step');
    assert.equal(buttons.filter(button => button.getAttribute('aria-current') === 'step').length, 1);
  }
  assert.equal(ids.motionProgress.value, 1);
  assert.equal(ids.cameraScrub.value, '100');
  assert.equal(ids.motionAnnouncement.textContent, '');
});
test('chapter click navigates to its scroll stage and dispatches its camera event', () => {
  const { ids, buttons, document, window } = setup();
  buttons[2].emit('click');
  assert.equal(window.lastScroll.top, 1600);
  assert.equal(window.lastScroll.behavior, 'smooth');
  assert.match(ids.motionAnnouncement.textContent, /^Rodaje\./);
  assert.equal(document.dispatched.length, 1);
  assert.equal(document.dispatched[0].type, 'skitoji:chapter');
  assert.equal(document.dispatched[0].detail.chapter, 2);
});
test('scrubbing previews every stage without moving the page or announcing every input', () => {
  const { ids, document, window } = setup();
  assert.equal(ids.cameraScrub.disabled, false);
  ids.cameraScrub.value = '63';
  ids.cameraScrub.emit('input');
  assert.equal(window.lastScroll, undefined);
  assert.equal(ids.motionProgress.value, 0.63);
  assert.equal(ids.motionChapterTitle.textContent, 'Rodaje');
  assert.equal(ids.cameraScrub.getAttribute('aria-valuetext'), '63% · Rodaje');
  assert.equal(ids.motionAnnouncement.textContent, '');
  assert.equal(document.dispatched.at(-1).type, 'skitoji:camera-progress');
  assert.equal(document.dispatched.at(-1).detail.progress, 0.63);
  ids.cameraScrub.emit('change');
  assert.match(ids.motionAnnouncement.textContent, /^Rodaje\./);
  ids.cameraScrub.value = '120'; ids.cameraScrub.emit('input');
  assert.equal(document.dispatched.at(-1).detail.progress, 1);
  ids.cameraScrub.value = 'invalid'; ids.cameraScrub.emit('input');
  assert.equal(document.dispatched.length, 2);
});
test('language and resize retain manual preview, and the next scroll resumes the narrative', () => {
  const { ids, document, window, flush } = setup();
  ids.cameraScrub.value = '85'; ids.cameraScrub.emit('input');
  document.emit('skitoji:language', { detail: { language: 'en' } });
  window.emit('resize'); flush();
  assert.equal(ids.motionChapterTitle.textContent, 'Editing');
  assert.equal(ids.motionProgress.value, 0.85);
  assert.equal(ids.cameraScrub.getAttribute('aria-valuetext'), '85% · Editing');
  ids.motionStudy.top = -400;
  window.emit('scroll'); flush();
  assert.equal(ids.motionChapterTitle.textContent, 'Optics');
  assert.equal(ids.motionProgress.value, 1 / 3);
  document.emit('skitoji:language', { detail: 'es' });
  assert.equal(ids.motionChapterTitle.textContent, 'Óptica');
});
test('camera inspection has one selected part and translates the selection without resetting it', () => {
  const { ids, parts, document } = setup();
  assert.equal(ids.cameraParts.hidden, false);
  assert.match(ids.cameraPartTitle.textContent, /^Explora/);
  assert.ok(parts.every(button => button.getAttribute('aria-pressed') === 'false'));
  for (const [index, title] of [[1, 'Sensor'], [2, 'Cuerpo'], [3, 'Monitor']]) {
    parts[index].emit('click');
    assert.match(ids.cameraPartTitle.textContent, new RegExp('^' + title));
    assert.equal(parts.filter(button => button.getAttribute('aria-pressed') === 'true').length, 1);
    assert.equal(parts[index].getAttribute('aria-pressed'), 'true');
    assert.equal(document.dispatched.at(-1).type, 'skitoji:inspect-camera');
    assert.equal(document.dispatched.at(-1).detail.part, parts[index].dataset.cameraPart);
  }
  document.emit('skitoji:language', { detail: 'en' });
  assert.equal(ids.cameraPartTitle.textContent, 'Monitor · The frame');
  assert.match(ids.cameraPartCopy.textContent, /Composition, focus and continuity/);
  assert.equal(parts[3].getAttribute('aria-pressed'), 'true');
  document.emit('skitoji:language', { detail: { language: 'es' } });
  assert.equal(ids.cameraPartTitle.textContent, 'Monitor · El encuadre');
});
test('journal controls reflect native scroll edges, index and viewport changes without live announcements', () => {
  const { ids, buttons, window, flush } = setup({ reduced: true });
  assert.equal(ids.journalPrev.hidden, false);
  assert.equal(ids.journalPrev.disabled, true);
  assert.equal(ids.journalNext.disabled, false);
  assert.equal(ids.journalPosition.textContent, '01 / 03');
  ids.journalNext.emit('click');
  assert.equal(ids.journalTrack.lastScroll.left, 320);
  assert.equal(ids.journalTrack.lastScroll.behavior, 'auto');
  ids.journalTrack.scrollLeft = 320; ids.journalTrack.emit('scroll');
  assert.equal(ids.journalPosition.textContent, '02 / 03');
  ids.journalTrack.scrollLeft = 600; ids.journalTrack.emit('scroll');
  assert.equal(ids.journalPrev.disabled, false);
  assert.equal(ids.journalNext.disabled, true);
  assert.equal(ids.journalPosition.textContent, '03 / 03');
  assert.equal(ids.journalPosition.getAttribute('aria-live'), undefined);
  ids.journalTrack.scrollLeft = 0; ids.journalTrack.clientWidth = 1000;
  window.emit('resize'); flush();
  assert.equal(ids.journalPrev.disabled, true);
  assert.equal(ids.journalNext.disabled, true);
  assert.equal(ids.journalPosition.textContent, '01 / 03');
  buttons[1].emit('click');
  assert.equal(window.lastScroll.behavior, 'auto');
});
test('optional media stays hidden until load succeeds and failures restore fallback', async () => {
  const { ids, fetchCalls } = setup({ media: { photo: { src: '/assets/process.jpg', alt: 'Process photo' }, video: { src: '/assets/reel.mp4', poster: '/assets/poster.webp' } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(fetchCalls, ['/studio-media.json']);
  assert.equal(ids.studioPhoto.src, '/assets/process.jpg');
  assert.equal(ids.studioPhoto.loading, 'eager');
  assert.equal(ids.studioPhoto.alt, 'Process photo');
  assert.equal(ids.studioPhoto.hidden, true);
  ids.studioPhoto.emit('load');
  assert.equal(ids.studioPhoto.hidden, false);
  assert.equal(ids.photoPlaceholder.hidden, true);
  ids.studioPhoto.emit('error');
  assert.equal(ids.studioPhoto.hidden, true);
  assert.equal(ids.photoPlaceholder.hidden, false);
  assert.equal(ids.studioVideo.src, '/assets/reel.mp4');
  assert.equal(ids.studioVideo.poster, '/assets/poster.webp');
  ids.studioVideo.emit('loadedmetadata');
  assert.equal(ids.studioVideo.hidden, false);
  ids.studioVideo.emit('error');
  assert.equal(ids.studioVideo.hidden, true);
  assert.equal(ids.videoPlaceholder.hidden, false);
});
test('optional photo fallback text follows the current language', async () => {
  for (const [language, expected] of [['es', 'Una mirada al proceso creativo'], ['en', 'A glimpse into the creative process']]) {
    const { ids } = setup({ language, media: { photo: { src: '/assets/process.jpg' } } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(ids.studioPhoto.alt, expected);
  }
});
test('bad optional media and incomplete chapter markup preserve useful fallbacks', async () => {
  const { ids } = setup({ incomplete: true, media: { photo: { src: '/assets/../x.jpg' }, video: { src: 'https://other.test/x.mp4' } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ids.chapterNav.hidden, true);
  assert.equal(ids.cameraScrub.disabled, true);
  assert.equal(ids.studioPhoto.src, undefined);
  assert.equal(ids.studioVideo.src, undefined);
  assert.equal(ids.photoPlaceholder.hidden, false);
  assert.equal(ids.videoPlaceholder.hidden, false);
});
test('incomplete camera inspection markup stays hidden without activating partial controls', () => {
  for (const options of [{ incompleteParts: true }, { missing: ['cameraPartCopy'] }, { missing: ['cameraPartTitle'] }]) {
    const { ids, parts, document } = setup(options);
    assert.equal(ids.cameraParts.hidden, true);
    parts[0].emit('click');
    assert.equal(document.dispatched.length, 0);
    document.emit('skitoji:language', { detail: 'en' });
    assert.equal(ids.cameraParts.hidden, true);
  }
});
test('absent enhancements and unavailable journal media leave the document usable', async () => {
  const { ids, window, flush } = setup({ missing: ['cameraParts', 'cameraPartTitle', 'cameraPartCopy', 'cameraScrub', 'journalPosition'] });
  window.emit('resize'); flush();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ids.motionChapterTitle.textContent, 'Visión');
  assert.equal(ids.photoPlaceholder.hidden, false);
  assert.equal(ids.videoPlaceholder.hidden, false);
});


test('compact non-sticky studies keep selected chapter without jumping or resetting on scroll', () => {
  const { ids, buttons, window, flush } = setup();
  ids.motionStudy.offsetHeight = 700;
  buttons[2].emit('click');
  assert.equal(ids.motionStudy.dataset.chapter, '2');
  assert.match(ids.motionChapterTitle.textContent, /Rodaje/);
  assert.equal(window.lastScroll, undefined);
  ids.motionStudy.top = -50;
  window.emit('scroll'); flush();
  assert.equal(ids.motionStudy.dataset.chapter, '2');
  assert.equal(buttons[2].getAttribute('aria-current'), 'step');
});


test('narrative navigation clears camera inspection so the final camera can reassemble', () => {
  const { ids, parts, buttons, window, flush, document } = setup();
  parts[1].emit('click');
  assert.equal(parts[1].getAttribute('aria-pressed'), 'true');
  buttons[3].emit('click');
  assert.ok(parts.every(button => button.getAttribute('aria-pressed') === 'false'));
  assert.match(ids.cameraPartTitle.textContent, /Explora/);
  parts[1].emit('click');
  ids.cameraScrub.value='100'; ids.cameraScrub.emit('input');
  assert.ok(parts.every(button => button.getAttribute('aria-pressed') === 'false'));
  parts[2].emit('click'); window.emit('scroll'); flush();
  assert.ok(parts.every(button => button.getAttribute('aria-pressed') === 'false'));
});


test('a tall non-sticky landscape study preserves inspection while scrolling to its controls', () => {
  const { ids, parts, buttons, window, flush } = setup();
  ids.motionStudy.querySelector=()=>ids.motionStudy;
  window.getComputedStyle=()=>({position:'relative'});
  parts[1].emit('click');
  ids.motionStudy.top=-1400;window.emit('scroll');flush();
  assert.equal(ids.motionProgress.value,0,'ordinary flow scrolling keeps the assembled start pose');
  assert.equal(ids.cameraScrub.value,'0','the scrubber stays aligned with the static camera');
  assert.equal(ids.motionStudy.dataset.chapter,'0');
  assert.equal(parts[1].getAttribute('aria-pressed'),'true');
  buttons[2].emit('click');
  assert.equal(window.lastScroll,undefined);
  parts[1].emit('click');
  ids.motionStudy.top=-400;window.emit('scroll');flush();
  assert.equal(ids.motionStudy.dataset.chapter,'2');
  assert.equal(parts[1].getAttribute('aria-pressed'),'true');
});
