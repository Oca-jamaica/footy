/* ---------- draw ---------- */
function txt(s,x,y,size,col,align='center',stroke=true){
  ctx.font=`italic 800 ${Math.round(size*1.06)}px "Barlow Condensed","Arial Narrow","Helvetica Neue",Arial,sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';
  if(stroke){ctx.lineWidth=Math.max(3,size*.14);ctx.strokeStyle=C.ink;ctx.lineJoin='round';ctx.strokeText(s,x,y)}
  ctx.fillStyle=col;ctx.fillText(s,x,y);
}
function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h)}
function drawDizzy(){if(state!=='play')return;
  {const o=B.owner;if(o&&o.team===1&&!o.keeper&&o.st.short){const hf=lookOf(o.st)[3]||1,h=P(o.x,o.y,(o.jump||0)+60*hf);ctx.fillStyle=C.coral;ctx.beginPath();ctx.moveTo(h.x-5,h.y-7);ctx.lineTo(h.x+5,h.y-7);ctx.lineTo(h.x,h.y);ctx.fill();txt(o.st.short,h.x,h.y-16,13,'#ffd0c8')}}for(const p of players){if(p.windup>0){const hf=lookOf(p.st)[3]||1,h=P(p.x,p.y,70*hf);txt('!',h.x,h.y,Math.round(22*h.s),p.windSlide?C.coral:C.sun)}}
  for(const p of players){if(!(p.whiff>8))continue;const hf=lookOf(p.st)[3]||1,h=P(p.x,p.y,48*hf),r=14*h.s;
    for(let i=0;i<3;i++){const a=t*.18+i*2.094,x=h.x+Math.cos(a)*r,y=h.y+Math.sin(a)*r*.4;ctx.fillStyle=i===1?C.cream:C.sun;star(x,y,5.2*h.s)}}}
function star(x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr2=i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr2,y+Math.sin(a)*rr2)}ctx.closePath();ctx.fill()}
function drawSwipe(w,n,age){
  // only failed tackles get marked: a faint dashed trail and a small X where the swipe ended
  if(w.res!=='miss'||age<0||n<2)return;const a=Math.max(0,1-age/50);if(a<=0)return;
  ctx.save();const pts=w.pts.slice(0,n).map(q=>P(q[0],q[1],2)),s0=pts[0].s,e=pts[pts.length-1];
  ctx.setLineDash([4*s0,4*s0]);ctx.lineCap='round';ctx.strokeStyle=`rgba(255,246,228,${.45*a})`;ctx.lineWidth=1.6*s0;
  ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.setLineDash([]);
  const r=4.5*s0;ctx.strokeStyle=`rgba(255,111,89,${.9*a})`;ctx.lineWidth=2.2*s0;ctx.beginPath();ctx.moveTo(e.x-r,e.y-r*.55);ctx.lineTo(e.x+r,e.y+r*.55);ctx.moveTo(e.x+r,e.y-r*.55);ctx.lineTo(e.x-r,e.y+r*.55);ctx.stroke();
  if(w.missBy&&w.vs===0){ctx.globalAlpha=a;txt(`${w.missBy.toFixed(1)}m`,e.x,e.y-14*s0,11,'rgba(255,246,228,.85)','center',false)}
  ctx.restore()}
function drawModeWorld(){
  if(SG&&SG.k==='target'&&state==='play'){for(const sy of [-1,1]){const y0=sy<0?GY0:GY1-26,y1=y0+26;ctx.fillStyle=`rgba(255,209,102,${.25+.12*Math.sin(t*.15)})`;ctx.beginPath();[[y0,0],[y1,0],[y1,BAR],[y0,BAR]].forEach(([y,z],i)=>{const q=P(FX1,y,z);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.closePath();ctx.fill()}}
  if(SG&&SG.k==='slalom'){SG.gates.forEach((g,i)=>{const a=P(g.x,g.y-46,0),b=P(g.x,g.y+46,0);ctx.strokeStyle=g.st>0?'rgba(127,224,180,.7)':g.st<0?'rgba(255,111,89,.6)':i===SG.gi?'rgba(255,209,102,.8)':'rgba(255,246,228,.35)';ctx.lineWidth=3*a.s;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([])});
    for(const c of SG.cones){const q=P(c.x,c.y,0),h=c.down?4:14;ctx.fillStyle=c.down?'#c4572f':'#ff9a3c';ctx.beginPath();ctx.moveTo(q.x-5*q.s,q.y);ctx.lineTo(q.x+5*q.s,q.y);ctx.lineTo(q.x,q.y-h*q.s);ctx.closePath();ctx.fill()}}
  if(SG&&state==='play'){const lab=SG.k==='target'?`TARGET PRACTICE  ·  ${SG.pts} pts  ·  ${Math.ceil(clock)}s`:SG.k==='slalom'?`SLALOM  ·  ${SG.time.toFixed(1)}s  ·  gate ${Math.min(SG.gi+1,SG.gates.length)}/${SG.gates.length}${SG.gi>=SG.gates.length?'  ·  now finish it!':''}`:'';
    if(lab){ctx.fillStyle='rgba(20,48,63,.9)';rr(W/2-210,76,420,30,15);ctx.fill();txt(lab,W/2,91,15,C.sun,'center',false)}}
  if(windX&&state==='play'){const d=Math.sign(windX);ctx.fillStyle='rgba(20,48,63,.85)';rr(W-150,76,120,26,13);ctx.fill();txt((d>0?'WIND →→':'←← WIND'),W-90,89,13,C.cream,'center',false)}}
function drawSwipes(){drawPassFx();if(state!=='play'&&state!=='goal'&&state!=='concede')return;for(const w of swipes)drawSwipe(w,w.pts.length,w.end==null?-1:t-w.end)}
function dizzyAt(p,x,y){const hf=lookOf(p.st)[3]||1,h=P(x,y,48*hf),r=14*h.s;for(let i=0;i<3;i++){const a=t*.18+i*2.094,sx=h.x+Math.cos(a)*r,sy=h.y+Math.sin(a)*r*.4;ctx.fillStyle=i===1?C.cream:C.sun;star(sx,sy,5.2*h.s)}}
function drawCtrlMarker(){
  if(!ctrl||state!=='play')return;const p=ctrl,hf=lookOf(p.st)[3]||1,g=P(p.x,p.y);
  if(g.x<14||g.x>W-14||g.y>H-48){const ax=clamp(g.x,26,W-26),ay=clamp(g.y-20,70,H-70),a=Math.atan2(g.y-20-ay,g.x-ax);ctx.save();ctx.translate(ax,ay);ctx.rotate(a);ctx.fillStyle=fire>0?C.coral:C.sun;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-6,-8);ctx.lineTo(-6,8);ctx.fill();ctx.restore();
    txt(p.st.short,clamp(ax,50,W-50),ay+(ay>H/2?-18:18),13,C.cream);return}
  ctx.strokeStyle=fire>0?C.coral:C.sun;ctx.lineWidth=Math.max(1.5,2.2*g.s);groundRing(p.x,p.y,15);ctx.stroke();
  const h=P(p.x,p.y,(p.jump||0)+60*hf);
  ctx.fillStyle=fire>0?C.coral:C.sun;ctx.beginPath();ctx.moveTo(h.x-6,h.y-8);ctx.lineTo(h.x+6,h.y-8);ctx.lineTo(h.x,h.y);ctx.fill();
  txt(p.st.short,h.x,h.y-17,13,C.cream);
  if(B.lobTo===p&&!B.owner&&B.z>3){ctx.globalAlpha=.65+.35*Math.sin(t*.4);txt(p.volley?'READY…':(B.lobTo===p&&B.lobThrough?'':'SPACE: '+(B.z>26?'HEADER':'VOLLEY')),h.x,h.y-36,15,C.sun,'center',true);ctx.globalAlpha=1}
  {const o=B.owner;if(o&&o.team===1&&!o.keeper&&p.tackleCd<=0&&p.stun<=0&&p.lunge<=0){const d=dist(p,o);if(d<95){const inR=d<62,pl=.5+.5*Math.sin(t*.25);
    ctx.strokeStyle=inR?`rgba(127,224,180,${.55+.45*pl})`:'rgba(127,224,180,.28)';ctx.lineWidth=Math.max(2,(inR?3.4:2)*g.s);groundRing(p.x,p.y,inR?26+pl*3:24);ctx.stroke();
    if(inR){const h2=P(p.x,p.y,0);txt('STEAL',h2.x,h2.y+22,11,C.mint,'center',false)}}}}
  if(p.tackleCd>(p.tcLast||0))p.tcMax=p.tackleCd;p.tcLast=p.tackleCd;
  if(B.owner!==p&&p.tackleCd>0){ctx.strokeStyle='rgba(255,111,89,.75)';ctx.lineWidth=Math.max(2,3*g.s);groundRing(p.x,p.y,19,-1.571,-1.571+(1-p.tackleCd/(p.tcMax||48))*6.283);ctx.stroke()}
  if(B.owner===p&&!charging){const m=passTarget(p);if(m){ctx.save();ctx.strokeStyle='rgba(255,246,228,.6)';ctx.lineWidth=2;ctx.setLineDash([4,4]);groundRing(m.x,m.y,17);ctx.stroke();ctx.restore()}}
  if(p.stam<99){ctx.fillStyle='rgba(20,48,63,.6)';ctx.fillRect(g.x-14,g.y+6,28,4);ctx.fillStyle=p.stam<25?C.coral:C.mint;ctx.fillRect(g.x-14,g.y+6,28*p.stam/100,4)}
  if(charging){
    // the ring is the power meter: gold = perfect strike, red = too much (it'll balloon)
    const A=v=>-1.571+v/1.15*6.283,w=sweetW(p),perf=Math.abs(charge-SWEET)<=w/2;
    ctx.lineCap='butt';ctx.lineWidth=Math.max(4,6*g.s);ctx.strokeStyle='rgba(13,17,23,.55)';groundRing(p.x,p.y,24);ctx.stroke();
    ctx.strokeStyle='rgba(255,209,102,.55)';groundRing(p.x,p.y,24,A(SWEET-w/2),A(SWEET+w/2));ctx.stroke();
    ctx.strokeStyle='rgba(255,111,89,.45)';groundRing(p.x,p.y,24,A(1),A(1.15));ctx.stroke();
    ctx.lineCap='round';ctx.lineWidth=Math.max(3,4.2*g.s);ctx.strokeStyle=charge>1?C.coral:perf?'#fff':C.mint;groundRing(p.x,p.y,24,-1.571,A(charge));ctx.stroke();ctx.lineCap='butt';
    if(perf){ctx.strokeStyle='rgba(255,209,102,.9)';ctx.lineWidth=Math.max(2,2.5*g.s);groundRing(p.x,p.y,30+Math.sin(t*.6));ctx.stroke()}
    drawAimLine(p);
  }
}
// Shows where a shot will go: to your aim point on the goal line, plus the random spread as a cone.
function drawAimLine(p){
  const gx=FX1,facing=p.aimY!=null?1:Math.cos(p.dir);const a=p.aimY!=null?Math.atan2(p.aimY-B.y,gx-B.x):p.dir;let ex,ey,onGoal=false;
  if(facing>.2){ex=gx;ey=B.y+Math.tan(a)*(gx-B.x);onGoal=ey>GY0+2&&ey<GY1-2}
  else{ex=B.x+Math.cos(a)*160;ey=B.y+Math.sin(a)*160}
  const col=onGoal?C.mint:C.coral,len=Math.hypot(ex-B.x,ey-B.y);
  const spread=.015+charge*.08*(1.55-p.st.fin*1.15);
  ctx.save();
  ctx.fillStyle=onGoal?'rgba(127,224,180,.16)':'rgba(255,111,89,.16)';
  wpath([[B.x,B.y],[B.x+Math.cos(a-spread)*len,B.y+Math.sin(a-spread)*len],[B.x+Math.cos(a+spread)*len,B.y+Math.sin(a+spread)*len]],true);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.setLineDash([8,7]);ctx.lineDashOffset=-t*.6;
  wpath([[B.x,B.y],[ex,ey]]);ctx.stroke();ctx.setLineDash([]);
  if(facing>.2){const tq=P(ex,ey,BAR*.45);ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(tq.x,tq.y,7,0,7);ctx.stroke();ctx.beginPath();ctx.arc(tq.x,tq.y,2.5,0,7);ctx.fillStyle=col;ctx.fill();
    const gq=P(ex,ey);ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(gq.x,gq.y);ctx.lineTo(tq.x,tq.y);ctx.stroke();ctx.setLineDash([])}
  ctx.restore();
}
function drawAbilities(){
  if(!ctrl||state!=='play')return;const p=ctrl,y=H-40,spMax=spCdOf(p);
  const items=[['E',SKILLS[p.st.sk],p.skillCd,SKILLS[p.st.sk].cd,C.cream],['X',SPECIALS[p.st.sp],p.spCd,spMax,C.sun]];
  const has=B.owner===p;
  if(p.st.sp==='bicycle'&&bikeReady(p)&&p.spCd<=0){const h=P(p.x,p.y,92);ctx.globalAlpha=.6+.4*Math.sin(t*.4);txt('X  BICYCLE!',h.x,h.y,15,C.sun,'center',false);ctx.globalAlpha=1}
  items.push(['C',{name:'SLIDE'},p.slideCd,SLIDE_CD,C.mint],['R',{name:has?'BURST':'LUNGE'},has?p.blungeCd:p.tackleCd,has?BLUNGE_CD:LUNGE_CD,C.mint]);
  // the special just came off cooldown: a short gold pulse on its button
  if(p.spCd>0)p.spWas=1;else if(p.spWas){p.spWas=0;p.spReadyT=t}
  ctx.fillStyle='rgba(13,17,23,.84)';rr(14,y-4,692,32,6);ctx.fill();
  txt('#'+p.st.num+' '+p.st.short,26,y+12,14,C.coral,'left',false);
  let x=146;items.forEach(([key,def,cd,max,col],i)=>{cd=+cd||0;const w=i<2?130:118,ready=cd<=0,frac=ready?1:clamp(1-cd/Math.max(1,max),0,1);
    ctx.fillStyle=ready?'#1d242e':'#151a20';rr(x,y+1,w,22,4);ctx.fill();
    if(!ready){ctx.fillStyle='rgba(255,255,255,.08)';rr(x,y+1,Math.max(8,w*frac),22,4);ctx.fill()}
    else{const glow=key==='X'&&p.spReadyT!=null&&t-p.spReadyT<40?1-(t-p.spReadyT)/40:0;
      if(glow){ctx.save();ctx.shadowColor=col;ctx.shadowBlur=14*glow;ctx.strokeStyle=col;ctx.lineWidth=1.5+2*glow;rr(x,y+1,w,22,4);ctx.stroke();ctx.restore()}
      else{ctx.strokeStyle=col;ctx.lineWidth=1.5;rr(x,y+1,w,22,4);ctx.stroke()}}
    // a little recharge dial on the left of the button
    const cx=x+12,cy=y+12;ctx.lineWidth=2.5;ctx.strokeStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.arc(cx,cy,6.5,0,6.2832);ctx.stroke();
    ctx.strokeStyle=ready?col:'#8a96a3';ctx.beginPath();ctx.arc(cx,cy,6.5,-1.5708,-1.5708+6.2832*frac);ctx.stroke();
    const label=ready?key+'  '+def.name:`${key}  ${def.name}  ${(cd/60).toFixed(1)}s`;
    txt(label,x+w/2+7,y+12,ready?12:11,ready?col:'#7d8894','center',false);x+=w+8});
}
function drawParts(){
  for(const p of parts){ctx.globalAlpha=Math.min(1,p.life/(p.max*.4));
    if(p.ring){ctx.strokeStyle=p.c;ctx.lineWidth=3;groundRing(p.wx,p.wy,p.r*1.4);ctx.stroke()}
    else{ctx.fillStyle=p.c;if(p.spark){ctx.beginPath();ctx.arc(p.x,p.y,2,0,7);ctx.fill()}else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()}}}
  ctx.globalAlpha=1;
}
function elastic(x){return x<=0?0:x>=1?1:Math.pow(2,-10*x)*Math.sin((x*10-.75)*2.094)+1}
function drawHUD(){
  const ab=s=>{const w=String(s||'').normalize('NFD').replace(/[^A-Za-z ]/g,'').trim().toUpperCase().split(/\s+/).filter(x=>x&&!['FC','AFC','THE','CF'].includes(x));return (w[0]||'???').slice(0,3)};
  const home=TEAMNAME(),away=OPP.name,x0=18,y0=14,hgt=34;
  if(state!=='pens'){
  ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;
  ctx.fillStyle='#0d1117';rr(x0,y0,286,hgt,6);ctx.fill();ctx.restore();
  // home | score | away | clock
  ctx.fillStyle=KIT();ctx.fillRect(x0,y0,5,hgt);ctx.fillStyle=OPP.kit;ctx.fillRect(x0+186,y0,5,hgt);
  txt(ab(home),x0+14,y0+hgt/2+1,19,'#ffffff','left',false);
  {const sk=score.join('-');if(sk!==hudKey){if(hudKey!=null)hudBumpT=t;hudKey=sk}}
  const bump=Math.max(0,1-(t-hudBumpT)/36);
  if(bump>0){ctx.save();ctx.globalAlpha=bump;ctx.shadowColor=C.sun;ctx.shadowBlur=22*bump;ctx.fillStyle=C.sun;rr(x0+62,y0,70,hgt,6);ctx.fill();ctx.restore()}
  {const g=ctx.createLinearGradient(0,y0,0,y0+hgt);g.addColorStop(0,'#f5f5f5');g.addColorStop(1,'#cfd3d8');ctx.fillStyle=g;rr(x0+66,y0+4,62,hgt-8,4);ctx.fill()}
  {const e=1+.45*bump*Math.abs(Math.sin(bump*Math.PI*1.5));ctx.save();ctx.translate(x0+97,y0+hgt/2+1);ctx.scale(e,e);txt(score[0]+' - '+score[1],0,0,21,'#0d1117','center',false);ctx.restore()}
  txt(ab(away),x0+137,y0+hgt/2+1,19,'#ffffff','left',false);
  ctx.fillStyle='#1d242e';rr(x0+196,y0+4,84,hgt-8,4);ctx.fill();
  const m=Math.floor(clock/60),sec=Math.floor(clock%60),beat=state==='play'&&clock>0&&clock<=10?Math.pow(clock%1,3):0;
  ctx.save();ctx.translate(x0+238,y0+hgt/2+1);ctx.scale(1+beat*.2,1+beat*.2);txt(m+':'+String(sec).padStart(2,'0'),0,0,20,clock<20?'#ff5a4a':'#ffffff','center',false);ctx.restore();}
  // hype and style, slim along the top right
  const rx=W-214;ctx.fillStyle='rgba(13,17,23,.82)';rr(rx,y0,196,hgt,6);ctx.fill();
  txt(fire>0?'ON FIRE':'HYPE',rx+12,y0+hgt/2+1,14,fire>0?'#ff5a4a':'#9fb0c0','left',false);
  ctx.fillStyle='#232b36';rr(rx+58,y0+13,46,8,4);ctx.fill();
  const hv=fire>0?fire/600:hype/100;ctx.fillStyle=fire>0?'#ff5a4a':'#ffd23f';rr(rx+58,y0+13,Math.max(5,46*hv),8,4);ctx.fill();
  txt(Math.round(shownStyle).toLocaleString(),rx+186,y0+hgt/2+1,19,'#ffd23f','right',false);
  txt('STYLE',rx+114,y0+hgt/2+1,12,'#9fb0c0','left',false);
  if(streak>=2){const pulse=1+Math.sin(t*.15)*.06;ctx.save();ctx.translate(x0+318,y0+hgt/2);ctx.scale(pulse,pulse);ctx.fillStyle='#e2483d';rr(-22,-12,44,24,5);ctx.fill();txt('×'+streak,0,1,17,'#fff','center',false);ctx.restore()}
  if(state==='play'&&chain>=2&&t-chainT<300){const pulse=1+Math.sin(t*.2)*.05;ctx.save();ctx.translate(W/2,92);ctx.scale(pulse,pulse);ctx.fillStyle='rgba(226,72,61,.92)';rr(-82,-15,164,30,6);ctx.fill();txt('SKILL CHAIN ×'+chain,0,1,18,'#fff','center',false);ctx.restore()}
  if(state==='play'&&kickT>0&&stT<50){ctx.globalAlpha=Math.min(1,kickT/20);txt('KICK OFF',W/2,140,40,'#ffffff');ctx.globalAlpha=1}
  drawAbilities();
}
let hudKey=null,hudBumpT=-999;
// Team sheets before kick-off: both line-ups slide in, with what's at stake
function compLabel(){const md=PITCH==='expanded'?'CLASSICAL EXPANDED':PITCH==='classical'?'CLASSICAL':'VOLTA';
  if(comp==='league'&&lgOf())return `${md}  ·  ${DIVS[lgOf().div].n.toUpperCase()}  ·  ROUND ${lgOf().round+1} OF ${lgOf().fx.length}`;
  if(comp==='wcc'&&wccOf())return OPP.final?`WORLD CLUB CHAMPIONSHIP  ·  THE FINAL`:`${md}  ·  WORLD CLUB CHAMPIONSHIP  ·  ${WROUNDS[wccOf().round].toUpperCase()}`;
  if(comp==='cup'&&club.cup)return `${CUPS[club.cup.tier].toUpperCase()}  ·  ${ROUNDS[Math.min(2,club.cup.round)].toUpperCase()}`;
  if(comp==='tour'&&club.tour)return `GRAND TOURNAMENT  ·  ${TROUNDS[club.tour.round].toUpperCase()}`;
  if(comp==='chal'&&chalCur)return `CHALLENGE  ·  ${chalCur.name.toUpperCase()}`;return comp==='friendly'?'FRIENDLY':'MATCH DAY'}
// Rain: streaks falling across the screen, a damp darkening and the odd splash on the grass
function drawRain(){if(weather!=='rain'||RM)return;ctx.save();ctx.fillStyle='rgba(18,28,44,.2)';ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(205,222,255,.32)';ctx.lineWidth=1.2;ctx.beginPath();
  for(let i=0;i<170;i++){const sp=9+(i*37%11),x=((i*137.1+t*2.2)%(W+80))-40,y=((i*71.3*3+t*sp)%(H+60))-30,l=10+(i%5)*3;ctx.moveTo(x,y);ctx.lineTo(x-l*.28,y+l)}ctx.stroke();
  ctx.fillStyle='rgba(205,222,255,.25)';for(let i=0;i<18;i++){const ph=(t*.05+i*.37)%1,x=(i*251.7)%W,y=H*.3+((i*97.3)%(H*.68));ctx.globalAlpha=1-ph;ctx.beginPath();ctx.ellipse(x,y,2+ph*7,1+ph*2.5,0,0,7);ctx.fill()}
  ctx.restore()}
function drawIntro(){const k=INTRO-introT,a=Math.min(1,k/10,introT/12);ctx.save();ctx.globalAlpha=a;
  ctx.fillStyle='rgba(8,14,22,.74)';ctx.fillRect(0,0,W,H);
  {const e=elastic(clamp(k/24,0,1));ctx.save();ctx.translate(W/2,62);ctx.scale(e,e);txt(compLabel()+(weather==='rain'?'  ·  RAIN':''),0,0,22,C.sun);ctx.restore()}
  if(comp==='chal'&&chalCur)txt(chalCur.d,W/2,92,15,C.cream,'center',false);
  const side=(tm,x0,from)=>{const e=elastic(clamp((k-6-tm*7)/32,0,1)),x=x0+(1-e)*from*560,y=122,w=372,h=340,kit=tm===0?KIT():OPP.kit,list=outfield(tm);
    const rating=tm===0?teamRating():Math.round(list.reduce((s,p)=>s+ovr(p.st),0)/list.length);
    ctx.fillStyle='rgba(13,17,23,.9)';rr(x,y,w,h,12);ctx.fill();ctx.fillStyle=kit;rr(x,y,w,8,4);ctx.fill();
    txt((tm===0?TEAMNAME():OPP.name).slice(0,18),x+20,y+40,28,C.cream,'left',false);
    txt(String(rating),x+w-20,y+42,40,C.sun,'right',false);txt('RATING',x+w-20,y+70,11,C.muted,'right',false);
    txt(tm===0?`FORMATION ${sq().f}`:(OPP.club!=null&&comp==='tour'?'TOURNAMENT SIDE':'OPPONENTS'),x+20,y+70,13,C.muted,'left',false);
    list.slice().sort((a,b)=>({DEF:0,MID:1,ATT:2}[a.slot.r]-{DEF:0,MID:1,ATT:2}[b.slot.r])).forEach((p,i)=>{const yy=y+112+i*50;
      ctx.fillStyle='rgba(255,255,255,.04)';rr(x+14,yy-20,w-28,42,8);ctx.fill();ctx.fillStyle=kit;rr(x+14,yy-20,5,42,3);ctx.fill();
      txt(String(Math.round(ovr(p.st))),x+30,yy+1,24,C.sun,'left',false);txt((p.st.name||p.st.short||'').slice(0,18),x+76,yy-6,17,C.cream,'left',false);
      txt(`${p.slot.r}  ·  ${SKILLS[p.st.sk]?SKILLS[p.st.sk].name:''}  ·  ${SPECIALS[p.st.sp]?SPECIALS[p.st.sp].name:''}`,x+76,yy+13,11,C.muted,'left',false);
      if(p.role){txt(p.role==='cap'?'C':'\u26a1',x+w-30,yy,16,p.role==='cap'?C.sun:C.coral,'center',false)}})};
  side(0,46,-1);side(1,W-46-372,1);
  {const e=elastic(clamp((k-22)/26,0,1));ctx.save();ctx.translate(W/2,292);ctx.scale(e,e);ctx.fillStyle=C.coral;ctx.beginPath();ctx.arc(0,0,34,0,7);ctx.fill();txt('VS',0,2,30,'#fff','center',false);ctx.restore()}
  if(k>40){ctx.globalAlpha=a*(.6+.4*Math.sin(t*.12));txt('SPACE to kick off',W/2,H-40,17,C.cream,'center',false)}
  ctx.restore()}
function drawBanner(){if(!banner||state!=='play')return;const k=t-banner.t0;if(k>150){banner=null;return}
  const e=elastic(k/26),a=Math.min(1,(150-k)/25);ctx.save();ctx.globalAlpha=a;ctx.translate(W/2,31);ctx.scale(e,e);
  ctx.fillStyle='rgba(226,72,61,.94)';rr(-120,-16,240,32,6);ctx.fill();txt(banner.txt,0,1,20,'#fff','center',false);ctx.restore()}
// warm pulsing glow round the edges of the screen while you're on fire
function drawFireGlow(){if(fire<=0||state!=='play'||RM)return;const a=Math.min(1,fire/60)*(.55+.25*Math.sin(t*.12));
  if(!fireCv){fireCv=document.createElement('canvas');fireCv.width=W/2;fireCv.height=H/2;const g=fireCv.getContext('2d'),rg=g.createRadialGradient(W/4,H/4,H*.2,W/4,H/4,W*.29);
    rg.addColorStop(0,'rgba(255,111,89,0)');rg.addColorStop(.6,'rgba(255,111,89,.12)');rg.addColorStop(1,'rgba(255,120,60,.5)');g.fillStyle=rg;g.fillRect(0,0,W/2,H/2)}
  ctx.save();ctx.globalAlpha=a;ctx.drawImage(fireCv,0,0,W,H);ctx.restore()}
let fireCv=null;
function drawPops(){for(const p of pops){ctx.globalAlpha=Math.min(1,p.life/25);const q=P(p.x,p.y,p.z),sz=p.size*(1+Math.max(0,(p.life-60)/10)*.4)*clamp(q.s,.8,1.6);txt(p.text,q.x,q.y,Math.round(sz),p.col);ctx.globalAlpha=1}}
function drawGoalBanner(){
  const k=stT,word='GOAL!',sp=82,x0=W/2-sp*2;
  for(let i=0;i<5;i++){const e=elastic((k-i*4)/32);if(e<=0)continue;const bob=Math.sin(k*.12+i*.7)*6;
    ctx.save();ctx.translate(x0+i*sp,108+bob);ctx.scale(e,e);ctx.rotate(Math.sin(k*.08+i)*.06);txt(word[i],0,6,118,'#c4572f');txt(word[i],0,0,118,i%2?C.sun:C.cream,'center',false);ctx.restore()}
  if(k>20){ctx.globalAlpha=Math.min(1,(k-20)/12);txt(scorer?scorer.st.name.toUpperCase():'',W/2,178,24,C.cream);txt(phrase,W/2,206,22,C.mint);ctx.globalAlpha=1}
  labels.forEach((l,i)=>{const kk=k-40-i*12;if(kk<0)return;const e=elastic(kk/26),y=250+i*32;ctx.save();ctx.translate(150,y);ctx.scale(e,e);
    ctx.fillStyle='rgba(20,48,63,.88)';rr(-120,-14,240,28,14);ctx.fill();txt(l[0],-102,1,16,C.cream,'left',false);txt('+'+l[1],102,1,16,C.sun,'right',false);ctx.restore()});
  if(k>14&&k<230){const by=H-100;ctx.fillStyle='rgba(20,48,63,.9)';rr(W/2-330,by,660,30,15);ctx.fill();
    CELEBS.forEach((c,i)=>txt((i+1)+' '+c,W/2-275+i*110,by+15,13,i===celebType?C.sun:C.muted,'center',false))}
  if(k>70){ctx.globalAlpha=.6+Math.sin(k*.1)*.3;txt(NET.on?'space: kick off':'space: replay',W/2,H-58,15,C.cream,'center',false);ctx.globalAlpha=1}
}
function drawWorld(ents){
  let t0=performance.now();if(!(broadCam()&&!(state==='goal'||(state==='fulltime'&&score[0]>score[1]))))drawSky();else{ctx.fillStyle='#05080f';ctx.fillRect(0,0,W,H)}PS('sky',t0);t0=performance.now();drawBackground();PS('bg',t0);t0=performance.now();goalBack(0);goalBack(1);PS('goals',t0);t0=performance.now();
  ents.push({y:GY1,f:()=>nearPost(0)},{y:GY1,f:()=>nearPost(1)});
  // each player/ball draws on its own: if one ever fails, the rest of the pitch still gets drawn
  ents.sort((a,b)=>(a.y||0)-(b.y||0)).forEach(e=>{const m=ctx.getTransform();try{e.f()}catch(err){loopErrs++;window.__lastErr=String(err&&err.stack||err);ctx.setTransform(m);ctx.globalAlpha=1;ctx.shadowBlur=0}});PS('players',t0);
}
function drawReplay(){
  const i=Math.min(replay.length-1,Math.floor(replayIdx)),f=replay[i];
  const ents=players.map((p,j)=>{const r=f.p[j];if(!r)return{y:0,f:()=>{}};return{y:r.y,f:()=>{
    const sv={};for(const k of VISK)sv[k]=p[k];for(const k of VISK)p[k]=r[k];
    drawPlayer(p,r.x,r.y,r.dir,r.rot||0,r.runPh,r.spdNow);if((r.whiff||0)>8||(r.fall||0)>8)dizzyAt(p,r.x,r.y);
    for(const k of VISK)p[k]=sv[k]}}});
  replayCh=f.b[3]||0;const sp0=B.spin;ents.push({y:f.b[1]+.1,f:()=>{B.spin=f.b[4]||0;drawBall(f.b[0],f.b[1],f.b[2]);B.spin=sp0}});
  drawWorld(ents);
  if(f.s)for(const [w,n,age] of f.s)drawSwipe(w,n,age);
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,0,W,46);ctx.fillRect(0,H-46,W,46);
  ctx.fillStyle=C.coral;ctx.beginPath();ctx.arc(34,23,7,0,7);ctx.globalAlpha=.5+Math.sin(t*.2)*.5;ctx.fill();ctx.globalAlpha=1;
  txt('REPLAY',50,24,22,C.cream,'left',false);
  txt((scorer?scorer.st.name.toUpperCase():'')+'  ·  '+(labels[0]?labels[0][0]:phrase),W-24,24,18,C.sun,'right',false);
  {const o=f.owner>=0&&players[f.owner]&&f.p[f.owner];if(o){const pl=players[f.owner],h=P(o.x,o.y,(o.jump||0)+62);txt(pl.st.short||'',h.x,h.y,14,pl.team===0?C.sun:'#ffd0c8')}}
  {const near=1-Math.min(1,(replay.length-1-replayIdx)/45);if(near>0){ctx.globalAlpha=near;txt('SLOW-MO',W-24,H-23,14,C.sun,'right',false);ctx.globalAlpha=1}}
  txt('space to skip',W/2,H-23,14,C.muted,'center',false);
}
function drawFulltime(){
  ctx.fillStyle='rgba(20,48,63,.78)';ctx.fillRect(0,0,W,H);
  if(comp==='skill'&&SG&&SG.msg){const e=elastic(stT/40);ctx.save();ctx.translate(W/2,170);ctx.scale(e,e);txt(SGAMES[SG.k].name.toUpperCase(),0,0,56,C.sun);ctx.restore();
    txt(SG.msg.toUpperCase(),W/2,250,40,SG.best?C.mint:C.cream);if(SG.best)txt('NEW PERSONAL BEST!',W/2,295,24,C.sun);
    const b=(club.sgBest||{})[SG.k];txt('Best: '+(b==null?'-':SG.k==='slalom'?b.toFixed(1)+'s':b),W/2,335,18,C.muted);
    if(stT>40){ctx.fillStyle='rgba(20,48,63,.92)';rr(W-250,H-110,220,60,30);ctx.fill();txt('+'+Math.round(shownEarned)+' coins',W-140,H-80,22,C.sun,'center',false)}
    if(stT>60)txt('space to continue',W/2,H-40,15,C.muted,'center',false);return}
  const pw=pen&&pen.winner!=null?pen.winner:null,win=score[0]>score[1]||pw===0,draw=score[0]===score[1]&&pw===null,e=elastic(stT/40);
  ctx.save();ctx.translate(W/2,150);ctx.scale(e,e);txt(mercy?'MERCY RULE':'FULL TIME',0,0,72,C.sun);ctx.restore();if(mercy)txt('Five-goal gap · the ref has seen enough',W/2,196,16,C.cream,'center',false);
  txt(`${TEAMNAME()}  ${score[0]} – ${score[1]}  ${OPP.name}`,W/2,225,30,C.cream);
  if(pw!==null){const g=t=>pen.kicks[t].filter(Boolean).length;txt(`(${g(0)} – ${g(1)} on penalties)`,W/2,252,18,C.muted)}
  txt(pw===0?'YOU WIN ON PENALTIES!':pw===1?'LOST ON PENALTIES':win?'YOU WIN!':draw?'HONOURS EVEN':'UNLUCKY. RUN IT BACK?',W/2,pw!==null?284:270,26,win?C.mint:draw?C.cream:C.coral);
  if(win){ctx.save();ctx.translate(W/2,350+Math.sin(t*.06)*4);ctx.fillStyle=C.sun;ctx.beginPath();ctx.moveTo(-34,-40);ctx.lineTo(34,-40);ctx.quadraticCurveTo(30,10,0,16);ctx.quadraticCurveTo(-30,10,-34,-40);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle=C.sun;ctx.beginPath();ctx.arc(-34,-24,12,1.57,4.71);ctx.stroke();ctx.beginPath();ctx.arc(34,-24,12,-1.57,1.57);ctx.stroke();ctx.fillRect(-6,14,12,18);ctx.fillRect(-22,32,44,10);ctx.restore()}
  if(matchRatings&&!NET.on){const R=matchRatings,mine=R.rows.filter(r=>r.p.team===0),x=34,y0=300,k=elastic(clamp((stT-20)/30,0,1));
    ctx.save();ctx.translate((1-k)*-320,0);ctx.fillStyle='rgba(13,17,23,.78)';rr(x-12,y0-34,272,48+mine.length*30+44,10);ctx.fill();
    txt('PLAYER RATINGS',x,y0-14,16,C.muted,'left',false);
    mine.forEach((r,i)=>{const y=y0+14+i*30,c=r.v>=8?C.mint:r.v>=6.5?C.cream:C.coral,nm=r.p.keeper?'GOALKEEPER':(r.p.st.short||'').slice(0,11);
      txt(nm,x,y,15,C.cream,'left',false);ctx.fillStyle='#232b36';rr(x+120,y-5,80,10,5);ctx.fill();ctx.fillStyle=c;rr(x+120,y-5,80*(r.v-3)/7,10,5);ctx.fill();
      txt(r.v.toFixed(1),x+236,y,16,c,'right',false);if(R.motm===r){ctx.fillStyle=C.sun;star(x+246,y-1,7)}});
    const m=R.motm,my=y0+14+mine.length*30+8,nm=m.p.keeper?'GOALKEEPER':(m.p.st.short||'').slice(0,12);
    txt('\u2605 MAN OF THE MATCH',x,my,13,C.sun,'left',false);txt(`${nm}${m.p.team===0?'  +25 coins':' ('+OPP.name.slice(0,12)+')'}`,x,my+20,15,m.p.team===0?C.mint:C.cream,'left',false);ctx.restore()}
  const rows=[['Shots',stats.shots],['On target',Math.min(stats.on,stats.shots)],['Skills landed',stats.skills],['Passes',stats.passes],['Tackles won',stats.tackles],['Style points',style.toLocaleString()]];
  if(!NET.on)rows.forEach((r,i)=>{const y=win?420+i*22:330+i*26;txt(r[0],W/2-110,y,16,C.muted,'left',false);txt(String(r[1]),W/2+110,y,16,C.cream,'right',false)});
  if(stT>40){ctx.fillStyle='rgba(20,48,63,.92)';rr(W-250,H-110,220,60,30);ctx.fill();ctx.fillStyle=C.sun;ctx.beginPath();ctx.arc(W-215,H-80,14,0,7);ctx.fill();ctx.strokeStyle='#c99a2e';ctx.lineWidth=3;ctx.stroke();txt('+'+Math.round(shownEarned).toLocaleString(),W-190,H-80,30,C.sun,'left',false)}
  if(stT>50&&earnNote&&!NET.guest){ctx.globalAlpha=Math.min(1,(stT-50)/20);ctx.font='700 13px Nunito,sans-serif';const tw=Math.min(620,ctx.measureText(earnNote).width+28);ctx.fillStyle='rgba(20,48,63,.9)';rr(W/2-tw/2,H-72,tw,24,12);ctx.fill();txt(earnNote,W/2,H-60,12,C.cream,'center',false);ctx.globalAlpha=1}
  if(eventText){ctx.fillStyle='rgba(20,48,63,.92)';rr(W/2-300,44,600,40,20);ctx.fill();txt(eventText,W/2,64,cupEvent==='champion'?22:17,cupEvent==='out'?C.coral:cupEvent==='champion'?C.sun:C.mint,'center',false)}
  else if(cupEvent&&club.cup){const c=club.cup,nm=CUPS[c.tier];ctx.fillStyle='rgba(20,48,63,.92)';rr(W/2-230,44,460,40,20);ctx.fill();
    txt(cupEvent==='champion'?`CHAMPIONS OF THE ${nm.toUpperCase()}!`:cupEvent==='advance'?`Through to the ${ROUNDS[c.round]}!`:`Knocked out of the ${nm} in the ${ROUNDS[c.round].toLowerCase()}`,W/2,64,cupEvent==='champion'?22:19,cupEvent==='out'?C.coral:cupEvent==='champion'?C.sun:C.mint,'center',false)}
  if(stT>60){ctx.globalAlpha=.6+Math.sin(t*.1)*.3;txt('space to continue',W/2,H-30,16,C.cream,'center',false);ctx.globalAlpha=1}
}
function draw(){
  if(state==='pens'&&pen){drawPens();return}
  if(state==='replay'){ctx.save();const rf=replay[Math.min(replay.length-1,Math.floor(replayIdx))];
    const near=1-Math.min(1,(replay.length-1-replayIdx)/60),zoom=1+near*.22,fz=BROAD.f*zoom,D=BROAD.dist+(BROAD.y-rf.b[1]);
    rcx+=(clamp(rf.b[0],FX0+260,FX1-230)-rcx)*.07;const th=H*.56-BROAD.h*fz/D;rhor+=(th-rhor)*.07;
    cam={...BROAD,x:rcx,f:fz,hor:rhor};drawReplay();ctx.restore();return}
  ctx.save();if(shake>0){
    // a smooth rumble with a touch of roll, instead of jumping to a new random spot every frame
    const sx=(Math.sin(t*1.7)+Math.sin(t*2.9+1.3)*.6)*.38*shake,sy=(Math.sin(t*2.3+.7)+Math.sin(t*3.7)*.5)*.38*shake;
    ctx.translate(W/2+sx,H/2+sy);ctx.rotate(Math.sin(t*1.3)*shake*.0012);ctx.translate(-W/2,-H/2)}
  const ents=players.map(p=>({y:p.y,f:()=>drawPlayer(p)}));ents.push({y:B.y+.1,f:()=>{drawTrail();drawBall()}});
  let _t=performance.now();drawWorld(ents);PS('world',_t);_t=performance.now();
  if(hr('night')&&state!=='menu'){ctx.fillStyle='rgba(6,10,40,.42)';ctx.fillRect(0,0,W,H);for(const fx of [W*.15,W*.85]){const gr=ctx.createRadialGradient(fx,40,10,fx,40,420);gr.addColorStop(0,'rgba(255,250,220,.18)');gr.addColorStop(1,'rgba(255,250,220,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H)}}
  {const th=cosOn('theme');if(th!=='theme_day'&&state!=='menu'){ctx.fillStyle=th==='theme_dusk'?'rgba(255,140,60,.13)':th==='theme_night'?'rgba(10,16,60,.3)':'rgba(212,175,55,.12)';ctx.fillRect(0,0,W,H)}}
  drawRain();drawModeWorld();
  drawSwipes();drawParts();drawDizzy();drawCtrlMarker();drawPops();drawBanner();drawFireGlow();PS('fx',_t);_t=performance.now();
  {const v=state!=='menu';if(vigOn!==v){vigOn=v;const e=$('vig');if(e)e.hidden=!v}}
  if(state==='goal'&&camK>0){ctx.fillStyle=`rgba(0,0,0,${.35*camK})`;ctx.fillRect(0,0,W,30*camK);ctx.fillRect(0,H-30*camK,W,30*camK);
    if(camK>.6){ctx.fillStyle=C.coral;ctx.beginPath();ctx.arc(W-90,H-15,4,0,7);ctx.fill();txt('STADIUM CAM',W-14,H-15,11,C.cream,'right',false)}}
  if(state==='pens'&&pen){if(pen.phase==='aim'&&pen.taker){pen.taker.aimY=pen.aimY;drawAimLine(pen.taker)}drawPenHUD()}
  if(hat&&t-hat.t0<330&&(state==='goal'||state==='concede'||state==='replay')){
    // hat-trick banner (or more) for either side
    const mine=hat.team===0,k=t-hat.t0,e=elastic(Math.min(1,k/28)),a=Math.min(1,(330-k)/30);ctx.save();ctx.globalAlpha=a;
    ctx.fillStyle=mine?'rgba(20,48,63,.9)':'rgba(60,24,30,.9)';rr(W/2-260,H-196,520,92,24);ctx.fill();
    ctx.translate(W/2,H-160);ctx.scale(e,e);txt(hat.txt,0,0,mine?50:42,mine?C.sun:C.coral);ctx.restore();
    ctx.save();ctx.globalAlpha=a;txt(`${hat.name}${mine?'':' ('+OPP.name+')'}`,W/2,H-122,17,C.cream,'center',false);
    if(mine)for(let i=0;i<Math.min(hat.n,6);i++){const x=W/2-((Math.min(hat.n,6)-1)*14)+i*28;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,H-212,9,0,7);ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=1.5;ctx.stroke()}
    ctx.restore()}
  else if(state!=='menu'&&!(state==='goal'&&camK>.5)&&!(state==='play'&&introT>0))drawHUD();
  if(state==='goal')drawGoalBanner();
  if(state==='play'&&introT>0)drawIntro();
  if(state==='concede'){const e=elastic(stT/30);ctx.save();ctx.translate(W/2,200);ctx.scale(e,e);txt('THEY SCORE',0,0,58,C.lilac);ctx.restore();if(stT>30)txt('shake it off, plenty of time',W/2,250,20,C.cream)}
  PS('rest',_t);
  if(state==='fulltime')drawFulltime();
  {const pr=NET.host?(netPrep?(netPrep.go?Math.max(1,Math.ceil((NETCOUNT-(performance.now()-netPrep.go))/1000)):-1):0):netLastG&&netLastG.pr;if(NET.on&&pr)drawNetPrep(pr)}
  if(NET.on&&state!=='fulltime'&&!(NET.host&&netPrep)&&(netWaiting||netGuestWait)){ctx.fillStyle='rgba(20,48,63,.9)';rr(W/2-230,H/2-34,460,68,34);ctx.fill();txt(NET.host?'WAITING FOR YOUR FRIEND…':'RECONNECTING TO THE HOST…',W/2,H/2-6,24,C.sun,'center',false);txt('The match carries on as soon as the connection is back',W/2,H/2+18,13,C.cream,'center',false)}
  ctx.restore();
  if(flash>0){ctx.fillStyle=`rgba(255,246,228,${flash*.5})`;ctx.fillRect(0,0,W,H)}
}

/* ---------- online: two laptops ---------- */
// The host's laptop runs the real match. The guest's laptop sends its key presses through room presence (any signed-in
// viewer may set presence) and draws the host's snapshots ~30 times a second, mirrored so the guest also attacks left to right.
let netRole=null,roomNS=null,nroom=null,netCode='',netMatch=0,netGuest=null,netHostSeen=0,netPeerGone=0,netPubAt=0,netSeenEv=0;
let netPopId=0,netPopsOut=[],netSfxId=0,netSfxOut=[],netSeenPop=0,netSeenSfx=0,netGState='',netGotMatch=0,guestSeqN=0,guestEv=[],netLock=false,netHatKey='';
RS={x:0,y:0,charging:false,charge:0};
const MX=x=>FX0+FX1-x,MA=a=>Math.PI-a,r1=v=>Math.round(v*10)/10;
const NETNOTE='Your friend doesn’t need Claude. Send them the Sunday Kickabout game file: they open it in Chrome, Safari or Edge, go to Online and type your code. Both laptops just need the internet. (If they’re signed in to Claude, they can also open this page from your Share invite.)';
async function netRoom(){if(roomNS)return roomNS;try{roomNS=window.claude&&window.claude.use?await window.claude.use('room'):null}catch(e){roomNS=null}return roomNS}
function netStatus(s,bad){const el=$('net-status');if(el){el.textContent=s;el.style.color=bad?'var(--coral)':''}}
function netCustom(){const c=custom;return{name:c.name,short:c.short,num:c.num,skin:c.skin,hair:c.hair,look:c.look||null,pace:c.pace,shot:c.shot,fin:c.fin,skill:c.skill,pass:c.pass,tackle:c.tackle,str:c.str,sk:c.sk,sp:c.sp,celeb:c.celeb||0}}
// the guest's line-up for the host's chosen match type: Volta 5-a-side or Classical 9-a-side
function netMyTeam(cl){const q=cl?club.csquads[club.cactive||0]:club.squads[club.active],n=cl?8:4;
  if(q.s.filter(Boolean).length<n){const g0=GM;GM=cl?'classical':'volta';autoPick(q);GM=g0}const ids=q.s.map((id,i)=>id||STARTERS[i%3].id);
  return{s:ids,al:ids.map(id=>ablOf(id)),f:q.f,att:q.att??null,cap:q.cap??null,nm:ids.map(id=>{const p=byId(id);return p?p.name:''}),sh:ids.map(id=>{const p=byId(id);return p?p.short:''})}}
const netPeer=role=>nroom?nroom.find(role):null;
// Two ways to reach the other laptop, tried together: the Claude room (both signed in on claude.ai) and a direct
// browser-to-browser link (WebRTC through the free PeerJS service), which also works from the downloaded game file.
let peerLib=null;
function loadPeer(){if(window.Peer)return Promise.resolve(window.Peer);if(peerLib)return peerLib;
  peerLib=new Promise(res=>{const urls=['https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js','https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];let i=0;
    const next=()=>{if(window.Peer){res(window.Peer);return}if(i>=urls.length){peerLib=null;res(null);return}const sc=document.createElement('script');sc.src=urls[i++];sc.onload=()=>res(window.Peer||null);sc.onerror=()=>{sc.remove();next()};document.head.appendChild(sc)};
    next();setTimeout(()=>res(window.Peer||null),9000)});return peerLib}
// what actually goes down the wire: the whole presence object now and then (and whenever the lobby info changes),
// otherwise only the fields that changed. Each side rebuilds the other's presence from these.
const FASTK=new Set(['g','k','ev','hb','me','mv','tc','fe']);
function wireOut(st,p,now){const slow=Object.keys(p).some(k=>!FASTK.has(k));if(slow||now-st.full>1000){st.full=now;return{f:st.mine}}return{p}}
function wireIn(prev,d){if(!d||typeof d!=='object'||Array.isArray(d))return null;if(d.f&&typeof d.f==='object')return d.f;if(d.p&&typeof d.p==='object')return{...(prev||{}),...d.p};if(!('f' in d)&&!('p' in d))return d;return null}
function peerRoom(code,role){return new Promise(async res=>{const PJ=await loadPeer();if(!PJ){res('nolib');return}
  const id='sundaykickabout3-'+code.toLowerCase();let mine={},remote=null,conn=null,peer=null,done=false,cache=Object.freeze([]);const subs=[];
  const finish=v=>{if(!done){done=true;res(v)}};
  const fire=()=>{cache=Object.freeze(remote?[remote]:[]);for(const f of subs)try{f({peers:cache})}catch(e){}};
  const st={full:0,mine:null},busy=()=>{const dc=conn&&conn.dataChannel;return dc&&dc.bufferedAmount>32000};
  const api={kind:'peer',presence:async p=>{mine={...mine,...p};for(const k in p)if(p[k]===null)delete mine[k];st.mine=mine;if(conn&&conn.open&&!busy())try{conn.send(wireOut(st,p,performance.now()))}catch(e){}},
    peers:()=>cache,onPeers:f=>{subs.push(f);return()=>{}},leave:async()=>{try{peer&&peer.destroy()}catch(e){}},connected:()=>!!(conn&&conn.open)};
  const attach=c=>{c.on('open',()=>{conn=c;st.full=performance.now();try{c.send({f:mine})}catch(e){}finish(api)});
    c.on('data',d=>{const v=wireIn(remote&&remote.presence,d);if(v){remote=Object.freeze({peer:String(c.peer),sameTab:false,isMe:false,presence:Object.freeze(v)});fire()}});
    c.on('close',()=>{if(conn===c){conn=null;remote=null;fire()}});c.on('error',()=>{})};
  const opts=window.__peerOpts||{debug:0};
  try{peer=role==='host'?new PJ(id,opts):new PJ(opts)}catch(e){finish('fail');return}
  peer.on('error',e=>{const ty=e&&e.type;if(!done){finish(ty==='peer-unavailable'?'nohost':ty==='unavailable-id'?'taken':'fail');try{peer.destroy()}catch(x){}}});
  peer.on('open',()=>{if(role==='host')finish(api);else attach(peer.connect(id,{serialization:'json',reliable:false}))});
  if(role==='host')peer.on('connection',c=>{if(conn&&conn.open){c.on('open',()=>{try{c.close()}catch(e){}});return}attach(c)});
  peer.on('disconnected',()=>{try{if(!peer.destroyed)peer.reconnect()}catch(e){}});
  setTimeout(()=>{if(!done){finish('fail');try{peer.destroy()}catch(e){}}},12000)})}
// Third route: a public MQTT relay over secure websockets. Slower than a direct link but it gets through almost any
// network, because both laptops only talk to the relay. Two relays are used at once in case one is down.
let mqttLib=null;
function loadMqtt(){if(window.mqtt&&window.mqtt.connect)return Promise.resolve(window.mqtt);if(mqttLib)return mqttLib;
  mqttLib=new Promise(res=>{const urls=['https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js','https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js'];let i=0;
    const next=()=>{if(window.mqtt&&window.mqtt.connect){res(window.mqtt);return}if(i>=urls.length){mqttLib=null;res(null);return}const sc=document.createElement('script');sc.src=urls[i++];sc.onload=()=>res(window.mqtt&&window.mqtt.connect?window.mqtt:null);sc.onerror=()=>{sc.remove();next()};document.head.appendChild(sc)};
    next();setTimeout(()=>res(window.mqtt&&window.mqtt.connect?window.mqtt:null),9000)});return mqttLib}
// port 443 relays first: they look like ordinary secure web traffic, so strict wifi lets them through
const RELAYS=()=>window.__relays||['wss://mqtt.eclipseprojects.io:443/mqtt',{url:'wss://public.cloud.shiftr.io',username:'public',password:'public'},'wss://broker.hivemq.com:8884/mqtt','wss://broker.emqx.io:8084/mqtt','wss://test.mosquitto.org:8081'];
function mqttRoom(code,url){return new Promise(async res=>{const M=await loadMqtt();if(!M){res('nolib');return}
  const me=Math.random().toString(36).slice(2,10),base='sundaykickabout/v3/'+code.toLowerCase(),peers=new Map();let mine={},cache=Object.freeze([]),done=false,cl=null,ka=null,lastSent=0,dirty=false,flushT=null;const subs=[];
  const finish=v=>{if(!done){done=true;res(v)}};
  const fire=()=>{cache=Object.freeze([...peers.values()].map(p=>p.obj));for(const f of subs)try{f({peers:cache})}catch(e){}};
  const st={full:0,mine:null};let pend={};
  const send=(forceFull)=>{flushT=null;if(!cl||!cl.connected)return;const now=performance.now();if(forceFull)st.full=0;st.mine=mine;const msg=wireOut(st,pend,now);pend={};dirty=false;lastSent=now;try{cl.publish(base+'/p/'+me,JSON.stringify(msg),{qos:0})}catch(e){}};
  const api={kind:'relay',presence:async p=>{mine={...mine,...p};for(const k in p)if(p[k]===null)delete mine[k];Object.assign(pend,p);dirty=true;const wait=50-(performance.now()-lastSent);if(wait<=0)send();else if(!flushT)flushT=setTimeout(send,wait)},
    peers:()=>cache,onPeers:f=>{subs.push(f);return()=>{}},
    leave:async()=>{clearInterval(ka);try{cl.publish(base+'/bye/'+me,'1');cl.end(false)}catch(e){}},connected:()=>!!(cl&&cl.connected)};
  const U=typeof url==='string'?{url}:url;try{cl=M.connect(U.url,{clientId:'sk_'+me,keepalive:20,connectTimeout:8000,reconnectPeriod:2000,clean:true,...(U.username?{username:U.username,password:U.password}:{})})}catch(e){finish('fail');return}
  cl.on('connect',()=>{cl.subscribe([base+'/p/+',base+'/bye/+'],{qos:0},err=>{if(err){finish('fail');return}send(true);finish(api)})});
  cl.on('message',(topic,buf)=>{const parts=topic.split('/'),id=parts[parts.length-1];if(id===me)return;
    if(parts[parts.length-2]==='bye'){if(peers.delete(id))fire();return}
    let d;try{d=JSON.parse(new TextDecoder().decode(buf))}catch(e){return}const old=peers.get(id),v=wireIn(old&&old.obj.presence,d);if(!v)return;
    peers.set(id,{seen:performance.now(),obj:Object.freeze({peer:'r'+id,sameTab:false,isMe:false,presence:Object.freeze(v)})});fire()});
  cl.on('error',()=>{});
  ka=setInterval(()=>{const now=performance.now();if(now-lastSent>900)send(true);let ch=false;for(const [id,p] of peers)if(now-p.seen>6000){peers.delete(id);ch=true}if(ch)fire()},500);
  setTimeout(()=>{if(!done){finish('fail');clearInterval(ka);try{cl.end(true)}catch(e){}}},10000)})}
// All working routes are used together. Once the other player is found, the big match snapshots only go down the
// route they're on (the first that reached them), so the host's upload stays small.
function multiRoom(list){let mine={};const subs=[];
  const m={prefer:null,kinds:()=>list.map(r=>r.kind),size:()=>list.length,
    presence:p=>{mine={...mine,...p};for(const k in p)if(p[k]===null)delete mine[k];
      if(m.prefer&&list.includes(m.prefer)&&'g' in p){const rest={...p};delete rest.g;const jobs=[Promise.resolve(m.prefer.presence(p)).catch(()=>{})];if(Object.keys(rest).length)for(const r of list)if(r!==m.prefer)jobs.push(Promise.resolve(r.presence(rest)).catch(()=>{}));return Promise.all(jobs)}
      return Promise.all(list.map(r=>Promise.resolve(r.presence(p)).catch(()=>{})))},
    peers:()=>list.length===1?list[0].peers():[].concat(...list.map(r=>r.peers())),
    find:role=>{if(role==='host'){// the guest follows whichever route carries the newest match snapshot
      let best=null,bn=-1;for(const r of list){const p=r.peers().find(q=>!q.sameTab&&q.presence&&q.presence.role==='host');if(p){const n=p.presence.g&&+p.presence.g.n||0;if(n>bn){bn=n;best=p}}}return best}
      const rank={peer:0,claude:1,relay:2};let bestR=null,bp=null;
      for(const r of list){const p=r.peers().find(q=>!q.sameTab&&q.presence&&q.presence.role===role);if(p&&(!bestR||(rank[r.kind]??3)<(rank[bestR.kind]??3))){bestR=r;bp=p}}
      if(bestR)m.prefer=bestR;return bp},
    onPeers:f=>{subs.push(f);for(const r of list)r.onPeers(f)},
    leave:()=>{const l=list;list=[];return Promise.all(l.map(r=>Promise.resolve(r.leave()).catch(()=>{})))},
    add:r=>{list.push(r);for(const f of subs)r.onPeers(f);if(Object.keys(mine).length)r.presence(mine).catch(()=>{});for(const f of subs)try{f({peers:m.peers()})}catch(e){}}};return m}
let netJoinId=0,netRoutes={};
const ROUTE_NAME={claude:'Claude',peer:'direct link',relay:'relay'};
// Joining never gives up: the code works straight away and every route keeps retrying in the background until one connects.
async function netJoin(code,role){const my=++netJoinId;
  if(nroom){try{await nroom.leave()}catch(e){}nroom=null}
  netRoutes={};const room=multiRoom([]);nroom=room;
  netCode=code;netRole=role;netSeenEv=0;netSeenPop=0;netSeenSfx=0;netGotMatch=0;guestEv=[];guestSeqN=0;netJoinAt=performance.now();
  room.presence({role,v:1,club:(club.name||'My Club').slice(0,16),kit:club.kit,...(role==='guest'?{sq:netMyTeam(false),csq:netMyTeam(true),cu:netCustom(),ev:[],k:[0,0],v2:1}:{m:0,nm:club.netMode||'volta'})});
  room.onPeers(()=>netLobby());
  const live=()=>my===netJoinId&&nroom===room;
  const R=await netRoom();
  const attempt=(key,kind,mk)=>{if(!live())return;netRoutes[key]=netRoutes[key]||'trying';
    mk().then(r=>{if(!live()){if(r&&typeof r==='object')r.leave().catch(()=>{});return}
      if(r&&typeof r==='object'){netRoutes[key]='ok';room.add(r);netLobby()}
      else{netRoutes[key]=r==='denied'?'denied':'retry';if(r!=='denied'&&!(r==='nohost'&&kind==='peer'&&role==='guest'&&Object.values(netRoutes).includes('ok')))setTimeout(()=>{if(live()&&!NET.on)attempt(key,kind,mk)},r==='nohost'?4000:6000)}},()=>{netRoutes[key]='retry';setTimeout(()=>{if(live()&&!NET.on)attempt(key,kind,mk)},6000)})};
  if(R)attempt('claude','claude',()=>R.join('ko-'+code.toLowerCase()).then(r=>({kind:'claude',presence:p=>r.presence(p),peers:()=>r.peers(),onPeers:f=>r.onPeers(f),leave:()=>r.leave()}),e=>e&&e.code==='not_permitted'?'denied':'fail'));
  attempt('peer','peer',()=>peerRoom(code,role));
  RELAYS().forEach((u,i)=>attempt('relay'+i,'relay',()=>mqttRoom(code,u)));
  return true}
let netJoinAt=0,netSnapN=0;
const netRouteText=()=>{const ok=[...new Set(Object.keys(netRoutes).filter(k=>netRoutes[k]==='ok').map(k=>ROUTE_NAME[k.replace(/\d+$/,'')]))];return ok.length?' (connected via '+ok.join(' + ')+')':' (still connecting…)'};
const newCode=()=>{const L='ABCDEFGHJKMNPQRSTUVWXYZ';return Array.from({length:4},()=>L[(Math.random()*L.length)|0]).join('')};
async function netHost(){initAudio();if(netRole==='host'&&nroom){$('net-code').textContent=netCode;return}netCode=newCode();
  $('net-code').textContent='';netStatus('Opening a room…');$('net-host').disabled=true;const ok=await netJoin(netCode,'host');$('net-host').disabled=false;if(!ok)return;
  $('net-code').textContent=netCode;netStatus('Tell your friend this code. Waiting for them to join…');netLobby()}
async function netJoinClick(){initAudio();const code=($('net-in').value||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,4);
  if(code.length!==4){netStatus('Type the 4-letter code from the host.',true);return}
  netStatus('Joining '+code+'…');$('net-join').disabled=true;const ok=await netJoin(code,'guest');$('net-join').disabled=false;if(!ok)return;netStatus('In room '+code+'. Waiting for the host…');netLobby()}
function netLobby(){if(!nroom||NET.on)return;
  if(netRole==='host'){const g=netPeer('guest');$('net-start').hidden=!g;netStatus(g?`${String(g.presence.club||'Your friend').slice(0,16)} has joined! Match: ${NETMODES[club.netMode||'volta']}. Hit kick off when you’re both ready.`:'Tell your friend this code. Waiting for them to join…'+netRouteText())}
  else if(netRole==='guest'){const h=netPeer('host');netStatus(h?`Connected to ${String(h.presence.club||'the host').slice(0,16)}. Match: ${NETMODES[h.presence.nm]||NETMODES.volta}. Waiting for them to kick off…`:performance.now()-netJoinAt>9000?`Still looking for a host with code ${netCode}. Check the letters, and that the host has pressed Host and kept that screen open.`+netRouteText():`Looking for the host with code ${netCode}…`+netRouteText())}}
setInterval(()=>{if(nroom&&!NET.on&&state==='menu')netLobby()},1000);
async function netLeave(){const r=nroom;nroom=null;netCode='';netRole=null;netPrep=null;netRdyAt=0;if(NET.on){NET.on=NET.host=NET.guest=false;ctrl2=null;RIN=null;netLock=false;comp=club.comp||'cup';netGuest=null;setup()}
  if(r){try{await r.leave()}catch(e){}}const c=$('net-code');if(c)c.textContent='';const s=$('net-start');if(s)s.hidden=true}
/* host side */
function netStart(){const g=netPeer('guest');if(!g){netStatus('Your friend isn’t in the room any more.',true);return}
  const nm=NETMODES[club.netMode]?club.netMode:'volta',pk=nm==='volta'?'volta':nm==='expanded'?'expanded':'classical',big=pk!=='volta',ns=big?8:4;
  const P=g.presence,sqd=(big?P.csq:P.sq)||{};netGuest={club:String(P.club||'Friend').slice(0,16),kit:typeof P.kit==='string'&&/^#[0-9a-f]{6}$/i.test(P.kit)?P.kit:'#4fb3ff',
    s:[...(Array.isArray(sqd.s)?sqd.s:[]),...E8()].slice(0,ns).map(x=>x==null?'':String(x)),f:FORM_KEYS[big?'classical':'volta'].includes(sqd.f)?sqd.f:FORM_KEYS[big?'classical':'volta'][0],att:sqd.att,cap:sqd.cap,al:Array.isArray(sqd.al)?sqd.al.map(x=>clamp(x|0||1,1,10)):[],nm:Array.isArray(sqd.nm)?sqd.nm.map(x=>String(x||'').slice(0,16)):[],sh:Array.isArray(sqd.sh)?sqd.sh.map(x=>String(x||'').slice(0,10)):[],cu:P.cu&&typeof P.cu==='object'?P.cu:null};
  let kit=netGuest.kit;if(kitClash(kit,club.kit))kit=KITS.find(k=>!kitClash(k,club.kit)&&k!=='#2f2f3a')||'#4fb3ff';
  OPP={name:netGuest.club.toUpperCase(),kit,off:0};cupEvent=null;eventText=null;comp='online';
  NET.on=true;NET.host=true;NET.guest=false;netMatch=(Date.now()%100000)+1;
  initAudio();if(ac&&ac.state==='suspended')ac.resume();DF=levelDF('normal');setPitch(pk);{const g0=GM;GM=big?'classical':'volta';setup();GM=g0}hat=null;score=[0,0];mercy=false;clock=pk==='volta'?120:pk==='expanded'?210:180;style=0;shownStyle=0;hype=0;fire=0;streak=0;
  stats={shots:0,on:0,skills:0,passes:0,tackles:0};parts=[];pops=[];RS={x:0,y:0,charging:false,charge:0};netSeenEv=netSeenEvOf(g);RME=null;netTk=0;netFe=0;netImp=0;netCim=null;netPre=null;netGuestAt=performance.now();netWaiting=false;
  menuEl.hidden=true;edEl.hidden=true;cv.focus();kickoff(0);ctrl2=outfield(1).reduce((a,b)=>b.slot.x>a.slot.x?b:a);
  const roster=players.map(p=>{const s=p.st;return[p.team,p.keeper?1:0,p.kit,String(s.id||'').replace(/_opp$/,'').replace(/^custom$/,'hcustom'),String(s.name||'').slice(0,16),String(s.short||'').slice(0,10),s.num||0,s.skin||'',s.hair||'',s.look||null,s.sk||'',s.sp||'',s.celeb||0,Object.fromEntries(STATK.map(([k])=>[k,Math.round((+s[k]||.6)*100)/100])),s.spLv||1]});
  // both laptops get ready before anyone moves: the guest loads, says so, then a 3-2-1
  netPrep={at:performance.now(),go:0};
  nroom.presence({m:netMatch,r:roster,pk,g:netSnapOf()}).catch(()=>{})}
const netSeenEvOf=g=>{const ev=g&&g.presence&&g.presence.ev;return Array.isArray(ev)&&ev.length?+ev[ev.length-1][0]||0:0};
// guest players get the guest's own team built from their squad (called from setup)
function netGuestTeam(){const g=netGuest,gs=FORMS[g.f],n=gs.length;
  g.s.forEach((id,i)=>{let c=id==='custom'&&g.cu?{...custom,...g.cu,id:'gcustom',isCustom:true}:byId(id);if(!c||c.isCustom&&id!=='custom')c=STARTERS[i%3];
    const fit=posFit(natPos(c),gs[i].r),st={...c,id:(c.id||'x')+'_opp'};if(fit<1)for(const [k] of STATK)st[k]=c[k]*fit;
    if(g.nm[i])st.name=g.nm[i];if(g.sh[i])st.short=g.sh[i];st.spLv=(g.al||[])[i]||1;
    for(const [k] of STATK)st[k]=clamp(+st[k]||.5,.2,.99);if(!SKILLS[st.sk])st.sk='roulette';if(!SPECIALS[st.sp])st.sp='curler';
    const p=mk(1,n+1+i,st,OPP.kit,0,0);p.slot=gs[i];p.role=g.att===i?'att':g.cap===i?'cap':null;players.push(p)})}
// the match types a host can pick, and the pre-match handshake
const NETMODES={volta:'Volta 5v5',classical:'Classical Standard 9v9',expanded:'Classical Expanded 9v9'},NETCOUNT=3000;
let netPrep=null,netRdyAt=0,netRdySent=0;
let netGuestP=null,netGuestAt=0,netWaiting=false,netGuestWait=false,netLastSnapAt=0;
function netHostInput(){const g=netPeer('guest');if(!g)return;
  if(g.presence!==netGuestP){netGuestP=g.presence;netGuestAt=performance.now()}
  const P=g.presence,k=Array.isArray(P.k)?P.k:[0,0];RS.x=-clamp(+k[0]||0,-1,1);RS.y=clamp(+k[1]||0,-1,1);
  const ev=Array.isArray(P.ev)?P.ev:[];for(const e of ev){const id=+e[0]||0;if(id<=netSeenEv)continue;netSeenEv=id;netRemoteKey(String(e[1]||''))}
  netV2=P.v2===1;
  const m=P.me;if(Array.isArray(m)&&m.length>=9&&(!RME||+m[7]!==RME.stamp)){const v=m.map(x=>+x||0);
    RME={x:clamp(v[0],FX0,FX1),y:clamp(v[1],FY0,FY1),vx:clamp(v[2],-12,12),vy:clamp(v[3],-12,12),dir:v[4],idx:v[5]|0,on:!!v[6],stamp:v[7],half:clamp(v[8],0,400),at:performance.now(),mv:P.mv&&typeof P.mv==='object'?P.mv:null}}
  if(netV2&&state==='play'){
    const tc=P.tc;if(tc&&typeof tc==='object'&&+tc.s>netTk){netTk=+tc.s;try{netTouchIn(tc)}catch(e){loopErrs++}}
    if(Array.isArray(P.fe))for(const e of P.fe){if(!Array.isArray(e)||+e[0]<=netFe)continue;netFe=+e[0];const q=players[e[1]|0];if(!q||q.team!==0)continue;
      q.stun=Math.max(q.stun||0,+e[2]||0);if((+e[3]||0)>(q.fall||0)){q.fall=+e[3];q.fallDir=+e[4]||0}if((+e[5]||0)>(q.whiff||0)){q.whiff=+e[5];q.whiffMax=Math.max(q.whiffMax||0,+e[6]||0)}}}}
/* Online, the guest's own player is run on the guest's laptop with the same code as offline (moves, skills, shots,
   tackles), so it feels exactly like playing the bots. The host takes the guest's word for where that player is and
   for every touch he makes on the ball, and only tells the guest about things done TO him (tackled, knocked over, robbed). */
let RME=null,netV2=false,netTk=0,netFe=0,netImp=0,netCim=null,netPre=null;
const netFree=c=>!(c.stun>0)&&!(c.fall>0)&&!(c.whiff>0)&&!c.anim&&!(c.lunge>0)&&!(c.locked>0);
const MVK=['anim','animT','animMax','rot','jump','arms','lunge','slide','ghost','turbo','knockT','spinRot','lean','flip','windup','windSlide','hjump'];
function netGuestPre(dt){if(!netV2)return;const r=RME;
  if(r&&state==='play'){const q=players[r.idx];if(q&&q.team===1&&!q.keeper)ctrl2=q}
  const c=ctrl2;if(!c)return;
  if(r&&players[r.idx]===c&&performance.now()-r.at<600){const f=Math.min(12,(performance.now()-r.at+r.half)/16.667);
    const tx=clamp(r.x+r.vx*f,FX0+10,FX1-10),ty=clamp(r.y+r.vy*f,FY0+10,FY1-10);
    if(Math.hypot(tx-c.x,ty-c.y)>200){c.x=tx;c.y=ty}else{const k=Math.min(1,.6*dt);c.x+=(tx-c.x)*k;c.y+=(ty-c.y)*k}
    c.vx=r.vx;c.vy=r.vy;c.dir=r.dir;
    const mv=r.mv;if(mv){for(const k of MVK){let x=mv[k];if(x===undefined)x=k==='anim'?null:k==='flip'?1:0;c[k]=x}if(c.lean)c.lean=-c.lean;c.aimY=mv.aimY==null?null:+mv.aimY;RS.charging=!!mv.ch;RS.charge=+mv.ch||0}}
  // only knocks the host itself gives him count here; his own whiffs and slides come from the guest's picture
  c.stun=c.hS||0;c.fall=c.hF||0;c.whiff=c.hW||0;
  netPre={c,s:c.stun,f:c.fall,w:c.whiff,own:B.owner===c}}
function netGuestPost(){if(!netV2||!netPre)return;const {c}=netPre;if(c!==ctrl2){netPre=null;return}
  const s=c.stun||0,f=c.fall||0,w=c.whiff||0,lost=netPre.own&&B.owner&&B.owner!==c;
  if(s>netPre.s+.01||f>netPre.f+.01||w>netPre.w+.01||lost){netImp++;netCim=[netImp,r1(s),r1(f),Math.round((c.fallDir||0)*100)/100,r1(w),lost?1:0,r1(c.whiffMax||0)]}
  c.hS=s;c.hF=f;c.hW=w;const mv=RME&&RME.mv;if(mv){c.stun=Math.max(s,+mv.stun||0);c.fall=Math.max(f,+mv.fall||0);c.whiff=Math.max(w,+mv.whiff||0);if(!f&&mv.fall)c.fallDir=MA(+mv.fallDir||0)}
  netPre=null}
// a touch from the guest: he's got the ball, or he's just kicked it (shot, pass, cross, clearance) exactly like this
function netTouchIn(tc){const c=ctrl2;if(!c)return;
  if(tc.k==='have'){if(B.owner===c)return;const o=B.owner;if(o&&o.keeper)return;if(dist(c,B)<80||(o&&dist(c,o)<80))give(c);return}
  const b=tc.b;if(!Array.isArray(b)||b.length<10)return;const n=v=>+v||0;
  B.owner=null;B.claimBy=null;B.graceTo=null;B.graceT=0;B.x=clamp(n(b[0]),FX0-40,FX1+40);B.y=clamp(n(b[1]),FY0,FY1);B.z=Math.max(0,n(b[2]));B.vx=clamp(n(b[3]),-30,30);B.vy=clamp(n(b[4]),-30,30);B.vz=clamp(n(b[5]),-20,20);
  B.curl=clamp(n(b[6]),-1,1);B.knuckle=clamp(n(b[7]),-2,2);B.rocket=!!b[8];B.lockBy=c;B.lockT=n(b[9]);B.kickN=(B.kickN||0)+1;
  const sh=tc.sh;B.shot=Array.isArray(sh)?{team:c.team,by:c,type:String(sh[0]||'normal'),ch:n(sh[1]),perfect:!!sh[2],first:!!sh[3],fx:c.x,one:false,beat:0,skill:false}:null;
  const pa=tc.pa;B.pass=Array.isArray(pa)?{from:c,to:players[pa[0]|0]||null,through:!!pa[1],lob:!!pa[2],cross:!!pa[3],chip:!!pa[4]}:null;
  if(B.lobTo)B.lobTo.lobRun=null;B.lobTo=null;
  const lo=tc.lo;if(Array.isArray(lo)){const m=players[lo[0]|0];if(m){B.lobTo=m;B.lobX=n(lo[1]);B.lobY=n(lo[2]);B.lobThrough=!!lo[3];m.lobRun={x:B.lobX,y:B.lobY}}}
  if(B.shot){c.mS=(c.mS||0)+1}
  try{SRAW.kick&&SRAW.kick(B.shot?.9:.5)}catch(e){}
  // it left his foot a moment ago on his screen: catch the ball up to where it is now
  const f=Math.min(10,Math.round(n(tc.h)/16.667));for(let i=0;i<f;i++)ballUpdate(1,false)}
function withP2(fn){if(!ctrl2)return;const c0=ctrl,ch=charging,cg=charge,me=ctrl2;RIN=RS;ctrl=me;charging=RS.charging;charge=RS.charge;
  try{fn()}finally{RS.charging=charging;RS.charge=charge;const after=ctrl;ctrl=c0;charging=ch;charge=cg;RIN=null;if(after&&after!==me&&after.team===1)ctrl2=after}}
function netRemoteKey(c){
  if(state==='play'&&ctrl2&&netV2)return;
  if(state==='play'&&ctrl2){if(c==='SpaceUp'){if(RS.charging)withP2(()=>playRelease(ctrl2));RS.charging=false;return}withP2(()=>playKey(ctrl2,c))}
  else if(state==='concede'){if(/^Digit[1-6]$/.test(c)&&stT<220&&scorer){celebType=+c.slice(5)-1;scorer.rot=0;scorer.jump=0}if(c==='Space'&&stT>60)kickoff(0)}}
function netSnapOf(){
  const ix=p=>p?players.indexOf(p):-1;
  const p=players.map(q=>{const v={};for(const k of VISK){const x=q[k];if(x)v[k]=typeof x==='number'?r1(x):x===true?1:x}return[Math.round(q.x),Math.round(q.y),Math.round(q.dir*100)/100,v,r1(q.vx||0),r1(q.vy||0)]});
  const c=ctrl2;const a=c?[r1(c.skillCd),r1(c.spCd),r1(c.slideCd),r1(c.blungeCd||0),r1(c.tackleCd),Math.round(c.stam),c.aimY==null?null:Math.round(c.aimY),RS.charging?1:0,Math.round(RS.charge*100)/100]:null;
  const s={n:++netSnapN,pr:netPrep?(netPrep.go?Math.max(1,Math.ceil((NETCOUNT-(performance.now()-netPrep.go))/1000)):-1):0,ack:netSeenEv,tk:netTk,cim:netCim,lt:B.lobTo&&!B.owner?[ix(B.lobTo),Math.round(B.lobX),Math.round(B.lobY),B.lobThrough?1:0]:0,pt:B.pass&&!B.owner?[ix(B.pass.from),ix(B.pass.to)]:0,me2:RME?RME.stamp:0,mh:RME?Math.round(performance.now()-RME.at):0,w:netWaiting?1:0,s:state,st:Math.round(stT),c:Math.round(clock*10),sc:score.slice(),b:[Math.round(B.x),Math.round(B.y),r1(B.z),ballCharge(),Math.round((B.spin||0)*100)/100,r1(B.vx||0),r1(B.vy||0),r1(B.vz||0),Math.round((B.curl||0)*1000)/1000,weather==='rain'?1:0],o:ix(B.owner),c1:ix(ctrl),c2:ix(ctrl2),p,a,kt:Math.round(kickT),
    pp:netPopsOut.slice(-8),fx:netSfxOut.slice(-10),sh:r1(shake),fl:r1(flash),ns:netShake.map(Math.round),sco:ix(scorer),cel:celebType,ph:state==='goal'||state==='concede'?String(phrase||'').slice(0,60):''};
  if(hat)s.hat=[hat.n,hat.team,String(hat.name).slice(0,16),hat.txt,Math.round(t-hat.t0)];
  return s}
function netPublish(){if(!NET.host||!nroom)return;const now=performance.now();if(now-netPubAt<32)return;netPubAt=now;
  netPopsOut=netPopsOut.filter(q=>netPopId-q[0]<8);netSfxOut=netSfxOut.filter(q=>netSfxId-q[0]<10);
  const g=netSnapOf();if(JSON.stringify(g).length>2600){g.pp=g.pp.slice(-2);g.fx=g.fx.slice(-3)}nroom.presence({g}).catch(()=>{})}
/* guest side */
function guestKey(c){
  if(state==='fulltime'){if(c==='Space'&&stT>60){netLeave();showMenu()}return}
  // your own player answers on your own laptop, straight away
  if(state==='play'&&gMe.on&&ctrl){try{if(c==='SpaceUp'){if(charging)playRelease(ctrl)}else{playKey(ctrl,c);if(c==='Tab'||c==='KeyQ')switchPlayer(true)}}catch(e){loopErrs++;window.__lastErr=String(e&&e.stack||e)}return}
  if(state==='play'&&c==='Space'){const p=ctrl;if(p&&(B.owner===p||(!B.owner&&dist(p,B)<70))){charging=true;charge=0}}
  if(c==='SpaceUp')charging=false;
  if(['Space','SpaceUp','KeyF','ShiftLeft','ShiftRight','KeyR','ArrowRight','KeyC','KeyE','ArrowUp','KeyX','ArrowDown'].includes(c)||/^Digit[1-6]$/.test(c)){
    guestEv.push([++guestSeqN,c]);if(guestEv.length>12)guestEv.shift();netGuestPush(true)}
  if(/^Digit[1-6]$/.test(c)&&state==='goal'){celebType=+c.slice(5)-1;S.skill(1)}}
let netGPushAt=0,netGK='';
let netHb=0,netHbAt=0,netEvSent={},netRtt=150,lead={x:0,y:0},leadP=null;
let netMeAt=0;
function netMeOut(){const c=ctrl;if(!c)return null;return[Math.round(MX(c.x)),Math.round(c.y),r1(-(c.vx||0)),r1(c.vy||0),Math.round(MA(c.dir)*100)/100,players.indexOf(c),gMe.on?1:0,Math.round(performance.now()),Math.round(netRtt/2)]}
function netGuestPush(force){if(!nroom)return;const k=[(K('KeyD')?1:0)-(K('ArrowLeft')||K('KeyA')?1:0),(K('KeyS')?1:0)-(K('KeyW')?1:0)],kk=k.join(),now=performance.now();
  const meDue=state==='play'&&now-netMeAt>=30;
  const hbDue=now-netHbAt>350;if(!force&&kk===netGK&&!hbDue&&!meDue)return;
  const extra=o=>{const me=netMeOut();if(me){o.me=me;o.mv=netMvOut()}if(gT.pk&&gT.seq>gT.ack)o.tc=gT.pk;if(gFe.length)o.fe=gFe.slice(-8);return o};
  if(!force&&kk===netGK&&!hbDue){netMeAt=now;nroom.presence(extra({})).catch(()=>{});return}
  netGK=kk;if(hbDue){netHbAt=now;netHb++}netMeAt=now;
  if(force&&guestEv.length)netEvSent[guestEv[guestEv.length-1][0]]=now;
  nroom.presence(extra({k,ev:guestEv.slice(),hb:netHb})).catch(()=>{})}
// what your player looks like right now (animations, lunges, the shot you're winding up), for the host's screen
function netMvOut(){const c=ctrl,o={};for(const k of MVK){const x=c[k];if(x)o[k]=typeof x==='number'?r1(x):x===true?1:x}if(o.lean)o.lean=-o.lean;
  if(c.stun>0)o.stun=r1(c.stun);if(c.fall>0){o.fall=r1(c.fall);o.fallDir=Math.round(MA(c.fallDir||0)*100)/100}if(c.whiff>0)o.whiff=r1(c.whiff);
  if(c.aimY!=null)o.aimY=Math.round(c.aimY);if(charging)o.ch=Math.round(charge*100)/100;return o}
// your touches on the ball and your knocks on their players, sent until the host has them
const gT={seq:0,ack:0,pk:null,mis:0,lob:false},gFe=[];let gFeN=0,gPrev=null,gImp=0;
const R2=v=>Math.round(v*100)/100,R3=v=>Math.round(v*1000)/1000;
function gTouch(kind){const sh=B.shot,pa=B.pass,c=ctrl,ix=q=>q?players.indexOf(q):-1;gT.seq++;
  gT.pk={s:gT.seq,k:kind,b:[r1(MX(B.x)),r1(B.y),r1(B.z),R2(-(B.vx||0)),R2(B.vy||0),R2(B.vz||0),R3(-(B.curl||0)),R3(-(B.knuckle||0)),B.rocket?1:0,r1(B.lockT||0)],
    sh:kind==='kick'&&sh&&sh.by===c?[sh.type||'normal',R2(sh.ch||.8),sh.perfect?1:0,sh.first?1:0]:0,
    pa:kind==='kick'&&pa&&pa.from===c?[ix(pa.to),pa.through?1:0,pa.lob?1:0,pa.cross?1:0,pa.chip?1:0]:0,
    lo:kind==='kick'&&B.lobTo?[ix(B.lobTo),r1(MX(B.lobX)),r1(B.lobY),B.lobThrough?1:0]:0,h:Math.round(netRtt/2)};
  netGuestPush(true)}
const gOpp=()=>players.map(q=>q.team===1?[q.stun||0,q.fall||0,q.whiff||0]:null);
function gRemember(){gPrev={owner:B.owner,kickN:B.kickN||0,opp:gOpp()}}
function gDetect(){const c=ctrl;if(!gPrev){gRemember();return}
  if(c&&B.owner===c&&gPrev.owner!==c)gTouch('have');
  else if(c&&(B.kickN||0)!==gPrev.kickN&&B.lockBy===c)gTouch('kick');
  else if(c&&gPrev.owner===c&&!B.owner)gTouch('kick');
  players.forEach((q,i)=>{const o=gPrev.opp[i];if(!o||q.team!==1)return;
    if((q.stun||0)>o[0]+.5||(q.fall||0)>o[1]+.5||(q.whiff||0)>o[2]+.5){gFe.push([++gFeN,i,r1(q.stun||0),r1(q.fall||0),R2(MA(q.fallDir||0)),r1(q.whiff||0),r1(q.whiffMax||0)]);if(gFe.length>8)gFe.shift();netGuestPush(true)}});
  gRemember()}
function guestBuild(h){const R=h.presence.r;if(!Array.isArray(R)||R.length<4)return false;
  players=R.map((r,j)=>{const base=byId(String(r[3]||''))||{};const st={...base,id:String(r[3]||''),name:String(r[4]||''),short:String(r[5]||''),num:+r[6]||0,skin:String(r[7]||base.skin||'#e8b88c'),hair:String(r[8]||base.hair||'#111'),sk:SKILLS[r[10]]?r[10]:'roulette',sp:SPECIALS[r[11]]?r[11]:'curler',celeb:+r[12]||0};
    if(Array.isArray(r[9]))st.look=r[9];if(st.id==='hcustom')st.id='x';
    // the real stats come with the line-up, so your own player plays exactly as he does on the host
    st.spLv=clamp(+r[14]|0||1,1,10);
    const sv=r[13]&&typeof r[13]==='object'?r[13]:{};for(const [k] of STATK){const v=+sv[k];st[k]=Number.isFinite(v)?clamp(v,.1,.99):Number.isFinite(+st[k])?+st[k]:.6}
    const kit=typeof r[2]==='string'&&/^#[0-9a-f]{6}$/i.test(r[2])?r[2]:'#999999',p=mk(1-(+r[0]?1:0),j,st,kit,0,0,!!r[1]);p.slot={x:.3,y:.5,r:'MID'};return p});
  const hk=players.find(p=>p.team===1&&!p.keeper);OPP={name:String(h.presence.club||'Host').toUpperCase().slice(0,16),kit:hk?hk.kit:'#8e8ff0',off:0};
  return true}
function guestBegin(h){setPitch(['volta','classical','expanded'].includes(h.presence.pk)?h.presence.pk:'volta');if(!guestBuild(h))return;netRdyAt=performance.now()+400;netRdySent=0;NET.on=true;NET.guest=true;NET.host=false;comp='online';netLock=false;netGotMatch=h.presence.m;netGState='';
  netSeenPop=Infinity;netSeenSfx=Infinity;score=[0,0];clock=120;style=0;shownStyle=0;hype=0;fire=0;streak=0;hat=null;mercy=false;pen=null;cupEvent=null;eventText=null;
  stats={shots:0,on:0,skills:0,passes:0,tackles:0};parts=[];pops=[];charging=false;
  menuEl.hidden=true;edEl.hidden=true;$('pack').hidden=true;cv.focus();state='play';stT=0;S.whistle(1);netLastSnapAt=performance.now();netGuestWait=false;gMe.p=null;gMe.on=false;gMe.hx=null;netLastEcho=0;gT.seq=0;gT.ack=0;gT.pk=null;gT.lob=false;gFe.length=0;gFeN=0;gPrev=null;gImp=0;netEvSent={};netApply(h.presence.g,true)}
function netApply(g,snap){if(!g||!Array.isArray(g.p))return;
  g.p.forEach((r,j)=>{const p=players[j];if(!p||!Array.isArray(r))return;const tx=MX(+r[0]||0),ty=+r[1]||0,td=MA(+r[2]||0);
    if(p===ctrl&&gMe.on&&!snap){p.tx=tx;p.ty=ty;p.svx=-(+r[4]||0);p.svy=+r[5]||0;p.td=td;return}
    if(snap||Math.hypot(tx-p.x,ty-p.y)>90){p.x=tx;p.y=ty}p.tx=tx;p.ty=ty;p.svx=-(+r[4]||0);p.svy=+r[5]||0;p.td=td;if(snap)p.dir=td;
    const v=r[3]||{};for(const k of VISK){let x=v[k];if(x===undefined)x=k==='anim'?null:k==='flip'?1:0;p[k]=x}
    if(p.lean)p.lean=-p.lean;if(p.fallDir)p.fallDir=MA(p.fallDir)});
  const b=g.b||[];B.tx=MX(+b[0]||MIDX);B.ty=+b[1]||MY;B.tz=+b[2]||0;B.svx=-(+b[5]||0);B.svy=+b[6]||0;B.svz=+b[7]||0;B.scurl=-(+b[8]||0);B.srain=!!b[9];if(snap){B.x=B.tx;B.y=B.ty;B.z=B.tz}B.spin=-(+b[4]||0);guestCh=+b[3]||0;
  const hostO=g.o>=0?players[g.o]||null:null;gT.ack=Math.max(gT.ack,+g.tk||0);
  if(gMe.on&&state==='play'&&String(g.s)==='play'&&ctrl){const pend=gT.seq>gT.ack;
    // something done to you on the host: tackled, knocked over, robbed
    const ci=g.cim;if(Array.isArray(ci)&&+ci[0]>gImp){gImp=+ci[0];const c=ctrl;c.stun=Math.max(c.stun||0,+ci[1]||0);if((+ci[2]||0)>(c.fall||0)){c.fall=+ci[2];c.fallDir=MA(+ci[3]||0)}
      if((+ci[4]||0)>(c.whiff||0)){c.whiff=+ci[4];c.whiffMax=Math.max(c.whiffMax||0,+ci[6]||0)}if(+ci[1]>0||+ci[2]>0){c.lunge=0;c.slide=false;charging=false}
      if(+ci[5]&&B.owner===c){B.owner=hostO;gT.ack=gT.seq;gT.lob=false}}
    if(gT.seq>gT.ack){}
    else if(hostO===ctrl){if(B.owner!==ctrl)B.owner=ctrl;gT.mis=0}
    else if(B.owner===ctrl){if(++gT.mis>=2){B.owner=hostO;gT.mis=0;gT.lob=false}}
    else if(!gT.lob)B.owner=hostO;
    // a lofted ball coming to you: fly it on your screen so you can volley or head it on time
    const lt=g.lt;if(!B.owner&&!gT.lob&&Array.isArray(lt)&&players[lt[0]|0]===ctrl&&gT.seq<=gT.ack){gT.lob=true;
      B.x=B.tx;B.y=B.ty;B.z=B.tz;B.vx=B.svx||0;B.vy=B.svy||0;B.vz=B.svz||0;B.lobTo=ctrl;B.lobX=MX(+lt[1]||0);B.lobY=+lt[2]||MY;B.lobThrough=!!lt[3];B.pass={from:null,to:ctrl,lob:true};B.lockT=0}
    if(!gT.lob&&gT.seq<=gT.ack){B.lobTo=null;const pt=g.pt;B.pass=Array.isArray(pt)?{from:players[pt[0]]||null,to:players[pt[1]]||null}:null}}
  else{B.owner=hostO;gT.lob=false;const c2=players[g.c2];if(c2&&c2!==ctrl){ctrl=c2;charging=false}}
  if(gPrev){gPrev.owner=B.owner;gPrev.opp=gOpp()}
  if(ctrl&&Array.isArray(g.a)&&!gMe.on){const a=g.a;[ctrl.skillCd,ctrl.spCd,ctrl.slideCd,ctrl.blungeCd,ctrl.tackleCd,ctrl.stam]=a.slice(0,6).map(x=>+x||0);ctrl.aimY=a[6]==null?null:+a[6];if(!a[7])charging=false;else{charging=true;charge=+a[8]||0}}
  if(Array.isArray(g.sc))score=[+g.sc[1]||0,+g.sc[0]||0];clock=(+g.c||0)/10;kickT=+g.kt||0;
  shake=Math.max(shake,+g.sh||0);flash=Math.max(flash,+g.fl||0);if(Array.isArray(g.ns))netShake=[+g.ns[1]||0,+g.ns[0]||0];
  for(const q of g.pp||[]){const id=+q[0];if(netSeenPop!==Infinity&&id<=netSeenPop)continue;
    if(netSeenPop!==Infinity)pops.push({text:String(q[1]).slice(0,40),x:MX(+q[2]||0),y:(+q[3]||0)+30,z:+q[6]||52,col:String(q[4]||C.cream),size:clamp(+q[5]||20,8,40),life:70})}
  netSeenPop=Math.max(0,...(g.pp||[]).map(q=>+q[0]||0));
  for(const q of g.fx||[]){const id=+q[0];if(netSeenSfx!==Infinity&&id<=netSeenSfx)continue;if(netSeenSfx!==Infinity&&SRAW[q[1]]&&!['goal','aww','whistle'].includes(q[1]))try{SRAW[q[1]](q[2])}catch(e){}}
  netSeenSfx=Math.max(0,...(g.fx||[]).map(q=>+q[0]||0));
  if(g.hat){const k=g.hat.slice(0,4).join('|');if(k!==netHatKey){netHatKey=k;hat={n:+g.hat[0],team:1-(+g.hat[1]?1:0),name:String(g.hat[2]),txt:String(g.hat[3]),t0:t-(+g.hat[4]||0)}}}
  // the host's states, seen from the guest's side of the pitch
  const hs=String(g.s),gsN=hs==='goal'?'concede':hs==='concede'?'goal':hs==='fulltime'?'fulltime':'play';
  if(gsN!==netGState){const was=netGState;netGState=gsN;
    if(gsN==='goal'){scorer=players[g.sco]||null;labels=[];phrase=g.ph||pick(PHRASES);streak++;speak(phrase);S.goal();shake=RM?0:16;flash=RM?0:1;burst(FX1+10,B.ty,170,CONF,9,.13);burst(FX1-200,MY,100,CONF,12,.15);if(scorer){scorer.cx=FX1-55;scorer.cy=scorer.y<MY?FY0+55:FY1-55}}
    else if(gsN==='concede'){scorer=players[g.sco]||null;streak=0;S.aww();S.whistle(1)}
    else if(gsN==='fulltime'){state='fulltime';stT=0;netLock=true;awardCoins();S.whistle(3,true);if(score[0]>score[1]){S.goal();burstS(W/2,H/2,200,CONF,12,.12)}else S.aww();return}
    else if(gsN==='play'&&was)S.whistle(1);
    state=gsN}
  if(gsN==='goal'||gsN==='concede'){scorer=players[g.sco]||scorer;if(gsN==='goal')celebType=+g.cel||0}
  stT=+g.st||0}
let guestCh=0,netLastEcho=0;
// Where the host's ball is by now: the same friction, gravity, bounce and curl the host uses, run forward f frames
function ballAhead(x,y,z,vx,vy,vz,curl,f,rain){const n=Math.min(12,Math.ceil(f)),h=f/Math.max(1,n);
  for(let i=0;i<n;i++){const sp=Math.hypot(vx,vy);if(curl&&sp>1){vx+=-vy/sp*curl*h;vy+=vx/sp*curl*h;curl*=Math.pow(.997,h)}
    x+=vx*h;y+=vy*h;const fr=z>0?.996:curl?.992:rain?.988:.984,k=Math.pow(fr,h);vx*=k;vy*=k;
    if(z>0||vz>0){vz-=.25*h;z+=vz*h;if(z<0){z=0;vz=Math.abs(vz)>1.2?-vz*.45:0}}
    if(y<FY0+6){y=FY0+6;vy=Math.abs(vy)*.7}if(y>FY1-6){y=FY1-6;vy=-Math.abs(vy)*.7}}
  return[x,y,z]}
// Your own player runs on your laptop with exactly the same code as an offline match: moves, skills, shots, tackles.
const gMe={p:null,on:false,hx:null,hy:null};
function guestLocal(dt,mineBall){const c=ctrl;if(!c)return;
  for(const k of ['x','y','z','vx','vy','vz','curl','knuckle','spin','lockT'])if(!Number.isFinite(B[k]))B[k]=k==='x'?(B.tx??MIDX):k==='y'?(B.ty??MY):0;
  tickPlayer(c,dt);
  if(c.stun>0){c.stun-=dt;c.vx*=.85;c.vy*=.85}else humanUpdate(c,dt);
  c.x=clamp(c.x+c.vx*dt,FX0+10,FX1-10);c.y=clamp(c.y+c.vy*dt,FY0+10,FY1-10);
  // bump into the others as the host would (only you move: they're the host's)
  for(const q of players){if(q===c||c.fall>0||q.fall>0||((c.ghost>0||q.ghost>0)&&c.team!==q.team))continue;const d=dist(c,q);
    const carry=(B.owner===c||B.owner===q)&&c.team!==q.team&&!(B.owner&&B.owner.keeper),R0=carry?24:20;
    if(d<R0&&d>0){const nx=(c.x-q.x)/d,ny=(c.y-q.y)/d,gap=R0-d,sd=carry&&B.owner===c?clamp(.85-((c.st.str??.6)-(q.st.str??.6))*.9,.35,1):.5;c.x+=nx*gap*sd;c.y+=ny*gap*sd;
      if(carry&&B.owner===c){const into=-(c.vx*nx+c.vy*ny);if(into>0){c.vx+=nx*into*1.6;c.vy+=ny*into*1.6}}}}
  autoSwitch(dt);
  // the ball is yours to move while it's at your feet or you've just played it
  const mine=B.owner===ctrl||gT.seq>gT.ack||gT.lob;
  if(mine){ballUpdate(dt,false);if(gT.lob&&(B.owner||!B.lobTo))gT.lob=false}
  // running onto a loose ball takes it straight away
  {const p=ctrl;if(p&&!B.owner&&p.stun<=0&&!(p.fall>0)&&B.z<14&&dist(p,B)<20&&!(B.lockBy===p&&B.lockT>0)&&Math.hypot(B.vx,B.vy)<11&&!(B.lobTo&&B.lobTo!==p)&&!(B.graceTo&&B.graceT>0&&B.graceTo!==p)){give(p);B.x=p.x+Math.cos(p.dir)*12;B.y=p.y+Math.sin(p.dir)*12}}
  gDetect()}
function guestUpdate(dt){t+=dt;const h=netPeer('host');
  if(!netLock){const now=performance.now();
    if(h&&h.presence.m===netGotMatch&&h.presence.g!==netLastG){netLastG=h.presence.g;netLastSnapAt=now;netApply(netLastG,false);
      const a=netLastG&&+netLastG.ack;if(a&&netEvSent[a]){for(const id in netEvSent)if(+id<=a)delete netEvSent[id]}
      const e2=netLastG&&+netLastG.me2;if(e2&&e2!==netLastEcho){netLastEcho=e2;const rt=now-e2-(+netLastG.mh||0);if(rt>0&&rt<3000)netRtt=netRtt*.8+rt*.2}}
    if(h&&h.presence.m!==netGotMatch&&h.presence.m){netLastSnapAt=now-1e9}
    const quiet=now-(netLastSnapAt||now);netGuestWait=quiet>1800||!!(netLastG&&netLastG.w);
    if(quiet>30000){netLeave();showMenu(true);resultEl.textContent='Lost the connection to the host, so the online match ended.';return}}
  netGuestPush(false);
  if(state==='fulltime'){stT+=dt;if(stT>50&&shownEarned<earned){shownEarned=Math.min(earned,shownEarned+Math.max(1,earned/70)*dt)}if(score[0]>score[1]&&stT%30<dt)firework(rnd(100,900),rnd(25,120))}
  // tell the host we've loaded everything (a moment after the first frames, so the stadium image is built)
  if(netRdyAt&&performance.now()>netRdyAt&&netRdySent!==netGotMatch&&nroom){netRdySent=netGotMatch;nroom.presence({rdy:netGotMatch}).catch(()=>{})}
  else{const live=state==='play'&&!netGuestWait&&!!ctrl&&!(netLastG&&netLastG.pr);if(live&&!gMe.on){gMe.on=true;gRemember();gT.ack=gT.seq}if(!live&&gMe.on){gMe.on=false;gT.lob=false}
    if(!gMe.on&&charging)charge=Math.min(1,charge+.024*dt);
    // dead reckoning: run each snapshot forward by its age, plus half the round trip so you see where things are on the host
    // right now rather than where they were when the snapshot left. Then ease towards that, so corrections don't jerk.
    const age=clamp((performance.now()-netLastSnapAt)/16.667,0,8),lc=state==='play'?clamp(netRtt/33.3,0,5):0,ex=f=>Math.min(f,10);
    for(const p of players){const mine=p===ctrl&&gMe.on;
      if(p.tx!=null){const f=ex(age+lc),gx=clamp(p.tx+(p.svx||0)*f,FX0-40,FX1+40),gy=clamp(p.ty+(p.svy||0)*f,FY0-40,FY1+40);
        if(p===ctrl){gMe.hx=gx;gMe.hy=gy}if(!mine){const k=Math.min(1,.45*dt);p.x+=(gx-p.x)*k;p.y+=(gy-p.y)*k}}
      if(p.td!=null&&!mine)p.dir+=angDiff(p.td,p.dir)*Math.min(1,.4*dt)}
    const mineBall=gMe.on&&(B.owner===ctrl||gT.seq>gT.ack||gT.lob);
    if(gMe.on)guestLocal(dt,mineBall);
    if(B.tx!=null&&!(gMe.on&&(B.owner===ctrl||gT.seq>gT.ack||gT.lob))){const k=Math.min(1,.55*dt),ox=B.x,oy=B.y,o=B.owner;let gx,gy,gz;
      if(o&&o.tx!=null){gx=o.x+(B.tx-o.tx);gy=o.y+(B.ty-o.ty);gz=B.tz}
      else{const q=ballAhead(B.tx,B.ty,B.tz,B.svx||0,B.svy||0,B.svz||0,B.scurl||0,ex(age+lc),B.srain);gx=q[0];gy=q[1];gz=q[2]}
      B.x+=(gx-B.x)*k;B.y+=(gy-B.y)*k;B.z+=(gz-B.z)*k;B.vx=(B.x-ox)/Math.max(.2,dt);B.vy=(B.y-oy)/Math.max(.2,dt)}

    if(state==='goal'&&stT%22<dt&&stT<220)burstS(rnd(100,900),rnd(-20,60),40,CONF,5,.1,[3,7])}
  for(const c of clouds){c.x+=.12*dt;if(c.x-c.r>W)c.x=-c.r}
  trailStep();clockCues();crowdMood(dt);
  for(const p of players){const d=Math.hypot(p.x-(p.lx??p.x),p.y-(p.ly??p.y));p.runPh=(p.runPh||0)+d*.17;p.spdNow=(p.spdNow||0)+(d/Math.max(.2,dt)-(p.spdNow||0))*Math.min(1,.3*dt);p.lx=p.x;p.ly=p.y}
  updateCam(dt);
  {let w=0;for(let i=0;i<parts.length;i++){const p=parts[i];if(p.ring){p.r+=2.2*dt}else{p.vy+=p.g*dt;p.vx*=.99;p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt}p.life-=dt;if(p.life>0)parts[w++]=p}parts.length=w}
  {let w=0;for(let i=0;i<pops.length;i++){const p=pops[i];p.z+=.6*dt;p.life-=dt;if(p.life>0)pops[w++]=p}pops.length=w}
  if(shake>0)shake=Math.max(0,shake-.6*dt);if(flash>0)flash=Math.max(0,flash-.05*dt);netShake=netShake.map(n=>Math.max(0,n-dt))}
let netLastG=null;
// a guest waiting in the lobby starts when the host kicks off
setInterval(()=>{if(!nroom||NET.on||netRole!=='guest'||state!=='menu')return;const h=netPeer('host');if(h&&h.presence.m&&h.presence.r)guestBegin(h)},200);
// sounds and pop-ups on the host are copied to the guest
const SRAW={...S};for(const k of Object.keys(S)){const f=S[k];S[k]=(...a)=>{if(NET.host){netSfxOut.push([++netSfxId,k,typeof a[0]==='number'?a[0]:null])}return f(...a)}}
{const _pop=pop;pop=function(text,x,y,col,size,z){_pop(text,x,y,col,size,z);if(NET.host)netPopsOut.push([++netPopId,String(text).slice(0,40),Math.round(x),Math.round(y),col||C.cream,size||20,z||52])}}
$('net-host').onclick=netHost;$('net-join').onclick=netJoinClick;$('net-start').onclick=netStart;
$('net-in').addEventListener('keydown',e=>{if(e.key==='Enter')netJoinClick()});
$('net-note').textContent=NETNOTE;
/* move a save between copies of the game */
const b64e=str=>btoa(String.fromCharCode(...new TextEncoder().encode(str))),b64d=str=>new TextDecoder().decode(Uint8Array.from(atob(str),c=>c.charCodeAt(0)));
function saveCode(){const sv=snapshotSave();sv.insp=club.insp||{};return 'SK1:'+b64e(JSON.stringify(sv))}
$('save-copy').onclick=async()=>{const code=saveCode(),box=$('save-code');box.value=code;let ok=false;
  try{await navigator.clipboard.writeText(code);ok=true}catch(e){}
  if(!ok){box.focus();box.select();try{ok=document.execCommand('copy')}catch(e){}}
  $('save-note').textContent=ok?'Copied! Now paste it into the other copy.':'Select the code in the box and copy it (Cmd+C).'};
$('save-load').onclick=()=>{const raw=($('save-code').value||'').trim().replace(/\s+/g,'');let sv=null;
  try{sv=JSON.parse(b64d(raw.replace(/^SK1:/,'')))}catch(e){}
  if(!sv||!sv.club||!Array.isArray(sv.club.owned)){$('save-note').textContent='That doesn’t look like a save code. Copy the whole thing and try again.';$('save-note').style.color='var(--coral)';return}
  try{localStorage.setItem('kickabout-club-before-load',JSON.stringify(snapshotSave()))}catch(e){}
  club={...club,...sv.club};loadClubFrom(JSON.parse(JSON.stringify(sv.club)));NAMES={...(sv.names||{})};applyNames();
  if(sv.custom&&sv.custom.name)custom={...custom,...sv.custom,isCustom:true};best=Math.max(best,+sv.best||0);
  try{localStorage.setItem('kickabout-club',JSON.stringify(club));localStorage.setItem('kickabout-names',JSON.stringify(NAMES));localStorage.setItem('kickabout-custom',JSON.stringify(custom));localStorage.setItem('kickabout-best3',best)}catch(e){}
  cloudPush();setup();$('save-code').value='';$('save-note').style.color='';$('save-note').textContent='';renderMenu();S.goal&&S.goal();toast(`Save loaded: ${club.name||'your club'}, ${club.owned.length} players, ${club.coins.toLocaleString()} coins.`)};
/* who's who */
// Who's who: every card's real player and country. Search any card, fix a name, and switch real names on or off.
let whoQ='';
function whoRender(){const opts=Object.keys(COUNTRIES).sort(),q=whoQ.trim().toLowerCase();
  const list=[...PLAYERS].filter(p=>!q||p.name.toLowerCase().includes(q)||p.name0.toLowerCase().includes(q)||inspOf(p.id)[0].toLowerCase().includes(q))
    .sort((a,b)=>(club.owned.includes(b.id)-club.owned.includes(a.id))||ovr(b)-ovr(a)).slice(0,60);
  $('who-top').innerHTML=`<button class="go" id="who-real" style="font-size:16px">${realOn()?'Real names: ON':'Real names: OFF'}</button><input id="who-q" placeholder="Search a card or real player" value="${esc(whoQ)}" aria-label="Search"><span class="hint" style="margin:0">${q?'Matching cards':'Your players first'} · showing ${list.length} of ${PLAYERS.length}</span>`;
  $('who').innerHTML=`<div class="wr wh"><span>CARD</span><span>REAL PLAYER</span><span>COUNTRY</span></div>`+list.map(p=>{const [nm,c]=inspOf(p.id);
    return `<div class="wr"><span><b>${esc(p.name0)}</b><small>${ovr(p)} · ${natPos(p)} · ${TIERS[tier(p)].name}${club.owned.includes(p.id)?' · yours':''}</small></span><input type="text" maxlength="30" data-wi="${esc(p.id)}" value="${esc(nm)}" aria-label="Real player"><select data-wc="${esc(p.id)}" aria-label="Country">${(opts.includes(c)?opts:[c,...opts]).map(o=>`<option${o===c?' selected':''}>${esc(o)}</option>`).join('')}</select></div>`}).join('')}
$('whobox').addEventListener('toggle',()=>{if($('whobox').open)whoRender()});
$('whobox').addEventListener('click',e=>{if(e.target.id==='who-real'){club.realNames=!realOn();saveClub();applyNames();renderMenu();whoRender();toast(realOn()?'Every card now shows its real player’s name.':'Cards show their own made-up names again.')}});
$('whobox').addEventListener('keydown',e=>{if(e.target.id==='who-q'&&e.key==='Enter'){whoQ=e.target.value;whoRender();const i=$('who-q');i.focus();i.setSelectionRange(i.value.length,i.value.length)}});
$('whobox').addEventListener('change',e=>{if(e.target.id==='who-q'){whoQ=e.target.value;whoRender()}});
$('who-save').onclick=()=>{const ins={...(club.insp||{})};for(const i of $('who').querySelectorAll('input[data-wi]')){const id=i.dataset.wi,sel=$('who').querySelector(`select[data-wc="${CSS.escape(id)}"]`),v=i.value.trim().slice(0,30),c=sel?sel.value:'',d=INSP0[id]||['',''];
    if(v!==d[0]||c!==d[1])ins[id]=[v,c];else delete ins[id]}club.insp=ins;saveClub();applyNames();renderMenu();whoRender();toast('Who’s who saved.')};
$('who-reset').onclick=()=>{club.insp={};saveClub();applyNames();renderMenu();whoRender();toast('Back to the original list.')};
/* rename lots of players at once */
function bulkRender(){const list=PLAYERS.filter(p=>club.owned.includes(p.id)).sort((a,b)=>ovr(b)-ovr(a));
  $('bulk').innerHTML=list.map(p=>`<label><span>${esc(p.name0)} · ${ovr(p)}</span><input type="text" maxlength="16" data-bn="${esc(p.id)}" value="${esc(NAMES[p.id]||'')}" placeholder="${esc(p.name0)}"></label>`).join('')}
$('bulkbox').addEventListener('toggle',()=>{if($('bulkbox').open)bulkRender()});
$('bulk-save').onclick=()=>{let n=0;
  for(const i of $('bulk').querySelectorAll('input[data-bn]')){const id=i.dataset.bn,v=i.value.trim().slice(0,16),p=byId(id);if(!p)continue;if(v&&v!==p.name0){if(NAMES[id]!==v)n++;NAMES[id]=v}else{if(NAMES[id])n++;delete NAMES[id]}}
  const norm=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
  for(const line of ($('bulk-paste').value||'').split(/\n/)){const m=line.split(/=|→|->/);if(m.length<2)continue;const from=norm(m[0]),to=m.slice(1).join(' ').trim().slice(0,16);if(!from||!to)continue;
    const p=PLAYERS.find(q=>norm(q.name0)===from||norm(q.name)===from||norm(q.short0)===from||norm(q.id)===from);if(p){NAMES[p.id]=to;n++}}
  applyNames();try{localStorage.setItem('kickabout-names',JSON.stringify(NAMES))}catch(e){}cloudPush();$('bulk-paste').value='';
  renderMenu();bulkRender();toast(n?`Saved ${n} name${n>1?'s':''}.`:'No names changed.')};
$('bulk-clear').onclick=()=>{if(!Object.keys(NAMES).length){toast('Everyone already has their card name.');return}NAMES={};applyNames();try{localStorage.setItem('kickabout-names','{}')}catch(e){}cloudPush();renderMenu();bulkRender();toast('All names reset.')};
renderMenu();cloudInit();
let last=performance.now();
function hitStop(f){if(!RM&&!NET.on)hitT=Math.max(hitT,f)}
// Every frame starts from a clean drawing state, and one bad frame can never stop the game: errors are caught and the
// loop carries on. A watchdog restarts the loop if the browser ever drops it, and the Fix screen button resets everything visual.
let lastFrame=performance.now(),loopErrs=0;
function cleanCtx(){ctx.setTransform(DPR,0,0,DPR,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.setLineDash([]);ctx.shadowBlur=0}
function safeDraw(){cleanCtx();try{draw()}catch(e){loopErrs++;window.__lastErr=String(e&&e.stack||e);cleanCtx()}}
const PERF={u:0,d:0,n:0,max:0,ft:[],sec:{},prof:false,cur:{},slow:[]};window.__perf=PERF;
// Adaptive quality: if more than one frame in six runs long during play over a few seconds, step the graphics down
// (lighter stadium image, fewer particles). Two steps at most; it never steps back up mid-session.
const AQ={n:0,slow:0};
function adaptQ(ms){if(state!=='play'||document.hidden)return;AQ.n++;if(ms>13)AQ.slow++;
  if(AQ.n>=240){if(AQ.slow/AQ.n>.16&&QLV<2){QLV++;pitchCv=null;PERF.qdrops=(PERF.qdrops||0)+1}AQ.n=0;AQ.slow=0}}
// section timings, only when profiling is switched on (tests): PS(key,startTime)
const PS=(k,t0)=>{if(PERF.prof){const v=performance.now()-t0;PERF.sec[k]=(PERF.sec[k]||0)+v;PERF.cur[k]=(PERF.cur[k]||0)+v}};
// only one loop may ever run: restarting it (watchdog, Fix screen) retires the old one instead of running two at once
let loopGen=0;const startLoop=()=>{const g=++loopGen;requestAnimationFrame(n=>loop(n,g))};
function loop(now,g){if(g!==loopGen)return;lastFrame=performance.now();const dt=Math.min(2.5,(now-last)/16.667);last=now;const p0=performance.now();
  try{if(hitT>0){hitT-=dt;safeDraw();requestAnimationFrame(n=>loop(n,g));return}let ds=dt;if(slowT>0){slowT-=dt;ds=dt*timeScale}if(hr('turbo')&&state==='play')ds*=1.3;const steps=Math.max(1,Math.ceil(ds/1.05-1e-9));for(let i=0;i<steps;i++)update(ds/steps)}catch(e){loopErrs++;window.__lastErr=String(e&&e.stack||e);hitT=0;slowT=0;timeScale=1}
  const p1=performance.now();safeDraw();const p2=performance.now();PERF.u+=p1-p0;PERF.d+=p2-p1;PERF.n++;PERF.max=Math.max(PERF.max,p2-p0);adaptQ(p2-p0);if(PERF.prof){PERF.ft.push([p1-p0,p2-p1,state]);if(PERF.ft.length>4000)PERF.ft.shift();if(p2-p0>7&&PERF.slow.length<30)PERF.slow.push({u:+(p1-p0).toFixed(1),d:+(p2-p1).toFixed(1),st:state,stT:Math.round(stT),c:Object.fromEntries(Object.entries(PERF.cur).map(([k,v])=>[k,+v.toFixed(1)]).filter(x=>x[1]>.5))});PERF.cur={}}requestAnimationFrame(n=>loop(n,g))}
setInterval(()=>{if(!document.hidden&&performance.now()-lastFrame>1500){last=performance.now();startLoop()}},1000);
function fixScreen(){pitchCv=null;skyCv=null;vigCv=null;grainPat=null;cv.width=W*DPR;cv.height=H*DPR;cleanCtx();hitT=0;slowT=0;timeScale=1;shake=0;flash=0;camK=0;celebCut=false;
  cam={...BROAD,x:camFollow=camTX=clamp(B.x,FX0+330,FX1-330),hor:camHor};parts=[];
  if(state==='replay'||state==='goal'||state==='concede')kickoff(state==='concede'?0:1);
  if(state!=='menu'&&!players.length)showMenu(true);last=performance.now();startLoop();toast('Screen reset');cv.focus()}
// the browser can throw away canvas memory (GPU reset, a hidden tab): rebuild the cached pictures when that happens
const dropCaches=()=>{pitchCv=null;skyCv=null;vigCv=null;grainPat=null;penA=null;penB=null};
cv.addEventListener('contextrestored',()=>{dropCaches();cleanCtx()});cv.addEventListener('contextlost',e=>{e.preventDefault()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){dropCaches();last=performance.now()}});
if(document.fonts&&document.fonts.load)document.fonts.load('40px "Lilita One"').catch(()=>{});
$('fixscr').onclick=fixScreen;$('fixscr2').onclick=()=>{setPause(false);fixScreen()};
// full screen: the whole stage (pitch and menus) fills the screen; Esc or V again to leave
function toggleFull(){const st=document.querySelector('.stage'),fs=document.fullscreenElement||document.webkitFullscreenElement;
  try{if(fs)(document.exitFullscreen||document.webkitExitFullscreen).call(document);else(st.requestFullscreen||st.webkitRequestFullscreen).call(st)}catch(e){toast('Full screen isn’t available here.')}cv.focus()}
$('fullscr').onclick=toggleFull;$('fullscr2').onclick=toggleFull;
const fsLabel=()=>{const on=!!(document.fullscreenElement||document.webkitFullscreenElement);$('fullscr').textContent=on?'Exit full screen (V)':'Full screen (V)';$('fullscr2').textContent=on?'Exit full screen':'Full screen'};
document.addEventListener('fullscreenchange',fsLabel);document.addEventListener('webkitfullscreenchange',fsLabel);
window.__kick={errs:()=>loopErrs,dbg:{snapSize:()=>JSON.stringify(netSnapOf()).length,prep:()=>!!netPrep,allPlayers:()=>PLAYERS.map(p=>({id:p.id,real:inspOf(p.id)[0],country:inspOf(p.id)[1],card:p.name0,pos:natPos(p),rar:TIERS[tier(p)].name,ovr:ovr(p),look:p.look,skin:p.skin})),draw:()=>draw(),proj:(x,y,z)=>P(x,y,z),cam:()=>cam,hit:()=>({hitT,slowT,timeScale}),shoot,give,keeperOf,startAim,openCorner,forcePlay:()=>{state="play";stT=99;kickT=0;koT=-999;introT=0},setWeather:w=>{weather=w},setDF:k=>{DF=levelDF(k)},DF:()=>DF},sim:()=>({air:airN,ctrl,clock,lastPoss,passChain,FX0,FX1,MY,GY0,GY1}),penApi:()=>({pen,penSetup,penRelease,updatePens,keeperStep,setCharge:v=>{charge=v},myDive,setDF:k=>{DF=levelDF(k)}}),setFire:v=>{fire=v},net:()=>({gm:{on:gMe.on,seq:gT.seq,ack:gT.ack,lob:gT.lob,wait:netGuestWait,rtt:netRtt,v2:netV2},RS:RS&&{...RS},NET,ctrl2:ctrl2&&players.indexOf(ctrl2),ctrl:ctrl&&players.indexOf(ctrl),state,stT,score:score.slice()}),tackle,setScore:(a,b)=>{score[0]=a;score[1]=b},goalFor,setCtrl:p=>{ctrl=p},startPens,pen:()=>pen,setClock:v=>{clock=v},setMode:m=>{mode=m},setGM:g=>{GM=g},gm:()=>({GM,PITCH,FX1,FY1,MIDX,MY}),club:()=>club,players:()=>players,B,state:()=>state,startMatch,update,keys,score:()=>score,stats:()=>stats,setSel:s=>{club.owned=[...new Set([...club.owned,...s])];sq().s=s.slice(0,4)}};
// Getting ready: a panel over the pitch while both laptops load, then the countdown
function drawNetPrep(pr){const who=NET.host?(netGuest?netGuest.club:'your friend'):OPP.name;ctx.fillStyle='rgba(13,24,33,.78)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(20,48,63,.95)';rr(W/2-260,H/2-120,520,240,22);ctx.fill();
  const md=PITCH==='expanded'?'Classical Expanded 9v9':PITCH==='classical'?'Classical Standard 9v9':'Volta 5v5';
  txt(pr>0?'KICK-OFF IN':'GETTING READY',W/2,H/2-80,30,C.sun,'center',false);
  if(pr>0){const k=(t%60)/60;ctx.save();ctx.translate(W/2,H/2+10);ctx.scale(1+.15*(1-k),1+.15*(1-k));txt(String(pr),0,0,96,C.cream,'center',false);ctx.restore()}
  else{const rows=[['Connected',true],[`Squads and pitch synced · ${md}`,true],[NET.host?`Waiting for ${String(who).slice(0,16)} to finish loading…`:'Loading the stadium…',false]];
    rows.forEach(([l,ok],i)=>{const y=H/2-28+i*34;txt((ok?'✓  ':'…  ')+l,W/2-200,y,17,ok?C.mint:C.cream,'left',false)})}
  txt('Both laptops start together once everything is ready',W/2,H/2+96,13,C.muted,'center',false)}
function renderNetModes(){const el=$('net-mode');if(!el)return;const cur=NETMODES[club.netMode]?club.netMode:'volta';
  el.innerHTML=Object.entries(NETMODES).map(([k,n])=>`<button data-nm="${k}" aria-pressed="${cur===k}">${n}</button>`).join('')}
$('net-mode').addEventListener('click',e=>{const b=e.target.closest('[data-nm]');if(!b||NET.on)return;club.netMode=b.dataset.nm;saveClub();renderNetModes();if(nroom&&netRole==='host'){nroom.presence({nm:club.netMode}).catch(()=>{});netLobby()}});
renderNetModes();
startLoop();
})();
