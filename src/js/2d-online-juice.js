/* ---------- online: the big moments hit harder, on both laptops ----------
   Everything here changes only what this laptop shows and plays, never the match, so both players get the same punch
   and the two matches can't drift apart. It reacts to moments both laptops already hear (a shot, a tackle, a save,
   the woodwork, a skill, a rocket) and to the score and the clock: a camera punch towards the action, speed lines,
   a coloured pulse round the edges, a slam-in call ("WHAT A SAVE!", "EQUALISER!"), stadium strobes and confetti for
   goals and wins. The joining player also gets their own style, hype, skill chain and ON FIRE (shown, not a boost:
   online, ON FIRE changes nothing in the match for either side, so it can't favour the host). */
const OJ={z:0,zt:0,zx:0,zy:0,lines:[],slam:null,vig:0,vigC:'255,210,63',strobe:0,at:0,prevSt:'',minDiff:0,ten:false,cd:{},was:false,beat:-1};
const ojOn=()=>NET.on&&!RM;
const ojBallVX=()=>NET.guest?(B.svx||0):(B.vx||0);
function ojPunch(a,wx,wy){if(!ojOn())return;if(a>=OJ.zt){OJ.zt=a;const q=P(wx,wy,8);OJ.zx=clamp(q.x,W*.2,W*.8);OJ.zy=clamp(q.y,H*.25,H*.8)}}
function ojLines(wx,wy,col,n=18,len=1){if(!ojOn())return;const q=P(wx,wy,8);if(OJ.lines.length>60)return;
  for(let i=0;i<n;i++){const a=i/n*6.283+rnd(-.12,.12);OJ.lines.push({x:q.x,y:q.y,a,r:rnd(26,50),v:rnd(16,28)*len,w:rnd(1.5,3.5),life:13,max:13,col})}}
function ojVig(col,a){if(!ojOn())return;if(a>=OJ.vig){OJ.vig=a;OJ.vigC=col}}
// a call slammed onto the screen; a fresh one isn't trampled by a smaller one, and each kind waits 2.5 s to repeat
function ojSlam(text,col,sub='',size=60,key='',y=null){if(!NET.on)return;const now=performance.now();
  if(key){if(OJ.cd[key]&&now-OJ.cd[key]<2500)return;OJ.cd[key]=now}
  if(OJ.slam&&t-OJ.slam.t0<24&&OJ.slam.size>size)return;
  OJ.slam={text,col,sub,size,t0:t,y:y==null?H*.34:y}}
function ojSting(big){if(muted)return;try{(big?[523,659,784,1047]:[659,880,1175]).forEach((f,i)=>tone(f,big?.22:.14,'triangle',big?.12:.08,i*.045))}catch(e){}}
function ojCannons(n){if(RM)return;for(const sx of [-1,1])for(let i=0;i<n;i++){const x=sx<0?30:W-30;
  parts.push({x,y:H-20,vx:-sx*rnd(2,7),vy:rnd(-15,-8),g:.22,life:rnd(55,85),max:85,c:pick(CONF),w:rnd(5,9),h:rnd(3,6),r:rnd(0,6),vr:rnd(-.3,.3)})}}
// the joining player's own style, hype and ON FIRE, worked out here from what they do (the host's come from its match)
function ojMine(styleN,hypeN,label){if(!NET.guest)return;style+=styleN;if(label&&ctrl)pop(label+'  +'+styleN,ctrl.x,ctrl.y-30,C.sun,18);
  if(fire>0||!hypeN)return;hype=Math.min(100,hype+hypeN*1.45);
  if(hype>=100){fire=780;hype=0;try{SRAW.fire()}catch(e){}if(ctrl)pop('ON FIRE!',ctrl.x,ctrl.y-40,C.coral,30);flash=RM?0:.5;ojSlam('ON FIRE!',C.coral,'',62,'fire')}}
