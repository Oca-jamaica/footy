function mk(team,i,st,kit,kx,ky,keeper=false){return{team,i,st,kit,kx,ky,keeper,x:kx,y:ky,vx:0,vy:0,dir:team?Math.PI:0,stun:0,stam:100,tackleCd:0,skillCd:0,spCd:0,anim:null,animT:0,animMax:1,rot:0,jump:0,arms:0,flip:1,lunge:0,slide:false,turbo:0,hold:0,react:0,dec:0,sprint:false,recvT:-99,track:false,burstT:-99,burstNear:false,slideCd:0,aiSlide:0,inter:false}}
const KIT=()=>{if(NET.guest){const p=players.find(q=>q.team===0&&!q.keeper);if(p)return p.kit}return mode==='club'?club.kit:C.coral};
const TEAMNAME=()=>mode==='club'?(club.name||'My Club').toUpperCase():'SUNDAY XI';
const OPPNAMES=['BAKER','MORALES','DIXON','OKONJO','FERRIS','LUND','PEREIRA','HOLT','VIDAL','ADEBAYO','KOWALSKI','REYES','NAKAMURA','O’NEILL','SANTOS','BRANDT','MBEKI','COSTA','HUGHES','DUARTE','PETERS','IBRAHIM','LINDQVIST','MARSH'];
let oppSeed=0;
function setup(){oppSeed=(Math.random()*OPPNAMES.length)|0;
  const o={pace:.7,shot:.72,fin:.6,skill:.55,pass:.65,tackle:.6,str:.6,sk:'roulette',sp:'curler'},gk={pace:.5,shot:.6,fin:.6,skill:.3,pass:.65,tackle:.5,str:.8,sk:'shield',sp:'turbo'};
  const q=sq(),slots=FORMS[q.f],n=slots.length;if(q.s.filter(Boolean).length<n){const keep=q.s.slice();autoPick(q);keep.forEach((id,i)=>{if(id&&!q.s.includes(id))q.s[i]=id})}
  const chem=NET.on?0:chemOf(q)*.0002;
  const mine=q.s.map((id,i)=>{let p=byId(id)||STARTERS[i%3];p=playStats(p);if(chem){p={...p};for(const [k] of STATK)p[k]=Math.min(.99,p[k]+chem)}const f=posFit(natPos(p),slots[i].r);
    if(f>=1)return p;const c={...p};for(const [k] of STATK)c[k]=p[k]*f;return c});
  const avg={};for(const [k] of STATK)avg[k]=clamp(mine.reduce((a,p)=>a+p[k],0)/mine.length+OPP.off,.3,.99);Object.assign(o,avg);// opponents get stronger each round
  const keys=FORM_KEYS[PITCH!=='volta'?'classical':'volta'],oppF=OPP.form&&keys.includes(OPP.form)?OPP.form:pick(keys),oslots=FORMS[oppF];
  const looks=[['#a8724f','#1f1a17'],['#e9b98f','#6b4426'],['#7a4b30','#111'],['#f2cfae','#c9a15b'],['#5e3a24','#111'],['#e8b88c','#b5562b'],['#c68d63','#2a1d17'],['#f2cfae','#e8e2d6']];
  const LOOKS=[['short',0,0,1.02],['buzz',0,1,1],['curly',0,0,.97],['quiff',0,0,1.04],['afro',0,1,.98],['bald',0,0,1.05],['bun',0,0,1.01],['mohawk','#e8cf7a',0,.99]];
  const NUMS=n>4?[2,5,4,6,8,7,11,9]:[4,8,10,9];
  players=[];
  mine.forEach((st,i)=>{const p=mk(0,i,st,KIT(),0,0);p.slot=slots[i];p.role=q.att===i?'att':q.cap===i?'cap':null;players.push(p)});
  players.push(mk(0,n,{...gk,...keeperStats(0),short:'GK',num:1,skin:'#c98f63',hair:'#3b2a22'},C.mint,FX0+16,MY,true));
  if(NET.host&&netGuest)netGuestTeam();
  else if(OPP.club!=null&&comp==='tour'){
    const cards=CLUBS[OPP.club][3].map(byId),ord={DEF:0,MID:1,ATT:2};cards.sort((a,b)=>ord[natPos(a)]-ord[natPos(b)]);
    const by={DEF:[],MID:[],ATT:[]};cards.forEach(c=>by[natPos(c)].push(c));const ys=n=>n===1?[.5]:n===2?[.3,.7]:n===3?[.2,.5,.8]:[.15,.38,.62,.85],X={DEF:.2,MID:.38,ATT:.58};
    let i=0;for(const r of ['DEF','MID','ATT'])by[r].forEach((c,k)=>{const p=mk(1,n+1+i,{...c,id:c.id+'_opp'},OPP.kit,0,0);p.st.look=c.look;p.slot={r,x:X[r],y:ys(by[r].length)[k]};players.push(p);i++});
  }else{
  const OSK=['stepover','elastico','burst','dragback','fakeshot','roulette','shield'],OSP=['rocket','through','knuckle','lob','turbo','slide','curler'],sh=(oppSeed*3)%7;
  // league and championship sides have a real strength of their own; the others are pitched against your team's average
  const SHP={DEF:['cb','fb','ballcb','wingback'],MID:['b2b','playmaker','destroyer'],ATT:['finisher','speed','dribbler','power']};
  oslots.forEach((sl,i)=>{let st={...o};if(OPP.str!=null){const r=Math.round(clamp(OPP.str*100+rnd(-4,4),35,98)),v=statsFor(r,pick(SHP[sl.r]));STATK.forEach(([k],j)=>st[k]=v[j])}
    const p=mk(1,n+1+i,{...st,sk:OSK[(sh+i*2)%7],sp:sl.r==='DEF'?pick(['slide','lob','turbo']):OSP[(sh+i*3)%7],look:LOOKS[(i+oppSeed)%LOOKS.length],num:NUMS[i],short:OPPNAMES[(oppSeed+i*7)%OPPNAMES.length],name:OPPNAMES[(oppSeed+i*7)%OPPNAMES.length],skin:looks[(i+oppSeed)%looks.length][0],hair:looks[(i+oppSeed)%looks.length][1]},OPP.kit,0,0);p.slot=sl;players.push(p)})}
  // Hard: every opponent is genuinely better than their card
  if(LV().boost&&!NET.on)for(const p of players)if(p.team===1){p.st={...p.st};for(const [k] of STATK)p.st[k]=Math.min(.99,(+p.st[k]||.6)+LV().boost)}
  players.push(mk(1,2*n+1,{...gk,...keeperStats(1),num:1,skin:'#f2c9a0',hair:'#d9a441'},C.sun,FX1-16,MY,true));
}
setup();
/* ---------- camera + projection ---------- */
// Broadcast camera sits high above the near touchline looking across the pitch, so the far side shrinks into the distance.
const BROAD={x:MIDX,y:FY1,dist:1193,f:1684,h:1319,hor:-1140};// ~30% closer than before
let HOR_TOP=72-BROAD.h*BROAD.f/(BROAD.dist+BROAD.y-FY0),HOR_BOT=(H-50)-BROAD.h*BROAD.f/(BROAD.dist+BROAD.y-FY1);
let camHor=BROAD.hor,camTX=MIDX,camTH=BROAD.hor;
let camFollow=MIDX;const followX=x=>clamp(x,FX0+330,FX1-330);
let cam={...BROAD},camK=0,celebCut=false;
function P(x,y,z=0){const D=Math.max(30,cam.dist+(cam.y-y)),s=cam.f/D;return{x:W/2+(x-cam.x)*s,y:cam.hor+(cam.h-z)*s,s}}
function lerpCam(a,b,k){const o={};for(const key in a)o[key]=a[key]+(b[key]-a[key])*k;return o}
const PENCAM={x:FX1-170,y:MY+200,dist:520,f:900,h:420,hor:-165};
const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
let celebTgt=null;
function updateCam(dt){
  if(![camFollow,camTX,camHor,camTH,cam.x,cam.hor].every(Number.isFinite)){camFollow=camTX=MIDX;camHor=camTH=BROAD.hor;cam={...BROAD}}
  if(state==='goal'&&scorer&&stT>34){
    if(!celebCut){celebCut=true;camK=0;parts=[];flash=RM?0:.35;S.swoosh();
      celebTgt={x:scorer.x-20,y:scorer.y+10,dist:250,f:690,h:150,hor:28}}
    // the stadium camera tracks the scorer from the touchline
    celebTgt.x+=(clamp(scorer.x-20,FX0+60,FX1-20)-celebTgt.x)*Math.min(1,.06*dt);
    celebTgt.y+=(scorer.y+10-celebTgt.y)*Math.min(1,.06*dt);
    celebTgt.dist+=(215-celebTgt.dist)*.004*dt;
    camK=Math.min(1,camK+(RM?1:.075)*dt);cam=lerpCam({...BROAD,x:camFollow,hor:camHor},celebTgt,ease(camK));
  }else{celebCut=false;camK=0;
    // two smoothing stages, so the camera eases in and out of every move instead of jerking when the ball is kicked
    const fx=state==='pens'?FX1-200:followX(B.owner?B.x+(B.owner.team===0?55:-55):B.x+B.vx*8);
    const fy=B.owner?B.owner.y:B.y+B.vy*6,th=HOR_TOP+(HOR_BOT-HOR_TOP)*clamp((fy-FY0-60)/(FY1-FY0-120),0,1);
    if(state==='pens'){camFollow+=(fx-camFollow)*Math.min(1,.2*dt);camTX=camFollow}
    else{camTX+=(fx-camTX)*Math.min(1,.09*dt);camFollow+=(camTX-camFollow)*Math.min(1,.09*dt);camTH+=(th-camTH)*Math.min(1,.06*dt);camHor+=(camTH-camHor)*Math.min(1,.08*dt)}
    cam=state==='pens'?{...PENCAM}:{...BROAD,x:camFollow,hor:camHor}}
}
function wpath(pts,close){ctx.beginPath();pts.forEach((p,i)=>{const q=P(p[0],p[1],p[2]||0);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});if(close)ctx.closePath()}
function wcircle(cx,cy,r,a0=0,a1=6.2832,n=40,z=0){const pts=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r,z])}return pts}
function wline(pts,lw,col,close=false){wpath(pts,close);const m=P(pts[0][0],pts[0][1]);ctx.lineWidth=Math.max(1,lw*m.s);ctx.strokeStyle=col;ctx.stroke()}

/* ---------- stadium ---------- */
const crowd=[],CSKIN=['#f2cfae','#e8b88c','#c68d63','#8d5a3b','#5e3a24'],CLOTH=['#23272f','#2f3540','#3d4452','#555c68','#7a808a','#c9c4b8','#e8e4da','#3a2a24','#20304a','#4a2f2f'];
const crowdCol=c=>c.c==='H'?KIT():c.c==='A'?OPP.kit:CLOTH[c.c];
function buildCrowd(){crowd.length=0;const R=10,st=typeof cosOn==='function'?cosOn('stad'):'stad1',dens=Math.max(st==='stad3'?1:st==='stad2'?.85:.6,[.6,.7,.8,.9,1][depLv('stad')-1]),keep=()=>Math.random()<dens;
 for(let r=0;r<R;r++)for(let x=FX0-120;x<=FX1+120;x+=11)if(keep())crowd.push({x:x+rnd(-2,2),y:FY0-36-r*13,z:8+r*11,c:Math.random()<.32?(x<MIDX?'H':'A'):(Math.random()*CLOTH.length)|0,ph:rnd(0,6),sk:(Math.random()*5)|0});
 for(const side of [0,1])for(let r=0;r<R;r++)for(let y=FY0-20;y<=FY1+70;y+=11)if(keep())crowd.push({x:side?FX1+50+r*13:FX0-50-r*13,y:y+rnd(-2,2),z:8+r*11,c:Math.random()<.55?(side?'A':'H'):(Math.random()*CLOTH.length)|0,ph:rnd(0,6),sk:(Math.random()*5)|0})}
buildCrowd();
const clouds=[{x:100,y:200,r:180},{x:600,y:450,r:220},{x:900,y:150,r:160}];
// small cached textures: grass grain and the vignette
let grainPat=null,vigCv=null,vigOn=null;
function makeGrain(){const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');
  for(let i=0;i<1400;i++){const l=Math.random();g.fillStyle=l<.5?`rgba(10,40,10,${.05+Math.random()*.09})`:`rgba(220,255,200,${.03+Math.random()*.06})`;g.fillRect(Math.random()*96,Math.random()*96,1+Math.random()*1.5,1+Math.random()*2.5)}
  return ctx.createPattern(c,'repeat')}
function vignette(){if(!vigCv){vigCv=document.createElement('canvas');vigCv.width=W;vigCv.height=H;const g=vigCv.getContext('2d'),rg=g.createRadialGradient(W/2,H*.52,H*.35,W/2,H*.52,W*.72);
    rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(.7,'rgba(0,0,0,.14)');rg.addColorStop(1,'rgba(0,0,0,.42)');g.fillStyle=rg;g.fillRect(0,0,W,H)}
  ctx.drawImage(vigCv,0,0,W,H)}
function lightBank(x,y,z,w){const c=P(x,y,z),sw=w*c.s;
  const rg=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,sw*2.6);rg.addColorStop(0,'rgba(255,252,235,.55)');rg.addColorStop(.25,'rgba(255,248,220,.18)');rg.addColorStop(1,'rgba(255,248,220,0)');
  ctx.fillStyle=rg;ctx.fillRect(c.x-sw*2.6,c.y-sw*2.6,sw*5.2,sw*5.2);
  ctx.fillStyle='#1a1f26';ctx.fillRect(c.x-sw/2-2,c.y-sw*.16-2,sw+4,sw*.32+4);
  ctx.fillStyle='#fffdf2';const n=6,cw=sw/n;for(let i=0;i<n;i++)for(let j=0;j<2;j++)ctx.fillRect(c.x-sw/2+i*cw+cw*.12,c.y-sw*.16+j*sw*.16+cw*.06,cw*.76,sw*.16-cw*.12)}
