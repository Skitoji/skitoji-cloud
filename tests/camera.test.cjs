const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildCamera, poseAt, projectCamera } = require('../skitoji-landing/camera.js');
const source = fs.readFileSync(path.join(__dirname,'../skitoji-landing/camera.js'),'utf8');

function eventTarget(extra = {}) {
  const listeners = new Map();
  return Object.assign({
    addEventListener(type, handler) { const list=listeners.get(type)||[]; list.push(handler); listeners.set(type,list); },
    emit(type, event = {}) { for (const handler of listeners.get(type)||[]) handler(event); }
  },extra);
}
function button() {
  const label={textContent:''},attributes=new Map();
  return eventTarget({label,querySelector:()=>label,setAttribute:(key,value)=>attributes.set(key,value),getAttribute:(key)=>attributes.get(key)});
}
function boot({ reducedMotion=false, width=280, height=250, contextAvailable=true, contextThrows=false, renderThrows=false, canvasPresent=true, offscreen=false, observers=true } = {}) {
  let frames=new Map(),nextFrame=0,intersection,resizeObserver;
  let renders=0,geometry=[],firstPoint,bounds,styleCounts;
  let currentPath=[];
  const ctx={
    clearRect() { if (renderThrows) throw new Error('canvas unavailable'); renders++;geometry=[];firstPoint=undefined;bounds=undefined;styleCounts={}; },
    createRadialGradient:()=>({addColorStop(){}}),save(){},restore(){},translate(){},scale(){},fillRect(){},setTransform(){},
    beginPath(){currentPath=[]},closePath(){},
    moveTo(x,y){ currentPath.push([x,y]); },lineTo(x,y){ currentPath.push([x,y]); },
    fill(){
      geometry.push(currentPath.map((p)=>[...p]));
      styleCounts[this.fillStyle]=(styleCounts[this.fillStyle]||0)+1;
      for (const [x,y] of currentPath) {
        if (!firstPoint) firstPoint=[x,y];
        bounds=bounds||{minX:x,maxX:x,minY:y,maxY:y};
        bounds.minX=Math.min(bounds.minX,x);bounds.maxX=Math.max(bounds.maxX,x);
        bounds.minY=Math.min(bounds.minY,y);bounds.maxY=Math.max(bounds.maxY,y);
      }
    },stroke(){}
  };
  const controls={hidden:true},classes=new Set();
  const container=eventTarget({classList:{add:(name)=>classes.add(name)},querySelector:()=>controls});
  const motion=button(),mode=button();
  let canvasTop=offscreen?1600:0;
  const canvas={closest:()=>container,parentElement:container,getContext(){if(contextThrows)throw new Error('unsupported');return contextAvailable?ctx:null},
    getBoundingClientRect:()=>({width,height,left:0,top:canvasTop,bottom:canvasTop+height})};
  let rect={top:0,height:2400};
  const section={getBoundingClientRect:()=>({...rect})};
  const preference=eventTarget({matches:reducedMotion});
  const document=eventTarget({documentElement:{lang:'en'},hidden:false,getElementById(id){return {motionCanvas:canvasPresent?canvas:null,motionStudy:section,storyMotionToggle:motion,storySceneMode:mode}[id]}});
  const window=eventTarget({innerHeight:800,devicePixelRatio:2,matchMedia:(query)=>query.includes('reduced-motion')?preference:{matches:false},
    requestAnimationFrame(callback){frames.set(++nextFrame,callback);return nextFrame},cancelAnimationFrame(id){frames.delete(id)}});
  if(observers){
    window.IntersectionObserver=class { constructor(callback){intersection=callback}observe(){} };
    window.ResizeObserver=class {constructor(callback){resizeObserver=callback}observe(){}};
  }
  vm.runInNewContext(source,{window,document},{filename:'camera.js'});
  return {
    document,window,motion,mode,controls,classes,canvas,
    get renders(){return renders},get pendingFrames(){return frames.size},get firstPoint(){return firstPoint&&[...firstPoint]},
    get geometry(){return geometry},get bounds(){return bounds&&{...bounds}},get styles(){return {...styleCounts}},
    step(now){const scheduled=[...frames.values()];frames.clear();scheduled.forEach((callback)=>callback(now))},
    settle(start=1000,count=60){for(let i=0;i<count;i++)this.step(start+i*40)},
    scroll(top,height=2400){rect={top,height};window.emit('scroll')},
    event(name,detail){document.emit(`skitoji:${name}`,{detail})},
    hidden(value){document.hidden=value;document.emit('visibilitychange')},
    intersect(value){if(intersection)intersection([{target:container,isIntersecting:value}])},
    preference(value){preference.matches=value;preference.emit('change',{matches:value})},
    resize(nextWidth,nextHeight){width=nextWidth;height=nextHeight;if(resizeObserver)resizeObserver();else window.emit('resize')},
    canvasTop(value){canvasTop=value}
  };
}