function ojEv(k,a){if(!NET.on||state!=='play')return;const me=ctrl;
  if(k==='kick'){const ch=+a||0;if(ch<.3)return;const mine=ojBallVX()>0;
    if(ch>.85){ojPunch(.05,B.x,B.y);ojLines(B.x,B.y,mine?'255,246,228':'255,190,170',20,1.15);if(mine)ojVig('255,210,63',.35)}
    else ojPunch(.025,B.x,B.y);if(mine)ojMine(0,3)}
  else if(k==='boom'){ojPunch(.085,B.x,B.y);ojLines(B.x,B.y,'255,150,90',26,1.4);ojVig('255,111,89',.55);flash=Math.max(flash,RM?0:.18);
    if(ojBallVX()>0)ojSlam(pick(['ROCKET!','THUNDERBOLT!','HIT IT!']),C.coral,'',58,'boom')}
  else if(k==='tackle'){const mine=B.owner&&B.owner.team===0;ojPunch(.04,B.x,B.y);
    if(mine){ojVig('127,224,180',.4);ojSlam(pick(['WON IT!','CRUNCHED!','PICKPOCKET!','CLEAN AS YOU LIKE']),C.mint,'',44,'tackle');ojMine(15,10)}
    else ojVig('255,111,89',.22)}
  else if(k==='save'){const mySide=B.x<MIDX;ojPunch(.055,B.x,B.y);ojLines(B.x,B.y,'255,246,228',16,.9);
    if(mySide){ojVig('127,224,180',.45);ojSlam(pick(['WHAT A SAVE!','UNBELIEVABLE STOP!','KEPT OUT!']),C.mint,'',54,'save');ojMine(10,10)}
    else{ojVig('255,111,89',.3);ojSlam(pick(['DENIED!','HOW DID HE SAVE THAT?','SO CLOSE!']),C.cream,'',44,'save')}}
  else if(k==='post'){const mine=B.x>MIDX;ojPunch(.07,B.x,B.y);shake=Math.max(shake,RM?0:7);ojLines(B.x,B.y,'255,210,63',22,1.2);
    ojSlam(mine?'OFF THE WOODWORK!':'PHEW!',mine?C.sun:C.cream,'',mine?54:42,'post');if(mine){ojVig('255,210,63',.45);ojMine(15,10)}}
  else if(k==='skill'){if(!me||B.owner!==me)return;ojPunch(.022,me.x,me.y);
    if(NET.guest){chain=t-chainT<300?chain+1:1;chainT=t;ojMine(12,5);if(chain>=3)ojSlam('SKILL CHAIN ×'+chain,C.sun,'',46,'chain'+chain)}}
  else if(k==='special'){ojPunch(.035,B.x,B.y);ojVig('255,210,63',.3)}}
// the same sounds play on both laptops at the same moments (the joining laptop hears the host's), so they're the cue
for(const k of ['kick','boom','tackle','save','post','skill','special']){const f=S[k];S[k]=(...a)=>{const r=f(...a);try{ojEv(k,a[0])}catch(e){}return r}}
function ojGoal(mine){const d=score[0]-score[1];
  if(mine){ojPunch(.13,FX1,MY);OJ.strobe=RM?0:20;ojVig('255,210,63',.9);ojCannons(26);ojLines(FX1-20,MY,'255,210,63',30,1.6);ojSting(true);
    const ctx2=d===0?['EQUALISER!',C.sun]:d===1&&clock<=15?['LAST-GASP LEAD!',C.coral]:d===1&&OJ.minDiff<=-2?['WHAT A COMEBACK!',C.mint]:d===1?['IN FRONT!',C.mint]:d>=3?['RUNNING RIOT!',C.sun]:d===2?['TWO CLEAR!',C.mint]:null;
    if(ctx2)ojSlam(ctx2[0],ctx2[1],'',50,'',H-160);if(NET.guest)ojMine(50,25)}
  else{ojPunch(.035,FX0,MY);ojVig('255,111,89',.6);if(d===0)ojSlam('ALL SQUARE',C.cream,'',40,'',H-170)}}
