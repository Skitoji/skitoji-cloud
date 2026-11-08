/* Practical framing, an explorable toolkit and a visitor-controlled moving strip. */
(() => {
  'use strict';
  const RATIOS = { '16:9': [16, 9], '4:3': [4, 3], '9:16': [9, 16] };
  function calculateFrame(width, ratio) {
    if ((typeof width !== 'string' && typeof width !== 'number') || String(width).trim() === '' || !Object.hasOwn(RATIOS, ratio)) return null;
    const pixels = Number(width);
    if (!Number.isInteger(pixels) || pixels < 320 || pixels > 7680) return null;
    const [x, y] = RATIOS[ratio];
    return { width: pixels, height: Math.round(pixels * y / x), ratio };
  }
  const TOOLS = {
    'after-effects': { name: 'After Effects', chapter: 3,
      es: ['Composición y movimiento para dar continuidad visual a una pieza.', ['Composición por capas', 'Animación de títulos', 'Integración de efectos']],
      en: ['Compositing and motion to give a piece visual continuity.', ['Layered compositing', 'Title animation', 'Effects integration']] },
    'premiere-pro': { name: 'Premiere Pro', chapter: 3,
      es: ['Organizar planos, ajustar la duración y construir el ritmo de un relato.', ['Selección y montaje', 'Ritmo y continuidad', 'Preparación de entregas']],
      en: ['Organising shots, shaping their duration and building a story’s rhythm.', ['Selection and editing', 'Rhythm and continuity', 'Delivery preparation']] },
    'davinci-resolve': { name: 'DaVinci Resolve', chapter: 3,
      es: ['Afinar la imagen en postproducción para que luz y color acompañen a la historia.', ['Corrección de color', 'Coherencia entre planos', 'Acabado y exportación']],
      en: ['Refining the image in post-production so light and colour support the story.', ['Colour correction', 'Consistency between shots', 'Finishing and export']] },
    'adobe-animate': { name: 'Adobe Animate', chapter: 3,
      es: ['Construir movimiento 2D a partir de dibujos, símbolos y secuencias.', ['Animación por fotogramas', 'Símbolos reutilizables', 'Piezas gráficas animadas']],
      en: ['Building 2D motion from drawings, symbols and sequences.', ['Frame animation', 'Reusable symbols', 'Animated graphic pieces']] },
    'motion-graphics': { name: 'Motion Graphics', chapter: 3,
      es: ['Relacionar diseño, tiempo y transiciones para comunicar con movimiento.', ['Jerarquía en movimiento', 'Ritmo visual', 'Transiciones con intención']],
      en: ['Connecting design, timing and transitions to communicate through motion.', ['Hierarchy in motion', 'Visual rhythm', 'Purposeful transitions']] },
    blender: { name: 'Blender', chapter: 2,
      es: ['Dar volumen a una idea y explorar cómo se ve desde distintos puntos de vista.', ['Modelado de objetos', 'Materiales e iluminación', 'Composición de escenas']],
      en: ['Giving an idea volume and exploring it from different viewpoints.', ['Object modelling', 'Materials and lighting', 'Scene composition']] },
    'cinema-4d': { name: 'Cinema 4D', chapter: 2,
      es: ['Desarrollar escenas y objetos 3D que pueden integrarse en una pieza audiovisual.', ['Formas tridimensionales', 'Animación de objetos', 'Escenas para motion']],
      en: ['Developing 3D scenes and objects that can be integrated into audiovisual work.', ['Three-dimensional forms', 'Object animation', 'Scenes for motion']] },
    maya: { name: 'Autodesk Maya', chapter: 2,
      es: ['Explorar la construcción y el movimiento de elementos dentro de un espacio 3D.', ['Modelado de elementos', 'Animación en el espacio', 'Composición de escenas']],
      en: ['Exploring the construction and movement of elements in 3D space.', ['Element modelling', 'Spatial animation', 'Scene composition']] },
    '3ds-max': { name: 'Autodesk 3ds Max', chapter: 2,
      es: ['Trabajar objetos y espacios virtuales para visualizar una propuesta antes de producirla.', ['Modelado de objetos', 'Visualización de espacios', 'Materiales y encuadre']],
      en: ['Working with virtual objects and spaces to visualise a proposal before production.', ['Object modelling', 'Spatial visualisation', 'Materials and framing']] },
    figma: { name: 'Figma', chapter: 0,
      es: ['Ordenar una experiencia y probar cómo se relacionan sus pantallas y decisiones.', ['Diseño de interfaces', 'Prototipos interactivos', 'Sistemas visuales']],
      en: ['Structuring an experience and testing how its screens and decisions connect.', ['Interface design', 'Interactive prototypes', 'Visual systems']] },
    photoshop: { name: 'Photoshop', chapter: 0,
      es: ['Preparar imágenes y composiciones que ayudan a definir una dirección visual.', ['Tratamiento de imagen', 'Composición visual', 'Exploración de referencias']],
      en: ['Preparing images and compositions that help define a visual direction.', ['Image treatment', 'Visual composition', 'Reference exploration']] },
    illustrator: { name: 'Illustrator', chapter: 0,
      es: ['Construir formas y recursos vectoriales que mantienen claridad en distintas escalas.', ['Identidad gráfica', 'Ilustración vectorial', 'Recursos para animación']],
      en: ['Building vector forms and assets that stay clear at different scales.', ['Graphic identity', 'Vector illustration', 'Assets for animation']] },
    'ui-ux': { name: 'UI/UX Design', chapter: 0,
      es: ['Conectar objetivos, contenido e interacción para que una experiencia resulte comprensible.', ['Estructura de información', 'Recorridos de uso', 'Jerarquía y accesibilidad']],
      en: ['Connecting goals, content and interaction to make an experience understandable.', ['Information structure', 'User journeys', 'Hierarchy and accessibility']] },
    'creative-direction': { name: 'Creative Direction', chapter: 0,
      es: ['Definir una intención compartida para que imagen, ritmo y diseño trabajen juntos.', ['Concepto y referencias', 'Lenguaje visual', 'Coherencia de la propuesta']],
      en: ['Defining a shared intent so image, rhythm and design work together.', ['Concept and references', 'Visual language', 'Proposal consistency']] },
    'html-css': { name: 'HTML / CSS', chapter: 0,
      es: ['Convertir una propuesta visual en contenido estructurado y adaptable a distintas pantallas.', ['Estructura semántica', 'Diseño responsive', 'Estados y composición']],
      en: ['Turning a visual proposal into structured content that adapts to different screens.', ['Semantic structure', 'Responsive design', 'States and composition']] },
    javascript: { name: 'JavaScript', chapter: 0,
      es: ['Hacer que las decisiones del visitante produzcan respuestas claras dentro de una interfaz.', ['Interacciones y controles', 'Estados de la interfaz', 'Mejoras progresivas']],
      en: ['Making visitor decisions produce clear responses within an interface.', ['Interactions and controls', 'Interface states', 'Progressive enhancements']] },
    webflow: { name: 'Webflow', chapter: 0,
      es: ['Llevar una composición visual a una experiencia web adaptable y organizada.', ['Composición responsive', 'Contenido estructurado', 'Interacciones de interfaz']],
      en: ['Bringing a visual composition into an adaptable, structured web experience.', ['Responsive composition', 'Structured content', 'Interface interactions']] },
    wordpress: { name: 'WordPress', chapter: 0,
      es: ['Organizar sitios cuyo contenido necesita mantenerse y crecer después de publicarse.', ['Estructura de páginas', 'Gestión de contenido', 'Presentación adaptable']],
      en: ['Organising websites whose content needs to be maintained and grow after publication.', ['Page structure', 'Content management', 'Adaptable presentation']] }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = { calculateFrame, toolKeys: Object.keys(TOOLS) };
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (root.dataset.workbenchReady === 'true') return;
  root.dataset.workbenchReady = 'true';
  const $ = id => document.getElementById(id);
  let language = root.lang === 'en' ? 'en' : 'es';
  const words = {
    es: {
      invalid: 'Introduce un ancho entero entre 320 y 7680 píxeles.',
      grid: 'Guía de tercios', paused: 'Reanudar franja', playing: 'Pausar franja',
      preview: 'Vista previa del encuadre', width: 'Ancho de entrega en píxeles',
      process: 'Explorar esta etapa', chapters: ['VISIÓN', 'ÓPTICA', 'RODAJE', 'MONTAJE'],
      result: (size, grid) => `${size.width} × ${size.height} píxeles. Formato ${size.ratio}. Guía de tercios ${grid ? 'activada' : 'desactivada'}.`
    },
    en: {
      invalid: 'Enter a whole-number width between 320 and 7680 pixels.',
      grid: 'Rule-of-thirds guide', paused: 'Resume strip', playing: 'Pause strip',
      preview: 'Framing preview', width: 'Delivery width in pixels',
      process: 'Explore this stage', chapters: ['VISION', 'OPTICS', 'PRODUCTION', 'EDITING'],
      result: (size, grid) => `${size.width} × ${size.height} pixels. ${size.ratio} format. Rule-of-thirds guide ${grid ? 'on' : 'off'}.`
    }
  };

  const planner = $('framePlanner');
  const width = $('frameWidth');
  const dimensions = $('frameDimensions');
  const preview = $('framePreview');
  const grid = $('frameGrid');
  const status = $('framePlannerStatus');
  const ratios = planner ? Array.from(planner.querySelectorAll('button[data-frame-ratio]')) : [];
  const validPlanner = !!(planner && width && dimensions && preview && grid && status && ratios.length === 3
    && Object.keys(RATIOS).every(ratio => ratios.some(button => button.dataset.frameRatio === ratio)));
  let currentRatio = '16:9';
  let lastFrame = calculateFrame(width?.value, currentRatio) || calculateFrame(1920, currentRatio);
  let showGrid = true;
  let announced = false;
  function renderFrame(announce = false) {
    if (!validPlanner) return;
    const calculated = calculateFrame(width.value, currentRatio);
    if (calculated) lastFrame = calculated;
    else lastFrame = calculateFrame(lastFrame.width, currentRatio);
    const invalid = !calculated;
    width.setAttribute('aria-invalid', String(invalid));
    width.setAttribute('aria-label', words[language].width);
    preview.dataset.ratio = currentRatio;
    preview.dataset.grid = showGrid ? 'on' : 'off';
    preview.setAttribute('aria-label', `${words[language].preview}: ${currentRatio}`);
    dimensions.textContent = `${lastFrame.width} × ${lastFrame.height} px`;
    grid.setAttribute('aria-pressed', String(showGrid));
    grid.setAttribute('aria-label', words[language].grid);
    ratios.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.frameRatio === currentRatio)));
    // Typing updates the visual readout, but only deliberate changes use the live region.
    if (announce) {
      announced = true;
      status.textContent = invalid ? words[language].invalid : words[language].result(lastFrame, showGrid);
    } else {
      announced = false;
      status.textContent = '';
    }
  }
  if (validPlanner) {
    ratios.forEach(button => {
      button.disabled = false;
      button.hidden = false;
      button.addEventListener('click', () => { currentRatio = button.dataset.frameRatio; renderFrame(true); });
    });
    width.disabled = false;
    width.addEventListener('input', () => renderFrame());
    width.addEventListener('change', () => renderFrame(true));
    grid.disabled = false;
    grid.hidden = false;
    grid.addEventListener('click', () => { showGrid = !showGrid; renderFrame(true); });
    renderFrame();
    planner.dataset.ready = 'true';
  }

  const skills = $('skills');
  const detail = $('toolDetail');
  const toolName = $('toolName');
  const toolStage = $('toolStage');
  const toolDescription = $('toolDescription');
  const toolCapabilities = $('toolCapabilities');
  const processLink = $('toolProcessLink');
  const processLabel = processLink?.querySelector('[data-process-label]') || processLink;
  const tools = skills ? Array.from(skills.querySelectorAll('button[data-tool]')) : [];
  const validTools = !!(skills && detail && toolName && toolStage && toolDescription && toolCapabilities && processLink
    && tools.length === Object.keys(TOOLS).length && Object.keys(TOOLS).every(key => tools.some(button => button.dataset.tool === key)));
  let selectedTool = 'premiere-pro';
  function renderTool() {
    if (!validTools) return;
    const item = TOOLS[selectedTool];
    toolName.textContent = item.name;
    toolStage.textContent = `0${item.chapter + 1} / ${words[language].chapters[item.chapter]}`;
    toolDescription.textContent = item[language][0];
    toolCapabilities.replaceChildren(...item[language][1].map(value => {
      const li = document.createElement('li'); li.textContent = value; return li;
    }));
    detail.dataset.tool = selectedTool;
    detail.dataset.chapter = String(item.chapter);
    processLabel.textContent = words[language].process;
    tools.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tool === selectedTool)));
    const selectedButton = tools.find(button => button.dataset.tool === selectedTool);
    const group = selectedButton?.closest?.('.skill-group');
    if (group && group.nextElementSibling !== detail && typeof group.insertAdjacentElement === 'function') {
      group.insertAdjacentElement('afterend', detail);
    }
  }
  if (validTools) {
    tools.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => { selectedTool = button.dataset.tool; renderTool(); });
    });
    processLink.addEventListener('click', event => {
      const nav = $('chapterNav');
      const button = nav?.querySelector(`button[data-chapter="${TOOLS[selectedTool].chapter}"]`);
      if (!nav || nav.hidden || !button || button.disabled || typeof button.click !== 'function') return;
      const stage = $('motionStudy')?.querySelector('.motion-stage');
      const sticky = stage && typeof window !== 'undefined' && typeof window.getComputedStyle === 'function'
        && window.getComputedStyle(stage).position === 'sticky';
      // Sticky chapter buttons already navigate through the long scene. In flow
      // layouts they change only the model, so preserve the ordinary anchor jump.
      if (sticky) event.preventDefault();
      button.click();
    });
    renderTool();
  }

  const strip = $('disciplineStrip');
  const marqueeToggle = $('marqueeToggle');
  const marqueeLabel = marqueeToggle?.querySelector('[data-marquee-label]') || marqueeToggle;
  const preference = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let userPaused = null;
  function renderMarquee() {
    if (!strip || !marqueeToggle) return;
    const paused = userPaused === null ? preference.matches : userPaused;
    strip.classList.toggle('is-paused', paused);
    strip.classList.toggle('is-playing', !paused && userPaused === false);
    marqueeToggle.setAttribute('aria-pressed', String(paused));
    const label = paused ? words[language].paused : words[language].playing;
    marqueeLabel.textContent = label;
    marqueeToggle.setAttribute('aria-label', label);
  }
  if (strip && marqueeToggle) {
    strip.dataset.marqueeReady = 'true';
    marqueeToggle.hidden = false;
    marqueeToggle.addEventListener('click', () => {
      userPaused = !(userPaused === null ? preference.matches : userPaused);
      if (!userPaused) strip.dataset.marqueeActivated = 'true';
      renderMarquee();
    });
    preference.addEventListener?.('change', () => {
      if (preference.matches && userPaused === false) userPaused = null;
      renderMarquee();
    });
    renderMarquee();
  }
  document.addEventListener('skitoji:language', event => {
    const requested = typeof event.detail === 'string' ? event.detail : event.detail?.language;
    language = requested === 'en' ? 'en' : 'es';
    renderFrame(announced); renderTool(); renderMarquee();
  });
})();