const rounded=(geometry)=>geometry.map((face)=>face.map((point)=>point.map((value)=>Math.round(value*1e7)/1e7)));

test('camera is deterministic 3D geometry with optics, sensor, body and monitor',()=>{
  const full=buildCamera(false),compact=buildCamera(true);
  assert.deepEqual(buildCamera(true),compact);
  assert.ok(full.length>compact.length,'mobile uses fewer curved faces');
  assert.ok(compact.length>500,'the camera includes a cage, optics, controls and display geometry');
  assert.deepEqual([...new Set(compact.map((face)=>face.part))].sort(),['body','lens','monitor','sensor']);
  const components=new Set(compact.map((face)=>face.component));
  for(const component of ['frontOptic','middleOptic','rearOptic','sensor','body','monitor']) assert.ok(components.has(component));
  for(const face of compact) {
    assert.ok(face.vertices.length>=3);
    assert.ok(face.vertices.every((p)=>p.length===3&&p.every(Number.isFinite)));
  }
});

test('optical assemblies separate in order and the entire rig reassembles',()=>{
  const start=poseAt(0),close=poseAt(.13),exploded=poseAt(.58),end=poseAt(1);
  assert.equal(start.explosion,0); assert.equal(end.explosion,0); assert.equal(exploded.explosion,1);
  assert.ok(close.zoom>start.zoom,'first movement is a dolly-in');
  assert.ok(exploded.offsets.frontOptic[0]<exploded.offsets.middleOptic[0]);
  assert.ok(exploded.offsets.middleOptic[0]<exploded.offsets.rearOptic[0]);
  assert.ok(exploded.offsets.sensor[1]<exploded.offsets.body[1],'sensor floats separately above its mount');
  assert.ok(exploded.offsets.monitor[1]<-0.5,'monitor hinges and lifts away');
  for(const offset of Object.values(end.offsets)) assert.ok(offset.every((value)=>Math.abs(value)<1e-10));
  assert.deepEqual(projectCamera(buildCamera(true),start,280,250).bounds,projectCamera(buildCamera(true),end,280,250).bounds);
});

test('complete detached geometry fits narrow and shallow mobile canvases at every chapter and inspection angle',()=>{
  const geometry=buildCamera(true);
  for(const [width,height] of [[280,250],[280,190],[320,210],[760,620]]) {
    for(let i=0;i<=24;i++) for(const aim of [{},{yaw:.24,pitch:-.02,zoom:.03,reveal:1},{yaw:-.22,pitch:.08,zoom:.025}]) {
      const model=projectCamera(geometry,poseAt(i/24,{compact:width<480,aim,clock:i}),width,height);
      assert.ok(model.bounds.minX>=15&&model.bounds.maxX<=width-15,`horizontal fit at ${width}×${height}`);
      assert.ok(model.bounds.minY>=15&&model.bounds.maxY<=height-15,`vertical fit at ${width}×${height}`);
      assert.ok(model.faces.every((face)=>face.vertices.every((p)=>Number.isFinite(p.x)&&Number.isFinite(p.y))));
    }
  }
});

