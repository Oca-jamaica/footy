/* ---------- penalty shoot-out ---------- */
// The shoot-out is its own scene: a camera behind the spot looking straight at goal, with everything in metres.
// X runs across the goal (0 = centre, posts at ±3.66), Y is distance out from the goal line (spot at 11), Z is height (bar at 2.44).
// Nothing is a dice roll on the result: the ball really flies, the keeper's hands really travel, and a save is the two meeting.
const PG={hw:3.66,bar:2.44,spot:11,br:.11},PC={D:24,H:4,f:1536,hor:113};
const PSTART={x:-1.7,y:13.8},PSTRIKE={x:-.42,y:11.32},SWEET=.86;
function PP(X,Y,Z=0){const s=PC.f/Math.max(.5,PC.D-Y);return{x:W/2+X*s,y:PC.hor+(PC.H-Z)*s,s}}
const gauss=()=>(Math.random()+Math.random()+Math.random()+Math.random()-2)*1.73;
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,L=dx*dx+dz*dz||1,u=clamp(((px-ax)*dx+(pz-az)*dz)/L,0,1);return Math.hypot(ax+dx*u-px,az+dz*u-pz)}
const sweetW=p=>.045+p.st.shot*.06;// better strikers get a wider "perfect contact" window

function startPens(){
  state='pens';stT=0;charging=false;parts=[];
  const byFin=tm=>outfield(tm).slice().sort((a,b)=>b.st.fin-a.st.fin);
  pen={kicks:[[],[]],turn:0,phase:'intro',t:0,order:[byFin(0),byFin(1)],n:[0,0],winner:null,zoom:1,slowT:0,flash:null,party:-999};
  penSetup();pen.phase='intro';pen.flash=null;
  S.whistle(2);
}
function penOver(){
  const g=t=>pen.kicks[t].filter(Boolean).length,a=g(0),b=g(1),na=pen.kicks[0].length,nb=pen.kicks[1].length;
  if(na<=5&&nb<=5){if(a+(5-na)<b)return 1;if(b+(5-nb)<a)return 0;if(na===5&&nb===5&&a!==b)return a>b?0:1;return null}
  if(na===nb&&a!==b)return a>b?0:1;return null;
}
// What's riding on this kick, and how much pressure that puts on the taker (0 to 1)
function penStakes(){
  const tm=pen.turn,k=pen.kicks[tm],out={tag:'',press:.2+.09*Math.min(5,k.length)};
  if(pen.ladder){out.press=Math.min(1,.3+pen.lvl*.07);out.tag=pen.lvl?`KICK ${pen.lvl+1}  ·  KEEPER SHARPER`:'';return out}
  k.push(true);const ifScore=penOver();k.pop();k.push(false);const ifMiss=penOver();k.pop();
  if(k.length>=5){out.tag='SUDDEN DEATH';out.press=.8}
  if(tm===0){if(ifScore===0){out.tag='SCORE TO WIN';out.press=1}else if(ifMiss===1){out.tag='MUST SCORE';out.press=1}}
  else{if(ifMiss===0){out.tag='SAVE TO WIN';out.press=1}else if(ifScore===1){out.tag='SAVE OR LOSE';out.press=1}}
  return out}
function penFlash(txt,col){pen.flash={txt,col,t0:t}}
function penSetup(){
  if(pen.ladder)pen.turn=0;
  const tm=pen.turn,taker=pen.order[tm][pen.n[tm]%pen.order[tm].length];
  Object.assign(pen,{taker,gk:keeperOf(1-tm),t:0,res:null,resT:0,word:'',sub:'',good:false,stut:false,stutT:0,commit:undefined,pan:false,perfect:false,power:0,
    wood:false,early:false,switched:false,net:null,trail:[],runK:0,calm:0,wob:{x:0,z:0},aim:{x:0,z:1.1},glove:{x:0,z:1.1},hb:20,strikeT:null,diveT:null});
  pen.run={x:PSTART.x,y:PSTART.y,ph:0,run:0,arms:0,lean:0,jump:0};
  pen.ball={state:'spot',x:0,y:PG.spot,z:PG.br,vx:0,vy:0,vz:0,v:0};
  // their keeper (when you shoot) cheats a step towards the side he fancies diving: watch for it
  pen.K={x:0,z:1,hx:0,hz:1.25,ux:0,uz:1,dive:false,t:0,d:0,sx:0,sz:1.25,tx:0,tz:1.25,spd:.14,bias:tm===0?pick([-1,0,0,1]):0,plan:null,held:false,land:0};
  pen.K.x=pen.K.bias*.22;pen.K.hx=pen.K.x;
  charge=0;charging=false;pen.st=penStakes();
  if(pen.st.tag)penFlash(pen.st.tag,pen.st.press>=1?C.coral:C.sun);
  pen.phase=tm===0?'aim':'kwait';
  if(tm===1){const sd=Math.random()<.5?-1:1,r=Math.random();let style='norm',ax,az;
    if(r<.04&&DF.gk>.8){style='pan';ax=rnd(-.2,.2);az=1.3}
    else if(r<.42){ax=sd*rnd(2.5,3.2);az=Math.random()<.6?rnd(.25,.6):rnd(1.55,2.15)}
    else if(r<.86){ax=sd*rnd(1.1,2.4);az=rnd(.3,1.5)}
    else{ax=rnd(-.5,.5);az=rnd(.5,1.8)}
    // honest takers open their hips towards where they're going; the rest sell you a dummy
    pen.ai={style,ax,az,power:style==='pan'?.2:rnd(.62,1),stut:style!=='pan'&&Math.random()<.2,stutAt:.45+rnd(0,.12),stutDone:false,
      honest:Math.random()<clamp(1.28-DF.gk*.55,.55,.85),runT:70+rnd(-8,8)}}
}