let skyCv=null;
function drawSky(){if(!skyCv){skyCv=document.createElement('canvas');skyCv.width=W;skyCv.height=H;const kc=ctx,keep=cam;ctx=skyCv.getContext('2d');cam={...BROAD,x:MIDX};try{drawSkyLive()}finally{ctx=kc;cam=keep}}ctx.drawImage(skyCv,0,0,W,H)}
function drawSkyLive(){
  const g=ctx.createLinearGradient(0,0,0,H*.6);g.addColorStop(0,'#05080f');g.addColorStop(.6,'#0e1a2b');g.addColorStop(1,'#1d2d3c');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // the glow the floodlights throw into the night air
  const top=P(MIDX,FY0-170,170),hz=ctx.createRadialGradient(top.x,top.y,10,top.x,top.y,W*.7);hz.addColorStop(0,`rgba(190,210,230,${.22+.03*(depLv('stad')-1)})`);hz.addColorStop(1,'rgba(190,210,230,0)');ctx.fillStyle=hz;ctx.fillRect(0,0,W,H);
}
function drawStandsW(){
  const top=FY0-36-10*13,tz=8+10*11;
  // far stand: lit concrete tiers under a dark roof
  {const a=P(MIDX,FY0-26,0),b=P(MIDX,top,tz),g=ctx.createLinearGradient(0,a.y,0,b.y);g.addColorStop(0,'#3a4250');g.addColorStop(1,'#1b2028');
   ctx.fillStyle=g;wpath([[FX0-140,FY0-26,0],[FX1+140,FY0-26,0],[FX1+140,top,tz],[FX0-140,top,tz]],true);ctx.fill();
   ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=1;for(let r=0;r<=10;r++){wpath([[FX0-140,FY0-30-r*13,4+r*11],[FX1+140,FY0-30-r*13,4+r*11]]);ctx.stroke()}}
  ctx.fillStyle='#0b0e13';wpath([[FX0-160,top,tz],[FX1+160,top,tz],[FX1+160,top-24,tz+46],[FX0-160,top-24,tz+46]],true);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.07)';wpath([[FX0-160,top,tz],[FX1+160,top,tz],[FX1+160,top-2,tz+5],[FX0-160,top-2,tz+5]],true);ctx.fill();
  for(const side of [0,1]){const s=side?1:-1,ex=side?FX1+44:FX0-44,bx=ex+s*140,a=P(ex,MY,0),b=P(bx,MY,tz),g=ctx.createLinearGradient(a.x,0,b.x,0);
    g.addColorStop(0,'#3a4250');g.addColorStop(1,'#181c23');ctx.fillStyle=g;wpath([[ex,FY0-26,0],[ex,FY1+90,0],[bx,FY1+90,tz],[bx,FY0-26,tz]],true);ctx.fill();
    ctx.fillStyle='#0b0e13';wpath([[bx,FY0-26,tz],[bx,FY1+90,tz],[bx+s*30,FY1+90,tz+40],[bx+s*30,FY0-26,tz+40]],true);ctx.fill()}
  const party=state==='goal'||(state==='fulltime'&&score[0]>score[1]);
  const byCol={};
  for(const c of crowd){const q=P(c.x,c.y,c.z+(party?Math.abs(Math.sin(t*.25+c.ph))*5:Math.sin(t*.03+c.ph)*.8));q.sk=c.sk;if(q.x<-10-cullM||q.x>W+10+cullM||q.y<-10||q.y>H+10)continue;const col=crowdCol(c);(byCol[col]||(byCol[col]=[])).push(q)}
  const close=cam.f/cam.dist>1.5,heads={};
  ctx.globalAlpha=.92;
  for(const col in byCol){ctx.fillStyle=col;ctx.beginPath();for(const q of byCol[col]){const r=Math.max(1.1,3.5*q.s);
    ctx.moveTo(q.x+r,q.y+r*.9);ctx.ellipse(q.x,q.y+r*.9,r,r*1.15,0,0,6.2832);(heads[q.sk]||(heads[q.sk]=[])).push(q)}ctx.fill()}
  // every fan gets a head, so the stands read as people rather than dots
  for(const sk in heads){ctx.fillStyle=CSKIN[sk];ctx.beginPath();for(const q of heads[sk]){const r=Math.max(.9,3.5*q.s)*.6;ctx.moveTo(q.x+r,q.y-r*.7);ctx.arc(q.x,q.y-r*.7,r,0,6.2832)}ctx.fill()}
  ctx.globalAlpha=1;
  if(party){ctx.fillStyle='#fff';for(let i=0;i<22;i++){const c=crowd[(Math.random()*crowd.length)|0],q=P(c.x,c.y,c.z+4);ctx.globalAlpha=.6+Math.random()*.4;ctx.beginPath();ctx.arc(q.x,q.y,2.2*q.s,0,7);ctx.fill()}ctx.globalAlpha=1}
  // floodlight banks on the roof
  {const sl=depLv('stad'),xs=[FX0-60,FX0+300,FX1-300,FX1+60];if(sl>=3)xs.push(MIDX-150,MIDX+150);if(sl>=5)xs.push(MIDX);for(const x of xs)lightBank(x,top-10,tz+52,46+(sl-1)*3)}
}
const BOARDS=['#ff6f59','#ffd166','#8e8ff0','#7fe0b4'];
function drawBoards(){
  // LED advertising boards: dark frame, glowing panel, scrolling text
  const segs=[];for(let x=FX0-40;x<FX1+40;x+=82)segs.push([x,Math.min(x+80,FX1+40)]);
  const ph=Math.floor(t/240)%2;
  segs.forEach(([x0,x1],i)=>{
    ctx.fillStyle='#0d1117';wpath([[x0,FY0-18,0],[x1,FY0-18,0],[x1,FY0-18,13],[x0,FY0-18,13]],true);ctx.fill();
    const bd=cosOn('boards'),BC=bd==='boards_gold'?['#d4af37','#f6e27a','#b8902b','#ffe9a3']:bd==='boards_club'?[club.kit,'#fff6e4',club.kit,'#ffd166']:BOARDS;
    const c=BC[(i+ph)%4];ctx.fillStyle=c;ctx.globalAlpha=.9;wpath([[x0+1,FY0-18,1.5],[x1-1,FY0-18,1.5],[x1-1,FY0-18,11.5],[x0+1,FY0-18,11.5]],true);ctx.fill();ctx.globalAlpha=1;
    const m=P((x0+x1)/2,FY0-18,6.5);if(m.s>.5){ctx.fillStyle='#0d1117';ctx.font=`italic 800 ${Math.round(8*m.s)}px "Barlow Condensed","Arial Narrow",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';const nm=(club.name||'MY CLUB').toUpperCase().slice(0,14);ctx.fillText(bd==='boards_gold'?((i+ph)%2?'WORLD CHAMPIONS':nm):bd==='boards_club'?((i+ph)%2?'KICKABOUT':nm):((i+ph)%2?'KICKABOUT':'SUNDAY LEAGUE'),m.x,m.y)}});
}
function drawPitchLive(){
  // run-off grass
  ctx.fillStyle='#2f6e33';wpath([[FX0-44,FY0-26],[FX1+44,FY0-26],[FX1+44,FY1+120],[FX0-44,FY1+120]],true);ctx.fill();
  // mown stripes, with a faint cross-cut
  const n=Math.round((FX1-FX0)/82),w=(FX1-FX0)/n,pat=cosOn('pitch');
  if(pat==='pitch_checks'){const m2=Math.round((FY1-FY0)/80),h2=(FY1-FY0)/m2;for(let i=0;i<n;i++)for(let j=0;j<m2;j++){ctx.fillStyle=(i+j)%2?'#4f9e48':'#45903f';wpath([[FX0+i*w,FY0+j*h2],[FX0+(i+1)*w+.5,FY0+j*h2],[FX0+(i+1)*w+.5,FY0+(j+1)*h2+.5],[FX0+i*w,FY0+(j+1)*h2+.5]],true);ctx.fill()}}
  else if(pat==='pitch_diag'){ctx.fillStyle='#45903f';wpath([[FX0,FY0],[FX1,FY0],[FX1,FY1],[FX0,FY1]],true);ctx.fill();ctx.save();wpath([[FX0,FY0],[FX1,FY0],[FX1,FY1],[FX0,FY1]],true);ctx.clip();ctx.fillStyle='#4f9e48';
    const H2=FY1-FY0;for(let x=FX0-H2;x<FX1;x+=2*w){wpath([[x,FY0],[x+w,FY0],[x+w+H2,FY1],[x+H2,FY1]],true);ctx.fill()}ctx.restore()}
  else for(let i=0;i<n;i++){ctx.fillStyle=i%2?'#4f9e48':'#45903f';wpath([[FX0+i*w,FY0],[FX0+(i+1)*w+.5,FY0],[FX0+(i+1)*w+.5,FY1],[FX0+i*w,FY1]],true);ctx.fill()}
  const m=5,h=(FY1-FY0)/m;ctx.fillStyle='rgba(255,255,255,.035)';for(let j=0;j<m;j+=2){wpath([[FX0,FY0+j*h],[FX1,FY0+j*h],[FX1,FY0+(j+1)*h],[FX0,FY0+(j+1)*h]],true);ctx.fill()}
  // grass grain, pinned to the pitch as the camera pans
  if(!grainPat)grainPat=makeGrain();
  if(grainPat){const c=P(MIDX,MY);try{grainPat.setTransform(new DOMMatrix([c.s*.9,0,0,c.s*.6,c.x,c.y]))}catch(e){}ctx.fillStyle=grainPat;wpath([[FX0-44,FY0-26],[FX1+44,FY0-26],[FX1+44,FY1+120],[FX0-44,FY1+120]],true);ctx.fill()}
  // worn goalmouths
  for(const gx of [FX0+30,FX1-30]){const c=P(gx,MY),rg=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,70*c.s);rg.addColorStop(0,'rgba(150,140,80,.28)');rg.addColorStop(1,'rgba(150,140,80,0)');
    ctx.save();ctx.translate(c.x,c.y);ctx.scale(1,.45);ctx.translate(-c.x,-c.y);ctx.fillStyle=rg;ctx.beginPath();ctx.arc(c.x,c.y,70*c.s,0,7);ctx.fill();ctx.restore()}
  // floodlit: the far side sits darker, the middle of the pitch gets the most light
  const a=P(MIDX,FY0),b=P(MIDX,FY1+80),g=ctx.createLinearGradient(0,a.y,0,b.y);g.addColorStop(0,'rgba(5,15,25,.38)');g.addColorStop(.45,'rgba(5,15,25,.06)');g.addColorStop(1,'rgba(5,15,25,.2)');
  ctx.fillStyle=g;wpath([[FX0-44,FY0-26],[FX1+44,FY0-26],[FX1+44,FY1+120],[FX0-44,FY1+120]],true);ctx.fill();
  {const c=P(MIDX,MY),rg=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,W*.55);rg.addColorStop(0,'rgba(255,250,225,.1)');rg.addColorStop(1,'rgba(255,250,225,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H)}
  const L='rgba(255,255,255,.88)';
  wline([[FX0,FY0],[FX1,FY0],[FX1,FY1],[FX0,FY1]],2,L,true);
  wline([[MIDX,FY0],[MIDX,FY1]],2,L);
  wline(wcircle(MIDX,MY,90),2,L);
  for(const side of [0,1]){const gx=side?FX1:FX0,s=side?-1:1;
    wline([[gx,MY-BOXH],[gx+s*BOX,MY-BOXH],[gx+s*BOX,MY+BOXH],[gx,MY+BOXH]],2,L);
    wline([[gx,MY-88],[gx+s*60,MY-88],[gx+s*60,MY+88],[gx,MY+88]],2,L);
    wline(side?wcircle(gx-SPOT,MY,75,Math.PI-.84,Math.PI+.84,20):wcircle(gx+SPOT,MY,75,-.84,.84,20),2,L);
    const sp=P(gx+s*SPOT,MY);ctx.fillStyle=L;ctx.beginPath();ctx.ellipse(sp.x,sp.y,2.6*sp.s,1.3*sp.s,0,0,7);ctx.fill()}
  const c=P(MIDX,MY);ctx.fillStyle=L;ctx.beginPath();ctx.ellipse(c.x,c.y,3*c.s,1.5*c.s,0,0,7);ctx.fill();
  for(const [x,y,a0] of [[FX0,FY0,0],[FX1,FY0,Math.PI/2],[FX1,FY1,Math.PI],[FX0,FY1,-Math.PI/2]])wline(wcircle(x,y,10,a0,a0+Math.PI/2,8),1.8,L);
  {const a=P(MIDX,FY0-18,0),b=P(MIDX,FY0+20,0),g=ctx.createLinearGradient(0,a.y,0,b.y);g.addColorStop(0,'rgba(255,240,200,.12)');g.addColorStop(1,'rgba(255,240,200,0)');ctx.fillStyle=g;wpath([[FX0-44,FY0-18],[FX1+44,FY0-18],[FX1+44,FY0+20],[FX0-44,FY0+20]],true);ctx.fill()}
}
// The pitch is flat, so a sideways camera pan just shears it: draw it once into a wide image and shear that every frame.
let pitchCv=null,cullM=0,PM=640;
const broadCam=()=>cam.f===BROAD.f&&cam.dist===BROAD.dist&&cam.h===BROAD.h&&cam.y===BROAD.y;let PV=260;
/* Two pitches: Volta is the tight 5-a-side cage, Classical is a proper 9-a-side field about 1.5x as long and 1.4x as wide,
   with bigger boxes and goals. The broadcast camera pulls back a touch so you still see enough of it. */
const PITCHES={volta:{w:1150,h:640,goal:62,box:175,boxh:165,spot:135,f:1684,pm:640},classical:{w:1720,h:900,goal:72,box:240,boxh:215,spot:150,f:1500,pm:800},
  // Classical Expanded: about 1.37x the standard pitch each way (same proportions), slightly bigger goal and boxes
  expanded:{w:2350,h:1200,goal:78,box:300,boxh:265,spot:165,f:1380,pm:1150}};
function setPitch(k){const d=PITCHES[k]||PITCHES.volta;if(PITCH===k&&FX1===175+d.w)return;PITCH=k;
  FX0=175;FX1=175+d.w;PSC=Math.max(1,d.w/1720);FY0=122;FY1=122+d.h;MIDX=(FX0+FX1)/2;MY=(FY0+FY1)/2;GY0=MY-d.goal;GY1=MY+d.goal;BOX=d.box;BOXH=d.boxh;SPOT=d.spot;
  BROAD.x=MIDX;BROAD.y=FY1;BROAD.f=d.f;
  HOR_TOP=72-BROAD.h*BROAD.f/(BROAD.dist+BROAD.y-FY0);HOR_BOT=(H-50)-BROAD.h*BROAD.f/(BROAD.dist+BROAD.y-FY1);BROAD.hor=HOR_TOP;
  PM=d.pm;PV=Math.max(260,Math.ceil(HOR_TOP-HOR_BOT+40));
  Object.assign(PENCAM,{x:FX1-170,y:MY+200});
  camFollow=camTX=MIDX;camHor=camTH=BROAD.hor;cam={...BROAD};pitchCv=null;skyCv=null;buildCrowd();
  Object.assign(B,{x:MIDX,y:MY,z:0,vx:0,vy:0,vz:0,owner:null})}
// Stands, crowd, boards and pitch are drawn once into a wide image. A sideways pan of the broadcast camera is (almost
// exactly) a shear of that image, so each frame just draws it once instead of thousands of fans and gradients.
// The stadium and pitch are drawn once into a few side-by-side tiles. One huge image (the Classical pitches need one
// about 5000 px wide) can fall off the graphics card and get re-uploaded every frame, which cost ~13 ms a frame;
// tiles of at most 2048 px each always stay on it, at full sharpness.
// Resolution of the cached stadium: full on Volta, 1.5x on the big Classical pitches (a full 2x copy of those is enough
// graphics memory to cause stutters), and lower again if adaptive quality kicks in on a slow machine.
let QLV=0;const cacheDPR=()=>Math.max(1,Math.min(DPR,PITCH==='volta'?2:1.5)-QLV*.25);
function buildPitchCache(){PERF.builds=(PERF.builds||0)+1;const DPR=cacheDPR(),full=W+2*PM,TW=Math.floor(2048/DPR),tiles=[];
  for(let u0=0;u0<full;u0+=TW){const w=Math.min(TW+2,full-u0),cv2=document.createElement('canvas');cv2.width=Math.ceil(w*DPR);cv2.height=Math.round((H+PV)*DPR);
    const c2=cv2.getContext('2d'),keep=cam,kc=ctx,kt=t;cam={...BROAD,x:MIDX};ctx=c2;t=0;cullM=PM;
    try{ctx.setTransform(DPR,0,0,DPR,(PM-u0)*DPR,0);
      {const g=ctx.createLinearGradient(0,0,0,H*.6);g.addColorStop(0,'#05080f');g.addColorStop(.6,'#0e1a2b');g.addColorStop(1,'#1d2d3c');ctx.fillStyle=g;ctx.fillRect(-PM,-10,W+2*PM,H+PV+10);
       const top=P(MIDX,FY0-170,170),hz=ctx.createRadialGradient(top.x,top.y,10,top.x,top.y,W*.7);hz.addColorStop(0,`rgba(190,210,230,${.22+.03*(depLv('stad')-1)})`);hz.addColorStop(1,'rgba(190,210,230,0)');ctx.fillStyle=hz;ctx.fillRect(-PM,-10,W+2*PM,H+PV+10)}
      drawStandsW();drawPitchLive();drawBoards()}finally{ctx=kc;cam=keep;t=kt;cullM=0}
    tiles.push({cv:cv2,u0,w})}
  return tiles}
function drawBackground(){
  const party=state==='goal'||(state==='fulltime'&&score[0]>score[1]);
  if(broadCam()&&!party){
    if(!pitchCv)pitchCv=buildPitchCache();
    const d=MIDX-cam.x,dy=cam.hor-BROAD.hor;ctx.save();ctx.translate(0,dy);ctx.transform(1,0,d/cam.h,1,-d*BROAD.hor/cam.h,0);
    for(const tl of pitchCv)ctx.drawImage(tl.cv,tl.u0-PM,0,tl.w,H+PV);ctx.restore()}
  else{PERF.live=(PERF.live||0)+1;drawStandsW();drawPitchLive();drawBoards()}
  for(const [x,y] of [[FX0,FY0],[FX1,FY0]]){const b=P(x,y),tp=P(x,y,26);ctx.strokeStyle='#f2f2f2';ctx.lineWidth=Math.max(1,1.4*b.s);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(tp.x,tp.y);ctx.stroke();
    ctx.fillStyle='#ffd23f';const f=P(x+(x<MIDX?11:-11),y,22+Math.sin(t*.1)*1.2);const l=P(x,y,17);ctx.beginPath();ctx.moveTo(tp.x,tp.y);ctx.lineTo(f.x,f.y);ctx.lineTo(l.x,l.y);ctx.fill()}
}
function goalBack(side){
  const gx=side?FX1:FX0,d=side?30:-30,ns=netShake[side],wob=ns>0?Math.sin(ns*.8)*ns*.25*(side?1:-1):0,gb=gx+d+wob,bh=BAR*.72;
  // the goal's shadow on the grass
  ctx.fillStyle='rgba(0,0,0,.18)';wpath([[gx,GY0+4],[gb+(side?6:-6),GY0+8],[gb+(side?6:-6),GY1+8],[gx,GY1+4]],true);ctx.fill();
  ctx.fillStyle='rgba(235,240,245,.1)';
  wpath([[gb,GY0,0],[gb,GY1,0],[gb,GY1,bh],[gb,GY0,bh]],true);ctx.fill();
  wpath([[gx,GY0,BAR],[gx,GY1,BAR],[gb,GY1,bh],[gb,GY0,bh]],true);ctx.fill();
  wpath([[gx,GY0,0],[gb,GY0,0],[gb,GY0,bh],[gx,GY0,BAR]],true);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.32)';const s0=P(gb,MY).s;ctx.lineWidth=Math.max(.5,.6*s0);
  for(let y=GY0;y<=GY1+.1;y+=6){wpath([[gb,y,0],[gb,y,bh],[gx,y,BAR]]);ctx.stroke()}
  for(let z=0;z<=bh;z+=4.5){wpath([[gx,GY0,z*BAR/bh],[gb,GY0,z],[gb,GY1,z]]);ctx.stroke()}
  wpath([[gx,GY1,0],[gb,GY1,0],[gb,GY1,bh],[gx,GY1,BAR]]);ctx.stroke();
  // far post and crossbar, round and lit from above
  const ps=P(gx,GY0).s;ctx.lineCap='round';
  ctx.strokeStyle='#b9c0c6';ctx.lineWidth=Math.max(2,3.6*ps);wpath([[gx,GY0,0],[gx,GY0,BAR],[gx,GY1,BAR]]);ctx.stroke();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=Math.max(1,1.8*ps);wpath([[gx,GY0,0],[gx,GY0,BAR+.4],[gx,GY1,BAR+.4]]);ctx.stroke();ctx.lineCap='butt';
}
function nearPost(side){const gx=side?FX1:FX0,ps=P(gx,GY1).s;ctx.lineCap='round';
  ctx.strokeStyle='#b9c0c6';ctx.lineWidth=Math.max(2,3.6*ps);wpath([[gx,GY1,0],[gx,GY1,BAR]]);ctx.stroke();
  ctx.strokeStyle='#fff';ctx.lineWidth=Math.max(1,1.8*ps);wpath([[gx,GY1,0],[gx,GY1,BAR]]);ctx.stroke();ctx.lineCap='butt';
  ctx.strokeStyle='rgba(255,255,255,.32)';ctx.lineWidth=Math.max(.5,.6*ps);
  for(let x=0;x<=30;x+=5){const xx=gx+(side?x:-x);wpath([[xx,GY1,0],[xx,GY1,BAR-(BAR*.28)*(x/30)]]);ctx.stroke()}
  for(let z=0;z<BAR;z+=4.5){wpath([[gx,GY1,z],[gx+(side?30:-30),GY1,z*.72]]);ctx.stroke()}}

/* ---------- players ---------- */
const LOOK={};
const lookOf=st=>st.look||LOOK[st.id]||['short',0,0,1];
function lighten(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;r=Math.round(r+(255-r)*amt);g=Math.round(g+(255-g)*amt);b=Math.round(b+(255-b)*amt);return `rgb(${r},${g},${b})`}
function limb(x1,y1,x2,y2,w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
// One figure in "body units": feet at 0, head centre at -44. The caller scales units to screen pixels.
function shade(hex,amt){if(!hex||hex[0]!=='#')return hex;const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=amt<0?0:255,k=Math.abs(amt);r=Math.round(r+(f-r)*k);g=Math.round(g+(f-g)*k);b=Math.round(b+(f-b)*k);return `rgb(${r},${g},${b})`}
function figure(o){
  const fx=o.fx,amp=clamp(o.run/2.6,0,1),ph=o.ph,legA=Math.sin(ph)*.55*amp,kit=o.kit,skin=o.skin,lk=o.look,hc=o.hair;
  ctx.lineCap='round';
  const hip=o.kneel?-12:-21,legL=o.kneel?12:21;
  const feet=[1,-1].map(sg=>{const a=sg*legA;return{x:Math.sin(a)*legL*fx,y:hip+Math.cos(a)*legL-(o.kneel?0:Math.max(0,Math.sin(ph+sg*1.57))*3*amp),back:sg<0}});
  const shoulder=-37+(o.kneel?9:0),sh=[-5.4,5.4];
  let hands;
  if(o.arms===1)hands=[[-8,shoulder-15],[8,shoulder-15]];
  else if(o.arms===2)hands=[[-3+fx*11,shoulder+4],[3+fx*11,shoulder+4]];
  else if(o.arms===3)hands=[[-18,shoulder-2],[18,shoulder-2]];
  else if(o.dive)hands=[[-14,shoulder-10],[14,shoulder-10]];
  else{const aa=-legA*1.15;hands=[[sh[0]+Math.sin(aa)*13*fx,shoulder+Math.cos(aa)*13],[sh[1]-Math.sin(aa)*13*fx,shoulder+Math.cos(aa)*13]]}
  const sock=o.socks,sockD=shade(sock,-.25),band=o.band||'#f4f4f4',boot=o.boot||'#15161b',skinD=shade(skin,-.18),kitD=shade(kit,-.28),kitL=shade(kit,.2);
  const OL='rgba(8,12,18,.62)';
  const drawLeg=(f,back)=>{const kx=f.x*.5+(back?-.4:.4)*fx,ky=(hip+f.y)/2;
    limb(back?-1.7:1.7,hip,kx,ky,5.6,OL);limb(kx,ky,f.x,f.y,4.8,OL);ctx.fillStyle=OL;ctx.beginPath();ctx.ellipse(f.x+fx*1.7,f.y-.8,4.3,2.5,0,0,7);ctx.fill();
    limb(back?-1.7:1.7,hip,kx,ky,4.5,back?skinD:skin);limb(kx,ky,f.x,f.y,3.6,back?sockD:sock);
    if(!back)limb((back?-1.7:1.7)+fx*.9,hip+1,kx+fx*.8,ky,1,shade(skin,.18));
    // sock band just under the knee
    const bx=kx+(f.x-kx)*.18,by=ky+(f.y-ky)*.18,ex=kx+(f.x-kx)*.32,ey=ky+(f.y-ky)*.32;limb(bx,by,ex,ey,4,band);
    ctx.fillStyle=boot;ctx.beginPath();ctx.ellipse(f.x+fx*1.7,f.y-.8,3.6,1.8,0,0,7);ctx.fill();
    ctx.fillStyle=o.bootMark||'#e9e9e9';ctx.fillRect(f.x+fx*.4-1.2,f.y-1.4,2.6,.8)};
  const drawArm=(i,back)=>{const s=[sh[i],shoulder],h=hands[i],mx=(s[0]+h[0])/2,my=(s[1]+h[1])/2;
    const ex=s[0]+(mx-s[0])*.75,ey=s[1]+(my-s[1])*.75;limb(s[0],s[1],ex,ey,4.6,OL);limb(ex,ey,h[0],h[1],3.9,OL);
    limb(s[0],s[1],ex,ey,3.6,back?kitD:kit);limb(s[0]+(mx-s[0])*.72,s[1]+(my-s[1])*.72,h[0],h[1],2.8,back?skinD:skin);
    ctx.lineCap='butt';limb(ex-(ex-s[0])*.1,ey-(ey-s[1])*.1,ex,ey,3.7,o.trim||kitD);ctx.lineCap='round';
    if(o.gloves){ctx.fillStyle=OL;ctx.beginPath();ctx.arc(h[0],h[1],3.1,0,7);ctx.fill();ctx.fillStyle=o.gloves;ctx.beginPath();ctx.arc(h[0],h[1],2.5,0,7);ctx.fill()}};
  const ty=o.kneel?9:0,hy=-47+ty;
  if(lk[0]==='afro'){ctx.save();ctx.translate(0,hy);ctx.scale(.8,.8);ctx.fillStyle=hc;ctx.beginPath();ctx.arc(0,-2,8.4,0,7);ctx.fill();ctx.restore()}
  if(lk[0]==='long'&&o.face<0){ctx.fillStyle=hc;ctx.fillRect(-5.2,hy-2,10.4,10)}
  drawLeg(feet[1],true);drawArm(fx>0?0:1,true);
  drawLeg(feet[0],false);
  // shorts
  {const g=ctx.createLinearGradient(-6,0,6,0);g.addColorStop(0,fx>0?shade(o.shorts,-.25):o.shorts);g.addColorStop(1,fx>0?o.shorts:shade(o.shorts,-.25));
   ctx.fillStyle=g;rr(-5.6,hip-6.5,11.2,8.5,2.2);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.8;ctx.stroke();ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(-.4,hip-1,.8,3)}
  // shirt: lit from above and the side, collar and side panel
  {const g=ctx.createLinearGradient(fx>0?6:-6,-41+ty,fx>0?-6:6,-24+ty);g.addColorStop(0,kitL);g.addColorStop(.55,kit);g.addColorStop(1,kitD);
   ctx.fillStyle=g;rr(-6.4,-41+ty,12.8,18,3.6);ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=.85;ctx.stroke();
   ctx.fillStyle='rgba(0,0,0,.14)';ctx.fillRect(-6,-26+ty,12,2.6);
   // floodlight catching the shoulders, and the creases of a shirt in motion
   ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(-5,-40.3+ty);ctx.lineTo(5,-40.3+ty);ctx.stroke();
   ctx.strokeStyle='rgba(0,0,0,.13)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-fx*3,-36+ty);ctx.quadraticCurveTo(-fx*1,-31+ty,-fx*3.6,-27+ty);ctx.stroke();
   if(o.face>=0){ctx.fillStyle=o.trim||'rgba(255,255,255,.75)';ctx.fillRect(fx>0?-6.4:5.2,-38+ty,1.2,12)}}
  if(o.glow){ctx.strokeStyle=o.glow;ctx.lineWidth=1.3;rr(-6.4,-41+ty,12.8,18,3.6);ctx.stroke()}
  if(o.num!=null&&o.k>.95){ctx.fillStyle=o.numCol||'rgba(255,255,255,.95)';ctx.textAlign='center';ctx.textBaseline='middle';
    if(o.face<0){ctx.font='800 9.5px "Barlow Condensed","Arial Narrow",sans-serif';ctx.fillText(o.num,0,-32+ty)}
    else if(o.face>0){ctx.font='800 4.6px "Barlow Condensed","Arial Narrow",sans-serif';ctx.fillText(o.num,0,-31+ty)}}
  // neck + head, drawn a little smaller for more grown-up proportions
  ctx.fillStyle=skinD;ctx.fillRect(-1.5,-44.5+ty,3,4);
  ctx.fillStyle=o.trim||shade(kit,-.4);ctx.beginPath();ctx.ellipse(0,-41+ty,3.4,1.3,0,0,7);ctx.fill();
  ctx.save();ctx.translate(0,hy);ctx.scale(.8,.8);ctx.translate(0,-hy);
  ctx.fillStyle=OL;ctx.beginPath();ctx.arc(0,hy,6.6,0,7);ctx.fill();
  {const g=ctx.createRadialGradient(-fx*1.8,hy-2,.5,0,hy,6.4);g.addColorStop(0,shade(skin,.12));g.addColorStop(1,skinD);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,hy,5.6,0,7);ctx.fill()}
  if(o.face!==0){ctx.fillStyle=skinD;for(const ex of [-5.4,5.4]){ctx.beginPath();ctx.ellipse(ex,hy+.4,1.1,1.6,0,0,7);ctx.fill()}}
  if(o.face===0){ctx.fillStyle=skinD;ctx.beginPath();ctx.ellipse(-fx*1.2,hy+.3,1.1,1.6,0,0,7);ctx.fill()}
  hairDraw(lk,hc,fx,o.face,hy);
  if(o.face>=0){ctx.fillStyle='#1d1d1d';const ex=o.face>0?[-2,2]:[fx*3];for(const e of ex){ctx.beginPath();ctx.arc(e,hy-.4,.7,0,7);ctx.fill()}
    ctx.strokeStyle=shade(hc,-.1);ctx.lineWidth=.6;for(const e of ex){ctx.beginPath();ctx.moveTo(e-1,hy-1.9);ctx.lineTo(e+1,hy-2.1);ctx.stroke()}
    ctx.strokeStyle='rgba(90,40,30,.45)';ctx.lineWidth=.55;ctx.beginPath();o.face>0?(ctx.moveTo(-1.2,hy+2.6),ctx.lineTo(1.2,hy+2.6)):(ctx.moveTo(fx*2,hy+2.6),ctx.lineTo(fx*3.6,hy+2.4));ctx.stroke();
    if(lk[2]){ctx.strokeStyle=hc;ctx.lineWidth=2;ctx.globalAlpha=.85;ctx.beginPath();o.face>0?ctx.arc(0,hy,5.2,.25*Math.PI,.75*Math.PI):ctx.arc(fx*.8,hy,5.2,fx>0?-.05*Math.PI:.55*Math.PI,fx>0?.45*Math.PI:1.05*Math.PI);ctx.stroke();ctx.globalAlpha=1}}
  ctx.restore();
  drawArm(fx>0?1:0,false);
  ctx.lineCap='butt';
}
function hairDraw(lk,hc,fx,face,hy){hairDraw0(lk,hc,fx,face,hy);if(lk[0]!=='bald'&&lk[0]!=='balding'){ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(-fx*.6,hy,4.8,Math.PI*1.2,Math.PI*1.55);ctx.stroke()}}
function hairDraw0(lk,hc,fx,face,hy){
  const st=lk[0],top=lk[1]||hc;
  const cap=(ext=.4,alpha=1)=>{ctx.globalAlpha=alpha;ctx.fillStyle=hc;ctx.beginPath();ctx.arc(0,hy,5.6+ext,Math.PI+.32,2*Math.PI-.32);ctx.closePath();ctx.fill();
    if(face<0){ctx.beginPath();ctx.arc(0,hy,5.6+ext,0,7);ctx.fill()}
    else if(face===0){ctx.beginPath();ctx.moveTo(0,hy);ctx.arc(0,hy,5.6+ext,fx>0?Math.PI*.55:-Math.PI*.2,fx>0?Math.PI*1.2:Math.PI*.45);ctx.closePath();ctx.fill()}
    ctx.globalAlpha=1};
  switch(st){
    case 'short':cap();break;
    case 'buzz':cap(0,.6);break;
    case 'bald':ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(-fx*1.6,hy-2.6,1.6,0,7);ctx.fill();break;
    case 'balding':ctx.strokeStyle=hc;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,hy,5.2,Math.PI*.7,Math.PI*1.08);ctx.stroke();ctx.beginPath();ctx.arc(0,hy,5.2,-Math.PI*.08,Math.PI*.3);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(0,hy-3,2,0,7);ctx.fill();break;
    case 'tuft':ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(-fx*1.4,hy-2.4,1.6,0,7);ctx.fill();
      ctx.fillStyle=hc;ctx.beginPath();ctx.ellipse(fx*2.2,hy-5.2,2.3,1.4,0,0,7);ctx.fill();break;
    case 'quiff':cap();ctx.fillStyle=hc;ctx.beginPath();ctx.ellipse(fx*2.2,hy-6.4,4.4,2.6,-fx*.3,0,7);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.2)';ctx.beginPath();ctx.ellipse(fx*2.6,hy-7.4,2,.8,-fx*.3,0,7);ctx.fill();break;
    case 'mohawk':cap(0,.35);ctx.fillStyle=top;rr(-1.7,hy-8.6,3.4,6,1.6);ctx.fill();ctx.fillStyle=hc;ctx.fillRect(-1.7,hy-3.4,3.4,1.8);break;
    case 'long':cap();ctx.fillStyle=hc;ctx.fillRect(-6.5,hy-2,2.6,9);ctx.fillRect(3.9,hy-2,2.6,9);
      if(lk[4]){ctx.strokeStyle='#fff6e4';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(0,hy,5.9,Math.PI*1.08,Math.PI*1.92);ctx.stroke()}break;
    case 'bun':cap(.2);ctx.fillStyle=hc;ctx.beginPath();ctx.arc(-fx*3.4,hy-6.2,2.5,0,7);ctx.fill();break;
    case 'curly':cap(.3);ctx.fillStyle=hc;for(let i=0;i<=6;i++){const a=Math.PI+i*Math.PI/6;ctx.beginPath();ctx.arc(Math.cos(a)*5.6,hy+Math.sin(a)*5.6,2.2,0,7);ctx.fill()}break;
    case 'afro':cap(.6);break;
    case 'dreads':cap(.3);ctx.strokeStyle=hc;ctx.lineWidth=1.5;for(const x of (face<0?[-5,-2.5,0,2.5,5]:[-fx*5,-fx*3,fx*4.6])){ctx.beginPath();ctx.moveTo(x*.9,hy-3);ctx.lineTo(x,hy+5.5);ctx.stroke()}break;
  }
}
// A safety net: if anything ever leaves a player or the ball at a non-number position (which makes them vanish),
// put them back somewhere sensible instead of losing them for the rest of the match.
const NUMK=['x','y','vx','vy','dir','jump','runPh','spdNow','rot','lean','lx','ly'];
function sanePitch(){
  for(const p of players){let bad=false;for(const k of NUMK)if(p[k]!=null&&!Number.isFinite(p[k])){bad=true;p[k]=0}
    if(bad){const sl=p.slot,att=p.team===0?1:-1;if(p.keeper){p.x=p.team?FX1-16:FX0+16;p.y=MY}else if(sl){p.x=MIDX-att*(1-sl.x)*(FX1-FX0)*.42;p.y=FY0+sl.y*(FY1-FY0)}else{p.x=MIDX;p.y=MY}
      p.vx=p.vy=0;p.lx=p.x;p.ly=p.y;p.dir=p.team?Math.PI:0;p.anim=null;window.__fixes=(window.__fixes||0)+1}}
  if(![B.x,B.y,B.z,B.vx,B.vy,B.vz].every(Number.isFinite)){Object.assign(B,{x:MIDX,y:MY,z:0,vx:0,vy:0,vz:0,curl:0,knuckle:0});B.owner=null;window.__fixes=(window.__fixes||0)+1}}
function kitFor(p){
  if(p.keeper)return{kit:p.kit,shorts:'#1b2530',socks:p.kit,gloves:'#f4f4f4',band:'#1b2530',trim:'#1b2530'};
  const k=typeof p.kit==='string'&&/^#[0-9a-f]{6}$/i.test(p.kit)?p.kit:'#8e8ff0',n=parseInt(k.slice(1),16),lum=((n>>16)*.3+(n>>8&255)*.59+(n&255)*.11),light=lum>170;
  if(p.team===0)return{kit:k,shorts:light?'#2a2d36':'#f4f4f4',socks:k,band:light?'#2a2d36':'#f4f4f4',trim:light?'#2a2d36':'#f4f4f4',numCol:light?'#1d2028':'#fff',boot:'#15161b',bootMark:'#ffd23f'};
  return{kit:k,shorts:light?'#1d2440':'#20253a',socks:light?k:'#20253a',band:light?'#1d2440':k,trim:light?'#1d2440':'#f4f4f4',numCol:light?'#1d2440':'#fff',boot:'#f2f2f2',bootMark:'#e2483d'};
}
function drawPlayer(p,x=p.x,y=p.y,dir=p.dir,rot=p.rot,ph=p.runPh||0,run=p.spdNow||0){
  const lk=lookOf(p.st),q=P(x,y,0),hf=lk[3]||1,k=q.s*1.08*hf;
  const sliding=p.slide&&(p.lunge>0||p.aiSlide>0),fallen=(state==='play'||state==='replay')&&p.fall>0;
  const spin=p.anim==='roul'||p.spinRot?rot:0;
  let fx=Math.cos(dir)>=0?1:-1;const sy=Math.sin(dir),face=sy>.45?1:sy<-.45?-1:0;
  const sq=Math.cos(spin);if(sq<0)fx=-fx;
  // shadow
  {const wd=sliding||fallen?1.9:1;ctx.fillStyle='rgba(0,0,0,.075)';
   for(const [dx,dy] of [[1,.32],[-1,.32],[1,-.22],[-1,-.22]]){ctx.beginPath();ctx.ellipse(q.x+dx*10*k,q.y+dy*6*k,13*k*wd,2.4*k,dx*dy>0?.32:-.32,0,7);ctx.fill()}
   ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(q.x,q.y,8.5*k*wd,2.7*k,0,0,7);ctx.fill()}
  const jz=P(x,y,p.jump||0);
  ctx.save();try{ctx.translate(q.x,jz.y);if(p.ghost>0)ctx.globalAlpha=.42+.18*Math.sin(t*.4);
  if(p.anim==='bike'){const pr=1-p.animT/p.animMax;ctx.translate(0,-14*k);ctx.rotate(-fx*pr*Math.PI*2);ctx.translate(0,14*k)}
  if(sliding){ctx.rotate(fx*1.25);ctx.translate(0,4*k)}
  else if(p.whiff>0&&!fallen&&(state==='play'||state==='replay')){const w=Math.min(1,(p.whiffMax-p.whiff)/5);ctx.translate(0,-2*k);ctx.rotate(fx*(.95+Math.sin(t*.45)*.12)*w);ctx.translate(0,7*k*w)}
  else if(!p.slide&&((p.lunge>0&&p===ctrl)||p.aiLunge>0||(p.locked>0&&p.stun>0))){ctx.translate(0,-2*k);ctx.rotate(fx*.55);ctx.translate(0,2*k)}
  else if(fallen){const fd=(p.fallDir||fx),k2=Math.min(1,(80-p.fall)/8);ctx.rotate(fd*1.5*Math.min(1,k2+.3));ctx.translate(0,5*k)}
  if(p.keeper&&(p.diveK||0)>0){const dk=p.diveK,dir=p.lastDy||1;ctx.translate(0,-7*k*Math.sin(Math.min(1,dk)*2.6));ctx.translate(0,-22*k);ctx.rotate(dir*fx*1.3*dk);ctx.translate(0,22*k)}
  if(p.lean){ctx.translate(0,-25*k);ctx.rotate(p.lean);ctx.translate(0,25*k)}
  ctx.scale(k*Math.max(.18,Math.abs(sq)),k);
  const kc=kitFor(p);
  figure({fx,face:spin?0:face,ph,run,kit:kc.kit,shorts:kc.shorts,socks:kc.socks,gloves:kc.gloves,band:kc.band,trim:kc.trim,numCol:kc.numCol,boot:kc.boot,bootMark:kc.bootMark,skin:p.st.skin,hair:p.st.hair,look:lk,arms:p.arms||(p.keeper&&(p.diveK||0)>.35?1:0),dive:p.keeper&&p.diving,
    kneel:p.kneel,glow:p.anim==='shield'?C.sun:p.turbo>0||p.knockT>0?C.mint:null,num:p.st.num,k});
  }finally{ctx.restore()}
  const head=P(x,y,(p.jump||0)+56*hf);
  if(state==='play'&&p.stun>0){ctx.fillStyle=C.sun;for(let i=0;i<3;i++){const a=t*.15+i*2.1;ctx.beginPath();ctx.arc(head.x+Math.cos(a)*10*q.s,head.y+Math.sin(a)*3*q.s,2.2*q.s,0,7);ctx.fill()}}
  if(p.team===0&&!p.keeper&&p!==ctrl&&state==='play')txt(String(p.st.num)+(p.role==='cap'?' C':p.role==='att'?' ⚡':''),head.x,head.y-2,Math.round(10*Math.max(.8,q.s)),'rgba(255,246,228,.8)','center',false);
}
const CHARGE=['#ffffff','#7fe0b4','#ffd166','#ff9a3c','#ff6f59'];
const ballCharge=()=>{if(state==='replay')return replayCh;if(state!=='play'&&state!=='goal')return 0;const mine=(B.owner&&B.owner.team===0)||(!B.owner&&B.pass&&B.pass.from&&B.pass.from.team===0)||(!B.owner&&B.shot&&B.shot.team===0);return mine?Math.min(4,passChain):0};
function drawBall(x=B.x,y=B.y,z=B.z){
  const gb=hr('giant')?2:1,g=P(x,y,0),q=P(x,y,z+5.2*gb),r=5.2*q.s*gb,ch=ballCharge();
  if(ch>0){ctx.save();ctx.globalAlpha=.3+.15*Math.sin(t*.3);ctx.fillStyle=CHARGE[ch];ctx.beginPath();ctx.arc(q.x,q.y,r*(1.9+ch*.25),0,7);ctx.fill();ctx.restore()}
  const lift=Math.min(.6,z/110);ctx.fillStyle=`rgba(0,0,0,${.32*(1-lift)})`;ctx.beginPath();ctx.ellipse(g.x+z*.08*g.s,g.y,5.4*g.s*(1-lift*.5),2.1*g.s,0,0,7);ctx.fill();
  ctx.save();ctx.translate(q.x,q.y);
  const base=ch>0?CHARGE[ch]:'#ffffff',rg=ctx.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.05);rg.addColorStop(0,'#ffffff');rg.addColorStop(.6,base);rg.addColorStop(1,'#9aa3ab');
  ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.clip();
  ctx.fillStyle='#22282e';for(let i=0;i<5;i++){const a=B.spin+i*1.2566,px=Math.cos(a)*r*.62,py=Math.sin(a*1.3)*r*.5;ctx.beginPath();for(let j=0;j<5;j++){const b=j*1.2566+a;const vx=px+Math.cos(b)*r*.2,vy=py+Math.sin(b)*r*.2;j?ctx.lineTo(vx,vy):ctx.moveTo(vx,vy)}ctx.closePath();ctx.fill()}
  ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(-r*.38,-r*.42,r*.3,r*.18,-.6,0,7);ctx.fill();
  ctx.restore();
  ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=Math.max(.5,.5*q.s);ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.stroke();
}
const gaussN=()=>(Math.random()+Math.random()+Math.random()+Math.random()-2)*1.73;
function groundRing(x,y,r,a0=0,a1=6.2832){wpath(wcircle(x,y,r,a0,a1,32))}
// a fading streak behind a fast-moving ball
let btrail=[],passFx=null;
// a quick fading guide on the grass from passer to where the ball is headed
function drawPassFx(){if(!passFx||state!=='play')return;const k=(t-passFx.t0)/26;if(k>=1){passFx=null;return}
  const a=P(passFx.x0,passFx.y0),b=P(passFx.x1,passFx.y1);ctx.save();ctx.globalAlpha=(1-k)*.55;ctx.strokeStyle=C.mint;ctx.lineCap='round';ctx.lineWidth=Math.max(1.5,2.4*b.s);
  ctx.setLineDash([2,7]);ctx.lineDashOffset=-k*30;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.ellipse(b.x,b.y,9*b.s*(1+k*.6),3.4*b.s*(1+k*.6),0,0,7);ctx.stroke();ctx.restore()}
function drawTrail(){const n=btrail.length;if(n<2)return;const ch=ballCharge(),col=B.rocket?'255,111,89':ch>=2?'255,209,102':'255,255,255';
  ctx.save();ctx.lineCap='round';
  for(let i=1;i<n;i++){const a=P(btrail[i-1][0],btrail[i-1][1],btrail[i-1][2]+5),b=P(btrail[i][0],btrail[i][1],btrail[i][2]+5),k=i/n;
    ctx.strokeStyle=`rgba(${col},${(.32*k*k).toFixed(3)})`;ctx.lineWidth=Math.max(1,9*b.s*k*(hr('giant')?2:1));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  ctx.restore()}

/* ---------- audio ---------- */
let ac=null,master=null,muted=false,nbuf=null;
function initAudio(){
  if(ac)return;try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
  master=ac.createGain();master.gain.value=muted?0:.55;master.connect(ac.destination);
  nbuf=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const n=ac.createBufferSource();n.buffer=nbuf;n.loop=true;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=420;const g=ac.createGain();g.gain.value=.05;n.connect(f).connect(g).connect(master);n.start();
  crowdG=g;crowdF=f;
  {const r=ac.createBufferSource();r.buffer=nbuf;r.loop=true;const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=2500;rainG=ac.createGain();rainG.gain.value=0;r.connect(hp).connect(rainG).connect(master);r.start(0,.7)}
}
// The crowd murmur swells and brightens as the ball nears either goal, peaks on shots and goals, and settles down in midfield.
let crowdG=null,crowdF=null,rainG=null,moodT=0;
function crowdMood(dt){if(!crowdG||!ac)return;moodT-=dt;if(moodT>0)return;moodT=8;
  let ex=0;
  if(state==='play'){const dg=Math.min(Math.abs(B.x-FX0),Math.abs(B.x-FX1));ex=clamp(1-(dg-80)/420,0,1)*(Math.abs(B.y-MY)<260?.85:.45);
    if(!B.owner&&B.shot)ex=Math.max(ex,.85);if(B.owner&&B.owner.breakaway)ex=Math.max(ex,.7)}
  else if(state==='goal')ex=1;else if(state==='concede')ex=.3;
  else if(state==='pens'&&pen)ex=pen.phase==='aim'||pen.phase==='kwait'?.05:pen.phase==='runup'?.45:pen.phase==='fly'?.85:pen.phase==='result'?(pen.good?.95:.4):.45;
  const tt=ac.currentTime;if(rainG)rainG.gain.setTargetAtTime(weather==='rain'&&state!=='menu'&&state!=='pens'?.035:0,tt,.6);crowdG.gain.setTargetAtTime(.04+ex*.1,tt,.45);crowdF.frequency.setTargetAtTime(380+ex*560,tt,.45)}
// Ticks over the last ten seconds, and a heads-up banner with half a minute left.
let lastSec=null,banner=null;
function clockCues(){if(state!=='play'||(SG&&SG.k==='slalom')){lastSec=null;return}const s=Math.ceil(clock);
  if(lastSec!=null&&s!==lastSec){if(s===30&&lastSec>30&&!SG)banner={txt:'30 SECONDS LEFT',t0:t};if(s<=10&&s>0)tone(s<=3?1320:990,.06,'square',s<=3?.05:.03)}
  lastSec=s}
function trailStep(){const sp=Math.hypot(B.vx,B.vy);
  if(!B.owner&&sp>7&&(state==='play'||state==='goal'||state==='concede')){btrail.push([B.x,B.y,B.z]);if(btrail.length>9)btrail.shift()}else if(btrail.length)btrail.shift();
  const cap=QLV?600:1200;if(parts.length>cap)parts.splice(0,parts.length-cap)}
function tone(fr,dur,type='triangle',vol=.18,delay=0,slide=0){
  if(!ac)return;const t0=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(fr,t0);
  if(slide)o.frequency.exponentialRampToValueAtTime(fr*slide,t0+dur);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+.01);g.gain.exponentialRampToValueAtTime(.0008,t0+dur);o.connect(g).connect(master);o.start(t0);o.stop(t0+dur+.05);
}
function noise(dur,freq,vol,q=.8,attack=.005,delay=0){
  if(!ac)return;const t0=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=nbuf;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=freq;f.Q.value=q;const g=ac.createGain();
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+attack);g.gain.exponentialRampToValueAtTime(.0008,t0+dur);s.connect(f).connect(g).connect(master);s.start(t0,Math.random());s.stop(t0+dur+.05);
}
const S={
  kick:p=>{tone(150,.14,'sine',.3+p*.2,0,.4);noise(.07,1800,.22)},
  pass:()=>{tone(260,.08,'sine',.18,0,.6);noise(.04,2200,.08)},
  tap:()=>tone(220,.05,'sine',.06,0,.6),
  tackle:()=>{tone(90,.18,'sine',.35,0,.5);noise(.15,500,.2)},
  whistle:(n=1,long=false)=>{for(let i=0;i<n;i++){const L=long&&i===n-1?.7:.16;tone(2300,L,'square',.05,i*.25);tone(2380,L,'square',.04,i*.25)}},
  goal:()=>{noise(3.4,900,.5,.5,.25);noise(2.8,2200,.18,.6,.3);[523,659,784,1047,1319].forEach((f,i)=>tone(f,.5,'triangle',.16,.05+i*.08));tone(1568,.9,'sine',.08,.5)},
  save:()=>{tone(110,.2,'sine',.35);noise(.7,700,.2,.6,.05,.05)},
  post:()=>{tone(1900,.35,'square',.05);tone(950,.5,'triangle',.12);noise(.9,600,.15,1.2,.1,.1)},
  skill:n=>{[660,880,1175,1568].slice(0,2+Math.min(2,n)).forEach((f,i)=>tone(f,.18,'triangle',.11,i*.06))},
  special:()=>{[392,587,784].forEach((f,i)=>tone(f,.3,'triangle',.12,i*.05));noise(.3,2600,.08,.6,.05)},
  ooh:()=>{noise(1,520,.24,1.1,.06);tone(196,.6,'sine',.05,0,1.5)},
  aww:()=>{noise(1.4,380,.25,1.4,.2);tone(330,.8,'sine',.04,0,.7)},
  fire:()=>{noise(.6,1200,.2,.4,.1);[392,523,659,784].forEach((f,i)=>tone(f,.6,'sawtooth',.04,i*.04))},
  swoosh:()=>noise(.25,3000,.1,.5,.06),
  boom:()=>{tone(70,.4,'sine',.5,0,.5);noise(.3,900,.3,.5)}
};
const muteBtn=$('mute');
function setMute(m){muted=m;try{if(m&&window.speechSynthesis)speechSynthesis.cancel()}catch(e){}if(master)master.gain.value=m?0:.55;muteBtn.textContent=m?'Sound off (M)':'Sound on (M)'}
muteBtn.onclick=()=>{initAudio();setMute(!muted)};

/* ---------- helpers ---------- */
function pop(text,x,y,col=C.cream,size=20,z=52){
  // if another fresh pop is already right here, stack this one above it so both stay readable
  for(let k=0;k<4&&pops.some(q=>q.life>38&&Math.abs(q.x-x)<85&&Math.abs(q.y-(y+30))<45&&Math.abs(q.z-z)<15);k++)z+=17;
  pops.push({text,x,y:y+30,z,col,size,life:70})}
function burst(x,y,n,cols,spd=6,grav=.12,size=[4,8]){const q=P(x,y,14);burstS(q.x,q.y,n,cols,spd,grav,size)}
function burstS(x,y,n,cols,spd=6,grav=.12,size=[4,8]){if(QLV)n=Math.ceil(n*(1-QLV*.3));for(let i=0;i<n;i++){const a=rnd(0,6.283),s=rnd(1,spd);parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rnd(0,3),g:grav,life:rnd(60,120),max:120,c:pick(cols),w:rnd(size[0],size[1]),h:rnd(3,6),r:rnd(0,6),vr:rnd(-.3,.3)})}}
function grass(wx,wy,n){const q=P(wx,wy);const x=q.x,y=q.y;for(let i=0;i<n;i++)parts.push({x,y,vx:rnd(-2,2),vy:rnd(-2,1),g:.08,life:rnd(15,30),max:30,c:'#3f8a4a',w:2,h:2,r:0,vr:0})}
function firework(x,y){for(let i=0;i<36;i++){const a=i/36*6.283;parts.push({x,y,vx:Math.cos(a)*3.2,vy:Math.sin(a)*3.2,g:.04,life:60,max:60,c:CONF[(Math.random()*5)|0],w:3,h:3,r:0,vr:0,spark:true})}noise(.4,1400,.07,.6,.002)}
function ring(x,y,c){parts.push({ring:true,wx:x,wy:y,x:0,y:0,r:0,life:30,max:30,vx:0,vy:0,g:0,c})}
function addStyle(n,x,y,label){style+=n;if(label)pop(label+'  +'+n,x,y-30,C.sun,18)}
function addHype(n){if(fire>0)return;hype=Math.min(100,hype+n*1.45);if(hype>=100){fire=780;hype=0;S.fire();pop('ON FIRE!',ctrl?ctrl.x:MIDX,ctrl?ctrl.y-40:MY,C.coral,30);flash=RM?0:.5}}
const outfield=team=>players.filter(p=>p.team===team&&!p.keeper);
const keeperOf=team=>players.find(p=>p.team===team&&p.keeper);
const goalX=team=>team===0?FX1:FX0;
const immune=p=>p.anim==='roul'||p.anim==='rainbow'||p.anim==='shield'||p.anim==='bike'||p.ghost>0;
function laneBlocked(a,b,r,team){const dx=b.x-a.x,dy=b.y-a.y,L2=dx*dx+dy*dy||1;for(const q of players){if(q.team===team)continue;const u=clamp(((q.x-a.x)*dx+(q.y-a.y)*dy)/L2,0,1);if(Math.hypot(a.x+dx*u-q.x,a.y+dy*u-q.y)<r)return true}return false}
function openness(p){let m=999;for(const q of players)if(q.team!==p.team)m=Math.min(m,dist(p,q));return m}

/* ---------- input ---------- */
const keys={};
const K=c=>!!keys[c];const MOVEK=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
const inX=()=>RIN?RIN.x:(K('KeyD')?1:0)-(K('ArrowLeft')||K('KeyA')?1:0),inY=()=>RIN?RIN.y:(K('KeyS')?1:0)-(K('KeyW')?1:0);
goBtn.onclick=startMatch;
let paused=false;
function setPause(v){if(state==='menu')return;paused=v;$('pause').hidden=!v;if(v){charging=false;for(const k in keys)keys[k]=false;$('resume').focus()}else cv.focus()}
$('resume').onclick=()=>setPause(false);
$('leave').onclick=()=>{paused=false;$('pause').hidden=true;if(NET.on)netLeave();showMenu(true)};
$('forfeit').onclick=()=>{if(NET.on){$('leave').onclick();return}paused=false;$('pause').hidden=true;pen=null;score=[0,3];style=0;awardCoins();club.coins-=earned;earned=0;saveClub();
  showMenu(false);resultEl.textContent='You forfeited. It counts as a 0–3 defeat.'+(eventText?' '+eventText:'')};
addEventListener('keydown',e=>{
  const c=e.code;
  if(state==='menu')return;
  if(c==='Escape'||c==='KeyP'){e.preventDefault();if(!e.repeat)setPause(!paused);return}
  if(c==='KeyV'&&state!=='menu'&&!e.repeat){toggleFull();return}
  if(paused)return;
  if(state==='play'&&introT>0){if(c==='Space'||c==='Enter')introT=Math.min(introT,12);e.preventDefault();return}
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Tab'].includes(c))e.preventDefault();
  keys[c]=true;if(e.repeat)return;
  if(c==='KeyM'){setMute(!muted);return}
  if(c==='KeyG'){fixScreen();return}
  if(c==='KeyN'&&NET.on){netDiag=!netDiag;return}// online connection details
  if(NET.guest){guestKey(c);return}
  if(state==='play'){
    const p=ctrl;if(!p)return;playKey(p,c);
    if(c==='Tab'||c==='KeyQ')switchPlayer(true);
  }else if(state==='goal'){
    if(/^Digit[1-6]$/.test(c)&&stT<220){celebType=+c.slice(5)-1;scorer.rot=0;scorer.jump=0;S.skill(1);pop(CELEBS[celebType],scorer.x,scorer.y-36,C.sun,20)}
    if(c==='Space'&&stT>70){if(NET.on)kickoff(1);else startReplay()}
  }else if(state==='replay'){if(c==='Space')kickoff(1)}
  else if(state==='concede'){if(c==='Space'&&stT>60)kickoff(0)}
  else if(state==='pens'&&pen)penKey(c);
  else if(state==='fulltime'){if(c==='Space'&&stT>60){if(NET.on)netEndMatch();else{netLeave();showMenu()}}}
});
// one button press for whoever is in control. The host runs this for the guest's player too.
function playKey(p,c){
    if(c==='Space'&&!B.owner&&B.lobTo===p&&B.z>3){p.volley=true;pop('ON IT',p.x,p.y-40,C.sun,14,40);return}
    if(c==='Space'&&(B.owner===p||(!B.owner&&dist(p,B)<70))){charging=true;charge=0;p.aimY=startAim(p)}
    else if(c==='Space'&&B.owner&&B.owner.team!==p.team&&p.lunge<=0&&p.stun<=0&&p.tackleCd<=0)startLunge(p);
    if(c==='KeyF'&&B.owner===p){cross(p);return}
    if(c==='KeyF'||c==='ShiftLeft'||c==='ShiftRight'){if(B.owner===p)humanPass(p);else if(p.lunge<=0&&p.stun<=0&&p.tackleCd<=0){
      startLunge(p)}}
    if(c==='KeyR'||c==='ArrowRight'){if(B.owner===p)ballLunge(p);else if(p.lunge<=0&&p.stun<=0&&p.tackleCd<=0)startLunge(p)}
    if(c==='KeyC'&&!koGrace(p)&&B.owner!==p&&p.lunge<=0&&p.stun<=0&&p.slideCd<=0){p.lunge=28;p.slide=true;p.slideCd=SLIDE_CD;const tb=Math.atan2(B.y-p.y,B.x-p.x);p.dir+=angDiff(tb,p.dir)*.6;S.swoosh();grass(p.x,p.y,6)}
    if(c==='KeyE'||c==='ArrowUp')doSkill(p);
    if(c==='KeyX'||c==='ArrowDown')doSpecial(p);
}
function playRelease(p){charging=false;if(state==='play'&&p&&canStrike(p)){if(p.aimY!=null)p.dir=Math.atan2(p.aimY-B.y,goalX(p.team)-B.x);p.quickShot=charge<.4;const w=sweetW(p);p.perfectShot=Math.abs(charge-SWEET)<=w/2;p.overShot=Math.max(0,charge-1);shoot(p,'normal',Math.max(Math.min(charge,1),.5),p.aimY);p.quickShot=false;p.perfectShot=false;p.overShot=0}if(p)p.aimY=null}
addEventListener('keyup',e=>{keys[e.code]=false;if(NET.guest){if(e.code==='Space')guestKey('SpaceUp');else if(MOVEK.has(e.code))netGuestPush(true);return}
  if(state==='pens'&&pen){penKeyUp(e.code);return}
  if(e.code==='Space'&&charging)playRelease(ctrl)});// a quick tap still gets a decent strike
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;charging=false});
// Aim point on the goal line. Starts where you're facing, then W/S (or up/down) slide it smoothly while you hold Space.
// Shot assist: the aim point drifts to the corner the keeper is leaving open. Better finishers get pulled there faster and spray less.
function openCorner(aimY,tm=0){const k=keeperOf(1-tm);if(Math.abs(k.y-MY)<8)return aimY<MY?GY0+12:GY1-12;return k.y>MY?GY0+12:GY1-12}
function startAim(p){const gx=goalX(p.team);if(Math.abs(gx-B.x)>700)return null;const f=Math.cos(p.dir)*(p.team?-1:1);
  let y=f>.2?B.y+Math.tan(p.dir)*(gx-B.x):B.y+Math.sign(Math.sin(p.dir)||1)*80;y=clamp(y,GY0-12,GY1+12);const c=openCorner(y,p.team);return y+(c-y)*clamp(p.st.fin*.55+.02,.12,.55)}
const canStrike=p=>B.owner===p||(!B.owner&&dist(p,B)<30&&B.z<18&&p.stun<=0);

function modeStart(){SG=null;chalWon=false;chalCur=null;windX=0;
  if(comp==='friendly'){if(hr('wind'))windX=(Math.random()<.5?-1:1)*rnd(.018,.03)}
  if(comp==='chal'){const c=CHALS.find(c=>c.id===chalId());chalCur=c;clock=c.clock||180;if(c.score)score=[...c.score];
    if(c.short){const off=outfield(0).slice(-1)[0];players=players.filter(p=>p!==off);if(ctrl===off)ctrl=outfield(0)[0]}
    eventText=c.name.toUpperCase()+' · '+c.d;cupEvent='advance'}
  if(comp==='skill'){const k=sgId();SG={k,pts:0,wait:0,time:0,gi:0,gates:[],cones:[]};
    if(k==='pens'){startPens();pen.ladder=true;pen.lvl=0;return}
    const me=outfield(0)[0];players=players.filter(p=>p===me||p.keeper);ctrl=me;
    if(k==='target'){clock=45;sgRespawn()}
    if(k==='slalom'){clock=99;const n=6;for(let i=0;i<n;i++){const x=FX0+250+i*(FX1-FX0-500)/(n-1),y=MY+(i%2?-1:1)*85;SG.gates.push({x,y,st:0});SG.cones.push({x,y:y-46,down:false},{x,y:y+46,down:false})}
      me.x=FX0+120;me.y=MY;me.vx=me.vy=0;me.dir=0;give(me);B.x=me.x+12;B.y=me.y;kickT=0}}}
function sgRespawn(){const c=ctrl;if(!c)return;if(SG)SG.parked=false;c.x=FX1-rnd(200,330);c.y=MY+rnd(-170,170);c.vx=c.vy=0;c.dir=Math.atan2(MY-c.y,FX1-c.x);
  Object.assign(B,{owner:null,x:c.x+12,y:c.y,z:0,vx:0,vy:0,vz:0,shot:null,pass:null,curl:0,knuckle:0,rocket:false,lockT:0});give(c);
  const k=keeperOf(1);if(k){k.x=FX1-16;k.y=MY;k.stun=0;k.hold=0;k.track=false}kickT=0}
function sgUpdate(dt){if(!SG)return;
  if(SG.k==='target'){if(SG.wait>0){SG.wait-=dt;if(SG.wait<=0)sgRespawn();return}if(SG.parked)return;
    if((B.owner&&B.owner.keeper)||(!B.owner&&!B.shot&&Math.hypot(B.vx,B.vy)<.5)||(!B.owner&&B.shot&&Math.hypot(B.vx,B.vy)<.6))SG.wait=28}
  if(SG.k==='slalom'){if(B.owner&&B.owner.keeper){give(ctrl)}SG.time+=dt/60;const me=ctrl,g=SG.gates[SG.gi];
    if(g&&me.x>=g.x){if(Math.abs(me.y-g.y)<46){g.st=1;pop('GATE '+(SG.gi+1),me.x,me.y-34,C.mint,16,40);S.tap()}else{g.st=-1;SG.time+=2;pop('MISSED  +2s',me.x,me.y-34,C.coral,16,50)}SG.gi++}
    for(const c of SG.cones)if(!c.down&&Math.hypot(me.x-c.x,me.y-c.y)<13){c.down=true;SG.time+=1;pop('CONE  +1s',c.x,c.y-20,C.coral,14,40);S.tap()}
    if(SG.time>=60&&state==='play'){SG.fail=true;clock=0}}}
function sgGoal(team){if(SG.k==='target'){const corner=Math.abs(B.y-MY)>36,pts=corner?3:1;SG.pts+=pts;pop(corner?'TOP CORNER  +3':'GOAL  +1',FX1-80,B.y-30,corner?C.sun:C.cream,corner?24:18,60);
    netShake[1]=30;S.goal();if(corner)burst(FX1-10,B.y,60,CONF,8,.12);B.owner=null;B.vx=B.vy=B.vz=0;B.x=FX1+20;SG.parked=true;SG.wait=26;return}
  if(SG.k==='slalom'){SG.done=SG.gi>=SG.gates.length;if(!SG.done){SG.time+=3;pop('MISSED GATES  +3s',FX1-80,MY-30,C.coral,18,60)}netShake[1]=40;S.goal();burst(FX1-10,MY,90,CONF,9,.12);B.x=FX1+20;B.vx=B.vy=B.vz=0;SG.parked=true;clock=0}}
function startMatch(){
  if(ownedPlayers().length<4)return;
  comp=club.comp||'cup';
  // Classical is played on the big pitch; skill games, challenges and online always use the Volta cage
  setPitch(GM==='classical'&&!['chal','skill'].includes(comp)?(club.cpitch==='expanded'?'expanded':'classical'):'volta');
  if(comp==='league'){let L=lgOf();if(!L)L=newSeason(GM,0,1);if(L.done){renderMenu();return}const f=myFixture(L),o=lgTeam(L,f.h==='me'?f.a:f.h);
    OPP={name:o.name.toUpperCase(),kit:o.kit,off:0,str:o.str,form:o.form,tac:o.tac,home:f.h==='me'};cupEvent=null;eventText=null}
  else if(comp==='wcc'){const W=wccOf();if(!W||!wMy(W)){renderMenu();return}const x=wMy(W),o=wTeam(W,x.a==='me'?x.b:x.a);
    OPP={name:o.name.toUpperCase(),kit:o.kit,off:0,str:o.str,form:o.form,tac:{push:1.1,pass:1.15,press:1.1},final:W.round===5};cupEvent=null;eventText=null}
  else if(comp==='friendly'||comp==='chal'||comp==='skill'){const pool=OPPS.filter(o=>!kitClash(o[1],club.kit)),o=pick(pool.length?pool:OPPS);OPP={name:o[0].toUpperCase(),kit:o[1],off:comp==='chal'?0:-.02};cupEvent=null;eventText=null}
  else if(comp==='tour'){if(tourOver()){newTour();renderMenu();return}const m=myMatch(),oi=m.a===ME?m.b:m.a;OPP={name:CLUBS[oi][0].toUpperCase(),kit:clubKit(oi),off:0,club:oi};cupEvent=null;eventText=null}
  else{if(cupOver()){newCup(diffKey);renderMenu();return}
  {const o=OPPS[club.cup.opps[club.cup.round]];OPP={name:o[0].toUpperCase(),kit:o[1],off:ROFF[club.cup.round]};cupEvent=null;eventText=null}}
  initAudio();if(ac&&ac.state==='suspended')ac.resume();
  DF=levelDF(comp==='tour'?tourDF(OPP.club):comp==='league'?DIVS[lgOf().div].df:comp==='wcc'?(OPP.str>.9?'legend':'hard'):diffKey);setup();players.forEach(p=>{if(p.team===1)p.spCd=rnd(140,380)});hat=null;score=[0,0];mercy=false;clock=PITCH==='volta'?120:PITCH==='expanded'?210:180;style=0;shownStyle=0;hype=0;fire=0;streak=0;
  stats={shots:0,on:0,skills:0,passes:0,tackles:0};parts=[];pops=[];
  menuEl.hidden=true;edEl.hidden=true;cv.focus();kickoff(0);modeStart();matchRatings=null;
  introT=SG||state!=='play'?0:INTRO;
  weather=!SG&&comp!=='friendly'&&Math.random()<.2?'rain':'clear';
}
function showMenu(left=false){
  state='menu';menuEl.hidden=false;
  const pw=pen&&pen.winner!=null?pen.winner:null;const r=score[0]>score[1]?'You won':score[0]<score[1]?'You lost':pw===0?'Won on penalties':pw===1?'Lost on penalties':'Draw';
  resultEl.hidden=false;resultEl.textContent=`Last match: ${r} ${score[0]}–${score[1]} · ${style.toLocaleString()} style pts`+(true?` · +${earned} coins`:` · best ${best.toLocaleString()}`);
  if((comp==='league'||comp==='wcc')&&eventText&&!left)resultEl.textContent=eventText+' · '+resultEl.textContent;
  else if(cupEvent==='champion')resultEl.textContent=`\u{1F3C6} ${comp==='tour'?'Grand Tournament':CUPS[club.cup.tier]} champions! `+resultEl.textContent;
  if(left){earned=0;resultEl.textContent=`Left the match at ${score[0]}–${score[1]}. No worries, go again whenever.`}
  if(comp==='skill'&&SG&&SG.msg&&!left)resultEl.textContent=`${SGAMES[SG.k].name}: ${SG.msg}${SG.best?' (new best!)':''} · +${earned} coins`;
  if(comp==='chal'&&eventText&&!left)resultEl.textContent=eventText+` · +${earned} coins`;
  if(levelUps.length&&!left){resultEl.textContent+=' · LEVEL UP: '+levelUps.join(', ');levelUps=[]}
  if(earnNote&&!left)resultEl.textContent+=' · '+earnNote;
  renderRoster();goBtn.focus();
}

/* ---------- ball actions ---------- */
let lastPoss=0,introT=0,weather='clear';const INTRO=240;
function give(p){B.claimBy=null;if(lastPoss!==p.team&&state==='play')wonT[p.team]=t;if(B.pass&&B.pass.from&&B.pass.from.team!==p.team&&!p.keeper&&p.team===1&&state==='play')aiStat.icptWon++;{const wp=B.pass;if(wp&&wp.from&&wp.from.team===p.team&&wp.from!==p)wp.from.mP=(wp.from.mP||0)+1;if(B.shot&&p.keeper&&B.shot.team!==p.team)p.mSv=(p.mSv||0)+1}if(p.team===0&&!p.keeper&&lastPoss===1&&state==='play'){counterT=t;counterX=p.x}if(B.lobTo){B.lobTo.lobRun=null;B.lobTo=null}if(B.graceTo){B.graceTo.lobRun=null;B.graceTo=null;B.graceT=0}if(p.team===1)swT=Math.min(swT,4);if(lastPoss!==p.team&&!p.keeper&&state==='play'&&p.team===0){const near=outfield(1).sort((a,b)=>dist(a,p)-dist(b,p));near.forEach((q,i)=>q.caughtT=i?110:45)}
  lastPoss=p.team;if(B.owner!==p)p.beatRun=0;if(p.team===1){chain=0}
  const wasPass=B.pass;
  if(p.team===0&&!p.keeper){passChain=(wasPass&&wasPass.from&&wasPass.from.team===0)?passChain+1:0;if(wasPass&&wasPass.from&&wasPass.from.team===0&&wasPass.from!==p){stats.passes++;addHype(4);if(passChain===3)pop('BALL CHARGED!',p.x,p.y-56,C.coral,16,60);if(passChain>=2){const lab=passChain>=6?'TIKI-TAKA':passChain>=4?'SILKY':'NICE MOVE';style+=passChain*6;pop(`${lab}  ${passChain+1} PASSES`,p.x,p.y-34,passChain>=4?C.sun:C.mint,15+Math.min(8,passChain*1.5),70);S.skill(Math.min(3,passChain-1));if(passChain>=4)burst(p.x,p.y,10,[C.sun,C.mint,C.cream],3,.05,[3,5])}if(wasPass.through)addStyle(20,p.x,p.y,'THROUGH BALL');if(wasPass.wall)addStyle(25,p.x,p.y,'ONE-TWO')}if(!p.wallTo)ctrl=p;
    if(t-p.burstT<70&&p.burstNear){p.burstNear=false;lastSkillT=t;stats.skills++;S.skill(2);addStyle(15,p.x,p.y,'KNOCK-ON');addHype(12)}}
  if(p.team===1)passChain=0;
  if(B.shot&&p.keeper&&B.shot.team!==p.team){if(B.shot.team===0)stats.on++;pop(pick(['SAVED!','GREAT STOP','HELD IT']),p.x,p.y-30,C.cream,20);S.save();if(B.shot.team===1){addHype(10);style+=10}}
  if(NET.host&&p.team===1&&!p.keeper&&!p.wallTo)setCtrl2(p);
  B.owner=p;B.shot=null;B.pass=null;B.curl=0;B.knuckle=0;B.rocket=false;B.z=0;B.vz=0;p.recvT=t;p.recvPass=!!(wasPass&&wasPass.from&&wasPass.from.team===p.team&&wasPass.from!==p);
  if(p.keeper)p.hold=p.team===0?30:45;
}
function kick(p,a,spd,vz){B.claimBy=null;B.kickN=(B.kickN||0)+1;if(NET.host&&p.team===1&&!p.keeper&&p!==ctrl2&&state==='play')netStat.aiKick1++;
  B.owner=null;B.vx=Math.cos(a)*spd;B.vy=Math.sin(a)*spd;B.vz=vz;B.z=Math.max(B.z,1);B.lockBy=p;B.lockT=14;B.curl=0;B.knuckle=0;B.rocket=false;B.shot=null;B.pass=null;
  B.x=p.x+Math.cos(a)*14;B.y=p.y+Math.sin(a)*14;
}
function pass(p,to,through=false,assist=1){if(NET.on)netKickLog(p,through?'through':'pass',to?players.indexOf(to):-1,0);
  const ps=p.st.pass??.65,att=p.team===0?1:-1;
  const lead=through?28:10+dist(p,to)/35;
  let tx=to.x+to.vx*lead+(through?att*90:0),ty=to.y+to.vy*lead;
  tx=clamp(tx,FX0+30,FX1-30);ty=clamp(ty,FY0+30,FY1-30);
  const d=Math.hypot(tx-p.x,ty-p.y);
  let a=Math.atan2(ty-p.y,tx-p.x);if(assist<1)a=p.dir+angDiff(a,p.dir)*assist;a+=rnd(-1,1)*(through?.02*(1.3-ps):.09*(1.25-ps));
  const spd=clamp(d*.046+6.2,6.8,14.5*(1+(PSC-1)*.3))*(.82+ps*.28);
  kick(p,a,spd,d>260?2.2:.4);B.pass={from:p,to,through};p.dir=a;S.pass();
  if(p.team===0&&!p.keeper)passFx={x0:p.x,y0:p.y,x1:p.x+Math.cos(a)*d,y1:p.y+Math.sin(a)*d,t0:t};
  if(through)to.turbo=90;
  if(p.team===0&&!to.keeper)ctrl=to;else if(p.team===1&&NET.host&&!to.keeper)setCtrl2(to);
}
// Light assist: only teammates within ~35 degrees of where you face are considered, and the ball is
// only nudged 80% of the way towards them. Nobody in the cone = a pass into space along your facing.
function passTarget(p){
  let best=null,bs=-1e9;
  const att=p.team?-1:1;for(const m of players){if(m.team!==p.team||m===p)continue;const d=dist(p,m);if(d<35||d>680*PSC)continue;
    const ad=Math.abs(angDiff(Math.atan2(m.y-p.y,m.x-p.x),p.dir));if(ad>.62)continue;
    const fwd=(m.x-p.x)*att/400,open=outfield(1-p.team).every(q=>dist(q,m)>55)?.35:0;
    const sc=-ad*2-d/600-(laneBlocked(p,m,18,p.team)?.6:0)-(m.keeper?1:0)+fwd*.1+open+(m.role==='att'?.45:0)-(m.goals||0)*.12;if(sc>bs){bs=sc;best=m}}
  return best;
}
function humanPass(p){
  const m=passTarget(p);
  if(m)pass(p,m,false,.96);
  else{if(NET.on)netKickLog(p,'pass',-1,0);const a=p.dir+rnd(-1,1)*.04*(1.2-p.st.pass);kick(p,a,9.5,.4);B.pass={from:p,to:null,through:false};S.pass();
    if(p.team===0)passFx={x0:p.x,y0:p.y,x1:p.x+Math.cos(a)*220,y1:p.y+Math.sin(a)*220,t0:t}}
}
function bestMate(p){
  const att=p.team===0?1:-1;let bm=null,bs=-1e9;
  for(const m of outfield(p.team)){if(m===p)continue;const o=openness(m);if(o<34)continue;const s=o/60+((m.x-p.x)*att)/180-(laneBlocked(p,m,22,p.team)?2:0);if(s>bs){bs=s;bm=m}}
  return bs>-.5?bm:null;
}
function curlCross(x,y,a,spd,curl,vz,gx){let vx=Math.cos(a)*spd,vy=Math.sin(a)*spd,z=1,c=curl;const dir=Math.sign(gx-x);
  for(let i=0;i<260;i++){const sp=Math.hypot(vx,vy);if(c&&sp>1){const nx=-vy/sp,ny=vx/sp;vx+=nx*c;vy+=ny*c;c*=.997}
    const px=x;x+=vx;y+=vy;if((x-gx)*dir>=0){const f=(gx-px)/(x-px||1);return y-vy*(1-f)}
    const fr=z>0?.996:c?.992:.984;vx*=fr;vy*=fr;if(z>0||vz>0){vz-=.25;z+=vz;if(z<0){z=0;vz=Math.abs(vz)>1.2?-vz*.45:0;if(vz>0)c*=.4}}
    if(sp<.5)return null}return null}
function solveCurl(x,y,a0,spd,curl,vz,gx,ty){let lo=a0-.6,hi=a0+.6;const f=a=>{const c=curlCross(x,y,a,spd,curl,vz,gx);return c==null?NaN:c-ty};
  let flo=f(lo),fhi=f(hi);if(!(flo*fhi<0))return a0;
  for(let i=0;i<22;i++){const m=(lo+hi)/2,fm=f(m);if(isNaN(fm))return a0;if(fm*flo<=0){hi=m;fhi=fm}else{lo=m;flo=fm}}return (lo+hi)/2}
function shoot(p,type,ch,aim=null){if(NET.on)netKickLog(p,'shot',type,ch);
  const gx=goalX(p.team),att=p.team===0?1:-1,fin=p.st.fin,pow=p.st.shot,fz=(fire>0&&p.team===0)?1.1:1;
  let ty=aim;
  // no aim assist: the ball goes exactly where you're facing
  if(ty==null&&Math.cos(p.dir)*att>.2)ty=B.y+Math.tan(p.dir)*(gx-B.x);
  let a=aim==null?p.dir:Math.atan2(ty-B.y,gx-B.x);
  const d=Math.hypot(gx-B.x,(ty??MY)-B.y);
  let spd,vz,curl=0,spread,knuckle=0,rocket=false;
  if(type==='normal'){spd=(7.5+ch*(3+pow*12))*fz;vz=.4+ch*1.4;spread=.015+ch*.08*(1.55-fin*1.15);if(p.quickShot)spread*=.6;if(p.team===0&&passChain>=3){spread*=.55;spd*=1.07}if((p.team===0||pvp())&&p.recvPass&&t-p.recvT<30){spread*=.6;pop('ONE-TOUCH',p.x,p.y-40,C.mint,15,40)}
    else if((p.team===0||pvp())&&(B.owner!==p||t-p.recvT<26)){spread*=2.1;spd*=.88;pop('rushed it',p.x,p.y-40,C.muted,13,40)}
    if(p.perfectShot){spread*=.5;spd*=1.045;pop('PERFECT STRIKE',p.x,p.y-52,C.mint,17,50);tone(1568,.1,'triangle',.08)}
    if(p.overShot){spread*=1+p.overShot*4;vz+=p.overShot*12;pop('leaned back',p.x,p.y-52,C.coral,14,40)}}
  else if(type==='curler'){spd=(9.5+fin*3+clamp((d-240)*.011,0,4.5))*fz;vz=1;spread=.05*(1.55-fin*1.15)*Math.min(1,260/d+.35);
    const side=((ty??MY)>B.y?1:-1)*att,th=.14+fin*.13;a-=side*th;curl=side*Math.pow(spd*.8,2)*2*Math.sin(th)/Math.max(140,d)*1.3;
    // solve the launch angle with the real ball physics so long-range curlers still bend into the corner
    if(ty!=null)a=solveCurl(B.x,B.y,a,spd,curl,vz,gx,ty)}
  else if(type==='rocket'){spd=(14+pow*9)*fz;vz=.9;spread=.075*(1.55-fin*1.1);rocket=true}
  else if(type==='bicycle'){spd=(15+pow*6)*fz;vz=.7;spread=.022*(1.4-fin*.8)}
  else if(type==='header'){spd=(6.5+(p.st.str??.6)*4+fin*2)*fz;vz=-.4;spread=.05*(1.6-fin)}
  else if(type==='volley'){spd=(11+pow*8)*fz;vz=.3;spread=.07*(1.6-fin)}
  else if(type==='knuckle'){spd=(11+pow*6)*fz;vz=2.6;spread=.065*(1.55-fin*1.15);knuckle=rnd(.25,.4)*(Math.random()<.5?-1:1)}
  else{spd=clamp(d*.021+3.6,4.6,9.4);const T=d/(spd*.94);vz=.25*T/2*(1+rnd(-.14,.14)*(1.3-fin));spread=.05*(1.3-fin)}
  a+=rnd(-spread,spread);
  kick(p,a,spd,vz);B.curl=curl;B.knuckle=knuckle;B.rocket=rocket;
  if(p.breakaway)p.breakaway=false;
  B.shot={perfect:!!p.perfectShot,one:!!p.wasClear,beat:p.beatRun||0,team:p.team,by:p,type,fx:p.x,first:t-p.recvT<22,skill:p.team===0&&t-lastSkillT<150,ch};
  {const k=keeperOf(1-p.team),ai=!(k.team===0||pvp());
   keeperRead(k,(ai?Math.round(DF.react*.55):6)+(type==='header'||type==='volley'?2:type==='curler'?3:type==='knuckle'?5:type==='bicycle'?14:0)+rnd(0,2),type)}
  p.mSh=(p.mSh||0)+1;if(p.team===0){stats.shots++;addHype(3)}
  S.kick(ch);grass(B.x,B.y,6+ch*10|0);
  if(ch>.6||type!=='normal'){ring(B.x,B.y,'rgba(255,255,255,.85)');burst(B.x,B.y,5+ch*6|0,['#ffffff',C.sun],3.5,.06,[2,4])}
  if(rocket){S.boom();shake=Math.max(shake,RM?0:9);ring(p.x,p.y,C.coral)}
  if(type==='normal'&&ch>.92){shake=Math.max(shake,RM?0:5);pop('LACES',p.x,p.y-30,C.sun,18)}
}

/* ---------- skills (E) ---------- */
function beatsChance(p,base){if(pvp()&&hum(p))return clamp(base-.12+p.st.skill*.62-DF.read,.05,.95);return clamp((base-.12+p.st.skill*.62-(p.team===0?DF.read:0))*(p.team===1?.42:1),.05,.95)}
function fool(p,range,base,front=false,stunT=34){
  let n=0;for(const q of outfield(1-p.team)){const d=dist(p,q);if(d>range)continue;
    if(front&&Math.cos(angDiff(Math.atan2(q.y-p.y,q.x-p.x),p.dir))<0)continue;
    if(Math.random()<(base-.12+p.st.skill*.62-(p.team===0?DF.read:0))*(p.team===1?.42:1)){
      // fooled defenders don't just pause: they go to ground
      knockDown(q,p,44+p.st.skill*26);n++;p.beatRun=(p.beatRun||0)+1;
      if(p.team===0){pop(pick(SENT),q.x,q.y-30,C.coral,26,92);slowmo(22,.32);shake=Math.max(shake,RM?0:3);S.ooh();if(dist(p,q)<30&&Math.cos(angDiff(Math.atan2(q.y-p.y,q.x-p.x),p.dir))>.6)pop('NUTMEG!',q.x,q.y-30,C.sun,22,124)}
      else pop('sent',q.x,q.y-20,C.muted,15)}
    else if(q.team===1){q.shadow=30;q.shadowOf=p}}// read it: he mirrors your move and stays in front
  return n;
}
function nearAny(p,r){return outfield(1-p.team).some(q=>dist(p,q)<r)}
let timeScale=1,slowT=0,chain=0,chainT=-999;
function slowmo(frames,scale){if(RM||NET.on)return;slowT=frames;timeScale=scale}
const SENT=['ANKLES!','SENT HIM!','ON THE FLOOR','SAT DOWN','BROKEN!','GONE!'];
function whiff(p,frames,car,beaten){p.whiff=p.whiffMax=frames;p.stun=Math.max(p.stun,frames);const a=p.lungeDir??p.dir;p.vx=Math.cos(a)*4.4;p.vy=Math.sin(a)*4.4;p.dir=a;grass(p.x,p.y,6);
  if(beaten&&car){if(car.team===0){car.turbo=Math.max(car.turbo||0,50);ring(car.x,car.y,C.mint);pop(pick(['TOO SLOW','SKINNED!','SEE YOU LATER','OLÉ!','BYE BYE']),p.x,p.y-34,C.coral,24,84);slowmo(18,.36);S.ooh();addStyle(12,car.x,car.y);addHype(8);shake=Math.max(shake,RM?0:2)}else pop('dodged you',p.x,p.y-30,C.muted,14)}}
function knockDown(q,from,frames,strong=true){q.fall=frames;q.stun=Math.max(q.stun,frames);const side=Math.sin(angDiff(Math.atan2(q.y-from.y,q.x-from.x),from.dir))>=0?1:-1,a=from.dir+side*Math.PI/2;q.vx=Math.cos(a)*(strong?3.4:2);q.vy=Math.sin(a)*(strong?3.4:2);q.fallDir=Math.cos(a)>=0?1:-1;grass(q.x,q.y,8)}
function landed(p,n,pts,label){if(n&&p.team===1){pop(label,p.x,p.y-30,C.muted,15);return}if(n){p.mS=(p.mS||0)+n;lastSkillT=t;stats.skills++;if(p.team===0){chain=t-chainT<300?chain+1:1;chainT=t;if(chain>=2)label+='  ×'+chain}S.skill(n+Math.min(2,chain-1));addStyle(pts*n*Math.max(1,chain),p.x,p.y,label);addHype(14);burst(p.x,p.y,10,[C.sun,C.cream],3,.05,[3,5])}}
function pushDir(p,lateral){
  const ix=p===ctrl?inX():0,iy=p===ctrl?inY():0;
  if(lateral){
    // pick the side the player is steering to, otherwise away from the nearest defender
    const L=p.dir-Math.PI/2,Rt=p.dir+Math.PI/2;
    if(ix||iy){const a=Math.atan2(iy,ix);return Math.cos(angDiff(a,L))>Math.cos(angDiff(a,Rt))?L:Rt}
    let nd=null;for(const q of outfield(1-p.team))if(!nd||dist(q,p)<dist(nd,p))nd=q;
    if(nd){const a=Math.atan2(nd.y-p.y,nd.x-p.x);return Math.cos(angDiff(a,L))>Math.cos(angDiff(a,Rt))?Rt:L}
    return Math.random()<.5?L:Rt}
  return (ix||iy)?Math.atan2(iy,ix):p.dir;
}
function push(p,a,spd,frames,next=null){p.push={a,spd,T:frames,max:frames,next}}
let KNOCK=[7.6,16,7.4,30,1.6];
function doSkill(p){
  const sk=p.st.sk,def=SKILLS[sk];
  if(!def||p.skillCd>0||p.stam<def.stam||p.anim||p.stun>0||B.owner!==p)return;
  p.skillCd=def.cd;p.stam-=def.stam;S.swoosh();
  const near=nearAny(p,75);
  switch(sk){
    case 'stepover':{// WRONG-FOOT: everyone close in front freezes leaning the wrong way; you just keep going
      p.anim='step';p.animT=p.animMax=22;push(p,p.dir,6.4,14);let n=0;
      for(const q of outfield(1-p.team)){if(dist(p,q)>95||Math.cos(angDiff(Math.atan2(q.y-p.y,q.x-p.x),p.dir))<-.2)continue;
        if(Math.random()<beatsChance(p,.42)){q.lungeDir=p.dir+(Math.random()<.5?1.4:-1.4);whiff(q,48,p,false);q.vx*=.5;q.vy*=.5;n++;if(p.team===0)pop('WRONG-FOOTED',q.x,q.y-30,C.coral,18,70)}
        else if(q.team===1){q.shadow=30;q.shadowOf=p}}
      if(n&&p.team===0)slowmo(14,.4);landed(p,n,15,'STEP-OVER');if(!n&&near)pop('read it',p.x,p.y-30,C.muted,15);break}
    case 'roulette':{// SPIN ROUND: always gets you past the one man in front, and he spins with you
      p.anim='roul';p.animT=p.animMax=30;let q=null;
      for(const o of outfield(1-p.team)){const d=dist(p,o);if(d<85&&Math.cos(angDiff(Math.atan2(o.y-p.y,o.x-p.x),p.dir))>0&&(!q||d<dist(p,q)))q=o}
      const sd=q?(Math.sin(angDiff(Math.atan2(q.y-p.y,q.x-p.x),p.dir))>0?-1:1):(pushDir(p,true)>p.dir?1:-1);
      push(p,p.dir+sd*1.25,5,14,{a:p.dir-sd*.35,spd:6,T:16});
      if(q){q.stun=Math.max(q.stun,46);q.whiff=q.whiffMax=46;q.vx*=.2;q.vy*=.2;q.anim='roul';q.animT=q.animMax=30;if(p.team===0){pop('SPUN HIM',q.x,q.y-30,C.coral,20,70);slowmo(12,.45)}landed(p,1,20,'ROULETTE')}
      break}
    case 'rainbow':{// OVER HIS HEAD: flick it over the defender and run onto it
      p.anim='rainbow';p.animT=p.animMax=30;const tx=p.x+Math.cos(p.dir)*125,ty=p.y+Math.sin(p.dir)*125;lobTo(p,p,tx,ty,30,false);B.pass=null;
      let n=0;for(const q of outfield(1-p.team)){if(dist(p,q)>95||Math.cos(angDiff(Math.atan2(q.y-p.y,q.x-p.x),p.dir))<.2)continue;q.stun=Math.max(q.stun,34);q.vx*=.3;q.vy*=.3;n++;if(p.team===0)pop('OVER HIS HEAD',q.x,q.y-30,C.coral,18,70)}
      landed(p,n,25,'RAINBOW FLICK');break}
    case 'elastico':{// ANKLE BREAKER: violent side-snap; the man in front goes down
      p.anim='elastico';p.animT=p.animMax=14;{const a=pushDir(p,true),sd=Math.sign(angDiff(a,p.dir))||1;push(p,p.dir+sd*1.5,9,8,{a:p.dir+sd*.2,spd:6.8,T:14})}
      const n=fool(p,68,.5,true,30);landed(p,n,18,'ELASTICO');if(!n&&near)pop('read it',p.x,p.y-30,C.muted,15);break}
    case 'burst':{p.burstNear=near;p.burstT=t;kick(p,p.dir,KNOCK[0],.3);B.lockT=KNOCK[1];p.knockT=95;push(p,p.dir,KNOCK[2],KNOCK[3]);if(p.team===0){pop('KNOCK-ON',p.x,p.y-30,C.mint,16);burst(p.x,p.y,8,[C.mint,C.cream],3,.05,[3,5])}break}
    case 'dragback':{// MATADOR: stop dead and pull it back; anyone charging at you sails past
      p.anim='drag';p.animT=p.animMax=12;const d0=p.dir;{const sd=Math.sign(angDiff(pushDir(p,true),p.dir))||1;p.dir+=Math.PI;push(p,p.dir,5.2,11,{a:p.dir-sd*1.3,spd:6,T:14})}
      let n=0;for(const q of outfield(1-p.team)){if(dist(p,q)>85||Math.cos(angDiff(Math.atan2(q.y-p.y,q.x-p.x),d0))<0)continue;
        if(Math.random()<beatsChance(p,.5)){q.lungeDir=Math.atan2(p.y-q.y,p.x-q.x);whiff(q,46,p,true);n++}}
      landed(p,n,12,'DRAG-BACK');break}
    case 'shield':{p.anim='shield';p.animT=p.animMax=56;let nd=null;for(const q of outfield(1-p.team))if(!nd||dist(q,p)<dist(nd,p))nd=q;
      p.shieldFrom=nd&&dist(nd,p)<140?nd:null;p.dir=p.shieldFrom?Math.atan2(p.y-nd.y,p.x-nd.x):p.dir+Math.PI;p.vx*=.3;p.vy*=.3;
      pop('SHIELD',p.x,p.y-30,C.sun,17);if(p.team===0&&p.shieldFrom&&dist(nd,p)<80){addStyle(8,p.x,p.y,'TURNED HIS BACK')}break}
    case 'fakeshot':{p.anim='fake';p.animT=p.animMax=16;
      // plant like you're about to strike, then chop it hard across your body
      const a=pushDir(p,true),sd=Math.sign(angDiff(a,p.dir))||1;p.vx*=.25;p.vy*=.25;push(p,p.dir+sd*1.35,7.2,12,{a:p.dir+sd*.55,spd:6.4,T:14});
      const n=fool(p,85,.38,true,30);
      const k=keeperOf(1-p.team),gx=goalX(p.team);if(Math.hypot(p.x-gx,p.y-MY)<340&&k.stun<=0){k.stun=26;k.y=clamp(k.y-sd*16,GY0+4,GY1-4);k.diving=true;if(p.team===0)pop('KEEPER BOUGHT IT',k.x,k.y-34,C.sun,18)}
      landed(p,n,18,'FAKE SHOT');if(!n&&near)pop('read it',p.x,p.y-30,C.muted,15);S.kick(.2);break}
  }
}
/* ---------- specials (X) ---------- */
/* ---------- new ultimates (shared by you and the AI) ---------- */
// Lofted ball that lands at (tx,ty) after T frames; only the intended teammate can take it, and he's pulled onto it.
function lobTo(p,m,tx,ty,T,through){
  tx=clamp(tx,FX0+25,FX1-25);ty=clamp(ty,FY0+25,FY1-25);kick(p,0,0,0);
  const d=Math.hypot(tx-B.x,ty-B.y),a=Math.atan2(ty-B.y,tx-B.x),sum=(1-Math.pow(.996,T))/.004;
  B.vx=Math.cos(a)*d/sum;B.vy=Math.sin(a)*d/sum;B.vz=.25*T/2;B.z=1;B.lockT=T;
  B.pass={from:p,to:m,through:!!through,lob:true};B.lobTo=m;B.lobX=tx;B.lobY=ty;B.lobThrough=!!through;
  m.lobRun={x:tx,y:ty};m.turbo=Math.max(m.turbo||0,T+25);p.dir=a;S.pass();
  if(p.team===0&&!m.keeper)ctrl=m}
// A lofted cross: to the best-placed teammate (ideally one in the box), or into space if nobody's there.
// Their keeper sometimes comes and claims it; at the far end a defender may head it clear.
function cross(p){if(NET.on)netKickLog(p,'cross',-1,0);const att=p.team===0?1:-1,gx=goalX(p.team);let best=null,bs=-1e9;
  for(const m of outfield(p.team)){if(m===p)continue;const d=dist(p,m);if(d<90||d>720*PSC)continue;const ad=Math.abs(angDiff(Math.atan2(m.y-p.y,m.x-p.x),p.dir));if(ad>1.25)continue;
    const sc=-ad*1.1-Math.hypot(gx-m.x,MY-m.y)/260+(m.role==='att'?.3:0)+((m.x-p.x)*att>0?.2:0);if(sc>bs){bs=sc;best=m}}
  if(!best){kick(p,p.dir,8.5,4.2);B.pass={from:p,to:null,through:false};S.pass();return}
  const T=clamp(dist(p,best)/7,32,58);airN.cross++;
  lobTo(p,best,best.x+best.vx*T*.65+att*22,best.y+best.vy*T*.65,T,false);B.pass.cross=true;
  pop('CROSS',p.x,p.y-34,p.team===0?C.cream:C.coral,15,50);
  const k=keeperOf(1-p.team),lx=B.lobX,ly=B.lobY;
  if(!noKeep()&&Math.abs(lx-goalX(p.team))<115&&Math.abs(ly-MY)<130&&Math.random()<(k.team===0||pvp()?.42:.3*DF.gk))B.claimBy=k;
  if(best.team===1&&best!==ctrl2&&Math.hypot(gx-lx,MY-ly)<340&&Math.random()<.65)best.volley=true}
// First-time strike on a ball in the air: a header if it's high, a volley if it's low. W/S picks the corner.
let airN={volley:0,header:0,claim:0,clear:0,cross:0};
function airStrike(m){airN[B.z>22?'header':'volley']++;const gx=goalX(m.team),k=keeperOf(1-m.team),header=B.z>22;
  const iy=hum(m)?inY():0,ty=iy?(iy<0?GY0+12:GY1-12):(k.y>MY?GY0+14:GY1-14);
  B.lobTo=null;m.lobRun=null;m.volley=false;if(header)m.hjump=18;
  m.dir=Math.atan2(ty-B.y,gx-B.x);shoot(m,header?'header':'volley',.9,ty);
  pop(header?'HEADER!':'VOLLEY!',m.x,m.y-50,m.team===0?C.sun:C.coral,22,70);if(m.team===0){slowmo(14,.4);addHype(8)}}
const attackSpot=team=>{const gx=goalX(team);return{x:gx-Math.sign(gx-MIDX)*SPOT,y:MY}};
function doThrough(p){if(B.owner!==p)return false;const sp=attackSpot(p.team);let m=null;
  for(const q of outfield(p.team))if(q!==p&&(!m||dist(q,sp)<dist(m,sp)))m=q;if(!m)return false;
  lobTo(p,m,sp.x,sp.y,60,true);pop('THROUGH BALL',p.x,p.y-34,p.team===0?C.sun:C.coral,20,70);return true}
function doLob(p){if(B.owner!==p)return false;const att=p.team===0?1:-1;let m=bestMate(p);
  if(!m){for(const q of outfield(p.team))if(q!==p&&(!m||(q.x-m.x)*att>0))m=q}if(!m)return false;
  const T=clamp(dist(p,m)/6.5,34,62),err=(1.25-(p.st.pass??.65))*55*(dist(p,m)/400+.5);lobTo(p,m,m.x+m.vx*T*.6+att*30+rnd(-err,err),m.y+m.vy*T*.6+rnd(-err,err),T,false);B.pass.chip=true;m.turbo=Math.min(m.turbo,T*.35);pop('CHIP PASS',p.x,p.y-34,p.team===0?C.sun:C.coral,18,70);return true}
function doOneTwo(p){if(B.owner!==p)return false;let m=null;for(const q of outfield(p.team))if(q!==p&&dist(q,p)<320&&(!m||dist(q,p)<dist(m,p)))m=q;if(!m)return false;
  pass(p,m,false,1);m.wallTo=p;m.wallT=7;p.turbo=Math.max(p.turbo||0,120);if(p.team===0)ctrl=p;pop('ONE-TWO',p.x,p.y-34,p.team===0?C.mint:C.coral,18,70);return true}
function doGhost(p){if(B.owner!==p)return false;p.ghost=150;ring(p.x,p.y,C.lilac);pop('GHOST',p.x,p.y-34,C.lilac,22,80);return true}
const bikeReady=p=>B.owner===p&&p.recvPass&&t-p.recvT<45&&Math.abs(B.x-goalX(p.team))<520&&Math.abs(B.y-MY)<260;
function doBicycle(p){if(B.owner!==p)return false;
  if(!bikeReady(p)){if(p.team===0)pop(p.recvPass&&t-p.recvT<45?'get closer to goal':'bicycle needs a first-time pass',p.x,p.y-34,C.muted,14);return false}p.anim='bike';p.animT=p.animMax=26;p.bikeT=11;p.vx*=.2;p.vy*=.2;charging=false;pop('BICYCLE KICK',p.x,p.y-40,p.team===0?C.sun:C.coral,22,80);slowmo(24,.35);return true}
function bicycleStrike(p){const k=keeperOf(1-p.team),gx=goalX(p.team),ty=k.y>MY?GY0+10:GY1-10;p.dir=Math.atan2(ty-B.y,gx-B.x);shoot(p,'bicycle',.92,ty);S.boom();shake=Math.max(shake,RM?0:8)}
function doStomp(p){if(B.owner&&B.owner.team===p.team)return false;const foes=outfield(1-p.team).filter(q=>dist(q,p)<125&&q.fall<=0);if(!foes.length)return false;
  foes.forEach(q=>knockDown(q,p,62,true));const o=B.owner;
  if((o&&o.team!==p.team&&!o.keeper&&dist(o,p)<125)||(!o&&dist(p,B)<125&&B.z<20))give(p);
  ring(p.x,p.y,C.coral);ring(p.x,p.y,C.sun);S.boom();shake=Math.max(shake,RM?0:10);slowmo(20,.35);
  pop('SHOCKWAVE',p.x,p.y-40,p.team===0?C.sun:C.coral,26,80);if(p.team===0){addStyle(15*foes.length,p.x,p.y);addHype(12)}return true}
function doSpecial(p){
  const sp=p.st.sp,def=SPECIALS[sp];if(!def||p.spCd>0||p.stun>0)return;
  if(['curler','rocket','knuckle','chip'].includes(sp)){if(!canStrike(p))return;p.spCd=spCdOf(p);charging=false;S.special();pop(def.name,p.x,p.y-34,C.sun,22,80);
    // assisted: aim for the side of goal the keeper is leaving open (chips go over his head)
    const k=keeperOf(1-p.team),ty=sp==='chip'?MY+rnd(-18,18):(k.y>MY?GY0+12:GY1-12);
    p.dir=Math.atan2(ty-B.y,goalX(p.team)-B.x);shoot(p,sp,.85,ty);slowmo(16,.45);return}
  const fn={through:doThrough,lob:doLob,bicycle:doBicycle}[sp];
  if(fn){if(fn(p)){p.spCd=spCdOf(p);S.special()}return}
  if(sp==='slide'){if((B.owner&&B.owner.team===p.team)||p.lunge>0||dist(p,B)>160)return;p.spCd=spCdOf(p);p.lunge=18;p.inter=true;p.slide=false;S.special();ring(p.x,p.y,C.sun);return}
  if(sp==='turbo'){p.spCd=spCdOf(p);p.turbo=180;p.stam=100;S.special();pop('TURBO',p.x,p.y-34,C.mint,18);ring(p.x,p.y,C.mint)}
}
// Auto-switch: when they have the ball you control whoever is best placed between the ball and your goal;
// when it's loose you get whoever will reach it first. Q still works, and a manual pick is respected for a moment.
let swT=0;
function autoSwitch(dt){autoSwitchT(dt,0)}
function autoSwitchT(dt,tm){
  const cur=tm?ctrl2:ctrl;if(!cur)return;
  if(tm){swT2-=dt;if(swT2>0)return;swT2=6}else{swT-=dt;if(swT>0)return;swT=6}
  const own=B.owner,att=tm?-1:1;if(own&&own.team===tm)return;
  if(B.pass&&B.pass.to&&B.pass.from&&B.pass.from.team===tm)return;// our pass in flight: the receiver takes over
  if(cur.lunge>0||cur.slide||(cur.locked>0&&cur.stun>0))return;// mid-tackle: let it play out
  const theirs=own&&own.team!==tm&&!own.keeper,myGoal=goalX(1-tm);
  if(theirs&&dist(cur,own)<55&&(own.x-cur.x)*att>-12)return;// already engaged and goal-side
  const tgt=theirs?{x:own.x+(myGoal-own.x)*.28,y:own.y+(MY-own.y)*.28}:{x:B.x+B.vx*10,y:B.y+B.vy*10};
  const score=p=>{let d=dist(p,tgt);if(theirs&&(p.x-own.x)*att>15)d+=(p.x-own.x)*att*1.2+60;if(p.fall>0||p.stun>12)d+=220;return d};
  let best=cur,bs=score(cur);const c0=bs;for(const p of outfield(tm)){const v=score(p);if(v<bs){bs=v;best=p}}
  if(best!==cur&&bs<c0*.7-12){if(tm){ctrl2=best;if(RS)RS.charging=false;swT2=40}else{ctrl=best;charging=false;swT=40;ring(best.x,best.y,C.mint)}}
}
function switchPlayer(manual){
  const cands=outfield(0).filter(p=>p!==ctrl);if(!cands.length)return;
  if(B.owner&&B.owner.team===0&&manual)return;
  let b=cands[0];for(const c of cands)if(dist(c,B)<dist(b,B))b=c;
  ctrl=b;charging=false;if(manual){S.tap();swT=70}
}

/* ---------- tackles ---------- */
const notBehind=(d,c)=>Math.cos(angDiff(Math.atan2(d.y-c.y,d.x-c.x),c.dir))>-.2;
const fromSide=(d,c)=>Math.cos(angDiff(Math.atan2(d.y-c.y,d.x-c.x),c.dir))>-.6;
const SLIDE_CD=360,LUNGE_CD=40,BLUNGE_CD=50;
// Tackle lunge: a committed stab at the ball. Touch the ball during it and you tackle; miss and you need a moment to recover.
function startLunge(p){if(koGrace(p)){pop('let them kick off',p.x,p.y-30,C.muted,13,40);return}p.lunge=13;p.slide=false;p.tackleCd=LUNGE_CD;p.lungeDir=Math.atan2(B.y-p.y,B.x-p.x);S.swoosh()}
// Ball lunge: a sharp burst with the ball glued to your feet, for shifting away from a defender
function ballLunge(p){if(p.blungeCd>0||p.stam<6||p.anim||p.stun>0)return;p.blungeCd=BLUNGE_CD;p.stam-=6;
  const ix=inX(),iy=inY(),a=(ix||iy)?Math.atan2(iy,ix):p.dir;push(p,a,7.4,13);p.lungeT=13;S.swoosh();grass(p.x,p.y,5)}
function tackle(def,car){
  if(car.keeper){def.tackleCd=30;def.lunge=0;return}
  if((car.ghost>0||car.anim==='bike')&&!def.inter){def.slide=false;def.aiSlide=0;def.aiLunge=0;def.lunge=0;whiff(def,46,car,true);return}
  def.tackleCd=def.team===1&&!hum(def)?75/DF.press:48;
  if(car.st.ab==='dribbler'&&!def.inter&&Math.random()<.2){def.slide=false;def.aiSlide=0;def.aiLunge=0;def.lunge=0;whiff(def,40,car,true);pop('RODE IT',car.x,car.y-36,car.team===0?C.sun:C.coral,16);return}
  const skilling=car.push&&car.push.T>0&&car.push.next;// only the feint itself can't be tackled; the burst past is fair game for anyone not fooled
  const early=car.animT>car.animMax*.45;
  const shielded=car.anim==='shield'||(!def.slide&&(((car.anim==='roul'||car.anim==='rainbow')&&early)||skilling));
  if(shielded&&!def.inter){def.slide=false;def.aiSlide=0;def.aiLunge=0;if(car.anim==='shield'){def.stun=30;if(car.team===0)addStyle(8,car.x,car.y,'BOUNCED OFF')}else whiff(def,48,car,true);return}
  const tk=def.st.tackle??.6,str=car.st.str??.6;
  // Where is the tackler relative to the carrier? In front of the ball = clean tackle; from behind = you have to go through them.
  const front=Math.cos(angDiff(Math.atan2(def.y-car.y,def.x-car.x),car.dir));
  const mySlide=def.slide&&(def.team===0||hum(def));
  const pos=front>.35?1:front>-.25?(mySlide?.9:def.slide?.8:.55):(mySlide?.5:def.slide?.4:.12);
  let ch;
  if(def.inter)ch=1;
  else{
    // timing matters: nick it on a heavy touch. Good dribblers keep it close and are hard to dispossess.
    const loose=B.owner===car?(B.loose||0):0,sk=car.st.skill??.6;
    ch=mySlide?.44+tk*.4+loose*.3-sk*.25-str*.1:def.slide?.2+tk*.4+loose*.25-sk*.3-str*.12:.3+tk*.5+loose*.5-sk*.3-str*.15;
    if(!hum(def)&&(def.team===0||pvp()))ch*=.85;// your AI teammates are a touch weaker than you; the opposition uses exactly your formula
    ch=clamp(ch,.06,.95)}
  if(!def.inter)ch*=pos;
  if(Math.random()<ch){
    if(def.team===1){if(def.slide)aiStat.slWon++;else aiStat.tkWon++}
    give(def);car.stun=def.slide?40:22;S.tackle();
    if(def.team===0){def.mT=(def.mT||0)+1;stats.tackles++;addHype(10);addStyle(def.slide||def.inter?20:10,def.x,def.y,def.inter?'INTERCEPTED':def.slide?'SLIDE TACKLE':'WON IT');ctrl=def;if(def.slide){shake=Math.max(shake,RM?0:5);slowmo(12,.45)}}
    else if(car.team===0){pop(def.slide?'SLID IN':'dispossessed',car.x,car.y-30,C.muted,15)}
  }else{if(def.slide)def.stun=60;else whiff(def,40,car,false);
    const sk=car.st.skill??.6,big=(car.st.str??.6)>.85;
    if(!def.slide&&(sk>.8||big)){knockDown(def,car,big?40:34,big);if(car.team===0){pop(big?'BOUNCED HIM':'SKINNED',def.x,def.y-20,C.coral,22);slowmo(14,.4);S.ooh()}}
    if(car.team===0){addStyle(12,car.x,car.y,def.slide?'HURDLED IT':'SHRUGGED OFF');addHype(6)}else pop(pos<.2?'from behind':pos<1?'wrong side':'missed',def.x,def.y-30,C.muted,14)}
  def.slide=false;def.inter=false;def.aiSlide=0;def.aiLunge=0;def.lunge=0;
}

/* ---------- movement ---------- */
function topSpeed(p){
  let s=(p.keeper?2.4:1.85+p.st.pace*1.85)*(1+(PSC-1)*.15);// PACE: ~45% faster at 99 than at 50; a touch quicker on the Expanded pitch
  if(B.owner===p)s*=.8+(p.st.skill??.6)*.1;// dribbling barely slows good dribblers, so you can run away from a chaser
  if(p.caughtT>0)s*=.8;
  if(p.sprint)s*=1.2+p.st.pace*.08;
  if(p.turbo>0)s*=p.sprint?1.08:1.42;
  else if(p.knockT>0)s*=KNOCK[4];// knock-on: explode after the ball
  if(p.anim==='shield')s*=.55;
  if(p.ghost>0)s*=1.1;
  if((B.lobTo===p||B.graceTo===p)&&B.lobThrough)s*=1.5;
  if(fire>0&&p.team===0)s*=1.07;
  return s;
}
function steer(p,tx,ty,spd,dt){
  const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy);let s=spd;if(d<24)s*=d/24;
  const vx=d>.5?dx/d*s:0,vy=d>.5?dy/d*s:0;
  const ik=hr('ice')?.04:.13;p.vx+=(vx-p.vx)*Math.min(1,ik*dt);p.vy+=(vy-p.vy)*Math.min(1,ik*dt);
}
function faceVel(p,dt){const sp=Math.hypot(p.vx,p.vy);if(sp>.4)p.dir+=angDiff(Math.atan2(p.vy,p.vx),p.dir)*Math.min(1,.25*dt)}

function humanUpdate(p,dt){
  let ax=inX(),ay=inY();const l=Math.hypot(ax,ay);if(l){ax/=l;ay/=l}
  if(p.lunge>0){p.lunge-=dt;const toBall=Math.atan2(B.y-p.y,B.x-p.x),a=!p.slide&&!p.inter?p.lungeDir+angDiff(toBall,p.lungeDir)*.65:p.slide?p.dir+angDiff(toBall,p.dir)*Math.min(1,.16*dt):toBall;
    const s=p.inter?9:p.slide?8*(p.lunge>6?1:.6):(p.lunge>5?6.4:2.6);p.vx=Math.cos(a)*s;p.vy=Math.sin(a)*s;p.dir=a;if((p.slide||p.inter)&&t%2<1)grass(p.x,p.y,1);
    const car=B.owner&&B.owner.team!==p.team&&!B.owner.keeper?B.owner:null;
    if(car&&!p.slide&&!p.inter&&dist(p,B)<23){
      // your lunge: catch the ball and it's yours, the carrier is dazed. Only a skill move mid-feint gets out of it.
      const feint=(car.push&&car.push.T>0)||car.anim==='shield'||car.ghost>0||car.anim==='bike',spin=(car.anim==='roul'||car.anim==='rainbow')&&car.animT>car.animMax*.45;
      if(feint||spin){p.lunge=0;whiff(p,40,null,false);p.locked=40;pop('dodged',car.x,car.y-30,C.muted,15)}
      else{give(p);p.mT=(p.mT||0)+1;car.stun=60;car.vx*=.2;car.vy*=.2;p.lunge=0;p.tackleCd=LUNGE_CD;S.tackle();shake=Math.max(shake,RM?0:4);if(p.team===0){stats.tackles++;addHype(10);addStyle(15,p.x,p.y)}pop('STOLEN!  +15',p.x,p.y-48,C.mint,28,70);hitStop(4);S.ooh();slowmo(12,.35);flash=RM?0:.25}}
    else if(car&&(dist(p,B)<(p.slide?28:p.inter?24:23)||(p.slide&&dist(p,car)<30))){tackle(p,car)}
    else if(!B.owner&&dist(p,B)<(p.slide?28:22)){if(p.slide){give(p);ctrl=p;B.vx=B.vy=0}p.lunge=0;p.slide=false;p.inter=false}
    if(p.lunge<=0&&p.slide){p.slide=false;p.stun=48;pop('up you get',p.x,p.y-28,C.muted,13)}
    if(p.lunge<=0&&!p.slide&&!p.inter&&B.owner!==p){whiff(p,30,null,false);p.locked=30;pop('whiff',p.x,p.y-28,C.muted,13)}// whiff: stuck in the lunge for a second
    if(p.lunge<=0)p.inter=false;
    return}
  if(B.lobTo===p||B.graceTo===p){const tx=(B.lobTo===p?B.lobX:B.x)-p.x,ty=(B.lobTo===p?B.lobY:B.y)-p.y,l=Math.hypot(tx,ty);if(l>5){ax=ax*.15+tx/l*.85;ay=ay*.15+ty/l*.85;const al=Math.hypot(ax,ay)||1;ax/=al;ay/=al}else{ax=0;ay=0}}
  else if(B.pass&&B.pass.to===p&&!B.owner&&Math.hypot(B.vx,B.vy)>1.5){
    // step onto the line of the pass: 75% assisted, 25% your input
    const sp=Math.hypot(B.vx,B.vy),ux=B.vx/sp,uy=B.vy/sp,u=Math.max(0,(p.x-B.x)*ux+(p.y-B.y)*uy),ix=B.x+ux*u,iy=B.y+uy*u;
    let tx=ix-p.x,ty=iy-p.y;const tl=Math.hypot(tx,ty);if(tl<6){tx=B.x-p.x;ty=B.y-p.y}const tl2=Math.hypot(tx,ty)||1;
    ax=ax*.25+tx/tl2*.75;ay=ay*.25+ty/tl2*.75;const al=Math.hypot(ax,ay)||1;ax/=al;ay/=al}
  p.sprint=false;// no sprint button: everyone runs at one steady pace, pace stat decides who's quicker
  if(p.sprint&&p.turbo<=0)p.stam=Math.max(0,p.stam-(.62-p.st.pace*.25)*dt);
  if(p.push&&p.push.T<=0&&p.push.next){const n=p.push.next;p.push={...n,max:n.T,next:null}}
  if(p.push&&p.push.T>0){const k=p.push.T/p.push.max,sp=p.push.spd*(.45+.55*k);p.vx=Math.cos(p.push.a)*sp;p.vy=Math.sin(p.push.a)*sp;p.push.T-=dt;
    if(p.anim!=='roul'&&p.anim!=='drag')p.dir+=angDiff(p.push.a,p.dir)*Math.min(1,.12*dt);if(t%2<dt)grass(p.x,p.y,1);if(charging)charge=Math.min(1,charge+.024*dt);return}
  const cur=Math.hypot(p.vx,p.vy);
  if((ax||ay)&&p.anim!=='drag'&&p.anim!=='shield'){const a=Math.atan2(ay,ax),turn=(B.owner===p?.17:.24)+(cur<1.5?.12:0);p.dir+=angDiff(a,p.dir)*Math.min(1,turn*dt)}
  const sp=topSpeed(p);
  if((B.lobTo===p||B.graceTo===p)&&B.lobThrough&&(ax||ay)){p.vx+=(ax*sp-p.vx)*Math.min(1,.35*dt);p.vy+=(ay*sp-p.vy)*Math.min(1,.35*dt)}
  if(p.anim==='elastico'){p.vx*=.92;p.vy*=.92}
  else{
    // gentle acceleration, firmer braking, and a sharp plant when you cut back the other way
    const cutting=(ax||ay)&&cur>.5&&(p.vx*ax+p.vy*ay)/cur<.15;
    if(cutting&&B.owner===p&&t-(p.cutT||-99)>18){p.cutT=t;p.pvx=p.vx;p.pvy=p.vy;if(cur>2.4){grass(p.x,p.y,6);S.tap()}}
    let k=!(ax||ay)?.17:cutting?.24:.1;if(hr('ice'))k*=.32;
    p.vx+=(ax*sp-p.vx)*Math.min(1,k*dt);p.vy+=(ay*sp-p.vy)*Math.min(1,k*dt)}
  if(charging){charge=Math.min(1.15,charge+.024*dt);
    if(p.aimY!=null){const c=openCorner(p.aimY,p.team);p.aimY+=(c-p.aimY)*Math.min(1,Math.max(.01,p.st.fin*.06)*dt);p.aimY=clamp(p.aimY+inY()*(7.5-charge*1.5)*dt,GY0-12,GY1+12);p.vx*=Math.pow(.9,dt);p.vy*=Math.pow(.9,dt);
      p.dir+=angDiff(Math.atan2(p.aimY-B.y,goalX(p.team)-B.x),p.dir)*Math.min(1,.3*dt)}}
}

// Where a player should stand right now: their formation spot, slid up/down the pitch with the ball
// and pulled a little towards the ball's side, with each role kept inside its own band.
/* ---------- AI decision quality ----------
   One number per side, 0..1, for how well the computer reads the game: Chill ~.15, Medium ~.42, Hard ~.72, Extreme ~.95
   (nudged by division). It changes decisions, not stats: interceptions, marking the dangerous runner, blocking lanes,
   spacing, runs into space, counters, through-ball timing and shot choice. Your own AI team-mates use a steady .6.
   Online both sides use the same value, so it stays fair. */
const wonT=[-999,-999],aiStat={icpt:0,icptWon:0,through:0,square:0,chip:0,corner:0,counter:0,sweeps:0,tkTry:0,tkWon:0,slTry:0,slWon:0};
function aiIQ(team){if(pvp())return .55;if(team===0)return .6;const b={chill:.15,normal:.42,hard:.72,extreme:.95}[club.level]??.42;return clamp(b+(DF.read||0)*.35-.04,0,1)}
const lastLine=(team,dir)=>{let v=-1e9;for(const q of outfield(team))v=Math.max(v,q.x*dir);return v};// deepest outfield player of `team`, measured along dir
// the open spot near a target: tries a few nearby points and keeps the one furthest from the opposition
function openSpot(p,tx,ty,att,r){let best={x:tx,y:ty},bv=-1;const opp=outfield(1-p.team);
  for(const [dx,dy] of [[0,0],[0,-r],[0,r],[att*r*.8,-r*.5],[att*r*.8,r*.5]]){const x=clamp(tx+dx,FX0+40,FX1-40),y=clamp(ty+dy,FY0+25,FY1-25);let m=1e9;for(const q of opp)m=Math.min(m,Math.hypot(q.x-x,q.y-y));
    const v=m-(dx||dy?6:0);if(v>bv){bv=v;best={x,y}}}return best}
/* ---------- Classical 9v9 team AI ----------
   On the big pitches the computer plays as a team rather than eight individuals. Defending: the defender who can get
   goal-side of the ball first engages (never trailing behind), jockeys and times his tackle for a heavy touch; a second
   man covers behind him; others block the obvious pass and pick up dangerous runners; the back line holds its shape and
   steps up; anyone beaten races back goal-side. Sliding tackles come when they're worth it: a forward through on goal, a
   shot being lined up, a runner getting away, and only from the side or front. Attacking: passes are chosen by how much
   ground they gain, how open the receiver is and how easily they could be cut out. Each club has a style (possession,
   counter-attack, high pressing, direct, wide play). Difficulty sets how sharp the decisions are, never pace or stats. */
const CSTY={possession:{n:'Possession',press:.95,line:.5,pass:1.3,long:.5,width:1,tempo:.9,shoot:.9},
  counter:{n:'Counter-attack',press:.8,line:.3,pass:.95,long:1.4,width:1,tempo:1.25,shoot:1.05},
  press:{n:'High pressing',press:1.3,line:.75,pass:1,long:.8,width:1,tempo:1.1,shoot:1},
  direct:{n:'Direct',press:1,line:.5,pass:.85,long:1.7,width:.9,tempo:1.25,shoot:1.2},
  wide:{n:'Wide play',press:1,line:.5,pass:1,long:1,width:1.3,tempo:1,shoot:.95},
  neutral:{n:'Balanced',press:1,line:.5,pass:1,long:1,width:1,tempo:1,shoot:1}};
const CL=()=>PITCH!=='volta';
function cStyle(team){if(team===0||NET.on)return CSTY.neutral;if(!OPP.style){const k=['possession','counter','press','direct','wide'];let h=7;for(const ch of String(OPP.name||''))h=(h*31+ch.charCodeAt(0))>>>0;OPP.style=k[h%k.length]}return CSTY[OPP.style]||CSTY.neutral}
// decision quality on the big pitches: Chill .3, Medium .58, Hard .82, Extreme 1 (a little higher in the top divisions)
function cIQ(team){if(pvp()||team===0)return .6;const b={chill:.3,normal:.58,hard:.82,extreme:1}[club.level]??.58;return clamp(b+(DF.read||0)*.3-.03,0,1)}
const lerp=(a,b,k)=>a+(b-a)*k;
// how loose his next touch will be in f frames (the same rhythm the tackle formula uses)
const looseAt=(o,f)=>{const psp=Math.hypot(o.vx||0,o.vy||0),amp=clamp(psp/2.6,0,1)*(17-(o.st.skill??.6)*12);return amp*Math.max(0,Math.sin((o.touchPh||0)+psp*.085*f))/17};
// the defender who can get goal-side of the carrier soonest (where the carrier will be, not where he is)
function cEngager(team,cands,o,sty){const ownGoal=team===0?FX0:FX1,vx=o.vx||0,vy=o.vy||0;let best=null,bs=1e9,bp=null;
  for(const p of cands){const ts=topSpeed(p),pen=(p.slot&&p.slot.r==='ATT'?8/sty.press:0)+(p.fall>0?30:0);
    for(let k=0;k<=64;k+=4){const px=clamp(o.x+vx*k,FX0+10,FX1-10),py=clamp(o.y+vy*k,FY0+10,FY1-10),dx=ownGoal-px,dy=MY-py,dg=Math.hypot(dx,dy)||1,gx=px+dx/dg*22,gy=py+dy/dg*22;
      if(Math.hypot(gx-p.x,gy-p.y)/ts+4<=k+2){const behind=((p.x-o.x)*dx+(p.y-o.y)*dy)/dg<-8?10:0,sc=k+behind+pen;if(sc<bs){bs=sc;best=p;bp={x:gx,y:gy}}break}}}
  if(!best){best=cands.reduce((a,b)=>dist(a,o)<dist(b,o)?a:b);const dx=ownGoal-o.x,dy=MY-o.y,dg=Math.hypot(dx,dy)||1;bp={x:o.x+dx/dg*22+vx*10,y:o.y+dy/dg*22+vy*10}}
  best.cPt=bp;return best}
// engage the ball carrier: get goal-side, jockey, and win it at the right moment
function cEngage(p,o,team,IQ,dt){const ownGoal=team===0?FX0:FX1,dxg=ownGoal-o.x,dyg=MY-o.y,dg=Math.hypot(dxg,dyg)||1,ux=dxg/dg,uy=dyg/dg;
  const rx=p.x-o.x,ry=p.y-o.y,d=Math.hypot(rx,ry),along=rx*ux+ry*uy,goalSide=along>-4,ts=topSpeed(p),front=Math.cos(angDiff(Math.atan2(ry,rx),o.dir));let tx,ty;
  if(!goalSide&&d<120){// beaten: race round his side to draw level, never tuck in behind him
    const sd=Math.sign(rx*(-uy)+ry*ux)||1;tx=o.x+ux*26+(-uy)*sd*18+(o.vx||0)*6;ty=o.y+uy*26+ux*sd*18+(o.vy||0)*6}
  else if(d>70){const P=p.cPt||{x:o.x+ux*22,y:o.y+uy*22};tx=P.x;ty=P.y}
  else{// jockey: between him and the goal, a stride off. He reads the carrier with a short delay (sharper sides react
    // quicker) and shuffles a little slower than a flat-out run, so a sharp cut, a skill or a change of pace can beat him.
    const tc=lerp(10,4,IQ),k=Math.min(1,dt/tc);if(p.jkO!==o){p.jkO=o;p.jx=o.x;p.jy=o.y;p.jvx=o.vx||0;p.jvy=o.vy||0}
    p.jx+=(o.x-p.jx)*k;p.jy+=(o.y-p.jy)*k;p.jvx+=((o.vx||0)-p.jvx)*k;p.jvy+=((o.vy||0)-p.jvy)*k;
    const off=lerp(24,15,IQ);tx=p.jx+ux*off+p.jvx*5;ty=p.jy+uy*off+p.jvy*5;steer(p,tx,ty,ts*lerp(.84,.95,IQ),dt);tx=null}
  if(tx!=null)steer(p,tx,ty,ts,dt);
  p.jockT=d<60&&goalSide?(p.jockT||0)+dt:0;
  if((p.cDec=(p.cDec||0)-dt)>0)return;p.cDec=lerp(8,3,IQ)+Math.random()*3;
  if(p.tackleCd>0||kickT>0||o.keeper||koGrace(p)||p.fall>0)return;
  const human=o===ctrl||o===ctrl2,shooting=human&&(o===ctrl?charging:!!(RS&&RS.charging)),csp=Math.hypot(o.vx||0,o.vy||0),dG=Math.hypot(ownGoal-o.x,MY-o.y),danger=dG<BOX*2.2;
  let others=0;for(const q of outfield(team)){if(q===p)continue;const a=(q.x-o.x)*ux+(q.y-o.y)*uy;if(a>10&&a<260*PSC&&Math.abs((q.x-o.x)*(-uy)+(q.y-o.y)*ux)<95*PSC)others++}
  const lastMan=others===0,wu=team===1&&o.team===0?[10,6,4,3][clamp(Math.round(LV().shift)+1,0,3)]:4;
  if(team===1&&o.team===0&&p.spCd<=0){
    if(p.st.sp==='stomp'&&d<95&&Math.random()<.25*IQ&&doStomp(p)){p.spCd=SPECIALS.stomp.cd*1.7;return}
    if(p.st.sp==='slide'&&d>25&&d<110&&notBehind(p,o)&&(lastMan||danger)&&Math.random()<.2+.3*IQ){p.spCd=spCdOf(p)*1.4;p.inter=true;p.aiLunge=16;p.lungeDir=Math.atan2(B.y-p.y,B.x-p.x);pop('INTERCEPTOR',p.x,p.y-34,C.coral,16);ring(p.x,p.y,C.coral);aiStat.tkTry++;return}}
  // sliding tackle: worth the risk when he's through, about to shoot or getting away; from the side or front only
  if(d>26&&d<74&&front>-.55&&t-(p.cSlideT||-999)>lerp(170,90,IQ)){let want=0;if(lastMan&&csp>1.5)want+=.45;if(shooting)want+=.55;if(!goalSide)want+=.3;if(danger)want+=.2;
    want*=lerp(.3,1,IQ)*(DF.slide||LV().extreme?1:.55);
    // sharper defenders time the slide for a loose touch rather than diving in on a ball glued to his foot
    if(IQ>.5)want*=looseAt(o,6)>.22?1.35:.55;
    if(Math.random()<want){p.windup=Math.max(3,wu-2);p.windSlide=true;p.tackleCd=LUNGE_CD;p.cSlideT=t;return}}
  // standing tackle: close, from the front or side, timed for his heavy touch (better sides wait for the moment)
  if(dist(p,B)<36&&front>-.25){const at=looseAt(o,wu+2),thr=lerp(.12,.4,IQ),stuck=p.jockT>lerp(70,35,IQ)&&csp<1.2;
    if(at>thr||stuck||(lastMan&&danger&&dist(p,B)<26)||Math.random()<.18*(1-IQ)){p.windup=wu;p.tackleCd=LUNGE_CD*2/DF.press;return}}}
// the second man: on the line between the ball and goal, close enough to step in when the first is beaten
function cCoverRun(p,o,team,IQ,dt){const ownGoal=team===0?FX0:FX1,dxg=ownGoal-o.x,dyg=MY-o.y,dg=Math.hypot(dxg,dyg)||1,shooting=(o===ctrl&&charging)||(o===ctrl2&&RS&&RS.charging);
  // he's lining up a shot: get into the line of it (closer for sharper sides) to block
  const cd=shooting&&dg<BOX*2.6?Math.min(dg*.5,lerp(70,40,IQ)):Math.min(dg*.55,lerp(125,80,IQ)*Math.sqrt(PSC));
  steer(p,o.x+dxg/dg*cd,o.y+dyg/dg*cd,topSpeed(p),dt);
  if(dist(p,B)<34&&p.tackleCd<=0&&kickT<=0&&!o.keeper&&notBehind(p,o)&&looseAt(o,4)>lerp(.2,.4,IQ)){p.windup=team===1&&o.team===0?4:2;p.tackleCd=LUNGE_CD*2/DF.press}}
// where a defender stands when he isn't engaging: a back line goal-side of the ball, midfield screening in front of it,
// everyone squeezed towards the ball's side; the line pushes up with the ball (higher for pressing sides)
function cDefSpot(p,team,sty){const own0=team===0?FX0:FX1,dir=team===0?1:-1,Wd=FX1-FX0,bx=clamp((B.x-own0)*dir/Wd,0,1),r=p.slot.r,y0=FY0+(FY1-FY0)*p.slot.y;
  const line=clamp(bx-lerp(.2,.13,sty.line),.07,.3+.16*sty.line),fx=r==='DEF'?line:r==='MID'?line+.13+(p.role==='cap'?-.04:0):Math.max(line+.27,.4-.1*(1-sty.line)+(sty.long>1.2?.06:0));
  const sq=r==='DEF'?.72:r==='MID'?.8:.9,pull=r==='DEF'?.32:r==='MID'?.38:.2;
  return{x:own0+dir*clamp(fx,.05,.8)*Wd,y:clamp(MY+(y0-MY)*sq+(B.y-MY)*pull,FY0+25,FY1-25)}}
// the carrier's most useful pass right now (used to block it, and by the carrier to choose it)
function cPassEval(p,IQ,sty,noise){const gx=goalX(p.team),dir=Math.sign(gx-p.x)||1,opp=outfield(1-p.team),Wd=FX1-FX0;let best=null,bv=-1e9;
  for(const m of outfield(p.team)){if(m===p)continue;const d=dist(p,m);if(d<55||d>(PITCH==='expanded'?720:600)*PSC)continue;
    const lead=d/35,rx=clamp(m.x+m.vx*lead,FX0+30,FX1-30),ry=clamp(m.y+m.vy*lead,FY0+30,FY1-30),lx=rx-p.x,ly=ry-p.y,L2=lx*lx+ly*ly||1;
    let risk=0,space=1e9;for(const q of opp){const u=clamp(((q.x-p.x)*lx+(q.y-p.y)*ly)/L2,0,1),dd=Math.hypot(p.x+lx*u-q.x,p.y+ly*u-q.y);risk+=Math.exp(-Math.pow(dd/(26*PSC),2))*(1.1-u*.4);space=Math.min(space,Math.hypot(q.x-rx,q.y-ry))}
    const prog=(rx-p.x)*dir/Wd,dG=Math.hypot(gx-rx,MY-ry);
    let v=prog*3.2*sty.tempo+Math.min(space,140)/140*1.1-risk*2.2*(1.2-.4*sty.pass)+(dG<BOX*1.6?.5:0)+(m.role==='att'?.15:0);
    if(noise)v+=(Math.random()-.5)*(1-IQ)*1.4;if(v>bv){bv=v;best=m}}
  return best?{m:best,v:bv}:null}
function homePos(p,attacking){
  const f=p.slot,bf=(B.x-FX0)/(FX1-FX0),prog=p.team===0?bf:1-bf;
  let fx=f.x+(prog-.45)*.5+(attacking?.08:-.06)+(tacOf(p.team).push-1)*(attacking?.16:.1);
  let lim={DEF:[.07,.55],MID:[.16,.74],ATT:[.28,.86]}[f.r];
  if(p.role==='att'){fx+=attacking?.17:.07;lim=[lim[0]+.08,Math.min(.9,lim[1]+.12)]}// attacking role: lives on the shoulder of the last man
  else if(p.role==='cap'){fx-=attacking?.15:.04;lim=[Math.max(.06,lim[0]-.05),Math.min(lim[1],.46)]}// captain: holds the line, rarely crosses halfway
  fx=clamp(fx,lim[0],lim[1]);
  const y0=FY0+(FY1-FY0)*f.y,ty=y0+(B.y-y0)*(f.r==='DEF'?.38:.25);
  return{x:p.team===0?FX0+fx*(FX1-FX0):FX1-fx*(FX1-FX0),y:clamp(ty,FY0+25,FY1-25)};
}
function teamAI(team,dt){
  const own=outfield(team),opp=1-team,owner=B.owner,att=team===0?1:-1,ownGoal=team===0?FX0:FX1;
  const ai=own.filter(p=>!(team===0&&p===ctrl)&&p!==ctrl2);
  const hasBall=owner?owner.team===team:lastPoss===team&&B.pass&&B.pass.from.team===team;
  const theyHave=owner&&owner.team===opp;
  // online: whoever has the ball for the joining player's team is theirs, even if he's stunned or mid-move
  if(NET.on&&team===1&&owner&&owner.team===1&&!owner.keeper&&owner!==ctrl2)setCtrl2(owner);
  const chipIn=!owner&&B.lobTo&&B.lobTo.team!==team&&B.pass&&B.pass.chip;// they've chipped it: someone go and attack where it drops
  let chaser=null,cover=null;const IQ=aiIQ(team),CLs=CL(),IQc=CLs?cIQ(team):IQ,STY=CLs?cStyle(team):null;for(const p of ai){p.icpt=null;p.cBlock=null}
  if(!owner||(theyHave&&!owner.keeper)){
    const target=owner||(chipIn?{x:B.lobX,y:B.lobY}:{x:B.x+B.vx*8,y:B.y+B.vy*8});
    const cands=ai.filter(p=>p.stun<=0);
    if(B.pass&&!owner){const r=cands.find(p=>p===B.pass.to);if(r)chaser=r}
    // their pass is rolling: the defender who can cut it out first goes for the interception point (better sides read it more often)
    if(!chaser&&!owner&&B.pass&&B.pass.from&&B.pass.from.team===opp&&!B.lobTo&&B.z<12&&cands.length){const P0=B.pass;P0.read=P0.read||{};if(P0.read[team]==null)P0.read[team]=Math.random()<.3+.65*IQ;
      if(P0.read[team]){const pts=ballPathPts(60,3),rcv=P0.to;let bp=null,bq=null,bm=1e9;
        for(const q of pts){if(q.i<3)continue;const tr=rcv?runT(rcv,q.x,q.y,topSpeed(rcv),2):1e9;for(const c of cands){const tc=runT(c,q.x,q.y,topSpeed(c),4);if(tc<=q.i+2&&tc<tr-2&&tc<bm){bm=tc;bp=c;bq=q}}if(bp)break}
        if(bp){chaser=bp;bp.icpt={x:bq.x,y:bq.y};if(team===1&&!P0.cnt){P0.cnt=1;aiStat.icpt++}}}}
    if(!chaser&&cands.length){chaser=cands.reduce((a,b)=>dist(a,target)<dist(b,target)?a:b);
      if(team===0&&ctrl&&dist(ctrl,target)<dist(chaser,target)+(theyHave?120:50))chaser=null}
    // a second defender drops goal-side of the ball to stop the carrier running straight through
    if(theyHave){const near=Math.abs(owner.x-ownGoal)<(FX1-FX0)*.33,f=near?.3:.55,gs={x:owner.x+(ownGoal-owner.x)*f,y:owner.y+(MY-owner.y)*f+(team===1&&near?(owner.y<MY?1:-1)*10:0)};
      const cc=cands.filter(p=>p!==chaser);if(cc.length)cover=cc.reduce((a,b)=>dist(a,gs)<dist(b,gs)?a:b);if(cover)cover.coverPt=gs}
    // Classical: the engager is whoever gets goal-side first; the cover sits on the line to goal behind him
    if(CLs&&theyHave&&cands.length){chaser=cEngager(team,cands,owner,STY);
      if(team===0&&ctrl&&dist(ctrl,owner)<dist(chaser,owner)+90)chaser=null;
      const cc=cands.filter(p=>p!==chaser);cover=null;if(cc.length){const dxg=ownGoal-owner.x,dyg=MY-owner.y,dg=Math.hypot(dxg,dyg)||1,cd=Math.min(dg*.55,lerp(125,80,IQc)*Math.sqrt(PSC)),gp={x:owner.x+dxg/dg*cd,y:owner.y+dyg/dg*cd};cover=cc.reduce((a,b)=>dist(a,gp)<dist(b,gp)?a:b)}}
  }
  const attackers=outfield(opp).filter(q=>q!==owner);const taken=new Set();
  // marking: the most dangerous free runners (closest to goal) are picked up first, each by the nearest free defender
  const markOf=new Map();if(!hasBall){const free=ai.filter(p=>p!==chaser&&p!==cover&&p.stun<=0),R=(150+130*IQ)*PSC;
    const homes=new Map(free.map(p=>[p,CLs?cDefSpot(p,team,STY):homePos(p,false)]));
    if(CLs&&theyHave&&!owner.keeper&&free.length&&Math.random()<.35+.65*IQc){const ev=cPassEval(owner,1,cStyle(opp),false);
      if(ev&&ev.m){const bx=owner.x+(ev.m.x-owner.x)*.45,by=owner.y+(ev.m.y-owner.y)*.45;let bd=null,bv=1e9;for(const d of free){const v=Math.hypot(d.x-bx,d.y-by);if(v<bv){bv=v;bd=d}}
        if(bd&&bv<260*PSC){bd.cBlock={x:bx,y:by};markOf.set(bd,ev.m)}}}
    for(const q of [...attackers].sort((a,b)=>Math.abs(a.x-ownGoal)-Math.abs(b.x-ownGoal))){let bd=null,bv=1e9;
      if([...markOf.values()].includes(q))continue;
      for(const d of free){if(markOf.has(d))continue;const h=homes.get(d),v=Math.hypot(q.x-h.x,q.y-h.y)*.6+dist(d,q)*.4;if(Math.hypot(q.x-h.x,q.y-h.y)<R&&v<bv){bv=v;bd=d}}
      if(bd)markOf.set(bd,q)}}
  const counter=hasBall&&t-wonT[team]<150&&IQ>.2&&owner&&outfield(opp).filter(q=>(q.x-B.x)*att>0).length<=Math.floor(outfield(opp).length/2);
  for(const p of ai){
    p.sprint=false;
    if(p.stun>0){p.stun-=dt;p.vx*=.9;p.vy*=.9;continue}
    if(kickT>0){steer(p,p.x,p.y,0,dt);continue}
    if(p===owner&&p.wallTo){p.wallT-=dt;p.vx*=.8;p.vy*=.8;if(p.wallT<=0){const r=p.wallTo;p.wallTo=null;pass(p,r,true);B.pass.wall=true}continue}
    if(p.lobRun&&(B.lobTo===p||B.graceTo===p)){steer(p,p.lobRun.x,p.lobRun.y,topSpeed(p)*1.3,dt);continue}
    if(p.push&&p.push.T<=0&&p.push.next){const n=p.push.next;p.push={...n,max:n.T,next:null}}
    if(p.push&&p.push.T>0){const k=p.push.T/p.push.max,sp=p.push.spd*(.45+.55*k);p.vx=Math.cos(p.push.a)*sp;p.vy=Math.sin(p.push.a)*sp;p.push.T-=dt;
      if(p.anim!=='roul'&&p.anim!=='drag')p.dir+=angDiff(p.push.a,p.dir)*Math.min(1,.12*dt);continue}
    if(p===owner){if(team===1){if(NET.on){setCtrl2(p);continue}carrierAI(p,dt)}continue}
    if(team===1&&owner&&owner.team===0&&!owner.keeper&&!p.aiLunge&&p.stun<=0&&p.fall<=0&&p.tackleCd<=0&&t-(owner.cutT||-99)<6&&dist(p,owner)<75&&p.bitCut!==owner.cutT){
      p.bitCut=owner.cutT;if(Math.random()<LV().bite){p.aiLunge=13;p.bit=true;aiStat.tkTry++;p.tackleCd=LUNGE_CD*2;p.lungeDir=Math.atan2(owner.y+(owner.pvy||0)*12-p.y,owner.x+(owner.pvx||0)*12-p.x);continue}}
    if(koGrace(p)){p.windup=0}
    if(p.windup>0){p.windup-=dt;p.vx*=.8;p.vy*=.8;p.dir=Math.atan2(B.y-p.y,B.x-p.x);
      if(p.windup<=0){const o=B.owner;if(o&&o.team!==team&&!o.keeper&&dist(p,o)<(p.windSlide?70:48)){
        if(p.windSlide){p.aiSlide=16;p.slide=true;p.dir=Math.atan2(o.y+o.vy*6-p.y,o.x+o.vx*6-p.x);if(team===1)aiStat.slTry++}else{p.aiLunge=13;p.lungeDir=Math.atan2(B.y-p.y,B.x-p.x);if(team===1)aiStat.tkTry++}}p.windSlide=false}
      continue}
    if(p.aiLunge>0){p.aiLunge-=dt;const tb=Math.atan2(B.y-p.y,B.x-p.x),a=p.lungeDir+angDiff(tb,p.lungeDir)*(p.inter?1:p.bit?.04:.4),sp=p.inter?8.5:p.aiLunge>5?6.4:2.6;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;p.dir=a;
      if(!p.bit&&owner&&owner.team!==team&&!owner.keeper&&dist(p,B)<23&&notBehind(p,owner)){p.aiLunge=0;tackle(p,owner);p.bit=false}else if(p.aiLunge<=0){p.inter=false;p.bit=false;if(owner&&owner.team!==team&&dist(p,owner)<70)whiff(p,50,owner,true);else p.stun=14}continue}
    if(p.aiSlide>0){p.aiSlide-=dt;p.vx=Math.cos(p.dir)*7.2;p.vy=Math.sin(p.dir)*7.2;if(t%2<1)grass(p.x,p.y,1);
      if(owner&&owner.team!==team&&!owner.keeper&&(team===1?fromSide(p,owner):notBehind(p,owner))&&(dist(p,B)<22||dist(p,owner)<25))tackle(p,owner);
      if(p.aiSlide<=0&&p.slide){p.slide=false;p.stun=40}continue}
    if(p.shadow>0&&owner===p.shadowOf){p.shadow-=dt;const f={x:B.x+Math.cos(owner.dir)*12,y:B.y+Math.sin(owner.dir)*12};
      p.vx=owner.vx*.92+(f.x-p.x)*.12;p.vy=owner.vy*.92+(f.y-p.y)*.12;
      if(dist(p,B)<20&&p.tackleCd<=0&&notBehind(p,owner))tackle(p,owner);continue}
    if(CLs&&theyHave&&p===chaser){cEngage(p,owner,team,IQc,dt);continue}
    if(CLs&&theyHave&&p===cover){cCoverRun(p,owner,team,IQc,dt);continue}
    if(p===chaser&&team===1&&owner&&owner.team===0&&owner.x<MIDX-20-(DF.press-.5)*260){
      const a=Math.atan2(MY-owner.y,FX1-owner.x);steer(p,owner.x+Math.cos(a)*60,owner.y+Math.sin(a)*60,topSpeed(p)*.8,dt);continue}
    if(p===chaser){
      let tgt=owner?{x:B.x+Math.cos(owner.dir)*10,y:B.y+Math.sin(owner.dir)*10}:chipIn?{x:B.lobX,y:B.lobY}:p.icpt?p.icpt:{x:B.x+B.vx*6,y:B.y+B.vy*6};
      // you're strolling with it: they don't just trail you, they get round in front and win it
      const csp=owner?Math.hypot(owner.vx,owner.vy):9,slow=team===1&&owner&&owner.team===0&&!owner.keeper&&csp<topSpeed(p)*1.02,side=owner?Math.cos(angDiff(Math.atan2(p.y-owner.y,p.x-owner.x),owner.dir)):1;
      // caught you from behind: draw level on your shoulder (not tucked in behind), ready to slide or nick it
      const trailing=slow&&side<-.1&&dist(p,owner)<160;
      if(trailing){const sd=Math.sign(Math.sin(angDiff(Math.atan2(p.y-owner.y,p.x-owner.x),owner.dir)))||1,a=owner.dir+sd*Math.PI/2;tgt={x:owner.x+Math.cos(owner.dir)*14+Math.cos(a)*20,y:owner.y+Math.sin(owner.dir)*14+Math.sin(a)*20}}
      if(team===1&&p.st.sp==='stomp'&&p.spCd<=0&&owner&&owner.team===0&&!owner.keeper&&dist(p,owner)<95&&Math.random()<.02*dt&&doStomp(p)){p.spCd=SPECIALS.stomp.cd*1.7;continue}
      if(team===1&&p.st.sp==='slide'&&p.spCd<=0&&owner&&owner.team===0&&!owner.keeper&&dist(p,owner)<110&&dist(p,owner)>25&&notBehind(p,owner)&&Math.random()<.015*dt){
        p.spCd=spCdOf(p)*1.4;p.inter=true;p.aiLunge=16;p.lungeDir=Math.atan2(B.y-p.y,B.x-p.x);pop('INTERCEPTOR',p.x,p.y-34,C.coral,16);ring(p.x,p.y,C.coral);continue}
      if(team===1&&owner&&owner.team===0&&!owner.keeper&&p.tackleCd<=0&&dist(p,owner)>(slow?20:28)&&dist(p,owner)<(slow?75:60)&&side>(slow?-.55:.3)&&Math.random()<(LV().extreme?.006:DF.slide?.0035:.0016)*(slow?(side<.3?9:3.5):1)*dt){p.windup=slow?5:10;p.windSlide=true;p.tackleCd=LUNGE_CD;continue}
      steer(p,tgt.x,tgt.y,topSpeed(p)*(trailing?1.16:slow?.92:team===1&&owner?(.72+.15*DF.press)*(1+(LV().ai-1)*.6):1)*Math.min(1.15,tacOf(team).press),dt);
      if(owner&&dist(p,B)<34&&p.tackleCd<=0&&kickT<=0&&notBehind(p,owner)&&((B.loose||0)>.38-DF.read||Math.random()<(team===1?.006*LV().ai*(slow?3.5:1):.012)*dt*(!cover&&Math.abs(p.x-ownGoal)<(FX1-FX0)*.3?1-.55*IQ:1))){if(team===1&&owner.team===0){p.windup=[10,6,4,3][clamp(Math.round(LV().shift)+1,0,3)];p.tackleCd=LUNGE_CD*2/DF.press}else{p.aiLunge=13;p.tackleCd=LUNGE_CD*2/DF.press;p.lungeDir=Math.atan2(B.y-p.y,B.x-p.x)}}
      continue;
    }
    if(p===cover){steer(p,p.coverPt.x,p.coverPt.y,topSpeed(p)*(team===1?.86:.95),dt);
      if(owner&&dist(p,B)<34&&p.tackleCd<=0&&kickT<=0&&notBehind(p,owner)&&((B.loose||0)>.38-DF.read||Math.random()<(team===1?.006*LV().ai:.012)*dt)){if(team===1&&owner.team===0){p.windup=[10,6,4,3][clamp(Math.round(LV().shift)+1,0,3)];p.tackleCd=LUNGE_CD*2/DF.press}else{p.aiLunge=13;p.tackleCd=LUNGE_CD*2/DF.press;p.lungeDir=Math.atan2(B.y-p.y,B.x-p.x)}}continue}
    let tx,ty,spd;
    if(hasBall){
      const h=homePos(p,true);tx=h.x;ty=h.y;
      if((p.slot.r==='ATT'||p.role==='att')&&owner)tx+=att*(30+Math.sin(t*.02+p.i)*30)+(p.role==='att'?att*40:0);
      // Classical: runners go beyond the ball and wide players hold the width, so there's always a pass on
      if(PITCH!=='volta'&&owner&&owner!==p){const ahead=(owner.x-p.x)*att;if(p.slot.r!=='DEF'&&ahead>-40)tx+=att*(70+Math.sin(t*.015+p.i*1.7)*50)*PSC*tacOf(team).push;
        {const wd=STY&&STY.width>1.1?.3:.22;if(p.slot.y<wd||p.slot.y>1-wd)ty=FY0+(FY1-FY0)*(p.slot.y<.5?.1:.9)}}
      // counter-attack: they've just won it and you're short at the back, so the forwards sprint into the space
      if(counter&&p.slot.r!=='DEF'){tx+=att*110*PSC;if(!CLs)p.sprint=true}
      // around the box: one attacks the near post, one the far post, the rest the edge of the box for a cut-back
      const tg=team===0?FX1:FX0;
      if(owner&&owner!==p&&p.slot.r!=='DEF'&&Math.abs(owner.x-tg)<BOX*1.7){const runners=ai.filter(q=>q.slot.r!=='DEF'&&q!==owner).sort((a,b)=>Math.abs(a.x-tg)-Math.abs(b.x-tg)),k=runners.indexOf(p),bs=owner.y<MY?-1:1;
        const spot=k===0?{x:tg-att*55*PSC,y:MY+bs*40}:k===1?{x:tg-att*70*PSC,y:MY-bs*55}:{x:tg-att*BOX*1.05,y:MY+(k%2?-1:1)*60};const w=.35+.55*IQ;tx+=(spot.x-tx)*w;ty+=(spot.y-ty)*w}
      // Classical: the nearest midfielder or defender offers a short angled pass to a team-mate who's being closed down
      if(CLs&&owner&&owner!==p&&p.slot.r!=='ATT'&&openness(owner)<75&&ai.filter(q=>q!==owner&&q.slot.r!=='ATT').sort((a,b)=>dist(a,owner)-dist(b,owner))[0]===p){
        const sd=p.y<owner.y?-1:1,w=.3+.6*IQc;tx+=(owner.x-att*70*PSC-tx)*w;ty+=(owner.y+sd*85*PSC-ty)*w}
      // find a pocket of space near the run instead of standing next to a defender (re-checked a few times a second)
      if(owner&&owner!==p&&p.slot.r!=='DEF'){if((p.runT=(p.runT||0)-dt)<=0){p.runT=10+rnd(0,6);p.runPt=Math.random()<.25+.7*IQ?openSpot(p,tx,ty,att,55*PSC):null;p.runB={x:tx,y:ty}}
        if(p.runPt){tx+=p.runPt.x-p.runB.x;ty+=p.runPt.y-p.runB.y}}
      if(owner&&dist({x:tx,y:ty},owner)<80){ty+=(ty<owner.y?-1:1)*60}
      spd=topSpeed(p)*(p.turbo>0||p.sprint||(CLs&&counter&&p.slot.r!=='DEF')?1:.85);
    }else{
      const h=CLs?cDefSpot(p,team,STY):homePos(p,false);let m=markOf.get(p);
      if(!m&&IQ<.3){let md=150*PSC;for(const q of attackers){if(taken.has(q))continue;const d=Math.hypot(q.x-h.x,q.y-h.y);if(d<md){md=d;m=q}}}
      if(m){taken.add(m);
        // goal-side of the runner, reading where he's going, and leaning into the passing lane from the ball
        const L=8*IQ,mx=m.x+m.vx*L,my=m.y+m.vy*L;let gx2=mx+(ownGoal-mx)*.2,gy2=my+(MY-my)*.2;
        if(owner&&owner.team===opp){const l=.4*IQ,lx=mx+(owner.x-mx)*.28,ly=my+(owner.y-my)*.28;gx2+=(lx-gx2)*l;gy2+=(ly-gy2)*l}
        // their through ball is on: track the run, don't watch the ball
        if(B.pass&&B.pass.through&&B.pass.to===m&&B.pass.from&&B.pass.from.team===opp){gx2=m.x+(ownGoal-m.x)*.1;gy2=m.y;p.sprint=!CLs&&IQ>.3}
        // blocking the carrier's best pass: stand in the lane
        if(p.cBlock){gx2=p.cBlock.x;gy2=p.cBlock.y}
        tx=gx2;ty=gy2;spd=CLs?topSpeed(p)*(Math.hypot(tx-p.x,ty-p.y)>60?1:.9):topSpeed(p)*(team===1?.76+.2*DF.press:1)*.95*(p.sprint?1.12:1)}
      else{tx=h.x;ty=h.y;spd=topSpeed(p)*.85;
        // beaten (the ball is between him and his goal): race back goal-side at full pace
        if(CLs&&(B.x-p.x)*att<-30)spd=topSpeed(p)}
    }
    // spacing: don't bunch up on top of a team-mate (the ball-chaser and cover are left alone)
    {const R=(46+30*IQ)*PSC;for(const q of own){if(q===p)continue;const dx=tx-q.x,dy=ty-q.y,d=Math.hypot(dx,dy);if(d<R&&d>.1){const f=(R-d)/R*R*.6;tx+=dx/d*f;ty+=dy/d*f}}}
    steer(p,clamp(tx,FX0+40,FX1-40),clamp(ty,FY0+25,FY1-25),spd,dt);
  }
}
function carrierAI(p,dt){
  const gx=goalX(p.team),defs=outfield(1-p.team);
  let nd=null,ndd=1e9;for(const q of defs){const d=dist(q,p);if(d<ndd){ndd=d;nd=q}}
  const dG=Math.hypot(p.x-gx,p.y-MY);p.dec-=dt;const IQ=aiIQ(p.team),dir0=Math.sign(gx-p.x)||1;
  if(p.dec<=0){
    p.dec=(13-5*IQ)+rnd(0,9-4*IQ);
    // a team-mate is running in behind (level with or past their last defender): slide him in
    if(Math.random()<.2+.6*IQ){const ll=lastLine(1-p.team,dir0);let tm=null,tb=-1e9;
      for(const m of outfield(p.team)){if(m===p)continue;const fwd=(m.x-p.x)*dir0,run=m.vx*dir0,d=dist(p,m);if(fwd<30||run<1.2||d>520*PSC||m.x*dir0<ll-50)continue;
        const lead={x:m.x+dir0*90,y:m.y+m.vy*20};if(laneBlocked(p,lead,22,p.team))continue;const sc=run+fwd/150-Math.abs(m.y-MY)/300;if(sc>tb){tb=sc;tm=m}}
      if(tm&&Math.hypot(tm.x-gx,tm.y-MY)<dG+60){pass(p,tm,true);if(p.team===1)aiStat.through++;return}}
    if(dG<(DF.range+40)*(CL()?cStyle(p.team).shoot:1)){const open=!laneBlocked(p,{x:gx,y:MY},18,p.team);
      // shooting lane blocked: a smarter side squares it to a team-mate with a clear sight of goal
      if(!open&&Math.random()<.15+.6*IQ){let sm=null,sd=1e9;for(const m of outfield(p.team)){if(m===p)continue;const md=Math.hypot(m.x-gx,m.y-MY);if(md<dG+40&&md<sd&&openness(m)>40&&!laneBlocked(m,{x:gx,y:MY},18,p.team)&&!laneBlocked(p,m,20,p.team)){sd=md;sm=m}}if(sm){pass(p,sm);if(p.team===1)aiStat.square++;return}}const ch=(open?.7:.26)*DF.shoot*(dG<230?1.9:1)*(ndd<30?.7:1)*LV().ai;if(Math.random()<ch){aiShoot(p,dG);return}}
    if(Math.abs(p.x-gx)<120){const m=bestMate(p);if(m&&Math.random()<.5){pass(p,m);return}aiShoot(p,dG);return}// never dribble into the byline
    if(CL()&&Math.random()<.45+.55*cIQ(p.team)){const sty=cStyle(p.team),IQc=cIQ(p.team),ev=cPassEval(p,IQc,sty,true);
      let ahead=1e9;for(const q of defs)if((q.x-p.x)*dir0>-10&&Math.abs(q.y-p.y)<120)ahead=Math.min(ahead,dist(q,p));
      const keep=Math.min(ahead,220)/220*1.3-(ndd<50?.6:ndd<90?.25:0)+(dG<DF.range+80?.3:0);
      if(ev&&ev.v>keep+lerp(.35,.05,IQc)/sty.pass){const m=ev.m,thr=m.vx*dir0>1.2&&m.x*dir0>lastLine(1-p.team,dir0)-60;pass(p,m,thr);if(thr&&p.team===1)aiStat.through++;return}}
    if(ndd<44){const m=bestMate(p);if(m&&Math.random()<.5*DF.press){pass(p,m);return}
}
    // on the big pitch the ball does the work: find a team-mate further up who's free and play it forward
    if(PITCH!=='volta'&&dG>DF.range){const dir=Math.sign(gx-p.x);let fm=null,fs=-1e9;
      for(const m of outfield(p.team)){if(m===p)continue;const fwd=(m.x-p.x)*dir,d=dist(p,m);if(fwd<50||d>560*PSC)continue;const o=openness(m);if(o<38||laneBlocked(p,m,24,p.team))continue;
        const sc=fwd/140+o/70-d/700+(Math.abs(m.y-MY)<(FY1-FY0)*.25?.3:0);if(sc>fs){fs=sc;fm=m}}
      if(fm&&Math.random()<(ndd<110?.65:.32)*(.8+DF.press*.3)*tacOf(p.team).pass){pass(p,fm);return}
      // a long ball over the top or across to a forward who's got away from his man (more of these on the Expanded pitch)
      if(!fm||Math.random()<.4){let lm=null,ls=-1e9;for(const m of outfield(p.team)){if(m===p)continue;const fwd=(m.x-p.x)*dir,d=dist(p,m);if(fwd<200||d>760*PSC||d<220)continue;const o=openness(m);if(o<45)continue;const sc=fwd/200+o/60;if(sc>ls){ls=sc;lm=m}}
        if(lm&&Math.random()<(.18+(PSC-1)*.5)*tacOf(p.team).pass*cStyle(p.team).long){const T=clamp(dist(p,lm)/7.5,38,78);lobTo(p,lm,lm.x+dir*45+lm.vx*T*.5,lm.y+lm.vy*T*.5,T,false);B.pass.chip=true;pop('LONG BALL',p.x,p.y-34,p.team===0?C.sun:C.coral,15,50);return}}
      // switch it to the far side when the near side is crowded
      if(ndd<120&&Math.random()<.25){const far=outfield(p.team).filter(m=>m!==p&&Math.abs(m.y-p.y)>(FY1-FY0)*.4&&openness(m)>45&&!laneBlocked(p,m,24,p.team));if(far.length){pass(p,pick(far));return}}}
    // their own skill move when someone closes them down
    if(nd&&ndd<95&&p.skillCd<=0&&!p.anim&&Math.random()<.55+DF.press*.3){doSkill(p);if(p.skillCd>0)return}
    if(nd&&ndd<80&&(p.blungeCd||0)<=0&&!p.anim&&Math.random()<.45){const side=Math.sin(angDiff(Math.atan2(nd.y-p.y,nd.x-p.x),p.dir))>0?-1:1,a=p.dir+side*.75;push(p,a,7.4,13,{a:p.dir,spd:6,T:10});p.blungeCd=BLUNGE_CD*1.4;S.swoosh();grass(p.x,p.y,5);return}
    if(p.spCd<=0&&aiSpecial(p,dG,ndd))return;
    if(Math.abs(p.y-MY)>(FY1-FY0)*.15&&Math.abs(p.x-gx)<460&&Math.random()<.4&&outfield(p.team).some(m=>m!==p&&Math.hypot(gx-m.x,MY-m.y)<300)){p.dir=Math.atan2(MY-p.y,gx-p.x);cross(p);return}
    if(Math.random()<.05){const m=bestMate(p);if(m&&m.x<p.x-50){pass(p,m);return}}
  }
  const dir=Math.sign(gx-p.x)||1;
  // head for the edge of the box (not the byline), drifting central
  let tx=gx-dir*150,ty=MY+Math.sin(t*.012+p.i)*70;
  const wide=Math.abs(p.y-MY)>(FY1-FY0)*.32;
  if(nd&&ndd<95&&(nd.x-p.x)*dir>-15){
    // go round the defender, but never towards the touchline when already out wide
    let side=p.y<nd.y?-1:1;if(wide)side=p.y<MY?1:-1;ty=clamp(p.y+side*90,FY0+60,FY1-60);tx=p.x+dir*50}
  else if(wide)ty=p.y+(MY-p.y)*.5;
  // boxed in or crawling along the wall: move it on
  const sp=Math.hypot(p.vx,p.vy);p.stuckT=sp<1.2||(wide&&ndd<60)?(p.stuckT||0)+dt:Math.max(0,(p.stuckT||0)-dt);
  if(p.stuckT>28){p.stuckT=0;const m=bestMate(p)||outfield(p.team).filter(q=>q!==p).sort((a,b)=>Math.abs(a.y-MY)-Math.abs(b.y-MY))[0];if(m){pass(p,m);return}}
  steer(p,tx,clamp(ty,FY0+60,FY1-60),topSpeed(p),dt);
}
// the opposition fires its ultimates too: shots from range, turbo into space, through balls
function aiSpecial(p,dG,ndd){const sp=p.st.sp,def=SPECIALS[sp];if(!def)return false;const IQ=aiIQ(p.team),smart=Math.random()<IQ,gx0=goalX(p.team),dir=Math.sign(gx0-p.x)||1;
  if(['curler','rocket','knuckle','chip'].includes(sp)){if(dG>DF.range+170||Math.random()>.68)return false;
    if(smart&&sp!=='chip'&&sp!=='curler'&&laneBlocked(p,{x:gx0,y:MY},18,p.team))return false;// smart sides save the strike for a clear sight of goal
  }
  if(smart&&sp==='turbo'&&outfield(1-p.team).some(q=>(q.x-p.x)*dir>0&&(q.x-p.x)*dir<170&&Math.abs(q.y-p.y)<70))return false;// no space to run into
  if(smart&&sp==='through'&&!outfield(p.team).some(m=>m!==p&&m.vx*dir>1&&(m.x-p.x)*dir>20))return false;// nobody making the run
  if(['curler','rocket','knuckle','chip'].includes(sp)){
    const k=keeperOf(1-p.team),gx=goalX(p.team),ty=sp==='chip'?MY+rnd(-18,18):(k.y>MY?GY0+12:GY1-12);
    p.spCd=spCdOf(p)*1.5;p.dir=Math.atan2(ty-B.y,gx-B.x);pop(def.name,p.x,p.y-34,C.coral,20,70);S.special();shoot(p,sp,.85,ty);return true}
  if(sp==='turbo'&&ndd>70&&Math.random()<.4){p.spCd=spCdOf(p)*1.5;p.turbo=150;pop('TURBO',p.x,p.y-34,C.coral,16);return false}
  if(sp==='through'&&dG<620&&Math.random()<.35&&doThrough(p)){p.spCd=spCdOf(p)*1.5;return true}
  if(sp==='lob'&&Math.random()<.3&&doLob(p)){p.spCd=spCdOf(p)*1.5;return true}
  if(sp==='onetwo'&&ndd<90&&Math.random()<.5&&doOneTwo(p)){p.spCd=def.cd*1.5;return true}
  if(sp==='ghost'&&ndd<85&&Math.random()<.5&&doGhost(p)){p.spCd=def.cd*1.5;return false}
  if(sp==='bicycle'&&bikeReady(p)&&Math.random()<.6&&doBicycle(p)){p.spCd=spCdOf(p)*1.5;return true}
  return false}
function aiShoot(p,dG){
  const k=keeperOf(1-p.team),gx=goalX(p.team);
  const IQ=aiIQ(p.team);let c=k.y>MY?GY0+12:GY1-12;
  // the far corner from the keeper, unless a body is in the way and the other corner is clear
  if(Math.random()<.2+.7*IQ){const o=c===GY0+12?GY1-12:GY0+12;if(laneBlocked(p,{x:gx,y:c},14,p.team)&&!laneBlocked(p,{x:gx,y:o},14,p.team))c=o}
  const ty=c+rnd(-1,1)*DF.err*.75*(dG/200);
  const kOut=Math.abs(k.x-gx);
  let type='normal';const ch=rnd(.55,1);
  const r=Math.random();if(kOut>60&&dG<340&&r<.3+.6*IQ){type='chip';if(p.team===1)aiStat.chip++}else if(dG<190&&kOut>36&&r<.3)type='chip';else if(dG<260&&r<.22)type='curler';
  p.dir=Math.atan2(ty-B.y,gx-B.x);shoot(p,type,ch,ty);
}

const noKeep=()=>hr('nokeep')||(comp==='skill'&&SG&&SG.k==='slalom');
// The keeper reads a shot the moment it's struck: he predicts where it will cross his line (curl included), with an
// error that grows with pace, swerve and knuckle and shrinks with his quality. Then he has to get there: a short
// reaction, then a dive that accelerates. Placement and pace beat him; a shot straight at him doesn't.
const kgk=k=>pvp()?1.02:k.team===0?(k.st.gkv||1.02):DF.gk;
function keeperRead(k,react,type='normal'){
  const gk=kgk(k),spd=Math.hypot(B.vx,B.vy),a=Math.atan2(B.vy,B.vx);
  let py=curlCross(B.x,B.y,a,spd,B.curl||0,B.vz||0,k.x);if(py==null){const tt=(k.x-B.x)/(B.vx||1e-3);py=B.y+B.vy*Math.max(0,tt)}
  const far=Math.abs(k.x-B.x),clean=B.shot&&B.shot.perfect;
  const sig=(3+spd*.45*(1.3-gk*.55)+far*.05)*(type==='curler'?(gk===1.02?1.25:1.7):type==='knuckle'?2.4:type==='rocket'?1.3:type==='volley'?1.7:type==='header'?1.3:1)*(clean?1.4:1);
  k.planErr=gaussN()*sig;k.planD0=Math.max(40,far);k.planY=py+k.planErr;k.react=Math.max(2,react);k.track=true;k.dv=0;k.diving=false}
/* ---------- sweeper keeper ----------
   When a through ball or loose ball runs in behind the defence, the keeper races the attackers to it. He reads the ball's
   path, his own run against the nearest attacker and the nearest defender, and commits only when he expects to win it.
   Outside the box he clears it (or plays it to a free team-mate); inside the box he gathers it. Better keepers (club keeper
   training, or the difficulty for the opposition) read it better and bail out of lost causes; weaker ones misjudge more.
   Same code runs on the host online, so it is identical for both players. */
const kSkill=k=>clamp((kgk(k)-.8)/.6,0,1);
const KSW_SPD=3.15;
function ballPathPts(n,stp){const out=[];let x=B.x,y=B.y,z=B.z,vx=B.vx,vy=B.vy,vz=B.vz||0;const fg=B.curl?.992:hr('ice')?.994:weather==='rain'?.988:.984;
  for(let i=0;i<=n;i++){if(i%stp===0)out.push({i,x,y,z});const fr=z>0?.996:fg;x+=vx;y+=vy;vx*=fr;vy*=fr;if(z>0||vz>0){vz-=.25;z+=vz;if(z<0){z=0;vz=Math.abs(vz)>1.2?-vz*.45:0}}
    if(x<FX0-30||x>FX1+30||y<FY0-30||y>FY1+30)break}return out}
// frames for a player to reach a point: run time plus a little to turn and get going
const runT=(p,x,y,spd,lag)=>Math.hypot(x-p.x,y-p.y)/spd+lag;
function sweepPlan(k){const gx=k.team===0?FX0:FX1,s=k.team===0?1:-1,sk=kSkill(k);
  if(B.owner||B.shot||B.claimBy===k||(B.lockBy===k&&B.lockT>0))return null;
  if(B.pass&&B.pass.from&&B.pass.from.team===k.team)return null;// his own side's pass: leave it
  if(B.lobTo&&B.lobTo.team===k.team)return null;
  const sp=Math.hypot(B.vx,B.vy);if(sp>1&&B.vx*s>.8)return null;// going away from his goal
  const zoneX=BOX*(1.55+.55*sk),zoneY=BOXH*1.25;
  if(Math.abs(B.x-gx)>zoneX+sp*70)return null;// too far away to matter yet
  const opp=outfield(1-k.team),mates=outfield(k.team),pts=ballPathPts(110,3);
  const rate=KSW_SPD*kgk(k)*(1+(PSC-1)*.15),lagK=7;
  let firstAtt=1e9;
  for(const q of pts){if(q.z>(B.lobTo?60:24)&&!(B.lobTo&&q===pts[pts.length-1]))continue;
    const ax=(q.x-gx)*s;if(ax>zoneX||Math.abs(q.y-MY)>zoneY||ax<14)continue;
    let tA=1e9;for(const o of opp){const boost=(B.lobTo===o||B.graceTo===o)&&B.lobThrough?1.5:1;tA=Math.min(tA,runT(o,q.x,q.y,topSpeed(o)*boost,3))}
    let tD=1e9;for(const m of mates)tD=Math.min(tD,runT(m,q.x,q.y,topSpeed(m),5));
    firstAtt=Math.min(firstAtt,tA);
    const tK=runT(k,q.x,q.y,rate,lagK),arrive=Math.max(q.i,tK);
    if(tK>q.i+10)continue;// can't be there in time for this point
    // an attacker has to be chasing it, or it isn't a danger: a slow ball with nobody near is gathered normally
    if(tA>Math.max(q.i,tK)+45)return null;
    if(tD<tK-6&&tD<tA-4)return null;// a defender gets there first: let him deal with it
    const tAp=tA*(k.swErr||1);// his read of the race (weaker keepers misjudge it more)
    if(arrive<tAp-3)return{x:q.x,y:q.y,i:q.i,tK,tA,tD,inBox:ax<BOX-4&&Math.abs(q.y-MY)<BOXH}}
  return null}
function sweepClear(k){const gx=k.team===0?FX0:FX1,s=k.team===0?1:-1,sk=kSkill(k);
  const inBox=Math.abs(B.x-gx)<BOX-4&&Math.abs(B.y-MY)<BOXH;
  B.lobTo=null;B.graceTo=null;B.graceT=0;B.lobThrough=false;
  if(inBox&&B.z<27){give(k);pop(pick(['CLAIMED','SWEPT UP','OFF HIS LINE']),k.x,k.y-30,C.cream,17);return}
  const opp=outfield(1-k.team),near=opp.reduce((a,o)=>Math.min(a,dist(o,k)),1e9);
  // a calm pass out to a free team-mate if nobody is on him, otherwise it goes long and wide
  let m=null;if(near>70&&Math.random()<.45+.45*sk){let bs=-1e9;for(const q of outfield(k.team)){const fw=(q.x-k.x)*s,d=dist(q,k);if(fw<40||d<120||d>620*PSC)continue;
      let open=1e9;for(const o of opp)open=Math.min(open,dist(o,q));if(open<55||laneBlocked(k,q,22,k.team))continue;const sc=open/60+fw/300;if(sc>bs){bs=sc;m=q}}}
  if(m){give(k);pass(k,m);k.hold=0;pop('SWEEPER KEEPER',k.x,k.y-30,C.mint,16);return}
  let a=Math.atan2((B.y<MY?-1:1)*rnd(.45,.9),s),spd=rnd(12.5,15)*Math.sqrt(PSC);
  const scuff=Math.random()<.32*(1-sk);if(scuff){spd*=.55;a+=rnd(-.7,.7)}
  kick(k,a,spd,scuff?1.5:rnd(4,5.5));S.pass();pop(scuff?'SCUFFED CLEARANCE':pick(['CLEARED','SWEPT AWAY','BIG HOOF']),k.x,k.y-30,scuff?C.coral:C.cream,16)}
function sweeperTick(k,dt){const gx=k.team===0?FX0:FX1,sk=kSkill(k);
  if(k.swCd>0)k.swCd-=dt;
  if(k.sweep){const w=k.sweep;w.t+=dt;
    // the race is lost or over: own side has it, they have it, or it's taking too long
    if(B.owner||B.shot||w.t>170){k.sweep=null;k.swCd=50;return false}
    if(dist(k,B)<17&&B.z<(B.lobTo?30:20)&&!(B.lockBy===k&&B.lockT>0)){k.sweep=null;k.swCd=40;sweepClear(k);return true}
    if((w.re-=dt)<=0){w.re=4;const P0=sweepPlan(k);
      if(P0){w.x+=(P0.x-w.x)*.5;w.y+=(P0.y-w.y)*.5;w.miss=0}
      else{// he can't see a winning line any more: good keepers get back quickly, poor ones keep going a moment too long
        w.miss=(w.miss||0)+1;if(w.miss>1+Math.round(5*(1-sk))){k.sweep=null;k.swCd=60;return false}}}
    // run onto the ball's path, then straight at it once close
    const tx=dist(k,B)<60?B.x+B.vx*4:w.x,ty=dist(k,B)<60?B.y+B.vy*4:w.y;
    steer(k,tx,ty,KSW_SPD*kgk(k)*(1+(PSC-1)*.15),dt);k.diving=false;return true}
  if(k.swCd>0||state!=='play'||kickT>0)return false;
  if((k.swLook=(k.swLook||0)-dt)>0)return false;k.swLook=3;
  const P0=sweepPlan(k);
  if(!P0){k.swSeen=0;k.swErr=null;return false}
  // first time he sees it he forms his read of the race; he needs to see it for a few frames (less for good keepers) before he goes
  if(!k.swErr)k.swErr=1+rnd(-.8,1)*(.05+.42*(1-sk));
  k.swSeen=(k.swSeen||0)+3;if(k.swSeen<3+Math.round(9*(1-sk)))return false;
  k.sweep={x:P0.x,y:P0.y,t:0,re:4,p0:P0};k.wide=true;k.swSeen=0;k.swErr=null;k.sweeps=(k.sweeps||0)+1;aiStat.sweeps++;return true}
function keeperUpdate(k,dt){
  if(noKeep()){const gx=k.team===0?FX0:FX1;k.x=gx+(k.team===0?-8:8);k.y=GY1+30;k.vx=k.vy=0;if(B.owner===k){B.owner=null;const m=outfield(k.team)[0];if(m)give(m)}return}
  const gx=k.team===0?FX0:FX1,s=k.team===0?1:-1,mine=k.team===0||pvp(),gk=kgk(k);
  if(k.stun>0)k.stun-=dt;
  if(B.owner===k){k.hold-=dt;k.diving=false;steer(k,gx+s*22,MY,1.5,dt);
    if(k.hold<=0){const m=bestMate(k)||pick(outfield(k.team));if(m)pass(k,m)}return}
  let shotIn=false;
  if(!B.owner&&B.vx*s<-2&&Math.abs(B.x-gx)<620&&!(B.lockBy===k&&B.lockT>0)){const tt=(gx-B.x)/B.vx,py=B.y+B.vy*tt;shotIn=py>GY0-34&&py<GY1+34}
  // a pass from them rolling towards goal isn't a shot until it's close: it's a ball to race for (see the sweeper keeper)
  if(shotIn&&!B.shot&&(k.sweep||(B.pass&&B.pass.from&&B.pass.from.team!==k.team&&Math.abs(B.x-gx)>BOX*.5)))shotIn=false;
  if(shotIn)k.shotHold=8;else if(k.track&&(k.shotHold||0)>0&&!B.owner&&B.vx*s<-.5){k.shotHold-=dt;shotIn=true}
  if(shotIn&&!k.track)keeperRead(k,mine?9:Math.round(DF.react*.6));// deflections and loose balls heading in
  if(!shotIn){k.track=false;k.planY=null;k.dv=0}else if(k.sweep){k.sweep=null;k.swCd=50}
  if(shotIn){
    if(k.react>0){k.react-=dt;k.vx*=.7;k.vy*=.7}
    else{// he keeps reading it as it comes: his early misjudgement shrinks the closer the ball gets
      {const spd=Math.hypot(B.vx,B.vy),py=curlCross(B.x,B.y,Math.atan2(B.vy,B.vx),spd,B.curl||0,B.vz||0,k.x);
       if(py!=null)k.planY=py+(k.planErr||0)*Math.pow(clamp(Math.abs(k.x-B.x)/(k.planD0||200),0,1),.6)}
      const ty=clamp(k.planY??B.y,GY0-24,GY1+24),dy=ty-k.y,max=(mine?3.5:DF.dive*1.15)*gk;
      k.dv=Math.min(max,(k.dv||0)+.45*gk*dt);k.vy=clamp(dy,-k.dv,k.dv);k.vx=0;if(Math.abs(dy)>7)k.diving=true;if(Math.abs(k.vy)>.3)k.lastDy=Math.sign(k.vy)}
  }else{
    k.diving=false;
    if(B.claimBy===k&&B.lobTo){steer(k,B.lobX,B.lobY,3.3*gk,dt);return}
    if(!noKeep()&&sweeperTick(k,dt))return;
    const threat=B.owner&&B.owner.team!==k.team?Math.hypot(B.x-gx,B.y-MY):999;
    const out=14+(threat<220?(220-threat)/220*40*(mine?1:gk):0);
    let ty=clamp(MY+(B.y-MY)*.55,GY0+6,GY1-6);
    // their keeper watches your shooting stance and shades towards where you're aiming: switch corners late to beat him
    const sh=B.owner;if(!mine&&sh&&sh.team!==k.team&&sh.aimY!=null&&(sh===ctrl?charging:sh===ctrl2&&RS&&RS.charging))ty=clamp(ty+(sh.aimY-ty)*.3*gk,GY0+4,GY1-4);
    steer(k,gx+s*out,ty,k.wide?2.9:2.3,dt);
    if(!B.owner&&!B.lobTo&&!(B.graceT>0)&&B.lockBy!==k&&Math.abs(B.x-gx)<BOX&&Math.abs(B.y-MY)<130&&B.z<24&&Math.hypot(B.vx,B.vy)<(mine?6:4)&&dist(k,B)<(mine?150:120))steer(k,B.x,B.y,mine?3.4:2.8,dt);
  }
}

/* ---------- ball physics ---------- */
function ballUpdate(dt,live){
  if(SG&&SG.parked)return;
  if(B.lockT>0)B.lockT-=dt;
  B.px=B.x;
  if(B.owner){
    const p=B.owner;
    if(p.anim==='rainbow'){const pr=1-p.animT/p.animMax,off=-12+pr*30;B.x=p.x+Math.cos(p.dir)*off;B.y=p.y+Math.sin(p.dir)*off;B.z=Math.sin(pr*Math.PI)*32;B.vx=p.vx;B.vy=p.vy;B.spin+=.3*dt;return}
    const psp=Math.hypot(p.vx,p.vy);p.touchPh=(p.touchPh||0)+psp*.085*dt;
    const amp=p.keeper?0:clamp(psp/2.6,0,1)*(17-(p.st.skill??.6)*12),tch=Math.max(0,Math.sin(p.touchPh));B.loose=amp*tch/17;
    const off=(p.keeper?10:12)+amp*tch,a=p.dir+(p.anim==='step'?Math.sin(p.animT*.8)*.9:0);
    {const f=Math.min(1,(p.push&&p.push.T>0?.8:.5)*dt);B.x+=(p.x+Math.cos(a)*off-B.x)*f;B.y+=(p.y+Math.sin(a)*off-B.y)*f}
    B.vx=p.vx;B.vy=p.vy;B.z=0;B.spin+=Math.hypot(p.vx,p.vy)*.08*dt;return;
  }
  const sp=Math.hypot(B.vx,B.vy);
  if(B.curl&&sp>1){const nx=-B.vy/sp,ny=B.vx/sp;B.vx+=nx*B.curl*dt;B.vy+=ny*B.curl*dt;B.curl*=Math.pow(.997,dt)}
  if(B.knuckle&&sp>3){const nx=-B.vy/sp,ny=B.vx/sp,w=Math.sin(t*.45)*B.knuckle;B.vx+=nx*w*dt;B.vy+=ny*w*dt}
  B.x+=B.vx*dt;B.y+=B.vy*dt;B.spin+=sp*.06*dt;
  const fr=B.z>0?.996:B.curl?.992:hr('ice')?.994:weather==='rain'?.988:.984;B.vx*=Math.pow(fr,dt);B.vy*=Math.pow(fr,dt);
  const wasAir=B.z>0;
  if(B.z>0||B.vz>0){B.vz-=(B.knuckle?.34:.25)*dt;B.z+=B.vz*dt;if(B.z<0){B.z=0;if(B.vz<-1.8){tone(110,.07,'sine',Math.min(.16,-B.vz*.03),0,.6);grass(B.x,B.y,3)}B.vz=Math.abs(B.vz)>1.2?-B.vz*.45:0;if(B.vz>0){B.curl*=.4;B.knuckle=0}}}
  if(B.lobTo&&B.claimBy&&B.z<44&&dist(B.claimBy,B)<30&&B.claimBy.stun<=0){const k=B.claimBy;B.claimBy=null;airN.claim++;give(k);k.hold=40;pop('CLAIMED',k.x,k.y-34,C.cream,17,60);S.save()}
  else if(B.lobTo&&B.lobTo.volley&&B.vz<0&&B.z<54&&B.z>2&&dist(B.lobTo,B)<44&&B.lobTo.stun<=0)airStrike(B.lobTo);
  // a chip pass is contested as it drops into reach: a defender who's got there can win it
  if(B.lobTo&&B.pass&&B.pass.chip&&!B.pass.contested&&B.vz<0&&B.z<20){B.pass.contested=true;const m=B.lobTo;let d=null;
    for(const q of outfield(1-m.team))if(q.stun<=0&&q.fall<=0&&dist(q,B)<40&&(!d||dist(q,B)<dist(d,B)))d=q;
    if(d&&Math.random()<clamp(.52+(dist(m,B)-dist(d,B))/60+((d.st.tackle??.6)-.6)*.5,.2,.8)){B.lobTo=null;m.lobRun=null;m.volley=false;d.hjump=14;airN.clear++;give(d);
      if(d.team===0){ctrl=d;stats.tackles++;pop('WON IT IN THE AIR',d.x,d.y-40,C.mint,16,60)}else pop('READ IT',d.x,d.y-40,C.muted,16,50);S.tap()}}
  if(B.lobTo&&wasAir&&B.z<=0&&B.pass&&(B.pass.cross||B.pass.chip)){const m=B.lobTo,chip=B.pass.chip;let d=null;
    // a chip can be attacked by anyone who's got there too: the closer he is compared with the receiver, the better his chance
    for(const q of outfield(1-m.team))if(q.stun<=0&&dist(q,B)<(chip?36:30)&&(chip||dist(q,B)<dist(m,B))&&(!d||dist(q,B)<dist(d,B)))d=q;
    const win=!d?0:chip?clamp(.42+(dist(m,B)-dist(d,B))/60+((d.st.tackle??.6)-.6)*.5,.2,.8):.55;
    if(d&&Math.random()<win){B.lobTo=null;m.lobRun=null;m.volley=false;const a=Math.atan2(MY-B.y,MIDX-B.x)+rnd(-.6,.6);d.hjump=18;airN.clear++;kick(d,a,9,3.4);pop('CLEARED',d.x,d.y-40,d.team===0?C.mint:C.muted,16,50);S.tap()}}
  if(B.lobTo&&wasAir&&B.z<=0){const m=B.lobTo;B.lobTo=null;m.lobRun=null;m.volley=false;
    if(dist(m,B)<(B.lobThrough?72:58)&&m.stun<=0){give(m);if(m.team===0)ctrl=m;else if(NET.host)setCtrl2(m)}else{const th=B.lobThrough;B.vx*=th?0:.15;B.vy*=th?0:.15;B.vz=0;B.graceTo=m;B.graceT=th?75:40;m.lobRun={x:B.x,y:B.y}}}
  if(B.graceT>0){B.graceT-=dt;if(B.graceT<=0||B.owner){if(B.graceTo)B.graceTo.lobRun=null;B.graceTo=null}}
  if(B.y<FY0+6){B.y=FY0+6;B.vy=Math.abs(B.vy)*.7}
  if(B.y>FY1-6){B.y=FY1-6;B.vy=-Math.abs(B.vy)*.7}
  const mouth=B.y>GY0&&B.y<GY1;
  if(!live){
    if(B.x>FX1+26){B.x=FX1+26;B.vx*=-.1;B.vy*=.3;netShake[1]=30}
    if(B.x<FX0-26){B.x=FX0-26;B.vx*=-.1;B.vy*=.3;netShake[0]=30}
    if(B.x>FX1||B.x<FX0)B.y=clamp(B.y,GY0+5,GY1-5);return}
  for(const k of [keeperOf(0),keeperOf(1)]){
    if(!k||noKeep())continue;
    if(k.stun>0||B.lockBy===k&&B.lockT>0)continue;
    const crossed=(B.px-k.x)*(B.x-k.x)<=0||Math.abs(B.x-k.x)<11;
    if(!crossed||B.z>27)continue;
    const f=B.x===B.px?1:clamp((k.x-B.px)/(B.x-B.px),0,1),yc=B.y-B.vy*dt*(1-f);
    const reach=12.5*kgk(k)+(k.diving?11:0);
    if(Math.abs(yc-k.y)<reach&&Math.abs(B.x-(k.team===0?FX0:FX1))<BOX){
      const s=k.team===0?1:-1;
      if(B.rocket&&Math.random()<.5){B.rocket=false;B.vx*=.8;B.vy+=rnd(-1,1);B.lockBy=k;B.lockT=30;pop('THROUGH HIS HANDS!',k.x-s*60,k.y-30,C.coral,20);S.boom();continue}
      if(Math.hypot(B.vx,B.vy)>(k.team===0?14.5:12.5)&&B.shot){
        if(B.shot.team===0)stats.on++;k.mSv=(k.mSv||0)+1;
        B.vx=s*rnd(3,5);B.vy=(B.y<k.y?-1:1)*rnd(4,7);B.vz=3;B.lockBy=k;B.lockT=16;B.curl=0;B.knuckle=0;B.rocket=false;
        pop(pick(['PARRIED!','WHAT A SAVE','FINGERTIPS']),k.x,k.y-30,C.cream,20);S.save();S.ooh();hitStop(5);slowmo(16,.4);shake=Math.max(shake,RM?0:5);B.shot=null;reboundT=t;if(k.team===0){addHype(8);style+=10}
      }else give(k);
      return;
    }
  }
  if(B.z<12){
    for(const p of players){
      if(p.keeper||p.stun>0||(B.lockBy===p&&B.lockT>0)||(B.lobTo&&p!==B.lobTo&&!(B.pass&&B.pass.chip&&p.team!==B.lobTo.team&&B.vz<0))||(B.graceTo&&B.graceT>0&&p!==B.graceTo))continue;
      {const x0=B.x-B.vx*dt,y0=B.y-B.vy*dt,dx=B.x-x0,dy=B.y-y0,L2=dx*dx+dy*dy||1,u=clamp(((p.x-x0)*dx+(p.y-y0)*dy)/L2,0,1);if(Math.hypot(x0+dx*u-p.x,y0+dy*u-p.y)>(B.shot&&B.shot.team===0&&p.team===1?12:18)*(hr('giant')?1.4:1))continue}
      if(B.shot&&B.shot.team===0&&p.team===1&&sp>6.5){
        // your shots: a defender in the way only stops it some of the time; otherwise it takes a nick and carries on
        const stopCh=clamp(.45+(p.st.tackle??.6)*.3-(sp-10)*.02,.35,.7);
        if(Math.random()>stopCh){B.vy+=rnd(-1.6,1.6);B.vx*=.93;B.lockBy=p;B.lockT=14;const nm=pick(['THROUGH HIS LEGS!','DEFLECTED','SQUEEZED THROUGH']);pop(nm,p.x,p.y-30,C.sun,17);if(nm[0]==='T')B.shot.nut=true;S.tap();break}}
      if(sp>12.5&&B.shot&&B.shot.team!==p.team){B.vx*=-.3;B.vy=B.vy*.4+rnd(-3,3);B.lockBy=p;B.lockT=10;B.curl=0;B.knuckle=0;B.rocket=false;if(B.shot){pop('BLOCKED',p.x,p.y-30,C.muted,16);B.shot=null}S.tap();break}
      give(p);S.tap();break;
    }
  }
  if(B.x>FX1||B.x<FX0){
    const team=B.x>FX1?0:1;
    if(mouth&&B.z<BAR){
      if(B.pass&&!B.shot){const k=keeperOf(team===0?1:0),s2=k.team===0?1:-1;k.diving=false;k.vx=k.vy=0;B.x=k.x+s2*10;B.y=k.y;B.vx=B.vy=B.z=B.vz=0;give(k);k.hold=40;if(team===0)pop('passes don’t count',k.x,k.y-30,C.muted,15);return}
      goalFor(team);return}
    const nearPost=Math.abs(B.y-GY0)<7||Math.abs(B.y-GY1)<7;
    if((mouth||nearPost)&&B.z<BAR+6){B.x=B.x>FX1?FX1-2:FX0+2;B.vx*=-.55;B.vy+=rnd(-2,2);S.post();pop(B.z>=BAR?'CROSSBAR!':'OFF THE POST!',B.x,B.y-30,C.sun,22);if(B.shot&&B.shot.team===0){addHype(10);style+=15;pop('SO CLOSE  +15',B.x,B.y-58,C.cream,15)}shake=Math.max(shake,RM?0:7);hitStop(7);slowmo(22,.35);S.ooh();if(B.shot)B.shot.wood=true;B.curl=0;B.knuckle=0;return}
    const k=keeperOf(B.x>FX1?1:0);if(B.shot)pop(B.z>=BAR?'OVER!':'WIDE',B.x>FX1?FX1-60:FX0+60,B.y-20,C.muted,18);
    if(B.shot&&B.shot.team===0)S.aww();
    // goal kick: the keeper gathers it where he is (he used to jump to the six-yard box in one frame)
    {const s2=k.team===0?1:-1;k.diving=false;k.vx=k.vy=0;k.dv=0;B.x=k.x+s2*10;B.y=k.y;B.vx=B.vy=B.z=B.vz=0;give(k);k.hold=60}
  }
}

/* ---------- goals + celebrations ---------- */
function goalFor(team){
  if(comp==='skill'&&SG){sgGoal(team);return}
  wasBehind=team===0&&score[0]<score[1];
  score[team]++;if(hr('golden')||(hr('first3')&&score[team]>=3))clock=Math.min(clock,.01);charging=false;
  const sh=B.shot,sc=sh&&sh.by.team===team?sh.by:(team===0?ctrl:outfield(1)[0]);
  B.owner=null;netShake[team===0?1:0]=40;
  if(sc){sc.goals=(sc.goals||0)+1;const n=sc.goals;
    if(n>=3){hat={n,team,name:sc.st.short||('Their #'+(sc.st.num||sc.i+1)),t0:t,txt:n===3?'HAT-TRICK!':n===4?'FOUR GOALS!':n===5?'FIVE GOALS!':n+' GOALS!'};
      if(team===0){S.skill(4)}}}
  if(team===0){
    streak++;state='goal';stT=0;scorer=sc;replay=rec.slice(-130);
    labels=[];const d=sh?FX1-sh.fx:200;
    if(d>380)labels.push(['SCREAMER',60]);else if(d<100)labels.push(['POACHER',10]);
    if(Math.abs(B.y-MY)>38)labels.push(['TOP BINS',40]);
    if(sh){const L={header:['HEADER',45],volley:['VOLLEY',50],bicycle:['BICYCLE KICK',90],curler:['CURLER',35],rocket:['ROCKET',35],knuckle:['KNUCKLEBALL',40],chip:['CHIPPED IT',45]}[sh.type];if(L)labels.push(L)}
    if(sh&&sh.first)labels.push(['FIRST TIME',30]);
    if(sh&&sh.beat>=2)labels.push(['SOLO GOAL',60+sh.beat*15]);else if(sh&&sh.skill)labels.push([sh.beat?'ANKLE BREAKER':'SKILL GOAL',sh.beat?55:40]);
    if(passChain>=2)labels.push(['TEAM GOAL',passChain*15]);
    if(fire>0)labels.push(['ON FIRE',30]);
    if(streak>=2)labels.push(['STREAK ×'+streak,streak*25]);
    if(sc&&sc.goals===1&&score[0]>1)labels.push(['NEW SCORER',35]);
    if(sh&&sh.wood)labels.unshift(['IN OFF THE POST',45]);
    if(sh&&sh.nut)labels.unshift(['NUTMEG FINISH',50]);
    if(t-reboundT<130)labels.push(['REBOUND',25]);
    if(t-counterT<420&&counterX<MIDX)labels.unshift(['COUNTER-ATTACK',45]);
    if(clock<15)labels.unshift(['LAST GASP',60]);
    if(wasBehind&&score[0]>score[1])labels.unshift(['COMEBACK',70]);else if(score[0]===score[1])labels.push(['EQUALISER',25]);
    if(hat&&hat.team===0&&hat.t0===t)labels.unshift([hat.n===3?'HAT-TRICK':hat.n+' GOALS',hat.n*40]);
    labels=labels.slice(0,5);
    let bonus=0;labels.forEach(l=>bonus+=l[1]);style+=100+bonus;stats.on++;
    if(style>best){best=style;try{localStorage.setItem('kickabout-best3',best)}catch(e){}}
    if(comp==='chal'&&chalCur&&!chalWon){if(chalCur.flag&&labels.some(l=>chalCur.flag.includes(l[0]))||(chalCur.hat&&hat&&hat.team===0)){chalWon=true;clock=Math.min(clock,.01);labels.unshift(['CHALLENGE DONE',100])}}
    phrase=labels.length&&ANN[labels[0][0]]?pick(ANN[labels[0][0]]):pick(PHRASES);speak(phrase);celebType=scorer.st.celeb??((Math.random()*6)|0);
    shake=RM?0:16;flash=RM?0:1;addHype(30);
    {const K=[...CONF,KIT(),KIT(),'#fff6e4'];burst(FX1+10,B.y,170,K,9,.13);burst(FX1-200,MY,100,K,12,.15)}if(hat&&hat.team===0&&hat.t0===t){burst(FX1-300,FY0+80,140,CONF,12,.15);burst(FX1-300,FY1-80,140,CONF,12,.15)}
    S.goal();
    scorer.cx=FX1-55;scorer.cy=scorer.y<MY?FY0+55:FY1-55;
  }else{
    streak=0;state='concede';stT=0;scorer=sc;if(NET.host){celebType=sc.st.celeb??((Math.random()*6)|0);phrase=pick(PHRASES)}S.aww();S.whistle(1);addHype(14);
    scorer.cx=FX0+55;scorer.cy=scorer.y<MY?FY0+55:FY1-55;shake=RM?0:5;
  }
}
function walkTo(p,tx,ty,spd,dt){steer(p,tx,ty,spd,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;faceVel(p,dt)}
function celebMove(s,dt){
  const k=stT,dx=s.cx-s.x,dy=s.cy-s.y,dd=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
  s.rot=0;s.jump=0;s.arms=0;s.flip=1;s.spinRot=false;s.lean=0;s.kneel=false;
  const run=sp=>{if(dd>8){s.x+=Math.cos(a)*Math.min(sp,dd)*dt;s.y+=Math.sin(a)*Math.min(sp,dd)*dt;s.dir=a}};
  switch(celebType){
    case 0:{const sp=dd>8?Math.min(6.5,dd*.05+2):0;run(sp);s.arms=1;s.kneel=sp<4.5;s.lean=s.kneel?-Math.cos(s.dir)*.25:0;if(dd<=8)s.dir=Math.PI/2;if(sp>1&&t%2<1)grass(s.x,s.y,2);break}
    case 1:{run(3.4);if(dd<12){const ph=(k%70)/70;s.jump=Math.sin(ph*Math.PI)*26;s.rot=ph*Math.PI*2;s.spinRot=true;if(ph>.93)s.dir=Math.PI/2;s.arms=ph>.5?1:3;if(ph>.93&&!s.landed){s.landed=true;ring(s.x,s.y,C.sun);pop('SIUUU!',s.x,s.y-40,C.sun,26);tone(196,.3,'sine',.25)}if(ph<.5)s.landed=false}break}
    case 2:{if(((k/8)|0)%2===0)run(4);s.dir=Math.round(Math.sin(k*.08)*2)*Math.PI/4;s.arms=((k/10)|0)%2?2:1;break}
    case 3:{const w=Math.sin(k*.09)*.9;if(dd>8){s.x+=Math.cos(a+w)*3.4*dt;s.y+=Math.sin(a+w)*3.4*dt}s.dir=a+w;s.lean=Math.sin(k*.09)*.35;s.arms=3;break}
    case 4:{run(3.2);if(dd<12){const ph=(k%60)/60;s.jump=Math.sin(ph*Math.PI)*34;s.lean=-Math.cos(s.dir)*ph*Math.PI*2;s.arms=1}break}
    case 5:{run(3);if(dd<12){s.dir=Math.PI/2;s.arms=((k/14)|0)%2?2:1;if(k%60<dt)pop('calm.',s.x,s.y-36,C.cream,18)}break}
  }
}
function updateGoalState(dt){
  stT+=dt;celebMove(scorer,dt);
  outfield(0).forEach((p,i)=>{if(p===scorer)return;if(stT>40){const a=-2.7+i*.7;walkTo(p,scorer.x+Math.cos(a)*30,scorer.y+Math.sin(a)*22,3.6,dt);if(dist(p,scorer)<34)p.dir=Math.atan2(scorer.y-p.y,scorer.x-p.x);p.jump=dist(p,scorer)<40?Math.abs(Math.sin(t*.2+i))*8:0}});
  outfield(1).forEach(p=>{walkTo(p,p.kx,p.ky,1,dt);p.jump=0});
  if(stT%22<dt&&stT<220)burstS(rnd(100,900),rnd(-20,60),40,CONF,5,.1,[3,7]);
  if((streak>=2||fire>0)&&stT%28<dt)firework(rnd(100,900),rnd(25,50));
  if(stT>260){if(NET.on)kickoff(1);else startReplay()}
}
function startReplay(){if(!replay||replay.length<10){kickoff(1);return}state='replay';replayIdx=0;{const r0=replay[0];rcx=clamp(r0.b[0],FX0+260,FX1-230);rhor=H*.56-BROAD.h*BROAD.f*1.0/(BROAD.dist+(BROAD.y-r0.b[1]))}S.swoosh();players.forEach(p=>{p.jump=0;p.rot=0;p.arms=0;p.flip=1;p.lean=0;p.kneel=false;p.spinRot=false})}
function updateConcede(dt){
  stT+=dt;const s=scorer;
  if(NET.host)celebMove(s,dt);else{walkTo(s,s.cx,s.cy,3.4,dt);s.arms=3}
  outfield(1).forEach((p,i)=>{if(p!==s&&stT>30)walkTo(p,s.x+Math.cos(i*2)*24,s.y+Math.sin(i*2)*24,3.2,dt)});
  outfield(0).forEach(p=>walkTo(p,p.kx,p.ky,1.2,dt));
  if(stT>170)kickoff(0);
}
let koT=-999;
const koGrace=pl=>t-koT<80&&B.owner&&B.owner.team!==pl.team;
function kickoff(team){koT=t;if(NET.host)netEpoch++;
  players.forEach(p=>{
    if(p.keeper){p.x=p.team?FX1-16:FX0+16;p.y=MY}
    else{const fx=Math.min(.44,p.slot.x*.8+.04);p.x=p.team===0?FX0+fx*(FX1-FX0):FX1-fx*(FX1-FX0);p.y=FY0+(FY1-FY0)*p.slot.y}
    p.kx=p.x;p.ky=p.y;if(p.keeper){p.diving=false;p.dv=0;p.track=false;p.react=0;p.planY=null;p.shotHold=0;p.hold=0;p.sweep=null;p.wide=false;p.swCd=0;p.swSeen=0;p.swErr=null}
    p.vx=p.vy=0;p.stun=0;p.anim=null;p.rot=0;p.jump=0;p.arms=0;p.flip=1;p.lunge=0;p.slide=false;p.inter=false;p.aiSlide=0;p.aiLunge=0;p.turbo=0;p.push=null;p.fall=0;p.beatRun=0;p.lean=0;p.kneel=false;p.spinRot=false;p.dir=p.team?Math.PI:0;p.hold=0;p.stam=Math.min(100,p.stam+40)});
  const pickTaker=tm=>outfield(tm).reduce((a,b)=>b.slot.x>a.slot.x?b:a);
  const taker=pickTaker(team);taker.x=team===0?MIDX-12:MIDX+12;taker.y=MY;
  B.x=MIDX;B.y=MY;B.vx=B.vy=B.z=B.vz=0;B.shot=null;B.pass=null;B.curl=0;B.knuckle=0;B.rocket=false;
  give(taker);ctrl=team===0?taker:pickTaker(0);if(NET.host){setCtrl2(team===1?taker:pickTaker(1));if(RS)RS.charging=false}lastPoss=team;
  kickT=50;state='play';stT=0;rec=[];btrail=[];charging=false;passChain=0;S.whistle(1);
}

/* ---------- penalty shoot-out ---------- */
const VISK=['diveK','lastDy','aiLunge','aiSlide','anim','animMax','animT','arms','diving','fall','fallDir','ghost','jump','kneel','knockT','lean','locked','lunge','rot','slide','spinRot','stun','turbo','vy','whiff','whiffMax','flip','windup','windSlide'];
let rcx=MIDX,rhor=0,replayCh=0;
let pen=null,mercy=false,hat=null,swipes=[],hitT=0,reboundT=-999,counterT=-999,counterX=0,wasBehind=false;
const PMISS={beginner:.2,easy:.14,normal:.1,hard:.07,legend:.04};
// the penalty shoot-out lives in 2b-penalties.js

let earned=0,shownEarned=0,matchRatings=null;
// 0-10 ratings from what each player did, and a Man of the Match (worth a few coins if he's yours)
function calcRatings(){const pw=pen&&pen.winner!=null?pen.winner:null,res=tm=>{const a=score[tm],b=score[1-tm];return a>b||pw===tm?1:a<b||(pw!=null&&pw!==tm)?-1:0};
  const rows=players.map(p=>{const r=res(p.team),conc=score[1-p.team];
    let v=6+(p.goals||0)*1.3+(p.mT||0)*.35+(p.mS||0)*.25+(p.mP||0)*.1+(p.mSh||0)*.05+(p.mSv||0)*.6+r*.45;
    if(p.keeper)v-=conc*.35;else if(p.slot&&p.slot.r==='DEF')v-=Math.max(0,conc-1)*.2;
    return{p,v:Math.round(clamp(v,3,10)*10)/10}});
  const motm=rows.reduce((a,b)=>b.v>a.v?b:a);return{rows,motm}}
function awardCoins(){awardCoins0();
  if(SG||NET.on){matchRatings=null;return}
  matchRatings=calcRatings();const m=matchRatings.motm;if(m.p.team===0){const b=Math.round(25*matchMul()*LV().coin);earned+=b;club.coins+=b;earnNote+=` · man of the match +${b}`;saveClub()}
  careerAfterMatch()}
function awardCoins0(){earned=0;shownEarned=0;earnNote='';
  if(NET.on){const r=score[0]>score[1]?60:score[0]<score[1]?15:30;earned=matchPay(score[0]>score[1]?'Online win':score[0]<score[1]?'Online defeat':'Online draw',r,score[0]*10,1);club.coins+=earned;club.played=(club.played||0)+1;cupEvent=null;eventText='ONLINE MATCH vs '+OPP.name;gdTokens(score[0],score[1]);saveClub();return}
  const pw=pen&&pen.winner!=null?pen.winner:null;
  const r=score[0]>score[1]?100:score[0]<score[1]?20:pw===0?80:pw===1?30:45;
  let bonus=0;const won=score[0]>score[1]||pw===0;
  if(comp==='skill'&&SG){const b=club.sgBest=club.sgBest||{},k=SG.k;let msg,best=false;
    if(k==='pens'){earned=SG.pts*6;best=SG.pts>(b.pens||0);if(best)b.pens=SG.pts;msg=`${SG.pts} in a row`}
    if(k==='target'){earned=SG.pts*2;best=SG.pts>(b.target||0);if(best)b.target=SG.pts;msg=`${SG.pts} points`}
    if(k==='slalom'){if(SG.done&&!SG.fail){const tm=SG.time;earned=Math.max(5,Math.round(70-tm*1.5));best=b.slalom==null||tm<b.slalom;if(best)b.slalom=tm;msg=`${tm.toFixed(1)} seconds`}else{earned=0;msg='out of time'}}
    earned=Math.round(earned/5)*5;club.coins+=earned;SG.msg=msg;SG.best=best;eventText=`${SGAMES[k].name}: ${msg}${best?'  ·  NEW BEST!':''}`;cupEvent=best?'champion':'advance';saveClub();return}
  grantXP(won);
  if(comp==='chal'&&chalCur){const ok=chalWon||(!!chalCur.win&&chalCur.win());const ch=club.chal=club.chal||{done:{}};ch.done=ch.done||{};
    if(ok){if(!ch.done[chalCur.id]){ch.done[chalCur.id]=true;bonus+=90}if(chalCur.id===dailyChal().id&&ch.daily!==today()){ch.daily=today();bonus+=150}}
    earned=bonus+(ok?20:0);club.coins+=earned;club.played=(club.played||0)+1;eventText=ok?`CHALLENGE COMPLETE · ${chalCur.name}`:`Challenge failed · ${chalCur.name}. Have another go!`;cupEvent=ok?'champion':'out';saveClub();return}
  if(comp==='league'){const L=lgOf(),D=DIVS[L.div],base=won?100:score[0]===score[1]?40:20;lgRecord(L,score[0],score[1]);
    earned=matchPay(won?'Win':score[0]===score[1]?'Draw':'Defeat',base,score[0]*10,LV().coin);club.coins+=earned;club.played=(club.played||0)+1;
    const sm=L.done?L.summary:null;cupEvent=sm&&sm.pos===1?'champion':won?'advance':null;
    eventText=sm?`SEASON OVER: ${ordinal(sm.pos)} in the ${D.n}. ${sm.lines.join(' · ')}`:`${D.n} · round ${L.round} of ${L.fx.length} · ${ordinal(lgTable(L).findIndex(r=>r.id==='me')+1)} in the table`;saveClub();return}
  if(comp==='wcc'){const W=wccOf(),out=wccRecord(W,score[0],score[1],pw);const base=won?150:30;earned=matchPay(won?'Win':'Defeat',base,score[0]*10,LV().coin,out&&out.prize||0);club.coins+=earned;club.played=(club.played||0)+1;
    if(out&&out.champ){stat('wcc_'+GM);club.trophies=club.trophies||{};club.trophies['wcc_'+GM]=(club.trophies['wcc_'+GM]||0)+1;grant({cp:300,tt:10,pack:'elite'});cupEvent='champion';eventText='WORLD CLUB CHAMPIONS! +'+out.prize.toLocaleString()+' coins, an Elite Pack and the trophy'}
    else if(out&&out.won){cupEvent='advance';eventText=`Through to the ${WROUNDS[W.round]}!`+(out.prize?` +${out.prize.toLocaleString()} prize`:'');grant({cp:20*W.round})}
    else{cupEvent='out';eventText=`Knocked out of the World Club Championship. ${wTeam(W,W.champ).name} won it.`}
    saveClub();return}
  if(comp==='friendly'){earned=matchPay('Friendly',Math.round((r+style/25)*.5),Math.round(score[0]*7.5),LV().coin);club.coins+=earned;club.played=(club.played||0)+1;cupEvent=null;eventText=levelUps.length?'LEVEL UP! '+levelUps.join(' · '):null;saveClub();return}
  if(comp==='tour'&&club.tour&&!tourOver()){const T=club.tour,m=myMatch(),meA=m.a===ME;
    Object.assign(m,{sa:meA?score[0]:score[1],sb:meA?score[1]:score[0],pen:pw!==null,w:won?ME:(meA?m.b:m.a)});m.up=won&&clubRating(meA?m.b:m.a)>teamRating()+3;
    if(won){if(T.round===3){T.done=true;T.champ=ME;bonus=TPRIZE[4];club.trophies=club.trophies||{};club.trophies.tour=(club.trophies.tour||0)+1;cupEvent='champion';eventText='GRAND TOURNAMENT CHAMPIONS!'}
      else{simRound();T.round++;bonus=TPRIZE[T.round];cupEvent='advance';eventText=`Through to the ${TROUNDS[T.round]}! +${bonus} prize`}}
    else{T.alive=false;T.exitRound=T.round;playOutRest();cupEvent='out';eventText=`Knocked out in the ${TROUNDS[T.exitRound]}. ${clubName(T.champ)} went on to win it.`}
    earned=matchPay(won?'Win':'Defeat',Math.round(r+style/25),score[0]*15,LV().coin,bonus);club.coins+=earned;club.played=(club.played||0)+1;saveClub();return}
  if(club.cup&&!cupOver()){const c=club.cup;c.res.push(won);
    if(won){bonus=RBONUS[c.round];c.round++;if(c.round>=3){club.trophies=club.trophies||{};club.trophies[c.tier]=(club.trophies[c.tier]||0)+1;cupEvent='champion'}else cupEvent='advance'}
    else{c.alive=false;cupEvent='out'}}
  earned=matchPay(won?'Win':score[0]===score[1]?'Draw':'Defeat',Math.round(r+style/25),score[0]*15,DIFFS[diffKey].coin*LV().coin,Math.round(bonus*DIFFS[diffKey].coin*LV().coin*MM()));club.coins+=earned;club.played=(club.played||0)+1;saveClub()}
/* ---------- main update ---------- */
// timers, animations and trails for one player, every frame
function tickPlayer(p,dt){if(p.locked>0)p.locked-=dt;if(p.caughtT>0)p.caughtT-=dt;if(p.fall>0){p.fall-=dt;p.vx*=.9;p.vy*=.9}if(p.tackleCd>0)p.tackleCd-=dt;if(p.skillCd>0)p.skillCd-=dt;if(p.spCd>0)p.spCd-=dt;if(p.slideCd>0)p.slideCd-=dt;if(p.blungeCd>0)p.blungeCd-=dt;if(p.turbo>0)p.turbo-=dt;if(p.whiff>0)p.whiff-=dt;
      {const lunging=!p.keeper&&(p.lunge>0||p.aiLunge>0||p.aiSlide>0);
       if(lunging){if(!p.swipe){p.swipe={pts:[],team:p.team,end:null,res:null,slide:!!p.slide};swipes.push(p.swipe)}p.swipe.pts.push([p.x+Math.cos(p.dir)*13,p.y+Math.sin(p.dir)*13])}
       else if(p.swipe){const w=p.swipe;p.swipe=null;w.end=t;w.res=B.owner===p?'won':p.whiff>0||p.stun>0?'miss':'none';
         if(w.res==='miss'&&w.pts.length){const e=w.pts[w.pts.length-1],o=B.owner;if(o&&o.team!==p.team){w.missBy=Math.max(.5,(dist({x:e[0],y:e[1]},B)-10)/29);w.vs=o.team}}}}
      if(p.ghost>0){p.ghost-=dt;if(t%3<dt){const q=P(p.x,p.y,rnd(10,40));parts.push({x:q.x,y:q.y,vx:0,vy:-.3,g:0,life:18,max:18,c:'rgba(142,143,240,.55)',w:7,h:7,r:0,vr:0})}}
      if(p.anim==='bike'){const pr=1-p.animT/p.animMax;p.jump=p.animT>1?Math.sin(pr*Math.PI)*30:0}
      if(p.keeper){const was=p.diveK||0;p.diveK=clamp(was+(p.diving?.17:-.06)*dt,0,1);if(was>.8&&p.diveK<=.8&&!p.diving)grass(p.x,p.y,8)}
      if(p.hjump>0){p.hjump-=dt;p.jump=p.hjump>0?Math.sin((1-p.hjump/18)*Math.PI)*15:0;p.arms=p.hjump>0?1:0}
      if(p.bikeT>0){p.bikeT-=dt;if(p.bikeT<=0&&B.owner===p)bicycleStrike(p)}if(p.knockT>0)p.knockT-=dt;
      if(p.anim==='shield'&&p.shieldFrom&&B.owner===p){const f=p.shieldFrom,aw=Math.atan2(p.y-f.y,p.x-f.x);p.dir+=angDiff(aw,p.dir)*Math.min(1,.25*dt)}
      if(p.anim){p.animT-=dt;p.rot=p.anim==='roul'?(1-p.animT/p.animMax)*6.283:0;if(p.animT<=0){p.anim=null;p.rot=0}}
      if(!p.sprint)p.stam=Math.min(100,p.stam+.22*dt)}

function update(dt){
  if(NET.guest){try{guestUpdate(dt)}catch(e){loopErrs++;window.__lastErr=String(e&&e.stack||e)}return}
  if(NET.host){try{netHostInput()}catch(e){loopErrs++}
    if(NET.on&&state!=='fulltime'){const now=performance.now(),quiet=now-netGuestAt,was=netWaiting;netWaiting=quiet>NETQUIET||netGuestBlind;
      if(was&&!netWaiting)netResumeAt=now+NETRESUME;
      if(quiet>30000){netWaiting=false;netGuestAt=now;toast('Your friend lost connection, so the match ended.');if(state!=='play')state='play';clock=0}
      else if(netWaiting||now<netResumeAt){if(netWaiting)netStat.pausedF=(netStat.pausedF||0)+1;t+=dt;updateCam(dt);netPublish();return}}}
  // kick-off only once both laptops are really ready: the joining laptop has loaded the match, its controls are reaching
  // the host, and it is receiving the host's snapshots. No timed fallback: a match never starts with someone missing.
  if(NET.host&&netPrep){const now=performance.now(),g=netPeer('guest');t+=dt;updateCam(dt);
    const P=g&&g.presence,fresh=!!P&&now-netGuestAt<800,same=!P||!Array.isArray(P.rdi)||(P.rdi[0]===PITCH&&+P.rdi[1]===players.length),loaded=!!P&&+P.rdy===netMatch&&same,ctl=!!RME&&RME.m===netMatch&&now-RME.at<800&&RME.an>=netPrep.n0;
    netPrep.bad=!same;
    netPrep.ck=[fresh,loaded,fresh&&loaded&&ctl];
    if(!netPrep.go&&fresh&&loaded&&ctl)netPrep.go=now;
    if(netPrep.go&&now-netGuestAt>1500)netPrep.go=0;// they dropped out during the countdown: wait for them again
    if(netPrep.go&&now-netPrep.go>=NETCOUNT){netPrep=null;S.whistle(1);netGuestAt=now;netResumeAt=0}
    netPublish();return}
  if(paused&&!NET.on)return;
  if(state==='play'&&introT>0){introT-=dt;t+=dt;updateCam(dt);if(introT<=0){S.whistle(1);koT=t;noise(1.4,700,.2,.5,.3)}return}
  t+=dt;
  if(state==='play'){
    stT+=dt;if(!(SG&&SG.k==='slalom'))clock=Math.max(0,clock-dt/60);if(kickT>0)kickT-=dt;sgUpdate(dt);
    if(windX&&!B.owner){B.vx+=windX*dt*(B.z>2?1.6:.6)}
    if(fire>0)fire-=dt;
    if(NET.host)netGuestPre(dt);
    for(const p of players)tickPlayer(p,dt);
    if(ctrl){if(ctrl.stun>0){ctrl.stun-=dt;ctrl.vx*=.85;ctrl.vy*=.85}else humanUpdate(ctrl,dt)}
    if(NET.host&&ctrl2&&!netV2){if(ctrl2.stun>0){ctrl2.stun-=dt;ctrl2.vx*=.85;ctrl2.vy*=.85}else{const q=ctrl2;withP2(()=>humanUpdate(q,dt))}netPendTick();netGuestFollow(dt)}
    {const _t=performance.now();teamAI(0,dt);teamAI(1,dt);keeperUpdate(keeperOf(0),dt);keeperUpdate(keeperOf(1),dt);PS('ai',_t)}
    if(ctrl)autoSwitch(dt);if(NET.host&&ctrl2&&!netV2)autoSwitchT(dt,1);
    for(const p of players){p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.keeper){const gx=p.team===0?FX0:FX1;if(p.wide){const R=BOX*2.3;p.x=clamp(p.x,p.team?gx-R:gx-6,p.team?gx+6:gx+R);p.y=clamp(p.y,FY0+10,FY1-10);if(!p.sweep&&Math.abs(p.x-gx)<BOX-2&&Math.abs(p.y-MY)<168)p.wide=false}else{p.x=clamp(p.x,p.team?gx-BOX:gx-6,p.team?gx+6:gx+BOX);p.y=clamp(p.y,MY-170,MY+170)}}
      else{p.x=clamp(p.x,FX0+10,FX1-10);p.y=clamp(p.y,FY0+10,FY1-10)}
      if(p!==ctrl&&p!==ctrl2)faceVel(p,dt)}
    for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j],d=dist(a,b);if(a.fall>0||b.fall>0||((a.ghost>0||b.ghost>0)&&a.team!==b.team))continue;
      const carry=(B.owner===a||B.owner===b)&&a.team!==b.team&&!(B.owner&&B.owner.keeper),R0=carry?24:20;
      if(d<R0&&d>0){const nx=(b.x-a.x)/d,ny=(b.y-a.y)/d,gap=R0-d;
        if(carry){
          // the defender holds his ground: the carrier is the one who gets bumped and loses momentum
          const own=B.owner===a?a:b,def=own===a?b:a,sx=own===a?-nx:nx,sy=own===a?-ny:ny;
          // STRENGTH: a strong carrier gets knocked about less and can lean through a weaker defender
          const sd=clamp(.85-((own.st.str??.6)-(def.st.str??.6))*.9,.35,1);own.x+=sx*gap*sd;own.y+=sy*gap*sd;def.x-=sx*gap*(1-sd);def.y-=sy*gap*(1-sd);
          const into=-(own.vx*sx+own.vy*sy);if(into>0){own.vx+=sx*into*1.6;own.vy+=sy*into*1.6}
          if((own.push&&own.push.T>0)||own.anim==='shield'||own.ghost>0){}else if(def.stun<=0&&Math.cos(angDiff(Math.atan2(def.y-own.y,def.x-own.x),own.dir))>.35)own.blocked=(own.blocked||0)+dt*clamp(1.5-(own.st.str??.6)+(def.st.str??.6)*.5,.35,1.6);
        }else{const push=gap/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push}}}
    // running into a set defender for too long and he nicks it
    for(const p of players){if(B.owner!==p){p.blocked=0;continue}if((p.blocked||0)>18){p.blocked=0;const d=players.filter(q=>q.team!==p.team&&!q.keeper&&q.stun<=0).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(d&&dist(d,p)<30){give(d);p.stun=20;S.tackle();if(d.team===0){stats.tackles++;addStyle(10,d.x,d.y,'STOOD FIRM');ctrl=d}else pop('ran into him',p.x,p.y-30,C.muted,15)}}
      if(B.owner===p&&!players.some(q=>q.team!==p.team&&dist(q,p)<26))p.blocked=Math.max(0,(p.blocked||0)-dt)}
    if(B.owner&&dist(B.owner,B)>48)B.owner=null;
    {const _t=performance.now();ballUpdate(dt,true);sanePitch();PS('ball',_t)}
    {const o=B.owner;if(o&&!o.keeper&&state==='play'){const gx=goalX(o.team),dir=Math.sign(gx-o.x);
      const clear=!outfield(1-o.team).some(q=>q.fall<=0&&(q.x-o.x)*dir>-6&&Math.abs(q.y-o.y)<Math.abs(q.x-o.x)*.9+40);
      if(clear&&Math.abs(gx-o.x)<700&&!o.breakaway){o.breakaway=true;if(o.team===0){pop('BREAKAWAY!',o.x,o.y-30,C.mint,28,96);addStyle(15,o.x,o.y);addHype(8);noise(1.6,700,.18,.5,.6);S.skill(1)}else pop('they’re through!',o.x,o.y-30,C.muted,16)}
      if(!clear)o.breakaway=false}}
    if(ctrl&&(fire>0||ctrl.turbo>0)&&t%3<dt){const q=P(ctrl.x+rnd(-6,6),ctrl.y,rnd(4,30));parts.push({x:q.x,y:q.y,vx:rnd(-.4,.4),vy:rnd(-1.6,-.6),g:-.02,life:24,max:24,c:fire>0?pick(['#ff6f59','#ffd166','#ff9a3c']):pick(['#7fe0b4','#fff6e4']),w:5,h:5,r:0,vr:.2})}
    if(!B.owner&&(B.rocket||B.knuckle||B.curl)&&t%2<dt){const q=P(B.x,B.y,B.z+5);parts.push({x:q.x,y:q.y,vx:0,vy:0,g:0,life:14,max:14,c:B.rocket?'rgba(255,111,89,.6)':B.knuckle?'rgba(142,143,240,.6)':'rgba(255,209,102,.6)',w:B.rocket?9:6,h:B.rocket?9:6,r:0,vr:0})}
    if(ctrl&&ctrl.sprint&&t%4<dt)grass(ctrl.x,ctrl.y,1);
    {const ch=ballCharge();if(ch>=3&&t%2<dt){const q=P(B.x,B.y,B.z+5);parts.push({x:q.x,y:q.y,vx:rnd(-.4,.4),vy:rnd(-1,-.3),g:0,life:16,max:16,c:CHARGE[ch],w:5,h:5,r:0,vr:.2})}}
    swipes=swipes.filter(w=>w.end==null||t-w.end<70);
    if(NET.host)netGuestPost();
    rec.push({p:players.map(p=>{const o={x:p.x,y:p.y,dir:p.dir,runPh:p.runPh||0,spdNow:p.spdNow||0};for(const k of VISK)o[k]=p[k];return o}),b:[B.x,B.y,B.z,ballCharge(),B.spin],owner:B.owner?players.indexOf(B.owner):-1,
      s:swipes.map(w=>[w,w.pts.length,w.end==null?-1:t-w.end])});if(rec.length>140)rec.shift();
    if(state==='play'&&Math.abs(score[0]-score[1])>4&&clock>0){clock=0;mercy=true}
    if(clock<=0&&state==='play'&&score[0]===score[1]&&!['chal','skill','league','friendly'].includes(comp)&&!NET.on){pen=null;startPens()}
    else if(clock<=0&&state==='play'){pen=null;state='fulltime';stT=0;awardCoins();S.whistle(3,true);if(score[0]>score[1]){S.goal();burstS(W/2,H/2,200,CONF,12,.12)}else S.aww();if(style>best){best=style;try{localStorage.setItem('kickabout-best3',best)}catch(e){}}}
  }else if(state==='goal'){updateGoalState(dt);ballUpdate(dt*.6,false)}
  else if(state==='replay'){const rf=replay[Math.min(replay.length-1,Math.floor(replayIdx))],cooked=rf&&rf.p.some(r=>(r.whiff||0)>6||(r.fall||0)>6),near=1-Math.min(1,(replay.length-1-replayIdx)/45);replayIdx+=(cooked?.28:.5-near*.27)*dt;if(replayIdx>=replay.length-1)kickoff(1)}
  else if(state==='concede'){updateConcede(dt);ballUpdate(dt*.6,false)}
  else if(state==='pens'){updatePens(dt)}
  else if(state==='fulltime'){stT+=dt;if(cupEvent==='champion'&&stT%18<dt){firework(rnd(80,920),rnd(30,200));if(stT<200)burstS(rnd(100,900),-10,40,CONF,5,.1,[3,7])}if(stT>50&&shownEarned<earned){const before=shownEarned;shownEarned=Math.min(earned,shownEarned+Math.max(1,earned/70)*dt);if(Math.floor(before/25)!==Math.floor(shownEarned/25))tone(1200+shownEarned%400,.05,'triangle',.06)}if(score[0]>score[1]&&stT%30<dt)firework(rnd(100,900),rnd(25,120))}
  else if(state==='menu'){players.forEach((p,i)=>{p.dir+=Math.sin(t*.01+i)*.004})}
  for(const c of clouds){c.x+=.12*dt;if(c.x-c.r>W)c.x=-c.r}
  trailStep();clockCues();crowdMood(dt);
  if(state!=='replay'&&state!=='menu')for(const p of players){const d=Math.hypot(p.x-(p.lx??p.x),p.y-(p.ly??p.y));p.runPh=(p.runPh||0)+d*.17;p.spdNow=(p.spdNow||0)+(d/Math.max(.2,dt)-(p.spdNow||0))*Math.min(1,.3*dt);p.lx=p.x;p.ly=p.y}
  updateCam(dt);
  {let w=0;for(let i=0;i<parts.length;i++){const p=parts[i];if(p.ring){p.r+=2.2*dt}else{p.vy+=p.g*dt;p.vx*=.99;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt}p.life-=dt;if(p.life>0)parts[w++]=p}parts.length=w}
  {let w=0;for(let i=0;i<pops.length;i++){const p=pops[i];p.z+=.6*dt;p.life-=dt;if(p.life>0)pops[w++]=p}pops.length=w}
  if(shake>0)shake=Math.max(0,shake-.6*dt);if(flash>0)flash=Math.max(0,flash-.05*dt);netShake=netShake.map(n=>Math.max(0,n-dt));
  shownStyle+=(style-shownStyle)*Math.min(1,.08*dt);if(Math.abs(style-shownStyle)<.5)shownStyle=style;
  if(NET.host)netPublish();
}

