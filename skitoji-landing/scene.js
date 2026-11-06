/* Original procedural sculpture. Shared by the hero and scroll study; no external assets. */
(() => {
  'use strict';

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const TAU = Math.PI * 2;
  const geometryCache = new Map();
  let language = document.documentElement.lang === 'es' ? 'es' : 'en';
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

  function createScene({ canvasId, containerSelector, motionId, modeId, scrollSectionId }) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    const container = canvas.closest(containerSelector) || canvas.parentElement;
    const motionButton = document.getElementById(motionId);
    const modeButton = document.getElementById(modeId);
    const scrollSection = scrollSectionId ? document.getElementById(scrollSectionId) : null;
    // Start on load; only the pause button changes the visitor's playback choice.
    let paused = false;
    let wireframe = false;
    let visible = true;
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
    let targetScroll = 0;
    let scrollProgress = 0;

    function createGeometry() {
      const segments = width < 600 || coarsePointer ? 120 : 180;
      const sides = width < 600 || coarsePointer ? 16 : 24;
      const key = `${segments}:${sides}`;
      if (geometryCache.has(key)) {
        ({ vertices, faces } = geometryCache.get(key));
        return;
      }
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
      geometryCache.set(key, { vertices, faces });
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

      const progress = scrollSection ? scrollProgress : 0;
      const storyTurn = scrollSection ? progress - 0.5 : 0;
      const ax = 0.65 + Math.sin(clock * 0.16) * 0.13 + pointerY * 0.16 + storyTurn * 0.5;
      const ay = -0.38 + clock * 0.12 + pointerX * 0.24 + storyTurn * 2.2;
      const az = -0.2 + Math.sin(clock * 0.09) * 0.09 + (scrollSection ? Math.sin(progress * Math.PI) * 0.24 : 0);
      // The story has extra breathing room for its restrained camera movement.
      const storyScale = scrollSection ? 0.93 + 0.14 * Math.sin(progress * Math.PI) : 1;
      const scale = Math.min(width, height) / (scrollSection ? 8.4 : 6.8) * storyScale;
      const centerX = width * (0.5 + (scrollSection ? Math.sin(storyTurn * Math.PI) * 0.065 : 0));
      const centerY = height * (0.46 + (scrollSection ? Math.cos(progress * Math.PI) * 0.025 : 0));
      const projected = vertices.map(({ position, normal }) => {
        const p = rotate(position, ax, ay, az);
        const n = rotate(normal, ax, ay, az);
        const perspective = 11.5 / (11.5 - p[2]);
        return { x: centerX + p[0] * scale * perspective, y: centerY + p[1] * scale * perspective, z: p[2], normal: n };
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
      return width > 0 && height > 0 && !paused && visible && !document.hidden;
    }

    function animate(now) {
      frame = 0;
      if (!canAnimate()) { lastTime = 0; return; }
      const elapsed = lastTime ? Math.min(0.06, (now - lastTime) / 1000) : 0;
      // Rendering at 30 fps keeps mobile work bounded; motion time is continuous.
      if (!lastTime || elapsed >= 0.031) {
        clock += elapsed * (preference.matches ? 0.35 : 1);
        lastTime = now;
        if (preference.matches) {
          pointerX = pointerY = 0;
          scrollProgress = 0;
        } else {
          pointerX += (targetX - pointerX) * 0.08;
          pointerY += (targetY - pointerY) * 0.08;
          scrollProgress += (targetScroll - scrollProgress) * Math.min(1, elapsed * 5);
        }
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
      updateScroll();
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
    function updateScroll() {
      if (!scrollSection) return;
      // Read layout once per scroll event. Compositing happens in the canvas RAF,
      // never by writing styles or scrolling the document from this handler.
      const rect = scrollSection.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight || 768;
      const travel = Math.max(1, rect.height - viewport + 88);
      targetScroll = Math.max(0, Math.min(1, (88 - rect.top) / travel));
    }

    function preferenceChanged() {
      targetX = targetY = 0;
      // A preference update must not move a manually paused sculpture.
      if (!paused) {
        pointerX = pointerY = 0;
        if (preference.matches) scrollProgress = 0;
        render();
      }
      updateControls();
      synchronizeAnimation();
    }

    if (!coarsePointer) {
      container.addEventListener('pointermove', (event) => {
        if (paused || preference.matches || !width || !height) return;
        const rect = canvas.getBoundingClientRect();
        targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / width - 0.5) * 2));
        targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / height - 0.5) * 2));
      });
      container.addEventListener('pointerleave', () => { targetX = targetY = 0; });
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    updateControls();
    resize();
    return {
      container,
      resize,
      updateScroll,
      updateControls,
      preferenceChanged,
      synchronizeAnimation,
      setVisible(value) {
        visible = value;
        synchronizeAnimation();
      }
    };
  }

  const scenes = [
    { canvasId: 'heroCanvas', containerSelector: '.hero-art', motionId: 'motionToggle', modeId: 'sceneMode' },
    { canvasId: 'motionCanvas', containerSelector: '.motion-stage', motionId: 'storyMotionToggle', modeId: 'storySceneMode', scrollSectionId: 'motionStudy' }
  ].map(createScene).filter(Boolean);
  if (!scenes.length) return;

  document.addEventListener('skitoji:language', (event) => {
    const requested = typeof event.detail === 'string' ? event.detail : event.detail?.language;
    language = requested === 'es' ? 'es' : 'en';
    scenes.forEach((scene) => scene.updateControls());
  });
  const preferenceChanged = () => scenes.forEach((scene) => scene.preferenceChanged());
  if (preference.addEventListener) preference.addEventListener('change', preferenceChanged);
  else if (preference.addListener) preference.addListener(preferenceChanged);
  document.addEventListener('visibilitychange', () => scenes.forEach((scene) => scene.synchronizeAnimation()));
  window.addEventListener('scroll', () => scenes.forEach((scene) => scene.updateScroll()), { passive: true });
  window.addEventListener('resize', () => {
    scenes.forEach((scene) => {
      scene.updateScroll();
      if (!('ResizeObserver' in window)) scene.resize();
    });
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const scene = scenes.find((candidate) => candidate.container === entry.target);
        if (scene) scene.setVisible(entry.isIntersecting);
      });
    }, { threshold: 0 });
    scenes.forEach((scene) => observer.observe(scene.container));
  }
})();
