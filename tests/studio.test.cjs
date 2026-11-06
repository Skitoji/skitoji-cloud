'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { studyProgress, chapterTarget, safeMediaPath } = require('../skitoji-landing/studio.js');
const source = fs.readFileSync(path.join(__dirname, '../skitoji-landing/studio.js'), 'utf8');

test('scroll progress clamps at the beginning and end without dividing by zero', () => {
  assert.equal(studyProgress(20, 2100, 1000), 0);
  assert.equal(studyProgress(-550, 2100, 1000), 0.5);
  assert.equal(studyProgress(-2000, 2100, 1000), 1);
  assert.equal(studyProgress(-50, 600, 1000), 0);
});
test('chapter targets use document offset and evenly spaced stages', () => {
  assert.equal(chapterTarget(-200, 1000, 2100, 1000, 0), 800);
  assert.equal(chapterTarget(-200, 1000, 2100, 1000, 1), 1350);
  assert.equal(chapterTarget(-200, 1000, 2100, 1000, 2), 1900);
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
function setup({ media = null, reduced = false, incomplete = false } = {}) {
  const ids = {};
  for (const id of ['motionStudy', 'motionAnnouncement', 'chapterNav', 'motionChapterTitle', 'motionChapterCopy', 'motionProgress', 'journalTrack', 'journalPrev', 'journalNext', 'studioPhoto', 'photoPlaceholder', 'studioVideo', 'videoPlaceholder']) ids[id] = element();
  ids.motionStudy.top = 0;
  ids.motionStudy.offsetHeight = 2100;
  ids.motionStudy.getBoundingClientRect = () => ({ top: ids.motionStudy.top });
  const buttons = [0, 1, 2].map(index => element({ chapter: String(index) }));
  ids.chapterNav.querySelectorAll = () => incomplete ? buttons.slice(0, 2) : buttons;
  ids.journalTrack.scrollLeft = 0; ids.journalTrack.clientWidth = 400; ids.journalTrack.scrollWidth = 1000;
  ids.journalTrack.scrollBy = args => { ids.journalTrack.lastScroll = args; };
  ids.photoPlaceholder.hidden = ids.videoPlaceholder.hidden = false;
  const document = element();
  document.getElementById = id => ids[id] || null;
  document.documentElement = { lang: 'es' };
  const window = element();
  window.innerHeight = 1000; window.scrollY = 800;
  window.matchMedia = () => ({ matches: reduced });
  const callbacks = [];
  window.requestAnimationFrame = callback => { callbacks.push(callback); return callbacks.length; };
  window.scrollTo = args => { window.lastScroll = args; };
  const fetchCalls = [];
  const fetch = async url => { fetchCalls.push(url); return { ok: !!media, json: async () => media }; };
  vm.runInContext(source, vm.createContext({ document, window, fetch }));
  return { ids, buttons, document, window, fetchCalls, flush: () => { while (callbacks.length) callbacks.shift()(); } };
}

test('chapters update on scroll, translate without resetting progress, and navigate natively', () => {
  const { ids, buttons, document, window, flush } = setup();
  assert.equal(ids.chapterNav.hidden, false);
  assert.equal(ids.motionChapterTitle.textContent, 'Forma');
  assert.equal(buttons[0].getAttribute('aria-current'), 'step');
  ids.motionStudy.top = -600;
  window.emit('scroll'); window.emit('scroll'); flush();
  assert.equal(ids.motionChapterTitle.textContent, 'Ritmo');
  assert.equal(buttons[1].getAttribute('aria-current'), 'step');
  document.emit('skitoji:language', { detail: { language: 'en' } });
  assert.equal(ids.motionChapterTitle.textContent, 'Rhythm');
  assert.equal(ids.motionStudy.dataset.chapter, '1');
  buttons[2].emit('click');
  assert.equal(window.lastScroll.top, 1300);
  assert.equal(window.lastScroll.behavior, 'smooth');
  assert.match(ids.motionAnnouncement.textContent, /^Story/);
});
test('journal controls reflect edges and reduced motion uses immediate scrolling', () => {
  const { ids, buttons, window } = setup({ reduced: true });
  assert.equal(ids.journalPrev.hidden, false);
  assert.equal(ids.journalPrev.disabled, true);
  assert.equal(ids.journalNext.disabled, false);
  ids.journalNext.emit('click');
  assert.equal(ids.journalTrack.lastScroll.left, 320);
  assert.equal(ids.journalTrack.lastScroll.behavior, 'auto');
  ids.journalTrack.scrollLeft = 600;
  ids.journalTrack.emit('scroll');
  assert.equal(ids.journalPrev.disabled, false);
  assert.equal(ids.journalNext.disabled, true);
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
  assert.equal(ids.studioVideo.src, '/assets/reel.mp4');
  assert.equal(ids.studioVideo.poster, '/assets/poster.webp');
  ids.studioVideo.emit('loadedmetadata');
  assert.equal(ids.studioVideo.hidden, false);
  ids.studioVideo.emit('error');
  assert.equal(ids.studioVideo.hidden, true);
  assert.equal(ids.videoPlaceholder.hidden, false);
});
test('bad optional media and incomplete chapter markup preserve useful fallbacks', async () => {
  const { ids } = setup({ incomplete: true, media: { photo: { src: '/assets/../x.jpg' }, video: { src: 'https://other.test/x.mp4' } } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ids.chapterNav.hidden, true);
  assert.equal(ids.studioPhoto.src, undefined);
  assert.equal(ids.studioVideo.src, undefined);
  assert.equal(ids.photoPlaceholder.hidden, false);
  assert.equal(ids.videoPlaceholder.hidden, false);
});