/* ----- input ----- */
function penKey(c){const ph=pen.phase;
  if(ph==='intro'){if(c==='Space'&&pen.t>40)penSetup();return}
  if(ph==='aim'&&c==='Space'&&!charging){charging=true;charge=0;S.tap();return}
  if(ph==='runup'&&(c==='KeyE'||c==='ArrowUp')&&!pen.stut&&pen.runK<.65){
    // freeze mid run-up: most keepers flinch and show you their side; the cool ones wait you out
    pen.stut=true;pen.stutT=32;pen.commit=Math.random()<.7?pick([-1,1]):0;penFlash('STUTTER…',C.sun);S.swoosh();return}
  if(pen.turn===1&&(ph==='kwait'||ph==='fly')&&c==='Space'&&!pen.K.dive){myDive();return}
  if(ph==='result'&&c==='Space'&&pen.resT>50)pen.resT=999;
}
function penKeyUp(c){if(c==='Space'&&charging&&pen.phase==='aim'){charging=false;penRelease()}}
function penRelease(){
  const w=sweetW(pen.taker);pen.power=charge;pen.perfect=Math.abs(charge-SWEET)<=w/2;
  pen.aim={x:pen.aim.x+pen.wob.x,z:pen.aim.z+pen.wob.z};// wherever the nerves had the reticle is where you've picked
  pen.phase='runup';pen.runK=0;
  if(pen.perfect){penFlash('PERFECT CONTACT',C.mint);tone(1568,.12,'triangle',.1)}else if(charge>1)penFlash('TOO MUCH ON IT',C.coral);
  S.tap()}
function myDive(){const K=pen.K,g=pen.glove;pen.diveT=pen.t;pen.diveEarly=pen.phase==='kwait';
  if(pen.phase==='kwait'){const a=pen.ai,left=(1-pen.runK)*a.runT+Math.max(0,pen.stutT)+(a.stut&&!a.stutDone?30:0);if(left>10)pen.early=true}
  K.spd=.14;startDive(K,g.x,g.z);S.swoosh()}

/* ----- update ----- */
function updatePens(dt){
  if(pen.slowT>0){pen.slowT-=dt;dt*=.33}
  pen.t+=dt;stT+=dt;
  const zt=RM?1:(pen.phase==='fly'||pen.phase==='result')?1.16:1;pen.zoom+=(zt-pen.zoom)*Math.min(1,.07*dt);
  if(pen.phase==='intro'){if(pen.t>110)penSetup();return}
  const K=pen.K,R=pen.run,tm=pen.turn;
  // your heart starts going when it really matters
  if((pen.phase==='aim'||pen.phase==='kwait')&&pen.st.press>=.5){pen.hb-=dt;if(pen.hb<=0){pen.hb=64-30*pen.st.press;const v=.12+.14*pen.st.press;tone(62,.13,'sine',v);tone(54,.11,'sine',v*.75,.14)}}
  if(pen.phase==='aim')penAim(dt);
  else if(pen.phase==='runup')penRunup(dt);
  else if(pen.phase==='kwait')penAiRun(dt);
  if(tm===1&&!K.dive&&(pen.phase==='kwait'||pen.phase==='fly')){const g=pen.glove;g.x=clamp(g.x+inX()*.09*dt,-4.2,4.2);g.z=clamp(g.z-inY()*.055*dt,.15,2.6)}
  if(K.plan&&!K.dive&&pen.ball.state==='fly'){K.plan.at-=dt;if(K.plan.at<=0){if(!K.plan.stay)startDive(K,K.plan.tx,K.plan.tz);K.plan=null}}
  keeperStep(K,dt);
  penBallStep(dt);
  if(pen.strikeT!=null){R.run*=Math.pow(.85,dt);if(pen.phase!=='kwait')R.lean*=Math.pow(.9,dt)}
  if(pen.phase==='result'){const happy=pen.res==='goal';R.arms=happy?1:2;R.jump=happy?Math.abs(Math.sin(pen.resT*.18))*.25:0;
    pen.resT+=dt;if(pen.resT>125)penNext()}
}
function penAim(dt){const f=pen.taker.st.fin,ix=inX(),iy=inY(),moving=ix||iy;
  pen.aim.x=clamp(pen.aim.x+ix*.075*dt,-4.6,4.6);pen.aim.z=clamp(pen.aim.z-iy*.045*dt,0,3.2);
  // nerves: the reticle sways, more under pressure and less for good finishers. Keep still and it settles.
  pen.calm=clamp(pen.calm+(moving?-.06:.018)*dt,0,1);
  const amp=(.13+pen.st.press*.36)*(1.35-f)*(1-.45*pen.calm);
  pen.wob.x=amp*(Math.sin(t*.061)*.7+Math.sin(t*.137+1.7)*.45);pen.wob.z=amp*.55*(Math.sin(t*.083+.4)*.7+Math.sin(t*.171)*.4);
  if(charging)charge=Math.min(1.25,charge+.02*dt)}
function moveTaker(k){const R=pen.run,nx=PSTART.x+(PSTRIKE.x-PSTART.x)*k,ny=PSTART.y+(PSTRIKE.y-PSTART.y)*k,d=Math.hypot(nx-R.x,ny-R.y);
  R.ph+=d*7;R.run=d>.001?2.6:R.run*.8;R.x=nx;R.y=ny}
function penRunup(dt){
  if(pen.stutT>0){pen.stutT-=dt;pen.run.run=0;// frozen: you can re-aim properly while the keeper shows his hand
    pen.aim.x=clamp(pen.aim.x+inX()*.07*dt,-4.6,4.6);pen.aim.z=clamp(pen.aim.z-inY()*.04*dt,0,3.2);return}
  pen.aim.x=clamp(pen.aim.x+inX()*.016*dt,-4.6,4.6);pen.aim.z=clamp(pen.aim.z-inY()*.01*dt,0,3.2);
  pen.runK=Math.min(1,pen.runK+dt/(pen.stut?40:46));moveTaker(pen.runK);
  if(pen.runK>=1)penStrikeMine()}
function penAiRun(dt){const a=pen.ai;
  if(a.stut&&!a.stutDone&&pen.runK>=a.stutAt){a.stutDone=true;pen.stutT=30;penFlash('STUTTER…',C.coral)}
  if(pen.stutT>0){pen.stutT-=dt;pen.run.run=0}else{pen.runK=Math.min(1,pen.runK+dt/a.runT);moveTaker(pen.runK)}
  // the tell: as he plants his foot his hips open towards his side (or the other way, if he's selling a dummy)
  const side=a.style==='pan'||Math.abs(a.ax)<.7?0:Math.sign(a.ax)*(a.honest?1:-1);
  pen.run.lean=side*.17*clamp((pen.runK-.5)/.25,0,1);
  if(pen.runK>=1&&pen.stutT<=0)penStrikeAi()}

