const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {buildProjector,projectorPose,projectProjector}=require('../skitoji-landing/projector.js');
const source=fs.readFileSync(path.join(__dirname,'../skitoji-landing/projector.js'),'utf8');

function eventTarget(extra={}){
  const listeners=new Map();
  return Object.assign({
    addEventListener(type,handler){const list=listeners.get(type)||[];list.push(handler);listeners.set(type,list);},
    emit(type,event={}){for(const handler of listeners.get(type)||[])handler(event);}
  },extra);
}
function control(extra={}){
  const attributes=new Map(),label={textContent:''};
  return eventTarget(Object.assign({label,hidden:true,disabled:false,value:'70',querySelector:()=>label,
    setAttribute:(key,value)=>attributes.set(key,value),getAttribute:key=>attributes.get(key)},extra));
}
function boot({reduced=false,coarse=false,width=320,height=280,context=true,throws=false,renderThrows=false,offscreen=false,observers=true}={}){
  let frames=new Map(),nextFrame=0,intersection,resizeObserver,renders=0,polygons=[],currentPath=[],gradients=[];
  const ctx={
    clearRect(){if(renderThrows)throw Error('render failed');renders++;polygons=[];gradients=[];},
    setTransform(){},beginPath(){currentPath=[];},moveTo(x,y){currentPath.push([x,y]);},lineTo(x,y){currentPath.push([x,y]);},closePath(){},
    createLinearGradient(){const stops=[];gradients.push(stops);return{addColorStop(offset,color){stops.push([offset,color]);}};},
    fill(){polygons.push({vertices:currentPath.map(p=>[...p]),color:this.fillStyle});},stroke(){}
  };
  const classes=new Set(),container=eventTarget({dataset:{},classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}});
  const pause=control(),light=control({disabled:true}),value={textContent:''};
  let top=offscreen?1200:0;
  const canvas={getContext(){if(throws)throw Error('context unavailable');return context?ctx:null;},getBoundingClientRect:()=>({width,height,left:0,top,bottom:top+height})};
  const document=eventTarget({hidden:false,documentElement:{lang:'en'},getElementById:id=>({projectorCanvas:canvas,projectorStudy:container,projectorPause:pause,projectorLight:light,projectorLightValue:value}[id])});
  const preference=eventTarget({matches:reduced});
  const window=eventTarget({innerHeight:800,devicePixelRatio:2,
    matchMedia:query=>query.includes('reduced-motion')?preference:{matches:coarse},
    requestAnimationFrame(callback){frames.set(++nextFrame,callback);return nextFrame;},cancelAnimationFrame:id=>frames.delete(id)});
  if(observers){window.IntersectionObserver=class{constructor(callback){intersection=callback;}observe(){}};
    window.ResizeObserver=class{constructor(callback){resizeObserver=callback;}observe(){}};}
  const runtime={window,document};vm.runInNewContext(source,runtime,{filename:'projector.js'});
  return{container,canvas,pause,light,value,document,window,classes,
    get renders(){return renders;},get polygons(){return polygons;},get gradients(){return gradients;},get pending(){return frames.size;},
    step(now){const scheduled=[...frames.values()];frames.clear();scheduled.forEach(callback=>callback(now));},
    settle(){for(let i=0;i<6;i++)this.step(1000+i*40);},
    intensity(amount){light.value=String(amount);light.emit('input');},
    hidden(hidden){document.hidden=hidden;document.emit('visibilitychange');},
    intersect(visible){intersection?.([{target:container,isIntersecting:visible}]);},
    reduced(value){preference.matches=value;preference.emit('change');},
    resize(w,h){width=w;height=h;if(resizeObserver)resizeObserver();else window.emit('resize');},
    scroll(y){top=y;window.emit('scroll');},
    language(language){document.emit('skitoji:language',{detail:{language}});},
    reload(){vm.runInNewContext(source,runtime,{filename:'projector.js'});}
  };
}
const points=polygons=>polygons.map(face=>face.vertices.map(p=>p.map(v=>Math.round(v*1e6)/1e6)));

test('projector is detailed deterministic 3D geometry with separate open reels, film, body, optics and light',()=>{
  const geometry=buildProjector(true);
  assert.deepEqual(buildProjector(true),geometry);
  assert.ok(geometry.length>1000);assert.ok(buildProjector(false).length>geometry.length);
  assert.deepEqual([...new Set(geometry.map(face=>face.part))].sort(),['beam','body','film','lens','reels']);
  const reels=geometry.filter(face=>face.part==='reels');
  assert.deepEqual([...new Set(reels.map(face=>face.component))].sort(),['reelA','reelB']);
  assert.ok(reels.every(face=>face.vertices.length<=36),'perforated rings/spokes rather than full opaque plates');
  assert.ok(geometry.every(face=>face.vertices.length>=3&&face.vertices.every(p=>p.length===3&&p.every(Number.isFinite))));
});

