/* A small cinema projector built from original 3D geometry.
   Light is an explicit control; motion stops offscreen and follows system preferences. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const subtract = (a, b) => a.map((value, i) => value-b[i]);
  const dot = (a, b) => a.reduce((sum, value, i) => sum+value*b[i], 0);
  const normal = vertices => {
    const n = cross(subtract(vertices[1], vertices[0]), subtract(vertices[2], vertices[0]));
    const length = Math.hypot(...n) || 1;
    return n.map(value => value/length);
  };
  const rotate = ([x,y,z], ax, ay, az) => {
    const y1=y*Math.cos(ax)-z*Math.sin(ax), z1=y*Math.sin(ax)+z*Math.cos(ax);
    const x2=x*Math.cos(ay)+z1*Math.sin(ay), z2=-x*Math.sin(ay)+z1*Math.cos(ay);
    return [x2*Math.cos(az)-y1*Math.sin(az),x2*Math.sin(az)+y1*Math.cos(az),z2];
  };
  const palette = {
    body:[66,74,85], panel:[46,54,66], rubber:[18,25,36], black:[8,14,26],
    silver:[182,195,209], edge:[117,135,155], pale:[216,232,243],
    blue:[75,119,224], red:[228,93,77], glass:[49,95,144], highlight:[160,213,240]
  };
  const pivots = {reelA:[-0.94,-0.94,0],reelB:[0.78,-0.94,0]};

  function buildProjector(compact = false) {
    const faces = [], segments = compact ? 24 : 36;
    const face = (vertices,material,part='body',component=part,outward) => {
      if(outward && dot(normal(vertices),outward)<0) vertices=[...vertices].reverse();
      faces.push({vertices,material,part,component});
    };
    function box([x,y,z],[width,height,depth],material,part='body',component=part) {
      const [w,h,d]=[width/2,height/2,depth/2];
      const v=[[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],
        [x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]];
      for(const side of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]])
        face(side.map(i=>v[i]),material,part,component);
    }
    function profile(points,za,zb,material,part='body',component=part) {
      face(points.map(([x,y])=>[x,y,za]),material,part,component,[0,0,-1]);
      face(points.map(([x,y])=>[x,y,zb]),material,part,component,[0,0,1]);
      for(let i=0;i<points.length;i++) {
        const a=points[i],b=points[(i+1)%points.length];
        face([[...a,za],[...b,za],[...b,zb],[...a,zb]],material,part,component,[b[1]-a[1],a[0]-b[0],0]);
      }
    }
    function cylinderZ(cx,cy,za,zb,radius,material,part='body',component=part,count=segments) {
      const front=[],back=[];
      for(let i=0;i<count;i++) {
        const a=TAU*i/count,b=TAU*(i+1)/count;
        front.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a),zb]);
        back.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a),za]);
        face([[cx+radius*Math.cos(a),cy+radius*Math.sin(a),za],[cx+radius*Math.cos(b),cy+radius*Math.sin(b),za],
          [cx+radius*Math.cos(b),cy+radius*Math.sin(b),zb],[cx+radius*Math.cos(a),cy+radius*Math.sin(a),zb]],material,part,component,
        [Math.cos((a+b)/2),Math.sin((a+b)/2),0]);
      }
      face(front,material,part,component,[0,0,1]);face(back,material,part,component,[0,0,-1]);
    }
    function ring(cx,cy,za,zb,inner,outer,material,component,phase=0) {
      for(let i=0;i<segments;i++) {
        const a=TAU*i/segments+phase,b=TAU*(i+1)/segments+phase;
        const p=(r,t,z)=>[cx+r*Math.cos(t),cy+r*Math.sin(t),z];
        face([p(inner,a,zb),p(outer,a,zb),p(outer,b,zb),p(inner,b,zb)],material,'reels',component,[0,0,1]);
        face([p(inner,b,za),p(outer,b,za),p(outer,a,za),p(inner,a,za)],material,'reels',component,[0,0,-1]);
        face([p(outer,a,za),p(outer,b,za),p(outer,b,zb),p(outer,a,zb)],material,'reels',component,[Math.cos((a+b)/2),Math.sin((a+b)/2),0]);
        face([p(inner,a,zb),p(inner,b,zb),p(inner,b,za),p(inner,a,za)],material,'reels',component,[-Math.cos((a+b)/2),-Math.sin((a+b)/2),0]);
      }
    }
    function latheX(points,cy,cz,material,part='lens') {
      for(let j=0;j<points.length-1;j++)for(let i=0;i<segments;i++) {
        const [xa,ra]=points[j],[xb,rb]=points[j+1],a=TAU*i/segments,b=TAU*(i+1)/segments;
        const p=(x,r,t)=>[x,cy+r*Math.sin(t),cz+r*Math.cos(t)];
        face([p(xa,ra,a),p(xb,rb,a),p(xb,rb,b),p(xa,ra,b)],material,part,part,
          xa===xb?[j===0?-1:1,0,0]:[0,Math.sin((a+b)/2),Math.cos((a+b)/2)]);
      }
    }
    function discX(x,cy,cz,radius,material) {
      face(Array.from({length:segments},(_,i)=>[x,cy+radius*Math.sin(i/segments*TAU),cz+radius*Math.cos(i/segments*TAU)]),material,'lens','lens',[1,0,0]);
    }

    // Open metal supports attach the two reels to the lamp housing.
    for(const [cx,cy] of Object.values(pivots)) {
      profile([[cx-.1,cy],[cx+.1,cy],[cx*.55+.12,-.08],[cx*.55-.12,-.08]],-.13,.12,'edge');
    }
    profile([[-1.06,-.23],[.69,-.23],[.91,-.02],[.91,1.06],[.73,1.25],[-.91,1.25],[-1.08,1.06],[-1.08,-.04]],-.48,.48,'body');
    profile([[-.89,-.12],[.57,-.12],[.75,.03],[.75,1.01],[.62,1.11],[-.85,1.11],[-.96,.98],[-.96,.02]],.485,.52,'panel');
    box([-.10,1.40,0],[2.18,.19,1.22],'edge');
    box([-.10,1.52,0],[2.42,.12,1.40],'rubber');
    for(const x of [-.85,.68])for(const z of [-.45,.45])box([x,1.61,z],[.31,.12,.30],'black');
    box([-.12,-.29,-.05],[1.29,.09,.56],'edge');
    box([-.47,-.41,-.05],[.11,.20,.18],'rubber');box([.35,-.41,-.05],[.11,.20,.18],'rubber');
    box([-.06,-.53,-.05],[.93,.12,.22],'silver');
    // Fins on the rear quarter and inset controls make the body read as a machine.
    for(let i=0;i<8;i++)box([-.86+i*.15,.22,.535],[.079,.20,.026],'black');
    for(let i=0;i<4;i++)box([-.89,.64+i*.09,.54],[.31,.024,.022],'edge');
    cylinderZ(.38,.80,.52,.61,.21,'rubber');cylinderZ(.38,.80,.613,.65,.14,'edge');
    box([.38,.75,.659],[.026,.12,.009],'pale');
    cylinderZ(-.46,.86,.53,.58,.10,'rubber');cylinderZ(-.46,.86,.582,.60,.055,'silver');
    cylinderZ(.57,.43,.53,.565,.042,'red');
    box([-.02,.43,.54],[.35,.085,.015],'silver');box([-.02,.43,.552],[.23,.027,.006],'panel');
    for(const x of [-.81,.63])for(const y of [-.02,1.0])cylinderZ(x,y,.52,.553,.025,'silver','body','body',8);

    // Each reel has open gaps between six broad spokes, extruded rims and a hub.
    for(const [component,[cx,cy]] of Object.entries(pivots)) {
      ring(cx,cy,-.12,.04,.62,.70,'rubber',component);
      ring(cx,cy,.045,.10,.67,.745,'edge',component);
      ring(cx,cy,.32,.38,.65,.76,'silver',component);
      ring(cx,cy,.384,.396,.715,.747,'pale',component);
      for(let i=0;i<6;i++) {
        const a=i/6*TAU,b=a+.36;
        const points=[[cx+.16*Math.cos(a-.12),cy+.16*Math.sin(a-.12)],
          [cx+.66*Math.cos(a+.03),cy+.66*Math.sin(a+.03)],
          [cx+.66*Math.cos(b+.03),cy+.66*Math.sin(b+.03)],
          [cx+.16*Math.cos(b+.24),cy+.16*Math.sin(b+.24)]];
        profile(points,.32,.38,'silver','reels',component);
      }
      cylinderZ(cx,cy,-.15,.41,.18,'edge','reels',component);
      cylinderZ(cx,cy,.415,.445,.115,'silver','reels',component);
      cylinderZ(cx,cy,.448,.46,.045,'black','reels',component,12);
      box([cx,cy-.074,.45],[.023,.045,.012],'pale','reels',component);
    }
    // A visible film path crosses the guide rollers and returns to the take-up reel.
    const path=[[-.96,-.20],[-.84,.02],[-.39,.15],[-.26,.53],[-.13,.60],[.01,.23],[.60,-.12]];
    for(let i=0;i<path.length-1;i++) {
      const a=path[i],b=path[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=-(b[1]-a[1])/length*.034,dy=(b[0]-a[0])/length*.034;
      face([[a[0]-dx,a[1]-dy,.57],[b[0]-dx,b[1]-dy,.57],[b[0]+dx,b[1]+dy,.57],[a[0]+dx,a[1]+dy,.57]],'black','film','film',[0,0,1]);
      for(let j=0;j<Math.ceil(length/.12);j++) {
        const t=(j+.5)/Math.ceil(length/.12),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
        box([x+dx*.65,y+dy*.65,.576],[.018,.022,.004],'silver','film');
      }
    }
    for(const [x,y] of [[-.84,.02],[-.26,.53],[.01,.23]]) {
      cylinderZ(x,y,.54,.60,.083,'edge','film');cylinderZ(x,y,.605,.62,.035,'black','film');
    }
    // Projecting optics point along +X; ridged focus rings catch the rim light.
    latheX([[.84,.32],[.94,.38],[1.16,.38],[1.22,.30]],.60,-.03,'rubber');
    latheX([[1.10,.385],[1.15,.405],[1.31,.405],[1.34,.31],[1.66,.31],[1.72,.36],[1.88,.36]],.60,-.03,'body');
    for(let i=0;i<6;i++)latheX([[1.20+i*.025,.409],[1.211+i*.025,.42],[1.22+i*.025,.409]],.60,-.03,'edge');
    latheX([[1.82,.362],[1.84,.385],[1.90,.385],[1.92,.33]],.60,-.03,'silver');
    discX(1.925,.60,-.03,.321,'black');discX(1.932,.60,-.03,.265,'glass');
    discX(1.937,.60,-.03,.20,'highlight');discX(1.942,.60,-.03,.118,'pale');
    // The light volume is actual 3D geometry, not a fixed screen-space triangle.
    for(let i=0;i<12;i++) {
      const a=TAU*i/12,b=TAU*(i+1)/12;
      face([[1.95,.60+.25*Math.sin(a),-.03+.25*Math.cos(a)],[3.57,.60+.83*Math.sin(a),-.03+.83*Math.cos(a)],
        [3.57,.60+.83*Math.sin(b),-.03+.83*Math.cos(b)],[1.95,.60+.25*Math.sin(b),-.03+.25*Math.cos(b)]],'beam','beam','beam');
    }
    return faces;
  }

  function projectorPose(clock=0,pointer={x:0,y:0}) {
    const time=Number.isFinite(clock)?clock:0;
    return {clock:time,pitch:-.15+clamp(pointer.y||0,-1,1)*.045,
      yaw:-.48+Math.sin(time*.28)*.035+clamp(pointer.x||0,-1,1)*.09,roll:-.025};
  }
  function projectProjector(geometry,pose,width,height) {
    if(!(width>0&&height>0))return {faces:[],bounds:null,parts:{}};
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    const transformed=geometry.map(face=>{
      const pivot=pivots[face.component];
      const vertices=face.vertices.map(vertex=>{
        let local=vertex;
        if(pivot)local=rotate(subtract(vertex,pivot),0,0,pose.clock*(face.component==='reelA'?.36:-.28)).map((value,i)=>value+pivot[i]);
        return rotate(local,pose.pitch,pose.yaw,pose.roll);
      });
      const points=vertices.map(([x,y,z])=>{
        const p=10/(10-z),point={x:x*p,y:y*p,z};
        minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);
        return point;
      });
      return {...face,vertices:points,normal:normal(vertices),depth:vertices.reduce((sum,p)=>sum+p[2],0)/vertices.length};
    });
    const padding=Math.max(12,Math.min(width,height)*.075);
    const scale=Math.max(.001,Math.min((width-padding*2)/(maxX-minX),(height-padding*2)/(maxY-minY)));
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2,parts={};
    for(const face of transformed) {
      face.vertices=face.vertices.map(p=>({x:width/2+(p.x-cx)*scale,y:height/2+(p.y-cy)*scale,z:p.z}));
      const bounds=parts[face.part]||(parts[face.part]={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity});
      for(const p of face.vertices){bounds.minX=Math.min(bounds.minX,p.x);bounds.maxX=Math.max(bounds.maxX,p.x);bounds.minY=Math.min(bounds.minY,p.y);bounds.maxY=Math.max(bounds.maxY,p.y);}
    }
    transformed.sort((a,b)=>a.depth-b.depth);
    return {faces:transformed,scale,parts,bounds:{minX:width/2+(minX-cx)*scale,maxX:width/2+(maxX-cx)*scale,minY:height/2+(minY-cy)*scale,maxY:height/2+(maxY-cy)*scale}};
  }

  if(typeof module==='object'&&module.exports)module.exports={buildProjector,projectorPose,projectProjector};
  if(typeof window==='undefined'||typeof document==='undefined')return;
  const canvas=document.getElementById('projectorCanvas');
  const container=document.getElementById('projectorStudy');
  if(!canvas||!container||typeof canvas.getContext!=='function'||container.dataset.projectorReady==='true')return;
  let ctx;
  try{ctx=canvas.getContext('2d',{alpha:true});}catch{return;}
  if(!ctx)return;
  const pause=document.getElementById('projectorPause'),light=document.getElementById('projectorLight'),value=document.getElementById('projectorLightValue');
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse=window.matchMedia('(pointer: coarse)').matches;
  let language=document.documentElement.lang==='en'?'en':'es';
  let width=0,height=0,geometry=[],compact=false,ready=false,visible=true,paused=preference.matches,manualPlay=false,frame=0,lastTime=0,clock=0;
  let intensity=.7,pointer={x:0,y:0},target={x:0,y:0};
  const words={
    es:{pause:'Pausar modelo',resume:'Reanudar modelo',animate:'Animar modelo',pauseFull:'Pausar proyector 3D',resumeFull:'Reanudar proyector 3D',light:'Intensidad de la luz'},
    en:{pause:'Pause model',resume:'Resume model',animate:'Animate model',pauseFull:'Pause 3D projector',resumeFull:'Resume 3D projector',light:'Light intensity'}
  };
  function controls(){
    const copy=words[language];
    if(pause){
      const label=pause.querySelector('[data-projector-label]');
      if(label)label.textContent=paused?(preference.matches?copy.animate:copy.resume):copy.pause;
      pause.setAttribute('aria-label',paused?(preference.matches?copy.animate:copy.resumeFull):copy.pauseFull);
      pause.setAttribute('aria-pressed',String(paused));
    }
    if(light){light.setAttribute('aria-label',copy.light);light.setAttribute('aria-valuetext',Math.round(intensity*100)+'%');}
    if(value)value.textContent=Math.round(intensity*100)+'%';
  }
  function color(material,n){
    const base=palette[material]||palette.body;
    const diffuse=clamp(dot(n,[-.34,-.52,.78])),shine=Math.pow(clamp(dot(n,[.17,-.29,.94])),20);
    const metallic=['silver','edge','body','pale'].includes(material);
    return `rgb(${base.map(channel=>Math.round(clamp(channel*(.48+diffuse*.63)+shine*(metallic?85:12),0,255))).join(',')})`;
  }
  function render(){
    if(!width||!height)return false;
    const model=projectProjector(geometry,projectorPose(clock,pointer),width,height);
    ctx.clearRect(0,0,width,height);ctx.lineJoin='round';
    // Transparent faces are behind the machine and fade with the real light control.
    if(intensity>0)for(const face of model.faces)if(face.part==='beam'){
      ctx.beginPath();ctx.moveTo(face.vertices[0].x,face.vertices[0].y);
      for(let i=1;i<face.vertices.length;i++)ctx.lineTo(face.vertices[i].x,face.vertices[i].y);
      ctx.closePath();
      const near={x:(face.vertices[0].x+face.vertices[3].x)/2,y:(face.vertices[0].y+face.vertices[3].y)/2};
      const far={x:(face.vertices[1].x+face.vertices[2].x)/2,y:(face.vertices[1].y+face.vertices[2].y)/2};
      const beam=ctx.createLinearGradient(near.x,near.y,far.x,far.y);
      beam.addColorStop(0,`rgba(206,230,255,${(intensity*.16).toFixed(4)})`);
      beam.addColorStop(.58,`rgba(188,215,255,${(intensity*.055).toFixed(4)})`);
      beam.addColorStop(1,'rgba(188,215,255,0)');
      ctx.fillStyle=beam;ctx.fill();
    }
    for(const face of model.faces){
      if(face.part==='beam'||face.normal[2]<-.01)continue;
      ctx.beginPath();ctx.moveTo(face.vertices[0].x,face.vertices[0].y);
      for(let i=1;i<face.vertices.length;i++)ctx.lineTo(face.vertices[i].x,face.vertices[i].y);
      ctx.closePath();
      ctx.fillStyle=face.part==='lens'&&['highlight','pale'].includes(face.material)
        ?`rgb(${[128,169,202].map((v,i)=>Math.round(v+(255-v)*intensity*(i===0?.85:1))).join(',')})`:color(face.material,face.normal);
      ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.36;ctx.stroke();
    }
    return model.faces.length>0;
  }
  function fail(){
    ready=false;container.classList.remove('scene-ready');
    if(pause)pause.hidden=true;if(light)light.disabled=true;
    if(frame)window.cancelAnimationFrame(frame);frame=0;lastTime=0;
  }
  function draw(){try{return render();}catch{fail();return false;}}
  const canAnimate=()=>ready&&width>0&&height>0&&visible&&!document.hidden&&!paused&&(!preference.matches||manualPlay);
  function animate(now){
    frame=0;if(!canAnimate()){lastTime=0;return;}
    const elapsed=lastTime?Math.min(.08,(now-lastTime)/1000):0;
    if(!lastTime||elapsed>=.031){
      lastTime=now;clock+=elapsed*(preference.matches?.45:1);
      const ease=Math.min(1,elapsed*5);pointer.x+=(target.x-pointer.x)*ease;pointer.y+=(target.y-pointer.y)*ease;
      if(!draw())return;
    }
    frame=window.requestAnimationFrame(animate);
  }
  function synchronize(){
    if(canAnimate()&&!frame)frame=window.requestAnimationFrame(animate);
    else if(!canAnimate()&&frame){window.cancelAnimationFrame(frame);frame=0;lastTime=0;}
  }
  function resize(){
    const rect=canvas.getBoundingClientRect(),nextWidth=Math.round(rect.width),nextHeight=Math.round(rect.height);
    if(!nextWidth||!nextHeight){width=height=0;fail();return;}
    if(nextWidth===width&&nextHeight===height&&ready)return;
    if(!width||!height)visible=rect.top<(window.innerHeight||768)&&(rect.bottom??rect.top+rect.height)>0;
    width=nextWidth;height=nextHeight;
    const nextCompact=coarse||width<480;
    if(!geometry.length||nextCompact!==compact){compact=nextCompact;geometry=buildProjector(compact);}
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    if(draw()){
      ready=true;container.dataset.projectorReady='true';container.classList.add('scene-ready');
      if(pause)pause.hidden=false;if(light)light.disabled=false;
    }
    synchronize();
  }
  pause?.addEventListener('click',()=>{paused=!paused;if(preference.matches)manualPlay=!paused;controls();synchronize();});
  light?.addEventListener('input',()=>{
    const requested=Number(light.value);if(!Number.isFinite(requested))return;
    intensity=clamp(requested/100);controls();if(ready)draw();
  });
  document.addEventListener('skitoji:language',event=>{
    const requested=typeof event.detail==='string'?event.detail:event.detail?.language;
    language=requested==='en'?'en':'es';controls();
  });
  const changed=()=>{pointer={x:0,y:0};target={x:0,y:0};if(preference.matches){paused=true;manualPlay=false;}controls();if(ready)draw();synchronize();};
  if(preference.addEventListener)preference.addEventListener('change',changed);else if(preference.addListener)preference.addListener(changed);
  if(!coarse){
    container.addEventListener('pointermove',event=>{
      if(paused||preference.matches||!width||!height)return;
      const rect=canvas.getBoundingClientRect();target={x:clamp((event.clientX-rect.left)/width*2-1,-1,1),y:clamp((event.clientY-rect.top)/height*2-1,-1,1)};
    });
    container.addEventListener('pointerleave',()=>{target={x:0,y:0};});
  }
  document.addEventListener('visibilitychange',synchronize);
  if('IntersectionObserver'in window)new window.IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.target===container){visible=entry.isIntersecting;synchronize();}
  },{threshold:0}).observe(container);
  else window.addEventListener('scroll',()=>{
    const rect=canvas.getBoundingClientRect();visible=rect.top<(window.innerHeight||768)&&(rect.bottom??rect.top+rect.height)>0;synchronize();
  },{passive:true});
  if('ResizeObserver'in window)new window.ResizeObserver(resize).observe(canvas);
  window.addEventListener('resize',resize,{passive:true});
  controls();resize();
})();