test('rendered scene reveals controls after a valid draw and starts in shaded mode',()=>{
  const camera=boot();
  assert.ok(camera.classes.has('scene-ready'));assert.equal(camera.controls.hidden,false);
  assert.equal(camera.motion.label.textContent,'Pause');assert.equal(camera.mode.label.textContent,'Wireframe');
  assert.equal(camera.canvas.width,420,'retina ratio is capped at 1.5');assert.equal(camera.pendingFrames,1);
  assert.ok(camera.geometry.length>200);
});

test('real scroll changes camera geometry on animation frames without synchronous drawing',()=>{
  const camera=boot(),control=boot();
  const renders=camera.renders;
  camera.scroll(-800);
  assert.equal(camera.renders,renders);
  camera.settle();control.settle();
  assert.notDeepEqual(camera.firstPoint,control.firstPoint);
  assert.ok(camera.bounds.minX>=15&&camera.bounds.maxX<=265);
});

test('manual scrub clamps values, rejects invalid input and remains until the next real scroll',()=>{
  const camera=boot({reducedMotion:true});
  camera.event('camera-progress',{progress:.58});const exploded=camera.geometry;
  camera.event('language',{language:'es'});camera.resize(281,250);camera.resize(280,250);
  assert.deepEqual(camera.geometry,exploded,'resize and language preserve manual preview');
  camera.event('camera-progress',{progress:NaN});assert.deepEqual(camera.geometry,exploded);
  camera.event('camera-progress',{progress:'0.2'});assert.deepEqual(camera.geometry,exploded);
  camera.event('camera-progress',{progress:8});const end=camera.geometry;
  camera.event('camera-progress',{progress:1});assert.deepEqual(camera.geometry,end);
  camera.event('camera-progress',{progress:-2});const start=camera.geometry;
  camera.event('camera-progress',{progress:0});assert.deepEqual(camera.geometry,start);
  camera.preference(false);camera.event('camera-progress',{progress:.58});camera.settle();
  const before=camera.firstPoint;camera.scroll(0);camera.settle(4000);
  assert.notDeepEqual(camera.firstPoint,before,'an actual scroll resumes the document story');
});

test('all four chapter presets change the actual geometry and final chapter reassembles',()=>{
  const camera=boot({reducedMotion:true});
  const start=camera.geometry;
  camera.event('chapter',{chapter:1});const optics=camera.geometry;
  camera.event('chapter',{chapter:2});const production=camera.geometry;
  camera.event('chapter',{chapter:3});const montage=camera.geometry;
  assert.notDeepEqual(optics,start);assert.notDeepEqual(production,optics);assert.deepEqual(rounded(montage),rounded(start));
  camera.event('chapter',{chapter:4});assert.deepEqual(camera.geometry,montage);
});

test('manual pause freezes every pose through scroll, scrub, inspection, preference, visibility and language changes',()=>{
  const camera=boot();camera.settle(1000,5);camera.motion.emit('click');
  const frozen=camera.geometry,renders=camera.renders;
  camera.scroll(-800);camera.event('camera-progress',{progress:.64});camera.event('inspect-camera',{part:'sensor'});
  camera.event('chapter',{chapter:1});camera.event('inspect-camera',{part:'monitor'});
  camera.preference(true);camera.preference(false);camera.hidden(true);camera.hidden(false);camera.intersect(false);camera.intersect(true);
  camera.event('language',{language:'es'});camera.step(2000);
  assert.deepEqual(camera.geometry,frozen);assert.equal(camera.renders,renders);assert.equal(camera.pendingFrames,0);
  assert.equal(camera.motion.label.textContent,'Reanudar');
  camera.mode.emit('click');
  assert.equal(camera.pendingFrames,0,'changing the surface does not resume playback');
  camera.motion.emit('click');camera.step(2040);
  const firstResume=camera.firstPoint;camera.step(2080);
  assert.notDeepEqual(camera.firstPoint,firstResume,'resume eases toward queued pose');
});