test('projector and complete light volume fit narrow, shallow and desktop canvases through rotation',()=>{
  const geometry=buildProjector(true);
  for(const [width,height]of[[280,190],[320,260],[640,390]])for(const clock of[0,3,10])for(const pointer of[{x:0,y:0},{x:-1,y:1},{x:1,y:-1}]){
    const model=projectProjector(geometry,projectorPose(clock,pointer),width,height);
    assert.ok(model.bounds.minX>=11&&model.bounds.maxX<=width-11);
    assert.ok(model.bounds.minY>=11&&model.bounds.maxY<=height-11);
    assert.ok(model.faces.every(face=>face.vertices.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
    for(let i=1;i<model.faces.length;i++)assert.ok(model.faces[i].depth>=model.faces[i-1].depth);
  }
  assert.deepEqual(projectProjector(geometry,projectorPose(),0,200),{faces:[],bounds:null,parts:{}});
});

test('initial valid draw exposes working controls, caps retina resolution and starts normal playback',()=>{
  const scene=boot();
  assert.ok(scene.classes.has('scene-ready'));assert.equal(scene.pause.hidden,false);assert.equal(scene.light.disabled,false);
  assert.equal(scene.value.textContent,'70%');assert.equal(scene.canvas.width,480);assert.equal(scene.canvas.height,420);
  assert.equal(scene.pause.label.textContent,'Pause model');assert.equal(scene.pending,1);
  const before=points(scene.polygons);scene.settle();assert.notDeepEqual(points(scene.polygons),before);
});

test('pause freezes geometry while intensity remains a real independent control with an off position',()=>{
  const scene=boot();scene.settle();scene.pause.emit('click');
  assert.equal(scene.pause.getAttribute('aria-pressed'),'true');assert.equal(scene.pending,0);
  const before=points(scene.polygons),renders=scene.renders;scene.settle();assert.equal(scene.renders,renders);
  scene.intensity(0);assert.equal(scene.value.textContent,'0%');assert.equal(scene.gradients.length,0);
  const withoutBeam=points(scene.polygons);assert.ok(withoutBeam.length<before.length);
  scene.intensity(100);assert.equal(scene.value.textContent,'100%');assert.equal(scene.gradients.length,12);
  assert.deepEqual(points(scene.polygons),before,'lighting changes do not move the paused object');
  assert.ok(scene.gradients[0][0][1].includes('0.1600'));
  scene.intensity('invalid');assert.equal(scene.value.textContent,'100%');
  scene.pause.emit('click');assert.equal(scene.pause.getAttribute('aria-pressed'),'false');assert.equal(scene.pending,1);
});

test('reduced motion is static until explicit animation, and a changed system preference stops it again',()=>{
  const scene=boot({reduced:true});
  assert.equal(scene.pending,0);assert.equal(scene.pause.getAttribute('aria-pressed'),'true');assert.equal(scene.pause.label.textContent,'Animate model');
  const before=points(scene.polygons);scene.settle();assert.deepEqual(points(scene.polygons),before);
  scene.container.emit('pointermove',{clientX:310,clientY:20});assert.equal(scene.pending,0);
  scene.intensity(50);assert.equal(scene.value.textContent,'50%');assert.equal(scene.pending,0);
  scene.pause.emit('click');assert.equal(scene.pending,1);scene.settle();assert.notDeepEqual(points(scene.polygons),before);
  scene.reduced(true);assert.equal(scene.pending,0);assert.equal(scene.pause.getAttribute('aria-pressed'),'true');
});

test('offscreen and hidden scenes suspend frames and preserve deliberate pause',()=>{
  const scene=boot();scene.intersect(false);assert.equal(scene.pending,0);scene.intersect(true);assert.equal(scene.pending,1);
  scene.hidden(true);assert.equal(scene.pending,0);scene.hidden(false);assert.equal(scene.pending,1);
  scene.pause.emit('click');scene.hidden(true);scene.hidden(false);scene.intersect(false);scene.intersect(true);
  assert.equal(scene.pending,0);assert.equal(scene.pause.getAttribute('aria-pressed'),'true');
  const fallback=boot({observers:false});fallback.scroll(2000);assert.equal(fallback.pending,0);fallback.scroll(0);assert.equal(fallback.pending,1);
});

test('language and resizing retain lighting/paused state, and loading twice does not double listeners',()=>{
  const scene=boot();scene.pause.emit('click');scene.intensity(36);scene.language('es');scene.resize(280,220);
  assert.equal(scene.value.textContent,'36%');assert.equal(scene.pause.label.textContent,'Reanudar modelo');assert.equal(scene.pending,0);
  const renders=scene.renders;scene.reload();assert.equal(scene.renders,renders);
  scene.pause.emit('click');assert.equal(scene.pause.getAttribute('aria-pressed'),'false');assert.equal(scene.pending,1);
});

test('unsupported rendering and zero-sized canvases keep fallbacks and controls unavailable',()=>{
  for(const options of[{context:false},{throws:true},{renderThrows:true},{width:0}]){
    const scene=boot(options);assert.equal(scene.classes.has('scene-ready'),false);assert.equal(scene.pause.hidden,true);assert.equal(scene.light.disabled,true);assert.equal(scene.pending,0);
  }
  const scene=boot();scene.resize(0,0);assert.equal(scene.pause.hidden,true);assert.equal(scene.pending,0);
  scene.resize(320,280);assert.equal(scene.classes.has('scene-ready'),true);assert.equal(scene.light.disabled,false);assert.equal(scene.pending,1);
});
