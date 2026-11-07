/* Original, opt-in interface sounds. No audio is loaded or played on arrival. */
(() => {
  'use strict';
  const toggle = document.getElementById('soundToggle');
  if (!toggle || toggle.dataset.soundReady === 'true') return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  const label = toggle.querySelector('[data-sound-label]');
  let language = document.documentElement.lang === 'en' ? 'en' : 'es';
  let context, enabled = false, wanted = false, epoch = 0, lastSound = -Infinity;
  let queue = Promise.resolve();
  const voices = new Set();
  const words = {
    es: { on: 'Sonido ON', off: 'Sonido OFF', enable: 'Activar sonidos de la interfaz', mute: 'Silenciar sonidos de la interfaz', unavailable: 'Sonido no disponible' },
    en: { on: 'Sound ON', off: 'Sound OFF', enable: 'Enable interface sounds', mute: 'Mute interface sounds', unavailable: 'Sound unavailable' }
  };
  function render() {
    const copy = words[language];
    if (label) label.textContent = Audio ? (enabled ? copy.on : copy.off) : copy.unavailable;
    toggle.setAttribute('aria-label', Audio ? (enabled ? copy.mute : copy.enable) : copy.unavailable);
    toggle.setAttribute('aria-pressed', String(enabled));
  }
  toggle.dataset.soundReady = 'true';
  render();
  if (!Audio) { toggle.hidden = true; toggle.disabled = true; return; }
  toggle.hidden = false;

  function silence() {
    const now = context?.currentTime || 0;
    voices.forEach(({ oscillator, gain }) => {
      try { gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now); oscillator.stop(now); } catch { /* A voice may already have ended. */ }
      try { oscillator.disconnect(); gain.disconnect(); } catch { /* Detached nodes are harmless. */ }
    });
    voices.clear();
  }
  function tone(frequency, endFrequency, duration, delay = 0) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.025, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    gain.gain.setValueAtTime(0, start + duration + 0.01);
    oscillator.connect(gain); gain.connect(context.destination);
    const voice = { oscillator, gain };
    voices.add(voice);
    oscillator.onended = () => { voices.delete(voice); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + 0.02);
  }
  function play(kind) {
    if (!enabled || document.hidden || context?.state !== 'running') return;
    if (kind === 'welcome') { tone(523.25, 523.25, 0.18); tone(783.99, 783.99, 0.22, 0.06); }
    else if (kind === 'sweep') tone(330, 550, 0.15);
    else if (kind === 'chapter') tone(440, 587.33, 0.12);
    else if (kind === 'spark') tone(659.25, 783.99, 0.11);
    else if (kind === 'summary') tone(392, 493.88, 0.12);
    else tone(587.33, 493.88, 0.075);
  }
  function failure(version) {
    if (version !== epoch) return;
    enabled = wanted = false;
    silence(); render();
  }
  function enqueue(task, version) {
    queue = queue.then(() => task()).catch(() => failure(version));
  }
  toggle.addEventListener('click', () => {
    wanted = !wanted;
    const version = ++epoch;
    if (!wanted) {
      enabled = false; silence(); render();
      enqueue(async () => { if (version === epoch && context?.state === 'running') await context.suspend(); }, version);
      return;
    }
    try { if (!context || context.state === 'closed') context = new Audio(); }
    catch { failure(version); return; }
    enqueue(async () => {
      if (version !== epoch || document.hidden) { if (version === epoch) failure(version); return; }
      if (context.state !== 'running') await context.resume();
      if (version !== epoch || !wanted || document.hidden) return;
      if (context.state !== 'running') throw new Error('Audio did not start');
      enabled = true; render(); lastSound = performance.now(); play('welcome');
    }, version);
  });
  document.addEventListener('click', event => {
    if (!enabled || document.hidden || event.target?.closest?.('#soundToggle')) return;
    const target = event.target?.closest?.('button[data-filter], #sceneMode, #storySceneMode, summary, a[href^="#"], button[data-spark], button[data-chapter], button[data-camera-part], button[data-footer-frame]');
    if (!target || target.disabled) return;
    const now = performance.now();
    if (now - lastSound < 140) return;
    lastSound = now;
    const version = epoch;
    const kind = target.matches('#sceneMode, #storySceneMode') ? 'sweep'
      : target.matches('button[data-chapter]') ? 'chapter'
      : target.matches('button[data-spark]') ? 'spark'
      : target.matches('summary') ? 'summary' : 'tick';
    enqueue(async () => {
      if (version !== epoch || !enabled || document.hidden) return;
      if (context.state !== 'running') await context.resume();
      if (version === epoch) play(kind);
    }, version);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return; // Resume only on the next deliberate interaction.
    const version = ++epoch;
    if (!enabled) { wanted = false; render(); }
    silence();
    enqueue(async () => { if (version === epoch && context?.state === 'running') await context.suspend(); }, version);
  });
  document.addEventListener('skitoji:language', event => {
    language = (typeof event.detail === 'string' ? event.detail : event.detail?.language) === 'en' ? 'en' : 'es';
    render();
  });
})();