/* ----- the strike ----- */
function penStrikeMine(){const st=pen.taker.st,p=pen.power;let tx=pen.aim.x,tz=pen.aim.z,v,arc=0,curl=0;
  const pan=p<.3&&Math.abs(tx)<1.3;
  let sig=(1.3-st.fin)*.38*(1+pen.st.press*.35);
  if(pen.perfect)sig*=.5;else if(p>1)sig*=1+(p-1)*3;
  if(pen.stut)sig*=1.35-st.skill*.35;
  if(pan){pen.pan=true;tx=tx*.35+gauss()*.12;tz=1.2+gauss()*.15;v=.2;arc=1.5}
  else{tx+=gauss()*sig;tz+=gauss()*sig*.7;if(p>1)tz+=(p-1)*rnd(3,7);if(p<.3)tz=Math.min(tz,.4);
    v=.15+Math.min(p,1.1)*.27+st.shot*.05+(pen.perfect?.05:0);if(pen.stut)v*=.94;arc=Math.max(0,.25-p*.2);curl=gauss()*.12*(1.1-st.fin)}
  aiKeeperPlan(pen.aim.x,pen.aim.z);
  penLaunch(tx,Math.max(PG.br,tz),v,arc,curl,p);stats.shots++}
// Their keeper decides at the strike. He reads some kicks (better keepers more often), guesses the rest,
// and a stutter that made him flinch commits him early. Then his hands have to actually get there.
function aiKeeperPlan(ix,iz){const K=pen.K,lv=pen.ladder?pen.lvl:0;
  const read=clamp(.1+DF.gk*.17+lv*.05-(pen.perfect?.03:0),.06,.64);
  K.spd=.133+DF.gk*.022+Math.min(.04,lv*.004);
  let tx=0,tz=1.2,at=clamp(Math.round(13-DF.gk*5-lv*.6),4,12),stay=false;
  if(pen.commit){tx=pen.commit*rnd(1.6,2.9);tz=rnd(.3,1.7);at=1}
  else{const rd=pen.commit===0?read+.2:read;
    if(Math.random()<rd){if(Math.abs(ix)<.8)stay=true;else{tx=ix+rnd(-.45,.45);tz=iz+rnd(-.35,.35)}}// read it down the middle: he just stands there
    else if(Math.random()<.18)stay=true;
    else{const sd=K.bias&&Math.random()<.7?K.bias:pick([-1,1]);tx=sd*rnd(1.1,3.1);tz=rnd(.25,2)}}
  K.plan={tx,tz,at,stay}}
function penStrikeAi(){const a=pen.ai,st=pen.taker.st;let ax=a.ax,az=a.az,v,arc=0,curl=0,tx,tz;
  // go too early and a good taker just waits and rolls it the other way
  if(pen.early&&a.style!=='pan'&&Math.random()<.75){ax=-(Math.sign(pen.K.tx)||pick([-1,1]))*rnd(1.7,3);az=rnd(.3,1.8);pen.switched=true;penFlash('HE WAITED FOR YOU',C.coral)}
  if(a.style==='pan'){tx=ax;tz=1.2;v=.2;arc=1.5;pen.pan=true}
  else{const sig=(1.3-st.fin)*.28;tx=ax+gauss()*sig;tz=az+gauss()*sig*.7;
    if(Math.random()<(PMISS[diffKey]||.1)*.45){if(Math.random()<.5)tx=(Math.sign(tx)||1)*rnd(3.85,4.4);else tz=rnd(2.65,3.3)}
    v=.15+a.power*.27+st.shot*.05;curl=gauss()*.1*(1.1-st.fin)}
  penLaunch(tx,Math.max(PG.br,tz),v,arc,curl,a.power)}
function penLaunch(tx,tz,v,arc,curl,p){const b=pen.ball;
  Object.assign(b,{state:'fly',x:0,y:PG.spot,z:PG.br,k:0,T:PG.spot/v,tx,tz,v,arc,curl,checked:false});
  pen.phase='fly';pen.strikeT=pen.t;pen.trail=[];
  S.kick(Math.min(1,p));const q=PP(0,PG.spot,.1);burstS(q.x,q.y,6+(p*8|0),['#ffffff',C.sun,'#3f8a4a'],3.5,.1,[2,4]);
  if(p>.8)shake=RM?0:3;pen.run.lean=pen.turn===0?Math.sign(tx||1)*.1:pen.run.lean}

/* ----- keeper ----- */
function startDive(K,tx,tz){Object.assign(K,{dive:true,t:0,d:0,sx:K.hx,sz:K.hz,tx,tz:clamp(tz,.15,2.5)})}
function keeperStep(K,dt){
  if(!K.dive){
    if(pen.turn===0){const tgt=K.bias*.22+Math.sin(t*.05)*.07+(pen.commit?pen.commit*.35:0);K.x+=(tgt-K.x)*Math.min(1,.1*dt)}
    else K.x+=(pen.glove.x*.12-K.x)*Math.min(1,.2*dt);// you edge across with your gloves
    K.hx=K.x;K.hz=1.25;K.z=1;K.ux=0;K.uz=1;return}
  K.t+=dt;if(!K.held)K.d+=K.spd*Math.min(1,(K.t+1)/5)*dt;
  const dx=K.tx-K.sx,dz=K.tz-K.sz,L=Math.hypot(dx,dz);let ux=0,uz=1;if(L>.05){ux=dx/L;uz=dz/L}
  const dd=Math.min(K.d,L+.9,3.6);/* a dive carries on past the point you picked, to full stretch */K.hx=clamp(K.sx+ux*dd,-4.3,4.3);K.hz=clamp(K.sz+uz*dd,.15,2.6);
  let cx=K.hx-ux*.8,cz=Math.max(.35,K.hz-uz*.8);
  // after a sideways dive he lands on the grass
  if(pen.phase==='result'&&pen.resT>16&&Math.abs(ux)>.35)K.land=Math.min(1,K.land+.07*dt);
  if(K.land){K.hz+=(.35-K.hz)*K.land;cz+=(.3-cz)*K.land;const ly=Math.sign(ux)*.95;ux+=(ly-ux)*K.land;uz+=(.05-uz)*K.land;K.hx=cx+ux*.8}
  K.x=cx;K.z=cz;K.ux=ux;K.uz=uz}
