'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { safeURL, normalizeProjects, contactPayload, delivered } = require('../skitoji-landing/app.js');

test('only HTTPS Behance projects and Behance images become external links', () => {
  assert.equal(safeURL('https://www.behance.net/gallery/123/My-work'), 'https://www.behance.net/gallery/123/My-work');
  for (const value of ['javascript:alert(1)', 'http://behance.net/gallery/123', 'https://behance.net.evil.test/', 'https://evil.test/', 'data:text/html,hello', null]) assert.equal(safeURL(value), '');
  assert.equal(safeURL('https://mir-s3-cdn-cf.behance.net/projects/image.png', 'image'), 'https://mir-s3-cdn-cf.behance.net/projects/image.png');
  assert.equal(safeURL('https://evil.test/image.png', 'image'), '');
});

test('real Behance sync data preserves project content and categories', () => {
  const source = JSON.parse(readFileSync(new URL('../skitoji-landing/works.json', 'file://' + __filename), 'utf8'));
  const projects = normalizeProjects(source);
  assert.equal(projects.length, 2);
  assert.deepEqual(projects.map(p => p.title), source.projects.map(p => p.title));
  assert.deepEqual(projects.map(p => p.category), ['works.cat.branding', 'works.cat.typography']);
  assert.ok(projects.every(p => p.url.startsWith('https://www.behance.net/') && p.cover));
});

test('invalid feeds cannot erase saved markup; unknown category has a safe label', () => {
  assert.throws(() => normalizeProjects({}), /Invalid projects/);
  const projects = normalizeProjects({ projects: [null, { title: 'bad', url: 'javascript:alert(1)' }, { title: '<img onerror=alert(1)>', url: 'https://behance.net/gallery/1', category: '__proto__' }] });
  assert.equal(projects.length, 1);
  assert.equal(projects[0].category, 'works.cat.project');
  assert.equal(projects[0].title, '<img onerror=alert(1)>'); // Inserted via textContent, never HTML.
  assert.deepEqual(normalizeProjects({ projects: [] }), []);
});

test('contact payload matches existing Python handler including anti-spam elapsed milliseconds', () => {
  const payload = contactPayload({ name: ' Samuel ', email: ' hello@example.com ', message: ' Una idea ', projectType: 'motion', website: '' }, 2600.8);
  assert.deepEqual(payload, { name: 'Samuel', email: 'hello@example.com', message: 'Una idea', projectType: 'motion', website: '', form_time: '2600' });
  assert.equal(contactPayload({}, 3000).website, '');
});

test('contact UI only reports actual delivery; a silent anti-spam success is not delivery', () => {
  assert.equal(delivered(true, { ok: true }), false);
  assert.equal(delivered(true, { ok: true, email: false, discord: false }), false);
  assert.equal(delivered(false, { ok: true, email: true }), false);
  assert.equal(delivered(true, { ok: false, discord: true }), false);
  assert.equal(delivered(true, { ok: true, email: true, discord: false }), true);
  assert.equal(delivered(true, { ok: true, email: false, discord: true }), true);
});