test('reduced motion is static assembled, ignores scroll/pointer, and explicit controls snap without animation',()=>{
  const camera=boot({reducedMotion:true}),control=boot({reducedMotion:true});
  const initial=camera.geometry;camera.scroll(-1000);camera.step(1000);
  assert.deepEqual(camera.geometry,initial);assert.equal(camera.pendingFrames,0);
  camera.event('inspect-camera',{part:'sensor'});
  assert.notDeepEqual(camera.geometry,initial,'inspection reveals a normally hidden sensor');
  assert.equal(camera.pendingFrames,0);
  const inspected=camera.geometry;camera.event('inspect-camera',{part:'__proto__'});
  assert.deepEqual(camera.geometry,inspected,'invalid part does not alter model');
  camera.event('chapter',{chapter:0});assert.deepEqual(camera.geometry,control.geometry);
  camera.motion.emit('click');camera.event('camera-progress',{progress:.6});assert.deepEqual(camera.geometry,initial);
  camera.motion.emit('click');assert.notDeepEqual(camera.geometry,initial,'explicit reduced-motion resume applies queued static pose');
  assert.equal(camera.pendingFrames,0);
});

test('hidden and offscreen scenes suspend frames and only resume when both visible',()=>{
  const camera=boot();camera.step(1000);camera.hidden(true);assert.equal(camera.pendingFrames,0);
  camera.intersect(false);camera.hidden(false);assert.equal(camera.pendingFrames,0);
  camera.intersect(true);assert.equal(camera.pendingFrames,1);
  camera.hidden(true);camera.intersect(false);camera.intersect(true);assert.equal(camera.pendingFrames,0);
  camera.hidden(false);assert.equal(camera.pendingFrames,1);
  assert.equal(boot({offscreen:true}).pendingFrames,0,'initial below-fold model does not rotate');
});

test('visibility still works without IntersectionObserver and zero-size resize suspends playback',()=>{
  const camera=boot({observers:false,offscreen:true});assert.equal(camera.pendingFrames,0);
  camera.canvasTop(0);camera.scroll(0);assert.equal(camera.pendingFrames,1);
  camera.canvasTop(-300);camera.scroll(-300);assert.equal(camera.pendingFrames,0);
  camera.canvasTop(0);camera.scroll(0);camera.resize(0,0);assert.equal(camera.pendingFrames,0);
});


test('a non-scrollable compact study preserves chapter and scrub previews during ordinary page scrolling',()=>{
  const camera=boot(),control=boot();
  for(const view of [camera,control]) view.event('camera-progress',{progress:.58});
  camera.scroll(-140,700);
  camera.settle(1000,14);control.settle(1000,14);
  assert.deepEqual(camera.geometry,control.geometry);
  camera.event('chapter',{chapter:1});control.event('chapter',{chapter:1});
  camera.scroll(-390,700);
  camera.settle(2000,14);control.settle(2000,14);
  assert.deepEqual(camera.geometry,control.geometry);
});

test('controls stay hidden and fallback stays available if rendering cannot initialize',()=>{
  for(const options of [{canvasPresent:false},{contextAvailable:false},{contextThrows:true},{renderThrows:true},{width:0},{height:0}]) {
    const camera=boot(options);
    assert.equal(camera.controls.hidden,true);assert.equal(camera.classes.has('scene-ready'),false);
    assert.equal(camera.pendingFrames,0);
  }
});

test('scrubbing and clearing inspection remove sensor reveal so the final model is fully assembled',()=>{
  const camera=boot({reducedMotion:true});
  const control=boot({reducedMotion:true});
  camera.event('inspect-camera',{part:'sensor'});
  assert.notDeepEqual(rounded(camera.geometry),rounded(control.geometry));
  camera.event('camera-progress',{progress:1});
  control.event('camera-progress',{progress:1});
  assert.deepEqual(rounded(camera.geometry),rounded(control.geometry));
  camera.event('inspect-camera',{part:'sensor'});
  camera.event('inspect-camera',{part:null});
  assert.deepEqual(rounded(camera.geometry),rounded(control.geometry));
});