// How close the ball came to the keeper: negative "miss" means he got something on it.
function keeperReach(K,bx,bz){let best={hit:false,miss:9,how:'',d:9};
  const chk=(d,r,how)=>{const m=d-r;if(m<best.miss)best={hit:m<0,miss:m,how,d}};
  if(K.dive){const fx=K.x-K.ux*.95,fz=K.uz>.6?Math.max(0,K.z-K.uz*.95):clamp(K.z-K.uz*.95,0,.35);/* feet stay low unless he springs straight up */chk(Math.hypot(bx-K.hx,bz-K.hz),.53,'hands');chk(segDist(bx,bz,fx,fz,K.hx,K.hz),.41,'body')}
  else{chk(segDist(bx,bz,K.x,0,K.x,1.95),.47,'body');chk(Math.hypot(bx-(K.x-.72),bz-1.3),.42,'hands');chk(Math.hypot(bx-(K.x+.72),bz-1.3),.42,'hands')}
  return best}

/* ----- ball ----- */
function penBallStep(dt){const b=pen.ball;
  if(b.state==='fly'){b.k+=dt/b.T;const k=Math.min(b.k,1),sk=Math.sin(k*Math.PI);
    b.x=b.tx*k+b.curl*sk;b.y=PG.spot*(1-k);b.z=PG.br+(b.tz-PG.br)*k+b.arc*sk;B.spin+=.5*dt;
    pen.trail.push([b.x,b.y,b.z]);if(pen.trail.length>8)pen.trail.shift();
    if(!b.checked&&b.y<=.32){b.checked=true;penContact()}
    if(b.state==='fly'&&b.k>=1)penGoalLine();
    return}
  if(pen.trail.length)pen.trail.shift();
  if(b.state==='held'){b.x=pen.K.hx;b.z=Math.max(PG.br,pen.K.hz);b.y=.45;return}
  if(b.state==='free'){b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.vz-=.012*dt;B.spin+=Math.hypot(b.vx,b.vy)*3*dt;
    if(b.z<PG.br){b.z=PG.br;b.vz=Math.abs(b.vz)>.03?-b.vz*.45:0;b.vx*=.9;b.vy*=.9;if(Math.abs(b.vz)>.02)tone(110,.05,'sine',.06,0,.6)}
    if(b.inNet){const back=-2+.35*Math.min(b.z,2.3)+.12;if(b.y<back){b.y=back;b.vy=Math.abs(b.vy)*.08;b.vx*=.4}
      if(Math.abs(b.x)>PG.hw-.15){b.x=Math.sign(b.x)*(PG.hw-.15);b.vx*=-.3}if(b.z>PG.bar-.15){b.z=PG.bar-.15;b.vz=Math.min(0,b.vz)}}
    if(b.y<-4){b.y=-4;b.vy=0;b.vx*=.5}}}
function penContact(){const b=pen.ball,K=pen.K,c=keeperReach(K,b.x,b.z);
  if(c.hit){const held=b.v<.34&&c.d<.45;
    if(held){b.state='held';K.held=true}
    else{b.state='free';b.vx=(b.x>=K.x?1:-1)*rnd(.05,.11);b.vy=rnd(.1,.18);b.vz=rnd(.05,.12)}
    S.save();hitStop(4);if(!RM)pen.slowT=26;shake=RM?0:5;
    const q=PP(b.x,b.y,b.z);burstS(q.x,q.y,12,['#ffffff',C.sun],4,.08,[2,4]);
    penResolve('saved',{held,tip:c.miss>-.12});return}
  if(c.miss<.35&&!RM)pen.slowT=22}// so close: let it breathe
function penGoalLine(){const b=pen.ball,ax=Math.abs(b.x),r=PG.br;
  b.state='free';b.vx=b.tx/b.T*.6;b.vy=-b.v*.75;b.vz=0;
  if(b.z>PG.bar+r+.02||ax>PG.hw+r+.02){if(b.z>PG.bar)b.vz=.05;penResolve(b.z>PG.bar+r+.02&&ax<PG.hw+.5?'over':'wide');return}
  const nearPost=ax>PG.hw-r-.07,nearBar=b.z>PG.bar-r-.06;
  if(nearPost||nearBar){pen.wood=true;S.post();shake=RM?0:6;if(!RM)pen.slowT=24;
    const inside=ax<PG.hw&&b.z<PG.bar;
    if(inside&&Math.random()<.5){if(nearPost)b.vx=-Math.sign(b.x)*.07;else b.vz=-.08;b.vy=-.16;b.inNet=true;penResolve('goal')}
    else{b.vy=rnd(.1,.18);if(nearPost)b.vx=Math.sign(b.x)*rnd(.02,.06)*(inside?-1:1);else b.vz=rnd(.06,.12);penResolve('post')}
    return}
  b.inNet=true;penResolve('goal')}

/* ----- result ----- */
function penResolve(res,info={}){if(pen.res)return;
  const tm=pen.turn,scored=res==='goal',b=pen.ball,K=pen.K;
  pen.res=res;pen.phase='result';pen.resT=0;pen.kicks[tm].push(scored);pen.n[tm]++;
  if(scored)pen.net={x:b.x,z:b.z,t0:t};
  const subs=[];let pts=0;const add=(l,p)=>{subs.push(l);pts+=p};
  const wrongWay=K.dive&&Math.abs(b.x)>1&&Math.sign(K.tx)!==Math.sign(b.x);
  if(tm===0){
    if(scored){pen.word=pen.pan?'PANENKA!':'GOAL!';stats.on++;
      if(pen.pan)pts+=60;if(pen.wood)add('OFF THE POST AND IN',30);if(pen.perfect)add('PERFECT STRIKE',20);
      if(b.z>1.85)add('TOP BINS',25);else if(Math.abs(b.x)>2.8)add('INTO THE CORNER',15);
      if(wrongWay)add('SENT HIM THE WRONG WAY',20);if(pen.stut)add('STUTTER',15)}
    else{pen.word=res==='saved'?'SAVED':res==='over'?'OVER THE BAR':res==='post'?'OFF THE POST':'WIDE';
      if(res==='saved')subs.push(pen.pan?'he stood his ground':!K.dive?'straight at him':info.tip?'fingertips':'he read it');
      if(res==='over'&&pen.power>1)subs.push('leaned back and skied it')}}
  else{
    if(scored){pen.word='THEY SCORE';subs.push(pen.switched?'he waited for you to go':wrongWay?'wrong way':pen.pan?'cheeky Panenka':K.dive?'just out of reach':'you never moved')}
    else{pen.word=res==='saved'?'YOU SAVED IT!':'HE’S MISSED!';
      if(res==='saved'){if(info.held)add('HELD IT',30);else if(info.tip)add('FINGERTIPS!',40);else add('GREAT SAVE',30);if(pen.diveEarly)add('GUESSED RIGHT',10)}
      else subs.push(res==='over'?'over the bar':res==='post'?'off the post':'wide')}}
  style+=pts;pen.sub=subs.join('  ·  ')+(pts?`   +${pts}`:'');
  pen.good=(scored&&tm===0)||(!scored&&tm===1);
  if(pen.good){S.goal();pen.party=t;const q=PP(b.x,0,1.2);burstS(q.x,q.y,90,[...CONF,KIT()],8,.12)}else S.aww()}