function ojFull(){const d=score[0]-score[1];if(d>0){OJ.strobe=RM?0:26;ojCannons(40);ojVig('255,210,63',.8);ojSting(true)}else if(d<0)ojVig('255,111,89',.5)}
function ojTick(){const now=performance.now(),dt=clamp((now-(OJ.at||now))/16.667,0,3);OJ.at=now;
  if(!NET.on){if(OJ.was){OJ.was=false;OJ.slam=null;OJ.lines.length=0;OJ.z=OJ.zt=OJ.vig=OJ.strobe=0}return}
  if(!OJ.was){OJ.was=true;OJ.prevSt=state;OJ.minDiff=0;OJ.ten=false;OJ.cd={};OJ.beat=-1}
  if(state!==OJ.prevSt){const was=OJ.prevSt;OJ.prevSt=state;if(state==='goal')ojGoal(true);else if(state==='concede')ojGoal(false);else if(state==='fulltime'&&was)ojFull()}
  if(state==='play'){OJ.minDiff=Math.min(OJ.minDiff,score[0]-score[1]);
    // a close game going into the last ten seconds: the screen beats with the clock
    if(clock<=10&&clock>0&&Math.abs(score[0]-score[1])<=1){if(!OJ.ten){OJ.ten=true;ojSlam('FINAL 10 SECONDS',C.coral,'',44,'ten')}
      const s=Math.ceil(clock);if(s!==OJ.beat){OJ.beat=s;ojVig('255,111,89',.28)}}}
  OJ.z+=(OJ.zt-OJ.z)*Math.min(1,.55*dt);OJ.zt*=Math.pow(.84,dt);if(OJ.zt<.001&&OJ.z<.001)OJ.z=OJ.zt=0;
  OJ.vig*=Math.pow(.93,dt);if(OJ.vig<.01)OJ.vig=0;if(OJ.strobe>0)OJ.strobe=Math.max(0,OJ.strobe-dt);
  {let w=0;for(const l of OJ.lines){l.life-=dt;l.r+=l.v*dt*.6;if(l.life>0)OJ.lines[w++]=l}OJ.lines.length=w}
  if(OJ.slam&&t-OJ.slam.t0>95)OJ.slam=null;
  // the joining laptop runs its own ON FIRE clock and flames (the host's match does this for the host)
  if(NET.guest&&state==='play'){if(fire>0)fire=Math.max(0,fire-dt);
    if(ctrl&&fire>0&&t%3<dt){const q=P(ctrl.x+rnd(-6,6),ctrl.y,rnd(4,30));parts.push({x:q.x,y:q.y,vx:rnd(-.4,.4),vy:rnd(-1.6,-.6),g:-.02,life:24,max:24,c:pick(['#ff6f59','#ffd166','#ff9a3c']),w:5,h:5,r:0,vr:.2})}
    shownStyle+=(style-shownStyle)*Math.min(1,.12*dt)}}
// the camera punch, applied around the pitch only (the scoreboard stays put)
function ojZoomOn(){const z=1+OJ.z;if(!(z>1.001)||!NET.on)return false;ctx.save();ctx.translate(OJ.zx,OJ.zy);ctx.scale(z,z);ctx.translate(-OJ.zx,-OJ.zy);return true}
function ojDraw(){if(!NET.on)return;
  for(const l of OJ.lines){const a=l.life/l.max,x0=l.x+Math.cos(l.a)*l.r,y0=l.y+Math.sin(l.a)*l.r,len=l.v*2.2*a+10;
    ctx.strokeStyle=`rgba(${l.col},${.75*a})`;ctx.lineWidth=l.w*a+.5;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+Math.cos(l.a)*len,y0+Math.sin(l.a)*len);ctx.stroke()}
  if(OJ.vig>0){const g=ctx.createRadialGradient(W/2,H/2,H*.32,W/2,H/2,W*.62);g.addColorStop(0,`rgba(${OJ.vigC},0)`);g.addColorStop(1,`rgba(${OJ.vigC},${.55*OJ.vig})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  if(OJ.strobe>0&&Math.floor(OJ.strobe/3)%2===0){ctx.fillStyle=`rgba(255,250,235,${.1+.12*(OJ.strobe/26)})`;ctx.fillRect(0,0,W,H)}
  const s=OJ.slam;if(s){const k=t-s.t0,e=elastic(Math.min(1,k/20)),a=Math.min(1,(95-k)/18),rot=Math.sin(k*.09)*.025;
    ctx.save();ctx.globalAlpha=Math.max(0,a);ctx.translate(W/2,s.y);ctx.rotate(rot-.04*(1-Math.min(1,k/12)));ctx.scale(e,e);
    txt(s.text,3,5,s.size,'rgba(0,0,0,.45)','center',false);txt(s.text,0,0,s.size,s.col);
    if(s.sub)txt(s.sub,0,s.size*.62,Math.round(s.size*.32),C.cream,'center',false);ctx.restore()}}
