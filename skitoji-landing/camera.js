/* A procedural cinema rig: real 3D faces, perspective and a scroll-driven teardown.
   No downloaded model, WebGL dependency or media request is required. */
(() => {
  'use strict';

  const TAU = Math.PI * 2;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, value) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const subtract = (a, b) => a.map((value, i) => value - b[i]);
  const normal = (vertices) => {
    const n = cross(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0]));
    const length = Math.hypot(...n) || 1;
    return n.map((value) => value / length);
  };
  const rotate = ([x, y, z], ax, ay, az) => {
    const y1 = y * Math.cos(ax) - z * Math.sin(ax);
    const z1 = y * Math.sin(ax) + z * Math.cos(ax);
    const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
    const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
    return [x2 * Math.cos(az) - y1 * Math.sin(az), x2 * Math.sin(az) + y1 * Math.cos(az), z2];
  };
  const materials = {
    graphite: [40, 44, 49], body: [48, 53, 58], edge: [82, 91, 99], rubber: [21, 24, 29],
    black: [10, 14, 20], silver: [154, 169, 182], cobalt: [61, 89, 246], glass: [18, 44, 71],
    sensor: [80, 135, 190], gold: [171, 148, 98], screen: [15, 28, 43], red: [225, 68, 61],
    pale: [161, 194, 224], teal: [78, 173, 169], glassShine: [69, 112, 157], glassBright: [106, 160, 195]
  };

  function buildCamera(compact = false) {
    const faces = [];
    const segments = compact ? 24 : 36;
    const face = (vertices, material, part, component = part, outward) => {
      if (outward && dot(normal(vertices), outward) < 0) vertices = [...vertices].reverse();
      faces.push({ vertices, material, part, component });
    };
    function box(center, size, material, part = 'body', component = part) {
      const [x, y, z] = center, [w, h, d] = size.map((v) => v / 2);
      const v = [[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],
        [x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]];
      const sides = [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]];
      sides.forEach((indices) => face(indices.map((i) => v[i]), material, part, component));
    }
    function discX(x, cy, cz, radius, material, part = 'lens', component = 'frontOptic', direction = -1, count = segments) {
      const points = Array.from({ length: count }, (_, i) => [x, cy + radius * Math.sin(i / count * TAU), cz + radius * Math.cos(i / count * TAU)]);
      face(points, material, part, component, [direction, 0, 0]);
    }
    function latheX(profile, material, part = 'lens', component = 'middleOptic', cy = 0, cz = 0) {
      for (let j = 0; j < profile.length - 1; j++) {
        const [xa, ra] = profile[j], [xb, rb] = profile[j + 1];
        for (let i = 0; i < segments; i++) {
          const a = i / segments * TAU, b = (i + 1) / segments * TAU;
          const vertices = [[xa,cy+ra*Math.sin(a),cz+ra*Math.cos(a)],[xb,cy+rb*Math.sin(a),cz+rb*Math.cos(a)],
            [xb,cy+rb*Math.sin(b),cz+rb*Math.cos(b)],[xa,cy+ra*Math.sin(b),cz+ra*Math.cos(b)]];
          const outward = xa === xb ? [j === 0 ? -1 : 1, 0, 0] : [0, Math.sin((a+b)/2), Math.cos((a+b)/2)];
          face(vertices, material, part, component, outward);
        }
      }
    }
    function cylinderZ(cx, cy, za, zb, radius, material, part = 'body', component = part, count = compact ? 12 : 20) {
      const front = [], back = [];
      for (let i = 0; i < count; i++) {
        const a = TAU * i / count, b = TAU * (i + 1) / count;
        front.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a),zb]);
        back.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a),za]);
        face([[cx+radius*Math.cos(a),cy+radius*Math.sin(a),za],[cx+radius*Math.cos(b),cy+radius*Math.sin(b),za],
          [cx+radius*Math.cos(b),cy+radius*Math.sin(b),zb],[cx+radius*Math.cos(a),cy+radius*Math.sin(a),zb]], material, part, component, [Math.cos((a+b)/2),Math.sin((a+b)/2),0]);
      }
      face(front, material, part, component, [0,0,1]);
      face(back, material, part, component, [0,0,-1]);
    }

    // The chamfered body has separate front, side and rear panels inside its cage.
    box([0.55,0.08,0], [1.78,1.34,1.12], 'body');
    box([0.58,-0.58,0], [1.55,0.11,1.02], 'edge');
    box([1.46,0.10,0], [0.14,1.12,0.98], 'graphite');
    box([0.65,0.13,0.578], [1.32,0.96,0.05], 'rubber');
    box([0.99,0.17,0.611], [0.54,0.45,0.024], 'graphite');
    box([1.50,0.04,0], [0.045,0.64,0.73], 'rubber');
    // Rear cooling fins and the characteristic perforated cage edges.
    for (let i = 0; i < (compact ? 6 : 9); i++) {
      box([1.529,-0.40+i*0.10,0], [0.022,0.026,0.72], 'black');
    }
    for (const z of [-0.61,0.61]) {
      box([0.58,-0.70,z], [1.98,0.08,0.095], 'edge');
      box([0.58,0.80,z], [1.98,0.09,0.095], 'edge');
      for (const x of [-0.38,1.52]) box([x,0.05,z], [0.09,1.47,0.095], 'edge');
    }
    for (const x of [-0.24,0.05,0.34,0.63,0.92,1.21,1.45]) {
      cylinderZ(x,-0.704,0.652,0.664,0.025,'black');
      cylinderZ(x,0.802,0.652,0.664,0.025,'black');
    }
    // Top handle is an open arch, rather than a solid block.
    box([0.11,-0.96,0], [0.16,0.51,0.25], 'graphite');
    box([1.14,-0.96,0], [0.16,0.51,0.25], 'graphite');
    box([0.625,-1.225,0], [1.25,0.17,0.28], 'edge');
    box([0.625,-1.32,0], [0.97,0.035,0.22], 'rubber');
    for (let i = 0; i < 7; i++) box([0.23+i*0.13,-1.344,0], [0.045,0.015,0.23], 'graphite');
    box([0.62,-0.77,0], [0.40,0.12,0.32], 'graphite');
    box([0.62,-0.843,0], [0.50,0.035,0.37], 'silver');
    // Follow-focus wheel, control dials, record key and small control legends.
    cylinderZ(0.03,0.22,0.603,0.687,0.185,'black');
    cylinderZ(0.03,0.22,0.688,0.716,0.133,'edge');
    cylinderZ(0.03,0.22,0.717,0.725,0.058,'rubber');
    cylinderZ(0.93,-0.39,0.60,0.68,0.083,'graphite');
    cylinderZ(0.93,-0.39,0.685,0.697,0.043,'red');
    for (let i = 0; i < 3; i++) {
      box([0.78+i*0.19,0.10,0.634], [0.105,0.035,0.012], i === 0 ? 'pale' : 'edge');
      box([0.78+i*0.19,0.24,0.634], [0.105,0.035,0.012], 'edge');
    }
    box([0.55,-0.37,0.612], [0.40,0.08,0.018], 'pale');
    box([0.55,-0.23,0.612], [0.26,0.025,0.018], 'edge');
    // Lens mount, baseplate, twin support rods and tripod foot.
    latheX([[-0.48,0.405],[-0.40,0.435],[-0.33,0.435]], 'silver', 'body', 'body');
    box([0.50,0.91,0], [1.64,0.16,0.88], 'graphite');
    box([0.62,1.04,0], [0.72,0.13,0.68], 'edge');
    for (const z of [-0.35,0.35]) {
      latheX([[-1.20,0.045],[-1.16,0.065],[1.52,0.065],[1.56,0.045]], 'silver', 'body', 'body', 0.94, z);
      discX(-1.205,0.94,z,0.042,'black','body','body');
    }

    // Three optical assemblies move independently along the optical axis.
    latheX([[-0.94,0.42],[-0.92,0.46],[-0.69,0.46],[-0.65,0.40],[-0.48,0.40]], 'rubber', 'lens', 'rearOptic');
    latheX([[-0.93,0.465],[-0.89,0.475],[-0.85,0.475]], 'silver', 'lens', 'rearOptic');
    discX(-0.95,0,0,0.36,'black','lens','rearOptic');
    discX(-0.957,0,0,0.27,'glass','lens','rearOptic');
    latheX([[-1.50,0.43],[-1.46,0.50],[-1.08,0.50],[-1.04,0.44],[-0.96,0.44]], 'graphite', 'lens', 'middleOptic');
    for (let i = 0; i < (compact ? 6 : 10); i++) {
      const x = -1.43 + i * (compact ? 0.052 : 0.032);
      latheX([[x,0.502],[x+0.012,0.515],[x+0.022,0.502]], 'rubber', 'lens', 'middleOptic');
    }
    latheX([[-1.49,0.436],[-1.476,0.462],[-1.455,0.462]], 'silver', 'lens', 'middleOptic');
    discX(-1.505,0,0,0.37,'black','lens','middleOptic');
    discX(-1.51,0,0,0.26,'glass','lens','middleOptic');
    // Calibrated focus index marks live on the lens surface, not in screen space.
    for (let i = 0; i < 9; i++) {
      const a = -1.05 + i * 0.23;
      const r = 0.517;
      const x = -1.08;
      face([[x,r*Math.sin(a),r*Math.cos(a)],[x+0.035,r*Math.sin(a),r*Math.cos(a)],
        [x+0.035,r*Math.sin(a+0.018),r*Math.cos(a+0.018)],[x,r*Math.sin(a+0.018),r*Math.cos(a+0.018)]], i === 4 ? 'cobalt' : 'pale', 'lens', 'middleOptic');
    }
    latheX([[-2.02,0.465],[-2.01,0.55],[-1.95,0.57],[-1.81,0.57],[-1.75,0.49],[-1.53,0.43]], 'graphite', 'lens', 'frontOptic');
    latheX([[-2.015,0.468],[-2.005,0.55],[-1.981,0.554]], 'silver', 'lens', 'frontOptic');
    latheX([[-1.88,0.575],[-1.86,0.581],[-1.84,0.575]], 'rubber', 'lens', 'frontOptic');
    discX(-2.025,0,0,0.463,'black');
    discX(-2.033,0,0,0.407,'glass');
    // Six iris blades and a dark central aperture behind the lens coating.
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU, b = a + TAU / 6;
      face([[-2.038,0.315*Math.sin(a),0.315*Math.cos(a)],[-2.038,0.315*Math.sin(b),0.315*Math.cos(b)],
        [-2.038,0.14*Math.sin(b+0.4),0.14*Math.cos(b+0.4)],[-2.038,0.14*Math.sin(a+0.4),0.14*Math.cos(a+0.4)]], i % 2 ? 'screen' : 'glass', 'lens', 'frontOptic', [-1,0,0]);
    }
    discX(-2.042,0,0,0.14,'black','lens','frontOptic',-1,6);
    // Narrow curved softbox reflections sit on the optical coating.
    for (let i = 0; i < 7; i++) {
      const a=-1.02+i*0.12, b=a+0.12;
      face([[-2.047,0.37*Math.sin(a),0.37*Math.cos(a)],[-2.047,0.37*Math.sin(b),0.37*Math.cos(b)],
        [-2.047,0.325*Math.sin(b),0.325*Math.cos(b)],[-2.047,0.325*Math.sin(a),0.325*Math.cos(a)]],
      i > 1 && i < 5 ? 'glassBright' : 'glassShine','lens','frontOptic',[-1,0,0]);
    }
    for (let i=0;i<4;i++) {
      const a=1.95+i*0.14,b=a+0.14;
      face([[-2.046,0.35*Math.sin(a),0.35*Math.cos(a)],[-2.046,0.35*Math.sin(b),0.35*Math.cos(b)],
        [-2.046,0.33*Math.sin(b),0.33*Math.cos(b)],[-2.046,0.33*Math.sin(a),0.33*Math.cos(a)]],
      'glassShine','lens','frontOptic',[-1,0,0]);
    }

    // The sensor is a separate copper-backed electronic module, not a lens ring.
    box([-0.405,0,0], [0.105,0.70,0.88], 'graphite', 'sensor');
    box([-0.465,0,0], [0.025,0.58,0.76], 'gold', 'sensor');
    box([-0.483,0,0], [0.016,0.44,0.62], 'sensor', 'sensor');
    for (let i = 0; i < (compact ? 5 : 9); i++) {
      box([-0.495,-0.18+i*(compact ? 0.09 : 0.045),0], [0.004,0.006,0.57], i % 2 ? 'teal' : 'glass', 'sensor');
    }
    for (const y of [-0.285,0.285]) for (const z of [-0.36,0.36]) {
      discX(-0.487,y,z,0.025,'silver','sensor','sensor',-1,8);
    }

    // Articulating external monitor, mounting arm and graphic field display.
    box([0.10,-0.30,0.73], [0.13,0.16,0.38], 'edge', 'monitor');
    box([0.62,-0.55,0.93], [1.26,0.79,0.11], 'rubber', 'monitor');
    box([0.62,-0.55,0.992], [1.12,0.66,0.018], 'screen', 'monitor');
    box([0.62,-0.60,1.005], [0.96,0.48,0.005], 'glass', 'monitor');
    // Letterboxed frame, safe-area corners, horizon and waveform bars.
    box([0.62,-0.77,1.011], [0.94,0.028,0.004], 'black', 'monitor');
    box([0.62,-0.41,1.011], [0.94,0.028,0.004], 'black', 'monitor');
    box([0.62,-0.59,1.012], [0.76,0.009,0.004], 'teal', 'monitor');
    box([0.62,-0.59,1.013], [0.009,0.18,0.004], 'pale', 'monitor');
    for (const x of [0.23,1.01]) for (const y of [-0.73,-0.46]) {
      box([x,y,1.014], [0.09,0.009,0.004], 'pale', 'monitor');
      box([x+(x < 0.6 ? -0.04 : 0.04),y+(y < -0.6 ? 0.025 : -0.025),1.014], [0.009,0.06,0.004], 'pale', 'monitor');
    }
    for (let i = 0; i < 13; i++) {
      const height = 0.018 + (Math.sin(i*1.75)*0.5+0.5)*0.062;
      box([0.18+i*0.07,-0.295-height/2,1.012], [0.035,height,0.004], i > 9 ? 'cobalt' : 'teal', 'monitor');
    }
    box([0.19,-0.82,1.012], [0.06,0.023,0.004], 'red', 'monitor');
    return faces;
  }

  const aims = {
    lens: { yaw: 0.12, pitch: 0.035, zoom: 0.08, reveal: 0 }, sensor: { yaw: 0.24, pitch: -0.02, zoom: 0.03, reveal: 1 },
    body: { yaw: -0.15, pitch: -0.035, zoom: 0.035, reveal: 0 }, monitor: { yaw: -0.22, pitch: 0.08, zoom: 0.025, reveal: 0 }
  };
  function poseAt(value, { compact = false, clock = 0, aim = {} } = {}) {
    const progress = clamp(Number.isFinite(value) ? value : 0);
    const explosion = Math.max(smooth(0.18,0.48,progress) * (1 - smooth(0.74,1,progress)),clamp(aim.reveal || 0)*0.72);
    const spread = compact ? 0.79 : 1;
    const separation = explosion * spread;
    return {
      progress, explosion, pitch: -0.24 + Math.sin(progress*Math.PI)*0.10 + (aim.pitch || 0),
      yaw: 0.72 + Math.sin(progress*TAU)*0.20 + (aim.yaw || 0) + Math.sin(clock*0.25)*0.018,
      roll: -0.045 + Math.sin(progress*Math.PI)*0.08,
      zoom: 1 + smooth(0,0.13,progress)*(1-smooth(0.17,0.33,progress))*0.22 + (aim.zoom || 0),
      monitorAngle: -0.18 - explosion*0.30,
      offsets: {
        body: [separation*0.80,separation*0.06,0],
        sensor: [-separation*0.38,-separation*0.50,separation*0.20],
        rearOptic: [-separation*0.58,0,0], middleOptic: [-separation*1.13,0,0],
        frontOptic: [-separation*1.72,0,0], monitor: [separation*0.62,-separation*0.98,separation*0.20]
      }
    };
  }

  function projectCamera(geometry, pose, width, height) {
    if (!(width > 0 && height > 0)) return { faces: [], bounds: null, parts: {} };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const transformed = geometry.map((face) => {
      const offset = pose.offsets[face.component] || [0,0,0];
      const world = face.vertices.map((vertex) => {
        let local = vertex;
        if (face.component === 'monitor') {
          const hinge = [0.08,-0.38,0.70];
          local = rotate(subtract(vertex,hinge),0,pose.monitorAngle,0).map((v,i) => v+hinge[i]);
        }
        if (face.component === 'sensor') {
          const pivot = [-0.45,0,0];
          local = rotate(subtract(vertex,pivot),0,-pose.explosion*0.12,0).map((v,i) => v+pivot[i]);
        }
        return rotate(local.map((v,i) => v+offset[i]),pose.pitch,pose.yaw,pose.roll);
      });
      const vertices = world.map(([x,y,z]) => {
        const perspective = 10 / (10-z);
        const point = { x: x*perspective, y: y*perspective, z };
        minX = Math.min(minX,point.x); maxX = Math.max(maxX,point.x);
        minY = Math.min(minY,point.y); maxY = Math.max(maxY,point.y);
        return point;
      });
      return { ...face, vertices, normal: normal(world), depth: world.reduce((sum,v) => sum+v[2],0)/world.length };
    });
    // Fit the complete rig, including hidden faces and all detached components.
    // The base scale still permits a small early dolly-in before the teardown.
    const padding = Math.max(16,Math.min(width,height)*0.075);
    const fit = Math.min((width-padding*2)/(maxX-minX),(height-padding*2)/(maxY-minY));
    const base = Math.min(width/5.05,height/3.65)*pose.zoom;
    const scale = Math.max(0.01,Math.min(base,fit));
    const cx = (minX+maxX)/2, cy = (minY+maxY)/2;
    const parts = {};
    for (const face of transformed) {
      face.vertices = face.vertices.map((p) => ({ x: width/2+(p.x-cx)*scale, y: height/2+(p.y-cy)*scale, z: p.z }));
      const bounds = parts[face.part] || (parts[face.part] = { minX: Infinity,maxX: -Infinity,minY: Infinity,maxY: -Infinity });
      for (const p of face.vertices) {
        bounds.minX=Math.min(bounds.minX,p.x); bounds.maxX=Math.max(bounds.maxX,p.x);
        bounds.minY=Math.min(bounds.minY,p.y); bounds.maxY=Math.max(bounds.maxY,p.y);
      }
    }
    transformed.sort((a,b) => a.depth-b.depth);
    return { faces: transformed, parts, scale, bounds: { minX: width/2+(minX-cx)*scale,maxX: width/2+(maxX-cx)*scale,minY: height/2+(minY-cy)*scale,maxY: height/2+(maxY-cy)*scale } };
  }

  // Pure geometry is also available to Node's built-in test runner. No browser globals leak.
  if (typeof module === 'object' && module.exports) module.exports = { buildCamera, poseAt, projectCamera };
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const canvas = document.getElementById('motionCanvas');
  if (!canvas || typeof canvas.getContext !== 'function') return;
  let ctx;
  try { ctx = canvas.getContext('2d',{ alpha: true }); } catch { return; }
  if (!ctx) return;
  const container = canvas.closest('.motion-stage') || canvas.parentElement;
  const section = document.getElementById('motionStudy');
  if (!container || !section) return;
  const motionButton = document.getElementById('storyMotionToggle');
  const modeButton = document.getElementById('storySceneMode');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const words = {
    es: { pause:'Pausar',resume:'Reanudar',pauseFull:'Pausar cámara 3D',resumeFull:'Reanudar cámara 3D',mesh:'Ver malla',solid:'Ver sólido' },
    en: { pause:'Pause',resume:'Resume',pauseFull:'Pause 3D camera',resumeFull:'Resume 3D camera',mesh:'Wireframe',solid:'Solid' }
  };
  let language = document.documentElement.lang === 'es' ? 'es' : 'en';
  let width=0,height=0,geometry=[],compact=false;
  let paused=false,wireframe=false,visible=true,ready=false,frame=0,lastTime=0,clock=0;
  let progress=0,targetProgress=0,currentPart=null,targetPart=null;
  let aim={yaw:0,pitch:0,zoom:0,reveal:0},pointer={x:0,y:0},targetPointer={x:0,y:0};
  let manualPreview=false;

  function color(material, n, selected) {
    const base=materials[material] || materials.graphite;
    const light=clamp(dot(n,[-0.41,-0.62,0.67]),0,1);
    const shine=Math.pow(clamp(dot(n,[-0.18,-0.26,0.948]),0,1),22);
    const metallic=['silver','edge','graphite','body'].includes(material);
    const intensity=0.52+light*0.67;
    const highlight=metallic ? shine*70 : shine*15;
    const tint=selected ? 0.27 : 0;
    return `rgb(${base.map((v,i) => Math.round(clamp(mix(v*intensity+highlight,materials.cobalt[i],tint),0,255))).join(',')})`;
  }
  function render() {
    if (!width || !height) return false;
    const pose=poseAt(progress,{ compact,clock,aim:{yaw:aim.yaw+pointer.x*0.045,pitch:aim.pitch+pointer.y*0.035,zoom:aim.zoom,reveal:aim.reveal} });
    const model=projectCamera(geometry,pose,width,height);
    ctx.clearRect(0,0,width,height);
    const shadow=ctx.createRadialGradient(width*0.52,height*0.81,0,width*0.52,height*0.81,width*0.33);
    shadow.addColorStop(0,'rgba(18,29,55,0.18)'); shadow.addColorStop(1,'rgba(18,29,55,0)');
    ctx.save(); ctx.translate(0,height*0.81); ctx.scale(1,0.15); ctx.translate(0,-height*0.81);
    ctx.fillStyle=shadow; ctx.fillRect(0,0,width,height*2); ctx.restore();
    ctx.lineJoin='round';
    for (const face of model.faces) {
      if (!wireframe && face.normal[2] < -0.015) continue;
      const selected=face.part===currentPart;
      ctx.beginPath(); ctx.moveTo(face.vertices[0].x,face.vertices[0].y);
      for (let i=1;i<face.vertices.length;i++) ctx.lineTo(face.vertices[i].x,face.vertices[i].y);
      ctx.closePath();
      if (wireframe) {
        ctx.fillStyle='rgba(240,241,234,0.028)'; ctx.fill();
        ctx.strokeStyle=face.normal[2]>0 ? (selected?'rgba(48,73,232,0.9)':'rgba(48,73,232,0.40)') : 'rgba(48,73,232,0.075)';
        ctx.lineWidth=selected?0.75:0.45;
      } else {
        ctx.fillStyle=color(face.material,face.normal,selected); ctx.fill();
        ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=0.45;
      }
      ctx.stroke();
    }
    return model.faces.length>0;
  }
  const canDraw = () => ready && width>0 && height>0 && visible && !document.hidden;
  const canAnimate = () => canDraw() && !paused && !preference.matches;
  function updateControls() {
    const copy=words[language];
    if (motionButton) {
      const label=motionButton.querySelector('[data-motion-label]');
      if (label) label.textContent=paused?copy.resume:copy.pause;
      motionButton.setAttribute('aria-label',paused?copy.resumeFull:copy.pauseFull);
      motionButton.setAttribute('aria-pressed',String(paused));
    }
    if (modeButton) {
      const label=modeButton.querySelector('[data-scene-label]');
      if (label) label.textContent=wireframe?copy.solid:copy.mesh;
      modeButton.setAttribute('aria-label',wireframe?copy.solid:copy.mesh);
      modeButton.setAttribute('aria-pressed',String(wireframe));
    }
  }
  function snapExplicit() {
    if (paused) return;
    progress=targetProgress; currentPart=targetPart;
    aim={ ...(aims[targetPart] || {yaw:0,pitch:0,zoom:0,reveal:0}) };
    pointer={x:0,y:0}; clock=0;
    if (canDraw()) render();
  }
  function animate(now) {
    frame=0;
    if (!canAnimate()) { lastTime=0; return; }
    const elapsed=lastTime?Math.min(0.08,(now-lastTime)/1000):0;
    if (!lastTime || elapsed>=0.031) {
      lastTime=now;
      const ease=Math.min(1,elapsed*6);
      clock+=elapsed;
      progress=mix(progress,targetProgress,ease);
      const desired=aims[targetPart] || {yaw:0,pitch:0,zoom:0,reveal:0};
      for (const axis of ['yaw','pitch','zoom','reveal']) aim[axis]=mix(aim[axis],desired[axis],ease);
      pointer.x=mix(pointer.x,targetPointer.x,ease); pointer.y=mix(pointer.y,targetPointer.y,ease);
      currentPart=targetPart;
      render();
    }
    frame=window.requestAnimationFrame(animate);
  }
  function synchronize() {
    if (canAnimate() && !frame) frame=window.requestAnimationFrame(animate);
    else if (!canAnimate() && frame) { window.cancelAnimationFrame(frame); frame=0; lastTime=0; }
  }
  function updateScroll() {
    if (!('IntersectionObserver' in window)) {
      const bounds=canvas.getBoundingClientRect();
      visible=bounds.top < (window.innerHeight || 768) && (bounds.bottom ?? bounds.top+bounds.height)>0;
    }
    const rect=section.getBoundingClientRect();
    const viewport=window.innerHeight || document.documentElement.clientHeight || 768;
    // In short landscape layouts this study is a regular, non-sticky section.
    // Its explicit controls still work; unrelated page scrolling must not reset them.
    const flowLayout=typeof window.getComputedStyle==='function' && window.getComputedStyle(container).position!=='sticky';
    if (flowLayout || rect.height<=viewport+1) { synchronize(); return; }
    manualPreview=false; targetPart=null;
    if (preference.matches) { synchronize(); return; }
    targetProgress=clamp(-rect.top/Math.max(1,rect.height-viewport));
    synchronize();
  }
  function resize() {
    const rect=canvas.getBoundingClientRect();
    const nextWidth=Math.round(rect.width),nextHeight=Math.round(rect.height);
    if (!nextWidth || !nextHeight) { width=height=0; ready=false; synchronize(); return; }
    if (nextWidth===width && nextHeight===height) return;
    if (!width && !height) visible=rect.top < (window.innerHeight || 768) && (rect.bottom ?? rect.top+rect.height)>0;
    width=nextWidth; height=nextHeight;
    const nextCompact=width<480 || coarsePointer;
    if (!geometry.length || nextCompact!==compact) { compact=nextCompact; geometry=buildCamera(compact); }
    const ratio=Math.min(window.devicePixelRatio || 1,1.5);
    canvas.width=Math.round(width*ratio); canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    try {
      if (render()) {
        ready=true;
        container.classList.add('scene-ready');
        const controls=container.querySelector('.scene-controls');
        if (controls) controls.hidden=false;
      }
    } catch { ready=false; synchronize(); return; }
    synchronize();
  }
  motionButton?.addEventListener('click',() => {
    paused=!paused; updateControls();
    if (!paused && preference.matches) snapExplicit();
    synchronize();
  });
  modeButton?.addEventListener('click',() => { wireframe=!wireframe; updateControls(); if (canDraw()) render(); });
  document.addEventListener('skitoji:language',(event) => {
    const requested=typeof event.detail==='string'?event.detail:event.detail?.language;
    language=requested==='es'?'es':'en'; updateControls();
  });
  document.addEventListener('skitoji:chapter',(event) => {
    const requested=Number(event.detail?.chapter);
    if (!Number.isInteger(requested) || requested<0 || requested>3) return;
    manualPreview=true; targetProgress=requested/3; targetPart=null;
    if (preference.matches) snapExplicit(); else synchronize();
  });
  document.addEventListener('skitoji:camera-progress',(event) => {
    const requested=event.detail?.progress;
    if (typeof requested!=='number' || !Number.isFinite(requested)) return;
    manualPreview=true; targetProgress=clamp(requested); targetPart=null;
    if (preference.matches) snapExplicit(); else synchronize();
  });
  document.addEventListener('skitoji:inspect-camera',(event) => {
    const requested=event.detail?.part;
    if (requested !== null && !Object.prototype.hasOwnProperty.call(aims,requested)) return;
    targetPart=requested;
    if (preference.matches) snapExplicit(); else synchronize();
  });
  const preferenceChanged=() => {
    targetPointer={x:0,y:0};
    if (!paused && preference.matches) {
      // Stop at the visitor's current pose. Explicit controls can still inspect it.
      targetProgress=progress; pointer={x:0,y:0}; render();
    }
    synchronize();
  };
  if (preference.addEventListener) preference.addEventListener('change',preferenceChanged);
  else if (preference.addListener) preference.addListener(preferenceChanged);
  if (!coarsePointer) {
    container.addEventListener('pointermove',(event) => {
      if (paused || preference.matches || !width || !height) return;
      const rect=canvas.getBoundingClientRect();
      targetPointer={x:clamp((event.clientX-rect.left)/width*2-1,-1,1),y:clamp((event.clientY-rect.top)/height*2-1,-1,1)};
    });
    container.addEventListener('pointerleave',() => { targetPointer={x:0,y:0}; });
  }
  document.addEventListener('visibilitychange',() => {
    if (canDraw() && !paused && preference.matches) snapExplicit();
    synchronize();
  });
  window.addEventListener('scroll',updateScroll,{passive:true});
  window.addEventListener('resize',() => {
    // Layout changes must preserve a deliberate scrub/chapter preview.
    if (!manualPreview) updateScroll();
    resize();
  },{passive:true});
  if ('IntersectionObserver' in window) {
    const observer=new window.IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.target===container) {
        visible=entry.isIntersecting;
        if (visible && !paused && preference.matches) snapExplicit();
        synchronize();
      }
    },{threshold:0});
    observer.observe(container);
  }
  if ('ResizeObserver' in window) new window.ResizeObserver(resize).observe(canvas);
  updateControls();
  // Always reveal an assembled camera first, including when reduced motion is on.
  resize();
  if (!preference.matches) updateScroll();
})();