function penNext(){
  if(pen.ladder){if(pen.kicks[0][pen.kicks[0].length-1]){pen.lvl++;penSetup()}else{state='fulltime';stT=0;SG.pts=pen.lvl;awardCoins();S.whistle(3,true)}return}
  const w=penOver();
  if(w!==null){pen.winner=w;state='fulltime';stT=0;awardCoins();S.whistle(3,true);if(w===0){S.goal();burstS(W/2,H/2,200,CONF,12,.12)}else S.aww();return}
  pen.turn=1-pen.turn;penSetup()}

/* ----- drawing ----- */
let penA=null,penB=null,penCrowd=null;
function penLayer(fn){const c=document.createElement('canvas');c.width=W*DPR;c.height=H*DPR;const g=c.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);const kc=ctx;ctx=g;try{fn()}finally{ctx=kc}return c}
// the stand behind the goal, tier by tier
function drawPenStandsA(){
  const g=ctx.createLinearGradient(0,0,0,H*.6);g.addColorStop(0,'#05080f');g.addColorStop(1,'#1d2d3c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const base=PP(0,-3.2,.3).y,sg=ctx.createLinearGradient(0,-40,0,base);sg.addColorStop(0,'#1b2028');sg.addColorStop(1,'#3a4250');ctx.fillStyle=sg;ctx.fillRect(0,-40,W,base+40);
  ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;for(let r=0;r<20;r++){const y=PP(0,-4-r*.95,.3+r*.7).y;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  for(const x of [W*.12,W*.88]){const rg=ctx.createRadialGradient(x,-10,0,x,-10,260);rg.addColorStop(0,'rgba(255,250,230,.35)');rg.addColorStop(1,'rgba(255,250,230,0)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H)}}
function penRows(){const rows=[];for(let r=19;r>=0;r--){const Y=-4-r*.95,Z=.75+r*.7,s=PC.f/(PC.D-Y),xm=(W/2+30)/s;
  for(let X=-xm;X<=xm;X+=.5)rows.push({X:X+rnd(-.12,.12),Y,Z,c:Math.random()<.45?(X<0?'H':'A'):(Math.random()*CLOTH.length)|0,ph:rnd(0,6),sk:(Math.random()*5)|0})}return rows}
function drawPenCrowd(){if(!penCrowd)penCrowd=penRows();const party=t-pen.party<220,byCol={},heads={};
  for(const c of penCrowd){const q=PP(c.X,c.Y,c.Z+(party?Math.abs(Math.sin(t*.25+c.ph))*.35:Math.sin(t*.03+c.ph)*.03));q.sk=c.sk;const col=crowdCol(c);(byCol[col]||(byCol[col]=[])).push(q)}
  for(const col in byCol){ctx.fillStyle=col;ctx.beginPath();for(const q of byCol[col]){const r=.17*q.s;ctx.moveTo(q.x+r,q.y+r*.9);ctx.ellipse(q.x,q.y+r*.9,r,r*1.2,0,0,6.2832);(heads[q.sk]||(heads[q.sk]=[])).push(q)}ctx.fill()}
  for(const sk in heads){ctx.fillStyle=CSKIN[sk];ctx.beginPath();for(const q of heads[sk]){const r=.11*q.s;ctx.moveTo(q.x+r,q.y-r*.6);ctx.arc(q.x,q.y-r*.6,r,0,6.2832)}ctx.fill()}}
function pline(pts,lw=.12){for(let i=1;i<pts.length;i++){const a=PP(pts[i-1][0],pts[i-1][1]),b=PP(pts[i][0],pts[i][1]);ctx.lineWidth=Math.max(1,lw*(a.s+b.s)/2);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}
// boards, grass and markings
function drawPenFieldB(){
  for(let Y=-2.6,i=0;Y<PC.D-1;Y+=2,i++){const a=PP(0,Y,0),b=PP(0,Math.min(Y+2,PC.D-1),0);ctx.fillStyle=i%2?'#4f9e48':'#45903f';ctx.fillRect(0,a.y,W,b.y-a.y+1)}
  {const a=PP(0,-2.6,0).y,g=ctx.createLinearGradient(0,a,0,H);g.addColorStop(0,'rgba(5,15,25,.35)');g.addColorStop(.35,'rgba(5,15,25,0)');g.addColorStop(1,'rgba(5,15,25,.18)');ctx.fillStyle=g;ctx.fillRect(0,a,W,H-a)}
  {const c=PP(0,1.5,0),rg=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,190);rg.addColorStop(0,'rgba(150,140,80,.25)');rg.addColorStop(1,'rgba(150,140,80,0)');ctx.save();ctx.translate(c.x,c.y);ctx.scale(1,.35);ctx.translate(-c.x,-c.y);ctx.fillStyle=rg;ctx.beginPath();ctx.arc(c.x,c.y,190,0,7);ctx.fill();ctx.restore()}
  ctx.strokeStyle='rgba(255,255,255,.88)';ctx.lineCap='round';
  pline([[-30,0],[30,0]]);pline([[-9.16,0],[-9.16,5.5],[9.16,5.5],[9.16,0]]);pline([[-20.16,0],[-20.16,16.5],[20.16,16.5],[20.16,0]]);
  {const a=Math.acos(5.5/9.15),pts=[];for(let i=0;i<=24;i++){const f=-a+2*a*i/24;pts.push([9.15*Math.sin(f),11+9.15*Math.cos(f)])}pline(pts)}
  {const q=PP(0,PG.spot,0);ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.ellipse(q.x,q.y,.14*q.s,.05*q.s,0,0,7);ctx.fill()}
  ctx.lineCap='butt';
  // LED boards behind the goal
  const by=-2.6,cols=['#ff6f59','#ffd166','#8e8ff0','#7fe0b4'];
  for(let x=-26,i=0;x<26;x+=3.4,i++){const a=PP(x,by,0),b=PP(x+3.3,by,.8);ctx.fillStyle='#0d1117';ctx.fillRect(a.x,b.y-2,b.x-a.x+2,a.y-b.y+2);
    ctx.fillStyle=cols[i%4];ctx.globalAlpha=.9;ctx.fillRect(a.x+2,b.y+1,b.x-a.x-3,a.y-b.y-4);ctx.globalAlpha=1;
    ctx.fillStyle='#0d1117';ctx.font=`italic 800 ${Math.round(.42*a.s)}px "Barlow Condensed","Arial Narrow",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(i%2?'KICKABOUT':'SUNDAY LEAGUE',(a.x+b.x)/2,(a.y+b.y)/2)}}
function drawPenNet(){const hw=PG.hw,n=pen.net,age=n?t-n.t0:999,amp=n?.6*Math.exp(-age/26)*Math.cos(age*.33):0;
  const rip=(x,z)=>amp?amp*Math.exp(-((x-n.x)**2+(z-n.z)**2)/.7):0,back=z=>-2+.35*Math.min(z,2.3),BP=(x,z)=>PP(x,back(z)-rip(x,z),z);
  const poly=pts=>{ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill()};
  ctx.fillStyle='rgba(0,0,0,.2)';poly([PP(-hw,0,0),PP(hw,0,0),PP(hw+.2,-2.1,0),PP(-hw-.2,-2.1,0)]);
  ctx.fillStyle='rgba(235,240,245,.08)';
  poly([BP(-hw,0),BP(hw,0),BP(hw,2.3),BP(-hw,2.3)]);poly([PP(-hw,0,PG.bar),PP(hw,0,PG.bar),BP(hw,2.3),BP(-hw,2.3)]);
  for(const sx of [-hw,hw])poly([PP(sx,0,0),PP(sx,0,PG.bar),BP(sx,2.3),BP(sx,0)]);
  ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=.8;
  const line=pts=>{ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke()};
  for(let i=0;i<=26;i++){const x=-hw+i*2*hw/26,pts=[];for(let z=0;z<=2.3;z+=.23)pts.push(BP(x,z));line(pts);line([PP(x,0,PG.bar),BP(x,2.3)])}
  for(let z=0;z<=2.31;z+=.23){const pts=[];for(let x=-hw;x<=hw+.01;x+=.3)pts.push(BP(x,z));line(pts)}
  for(const sx of [-hw,hw]){for(let z=0;z<=2.31;z+=.23)line([PP(sx,0,z*PG.bar/2.3),BP(sx,z)]);for(let f=.25;f<1;f+=.25){const pts=[];for(let z=0;z<=2.3;z+=.23)pts.push(PP(sx,back(z)*f,z+(PG.bar-2.3)*f*z/2.3));line(pts)}}}
function drawPenPosts(){const hw=PG.hw,a=PP(-hw,0,0),b=PP(-hw,0,PG.bar),c=PP(hw,0,PG.bar),d=PP(hw,0,0),w=.12*a.s;
  const frame=()=>{ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke()};
  ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=w+3;frame();ctx.strokeStyle='#c9cfd4';ctx.lineWidth=w;frame();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=w*.45;ctx.save();ctx.translate(-w*.18,-w*.18);frame();ctx.restore();ctx.lineCap='butt';ctx.lineJoin='miter'}
function penFig(p,x,y,sc,o){const kc=kitFor(p);ctx.save();ctx.translate(x,y);if(o.rot){ctx.translate(0,-25*sc);ctx.rotate(o.rot);ctx.translate(0,25*sc)}ctx.scale(sc,sc);
  figure({fx:o.fx||1,face:o.face,ph:o.ph||0,run:o.run||0,kit:kc.kit,shorts:kc.shorts,socks:kc.socks,gloves:kc.gloves,band:kc.band,trim:kc.trim,numCol:kc.numCol,boot:kc.boot,bootMark:kc.bootMark,
    skin:p.st.skin,hair:p.st.hair,look:lookOf(p.st),arms:o.arms||0,dive:o.dive,kneel:false,num:p.st.num,k:2});ctx.restore()}
function penShadow(X,Y,w,a=.3){const q=PP(X,Y,0);ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(q.x,q.y,w*q.s,w*.3*q.s,0,0,7);ctx.fill()}
function drawPenKeeper(){const K=pen.K,gk=pen.gk,s=PP(0,.3,0).s,sc=s*1.9/53*(lookOf(gk.st)[3]||1);
  penShadow(K.dive?K.x:K.x,.3,K.dive?.9:.5);
  if(!K.dive){const f=PP(K.x,.3,0),bob=Math.abs(Math.sin(t*.12))*2;penFig(gk,f.x,f.y-bob,sc,{face:1,arms:3,rot:pen.turn===0&&pen.commit?pen.commit*.16:K.bias*.04});return}
  const c=PP(K.x,.3,K.z),h=PP(K.hx,.3,K.hz);penFig(gk,c.x,c.y+25*sc,sc,{face:1,arms:1,dive:true,rot:Math.atan2(h.x-c.x,-(h.y-c.y))})}
function drawPenTaker(){const R=pen.run,tk=pen.taker,f=PP(R.x,R.y,0),sc=f.s*1.82/53*(lookOf(tk.st)[3]||1);penShadow(R.x,R.y,.45);
  penFig(tk,f.x,f.y-R.jump*f.s,sc,{face:-1,fx:1,ph:R.ph,run:R.run,arms:R.arms,rot:R.lean})}
function drawPenBall(){const b=pen.ball,q=PP(b.x,b.y,b.z),g=PP(b.x,b.y,0),r=Math.max(2,PG.br*q.s);
  pen.trail.forEach((p,i)=>{const s=PP(p[0],p[1],p[2]);ctx.fillStyle=`rgba(255,255,255,${(.22*(i+1)/pen.trail.length).toFixed(3)})`;ctx.beginPath();ctx.arc(s.x,s.y,PG.br*s.s*(.5+.5*(i+1)/pen.trail.length),0,7);ctx.fill()});
  const lift=Math.min(.7,b.z/3);ctx.fillStyle=`rgba(0,0,0,${.35*(1-lift)})`;ctx.beginPath();ctx.ellipse(g.x,g.y,r*1.1,r*.35,0,0,7);ctx.fill();
  ctx.save();ctx.translate(q.x,q.y);const rg=ctx.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.05);rg.addColorStop(0,'#ffffff');rg.addColorStop(.6,'#f2f2f2');rg.addColorStop(1,'#9aa3ab');
  ctx.fillStyle=rg;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.clip();
  ctx.fillStyle='#22282e';for(let i=0;i<5;i++){const a=B.spin+i*1.2566,px=Math.cos(a)*r*.62,py=Math.sin(a*1.3)*r*.5;ctx.beginPath();for(let j=0;j<5;j++){const bb=j*1.2566+a;const vx=px+Math.cos(bb)*r*.2,vy=py+Math.sin(bb)*r*.2;j?ctx.lineTo(vx,vy):ctx.moveTo(vx,vy)}ctx.closePath();ctx.fill()}
  ctx.restore();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.stroke()}
function drawPenAim(){
  if(pen.turn===0&&(pen.phase==='aim'||pen.phase==='runup')){const aiming=pen.phase==='aim',x=pen.aim.x+(aiming?pen.wob.x:0),z=pen.aim.z+(aiming?pen.wob.z:0),q=PP(x,0,z);
    const ax=Math.abs(x),out=ax>PG.hw||z>PG.bar,risky=ax>3.15||z>2.05,col=out?C.coral:risky?C.sun:C.mint,R=aiming?13+(charging?Math.sin(t*.5)*2:0):8;
    ctx.save();ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(q.x,q.y,R,0,7);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(q.x,q.y,R,0,7);ctx.stroke();
    ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x-R-6,q.y);ctx.lineTo(q.x-R+4,q.y);ctx.moveTo(q.x+R-4,q.y);ctx.lineTo(q.x+R+6,q.y);ctx.moveTo(q.x,q.y-R-6);ctx.lineTo(q.x,q.y-R+4);ctx.moveTo(q.x,q.y+R-4);ctx.lineTo(q.x,q.y+R+6);ctx.stroke();
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,7);ctx.fill();ctx.restore();
    if(aiming){const lab=out?'OFF TARGET':risky?'RISKY':pen.calm>.75?'STEADY':'';if(lab)txt(lab,q.x,q.y+R+16,12,col,'center',true)}}
  if(pen.turn===1&&!pen.K.dive&&(pen.phase==='kwait'||pen.phase==='fly')){const g=pen.glove,q=PP(g.x,.3,g.z),r=.16*q.s;
    ctx.save();ctx.globalAlpha=.85+.15*Math.sin(t*.2);for(const dx of [-r*.85,r*.85]){ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(q.x+dx,q.y+2,r*.75,r,0,0,7);ctx.fill();ctx.fillStyle=C.sun;ctx.beginPath();ctx.ellipse(q.x+dx,q.y,r*.7,r*.95,0,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=1.5;ctx.stroke()}
    ctx.restore();txt('DIVE',q.x,q.y+r+12,11,C.sun,'center',true)}}
function drawPens(){
  if(!penA){penA=penLayer(drawPenStandsA);penB=penLayer(drawPenFieldB)}
  ctx.save();
  if(shake>0){const sx=(Math.sin(t*1.7)+Math.sin(t*2.9+1.3)*.6)*.38*shake,sy=(Math.sin(t*2.3+.7)+Math.sin(t*3.7)*.5)*.38*shake;ctx.translate(sx,sy)}
  const z=pen.zoom||1,fy=PP(0,0,1.2).y;ctx.translate(W/2,fy);ctx.scale(z,z);ctx.translate(-W/2,-fy);
  ctx.drawImage(penA,0,0,W,H);drawPenCrowd();ctx.fillStyle='rgba(8,14,22,.28)';ctx.fillRect(-W,-H,W*3,PP(0,-2.6,.9).y+H);ctx.drawImage(penB,0,0,W,H);
  drawPenNet();
  const b=pen.ball;if(b.y<0)drawPenBall();
  drawPenPosts();
  if(b.y>=0&&b.y<.3)drawPenBall();
  drawPenKeeper();
  if(b.y>=.3)drawPenBall();
  drawPenTaker();drawPenAim();
  ctx.restore();
  drawParts();vignette();drawPenHUD();
  if(flash>0){ctx.fillStyle=`rgba(255,246,228,${flash*.5})`;ctx.fillRect(0,0,W,H)}
}
function drawPenHUD(){
  if(pen.ladder){ctx.fillStyle='rgba(20,48,63,.92)';rr(W/2-200,10,400,40,20);ctx.fill();txt(`PENALTY LADDER  ·  ${pen.lvl} in a row  ·  best ${(club.sgBest||{}).pens||0}`,W/2,30,17,C.sun,'center',false)}
  else{ctx.fillStyle='rgba(20,48,63,.9)';rr(W/2-220,8,440,64,18);ctx.fill();
    const rows=[[TEAMNAME().slice(0,12),0,KIT()==='#2f2f3a'?C.cream:KIT()],[OPP.name.slice(0,14),1,lighten(OPP.kit,.2)]];
    rows.forEach(([nm,tm,col],r)=>{const y=27+r*26;txt(nm,W/2-206,y,14,col,'left',false);
      const ks=pen.kicks[tm],n=Math.max(5,ks.length+(pen.turn===tm&&pen.phase!=='result'?1:0)),x0=W/2-60-Math.max(0,n-5)*26;
      for(let i=0;i<n;i++){const x=x0+i*26;
        if(i<ks.length){ctx.fillStyle=ks[i]?C.mint:C.coral;ctx.beginPath();ctx.arc(x,y,8,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2.4;ctx.beginPath();
          if(ks[i]){ctx.moveTo(x-4,y);ctx.lineTo(x-1,y+3);ctx.lineTo(x+4,y-3)}else{ctx.moveTo(x-3.5,y-3.5);ctx.lineTo(x+3.5,y+3.5);ctx.moveTo(x+3.5,y-3.5);ctx.lineTo(x-3.5,y+3.5)}ctx.stroke()}
        else{const now=i===ks.length&&pen.turn===tm&&pen.phase!=='intro';ctx.strokeStyle=now?C.sun:'rgba(255,246,228,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,now?8+Math.sin(t*.2):7,0,7);ctx.stroke()}}
      txt(String(ks.filter(Boolean).length),W/2+200,y,20,C.cream,'right',false)})}
  if(pen.phase==='intro'){const e=elastic(pen.t/34);ctx.save();ctx.translate(W/2,H/2-30);ctx.scale(e,e);txt(pen.ladder?'PENALTY LADDER':'PENALTIES!',0,0,84,C.sun);ctx.restore();
    if(pen.t>30)txt(pen.ladder?'Keep scoring. Their keeper gets sharper every kick.':'Level after full time. Five kicks each, then sudden death.',W/2,H/2+30,18,C.cream);return}
  // what's riding on it
  if(pen.st&&pen.st.tag&&pen.phase!=='result'&&!pen.ladder){const hot=pen.st.press>=1,y=pen.ladder?66:90;ctx.fillStyle=hot?'rgba(226,72,61,.92)':'rgba(20,48,63,.9)';rr(W/2-95,y-13,190,26,13);ctx.fill();txt(pen.st.tag,W/2,y+1,14,hot?'#fff':C.sun,'center',false)}
  if(pen.flash){const k=t-pen.flash.t0;if(k>85)pen.flash=null;else if(pen.phase!=='result'){const e=elastic(k/22);ctx.save();ctx.globalAlpha=Math.min(1,(85-k)/20);ctx.translate(W/2,165);ctx.scale(e,e);txt(pen.flash.txt,0,0,34,pen.flash.col);ctx.restore()}}
  // who's up
  const tm=pen.turn,tk=pen.taker,st=tk.st;
  ctx.fillStyle='rgba(13,17,23,.84)';rr(W-264,H-96,250,82,8);ctx.fill();
  if(tm===0){txt(`#${st.num} ${st.short||''}`,W-252,H-80,17,C.sun,'left',false);
    txt(`FIN ${Math.round(st.fin*100)}   SHO ${Math.round(st.shot*100)}   SKL ${Math.round(st.skill*100)}`,W-252,H-58,13,C.cream,'left',false);
    const nv=clamp(pen.st.press*(1.35-st.fin)/1.05,0,1);txt('NERVES',W-252,H-34,12,C.muted,'left',false);ctx.fillStyle='#232b36';rr(W-194,H-39,166,9,4);ctx.fill();
    ctx.fillStyle=nv>.6?C.coral:nv>.35?C.sun:C.mint;rr(W-194,H-39,Math.max(6,166*nv*(1-.45*pen.calm)),9,4);ctx.fill()}
  else{txt('YOU’RE IN GOAL',W-252,H-80,17,C.mint,'left',false);txt(`#${st.num} ${st.short||''}  ·  FIN ${Math.round(st.fin*100)}`,W-252,H-58,13,C.cream,'left',false);
    txt(pen.ai&&pen.ai.honest===false&&DF.gk<.9?'some takers dummy you':'watch his hips as he plants',W-252,H-34,12,C.muted,'left',false)}
  // power bar while you're shooting
  if(tm===0&&(pen.phase==='aim'||pen.phase==='runup')){const x=W-58,y0=140,h=300,v2y=v=>y0+h-h*v/1.25,w=sweetW(tk);
    ctx.fillStyle='rgba(13,17,23,.84)';rr(x-14,y0-30,56,h+56,8);ctx.fill();
    const band=(a,b,col)=>{ctx.fillStyle=col;ctx.fillRect(x,v2y(b),22,v2y(a)-v2y(b))};
    band(0,.3,'rgba(142,143,240,.55)');band(.3,1,'rgba(255,246,228,.16)');band(SWEET-w/2,SWEET+w/2,C.sun);band(1,1.25,'rgba(255,111,89,.6)');
    txt('POWER',x+11,y0-15,12,C.muted,'center',false);txt('SKY',x+11,v2y(1.12),10,'#fff','center',false);txt('CHIP',x+11,v2y(.15),10,'#fff','center',false);
    const pv=pen.phase==='aim'?charge:pen.power;if(pv>0){const y=v2y(pv);ctx.fillStyle='#fff';ctx.shadowColor='#fff';ctx.shadowBlur=8;ctx.fillRect(x-6,y-2,34,4);ctx.shadowBlur=0}}
  // what to do
  const hint=tm===0?(pen.phase==='aim'?(charging?'let go in the gold zone for perfect contact':'WASD aim  ·  keep still to steady your nerves  ·  hold SPACE for power  ·  soft down the middle = Panenka')
      :pen.phase==='runup'?(pen.stutT>0?'he’s twitching: re-aim with WASD':pen.stut?'':'E to stutter and make him flinch'):'')
    :(pen.phase==='kwait'||pen.phase==='fly')&&!pen.K.dive?'WASD move your gloves  ·  SPACE to dive  ·  go too early and he’ll wait you out':'';
  if(hint){ctx.font='italic 800 15px "Barlow Condensed","Arial Narrow",sans-serif';const tw=ctx.measureText(hint).width,sc=Math.min(1,640/tw),w=tw*sc+36,cx=W/2,hy=pen.ladder?78:122;
    ctx.fillStyle='rgba(20,48,63,.88)';rr(cx-w/2,hy-15,w,30,15);ctx.fill();ctx.save();ctx.translate(cx,hy);ctx.scale(sc,1);txt(hint,0,0,14,C.cream,'center',false);ctx.restore()}
  // the verdict
  if(pen.phase==='result'){const e=elastic(pen.resT/26);ctx.save();ctx.translate(W/2,175);ctx.scale(e,e);txt(pen.word,0,0,pen.good?72:56,pen.good?C.sun:C.muted);ctx.restore();
    if(pen.sub&&pen.resT>14){ctx.globalAlpha=Math.min(1,(pen.resT-14)/12);txt(pen.sub,W/2,228,20,pen.good?C.mint:C.cream);ctx.globalAlpha=1}}
}
