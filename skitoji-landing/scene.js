/* Original procedural sculpture. No assets, libraries, or external requests. */
(() => {
  'use strict';

  const canvas = document.getElementById('heroCanvas');
  if (!canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const container = canvas.closest('.hero-art') || canvas.parentElement;
  const motionButton = document.getElementById('motionToggle');
  const modeButton = document.getElementById('sceneMode');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const TAU = Math.PI * 2;
  let language = document.documentElement.lang === 'es' ? 'es' : 'en';
  let paused = preference.matches;
  let wireframe = false;
  let visible = true;
  let focused = document.hasFocus ? document.hasFocus() : true;
  let frame = 0;
  let clock = 0;
  let lastTime = 0;
  let width = 0;
  let height = 0;
  let targetX = 0;
  let targetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let vertices = [];
  let faces = [];

  const copy = {
    en: { pause: 'Pause motion', resume: 'Resume motion', mesh: 'View wireframe', solid: 'View sculpture', pauseShort: 'Pause', resumeShort: 'Resume', meshShort: 'Wireframe', solidShort: 'Solid' },
    es: { pause: 'Pausar animación', resume: 'Reanudar animación', mesh: 'Ver malla', solid: 'Ver escultura', pauseShort: 'Pausar', resumeShort: 'Reanudar', meshShort: 'Ver malla', solidShort: 'Ver sólido' }
  };

  const normalize = ([x, y, z]) => {
    const length = Math.hypot(x, y, z) || 1;
    return [x / length, y / length, z / length];
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const centerline = (u) => {
    const radius = 1.82 + 0.64 * Math.cos(3 * u);
    return [radius * Math.cos(2 * u), radius * Math.sin(2 * u), 0.9 * Math.sin(3 * u)];
  };

  function createGeometry() {
    const segments = width < 600 || coarsePointer ? 120 : 180;
    const sides = width < 600 || coarsePointer ? 16 : 24;
    vertices = [];
    faces = [];
    for (let i = 0; i < segments; i++) {
      const u = TAU * i / segments;
      const p = centerline(u);
      const next = centerline(u + 0.001);
      const tangent = normalize(next.map((v, j) => v - p[j]));
      const normal = normalize(cross(tangent, [0, 0, 1]));
      const binormal = normalize(cross(tangent, normal));
      for (let j = 0; j < sides; j++) {
        const angle = TAU * j / sides;
        const n = normal.map((v, k) => v * Math.cos(angle) + binormal[k] * Math.sin(angle));
        vertices.push({ position: p.map((v, k) => v + n[k] * 0.39), normal: n });
      }
    }
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < sides; j++) {
        faces.push([
          i * sides + j,
          ((i + 1) % segments) * sides + j,
          ((i + 1) % segments) * sides + (j + 1) % sides,
          i * sides + (j + 1) % sides
        ]);
      }
    }
  }

  function rotate([x, y, z], ax, ay, az) {
    const x1 = x;
    const y1 = y * Math.cos(ax) - z * Math.sin(ax);
    const z1 = y * Math.sin(ax) + z * Math.cos(ax);
    const x2 = x1 * Math.cos(ay) + z1 * Math.sin(ay);
    const z2 = -x1 * Math.sin(ay) + z1 * Math.cos(ay);
    return [x2 * Math.cos(az) - y1 * Math.sin(az), x2 * Math.sin(az) + y1 * Math.cos(az), z2];
  }

  function metalColor(normal) {
    const [nx, ny, nz] = normalize(normal);
    // Reflections of an imaginary studio: broad softboxes, a dark horizon,
    // and one cobalt wall. The lights stay still while the sculpture turns.
    const reflectionY = 2 * ny * nz;
    const reflectionX = 2 * nx * nz;
    const band = (position, spread) => Math.exp(-Math.pow((reflectionY - position) / spread, 2));
    let value = 112 + 67 * Math.tanh(reflectionY * 4);
    value += 100 * band(0.49, 0.15) + 135 * band(-0.7, 0.09) - 73 * band(-0.13, 0.13);
    const specular = Math.pow(Math.max(0, -0.35 * nx - 0.55 * ny + 0.76 * nz), 48) * 125;
    value = Math.max(18, Math.min(250, value + specular));
    const blue = Math.max(0, reflectionX - 0.27) * Math.max(0, 1 - Math.abs(reflectionY)) * 0.75;
    const rim = Math.pow(1 - Math.max(0, nz), 3) * 23;
    const r = Math.round(Math.min(255, value * (0.99 - blue * 0.55) + rim));
    const g = Math.round(Math.min(255, value * (1.01 - blue * 0.37) + rim));
    const b = Math.round(Math.min(255, value * 1.055 + blue * 62 + rim));
    return `rgb(${r},${g},${b})`;
  }

  function render() {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    const shadow = ctx.createRadialGradient(width * 0.5, height * 0.85, 0, width * 0.5, height * 0.85, width * 0.32);
    shadow.addColorStop(0, 'rgba(42,54,93,0.12)');
    shadow.addColorStop(0.45, 'rgba(42,54,93,0.055)');
    shadow.addColorStop(1, 'rgba(42,54,93,0)');
    ctx.save();
    ctx.translate(0, height * 0.85);
    ctx.scale(1, 0.18);
    ctx.translate(0, -height * 0.85);
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, width, height * 2);
    ctx.restore();

    const ax = 0.65 + Math.sin(clock * 0.16) * 0.13 + pointerY * 0.16;
    const ay = -0.38 + clock * 0.12 + pointerX * 0.24;
    const az = -0.2 + Math.sin(clock * 0.09) * 0.09;
    const scale = Math.min(width, height) / 6.8;
    const projected = vertices.map(({ position, normal }) => {
      const p = rotate(position, ax, ay, az);
      const n = rotate(normal, ax, ay, az);
      const perspective = 11.5 / (11.5 - p[2]);
      return { x: width * 0.5 + p[0] * scale * perspective, y: height * 0.46 + p[1] * scale * perspective, z: p[2], normal: n };
    });
    const surface = [];
    for (const indices of faces) {
      const points = indices.map((index) => projected[index]);
      const normal = [0, 1, 2].map((k) => points.reduce((sum, point) => sum + point.normal[k], 0) / 4);
      if (!wireframe && normal[2] < -0.05) continue;
      surface.push({ points, normal, depth: points.reduce((sum, p) => sum + p.z, 0) / 4 });
    }
    surface.sort((a, b) => a.depth - b.depth);
    ctx.lineJoin = 'round';
    for (const { points, normal } of surface) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      if (wireframe) {
        ctx.strokeStyle = normal[2] > 0 ? 'rgba(48,73,232,0.62)' : 'rgba(48,73,232,0.09)';
        ctx.lineWidth = 0.55;
        ctx.stroke();
      } else {
        ctx.fillStyle = metalColor(normal);
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 0.65;
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function canAnimate() {
    return !paused && visible && focused && !document.hidden;
  }

  function animate(now) {
    frame = 0;
    if (!canAnimate()) { lastTime = 0; return; }
    const elapsed = lastTime ? Math.min(0.06, (now - lastTime) / 1000) : 0;
    // Rendering at 30 fps keeps mobile work bounded; motion time is continuous.
    if (!lastTime || elapsed >= 0.031) {
      clock += elapsed;
      lastTime = now;
      pointerX += (targetX - pointerX) * 0.08;
      pointerY += (targetY - pointerY) * 0.08;
      render();
    }
    frame = window.requestAnimationFrame(animate);
  }

  function synchronizeAnimation() {
    if (canAnimate() && !frame) frame = window.requestAnimationFrame(animate);
    else if (!canAnimate() && frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  }

  function updateControls() {
    const words = copy[language];
    if (motionButton) {
      const label = paused ? words.resume : words.pause;
      const shortLabel = paused ? words.resumeShort : words.pauseShort;
      const span = motionButton.querySelector('[data-motion-label]');
      if (span) span.textContent = shortLabel;
      else motionButton.textContent = shortLabel;
      motionButton.setAttribute('aria-label', label);
      motionButton.setAttribute('aria-pressed', String(paused));
    }
    if (modeButton) {
      const label = wireframe ? words.solid : words.mesh;
      const shortLabel = wireframe ? words.solidShort : words.meshShort;
      const span = modeButton.querySelector('[data-scene-label]');
      if (span) span.textContent = shortLabel;
      else modeButton.textContent = shortLabel;
      modeButton.setAttribute('aria-label', label);
      modeButton.setAttribute('aria-pressed', String(wireframe));
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.round(rect.width);
    const nextHeight = Math.round(rect.height);
    if (!nextWidth || !nextHeight || nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    createGeometry();
    render();
    container.classList.add('scene-ready');
    const controls = container.querySelector('.scene-controls');
    if (controls) controls.hidden = false;
    synchronizeAnimation();
  }

  motionButton?.addEventListener('click', () => {
    paused = !paused;
    updateControls();
    synchronizeAnimation();
  });
  modeButton?.addEventListener('click', () => {
    wireframe = !wireframe;
    updateControls();
    render();
  });
  document.addEventListener('skitoji:language', (event) => {
    const requested = typeof event.detail === 'string' ? event.detail : event.detail?.language;
    language = requested === 'es' ? 'es' : 'en';
    updateControls();
  });
  const preferenceChanged = (event) => {
    paused = event.matches;
    targetX = targetY = pointerX = pointerY = 0;
    updateControls();
    render();
    synchronizeAnimation();
  };
  if (preference.addEventListener) preference.addEventListener('change', preferenceChanged);
  else if (preference.addListener) preference.addListener(preferenceChanged);
  if (!coarsePointer) {
    container.addEventListener('pointermove', (event) => {
      if (paused || preference.matches) return;
      const rect = canvas.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / width - 0.5) * 2));
      targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / height - 0.5) * 2));
    });
    container.addEventListener('pointerleave', () => { targetX = targetY = 0; });
  }
  document.addEventListener('visibilitychange', synchronizeAnimation);
  window.addEventListener('focus', () => { focused = true; synchronizeAnimation(); });
  window.addEventListener('blur', () => { focused = false; synchronizeAnimation(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      synchronizeAnimation();
    }, { threshold: 0 });
    observer.observe(container);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  updateControls();
  resize();
})();
