// Difficulty regression test: plays whole offline matches with a simple "casual player" bot (chases the ball, dribbles
// at goal, shoots from close range, passes when someone closes him down) and measures what each level feels like:
// goals both ways, how often you're tackled while on the ball, how often two or more of them swarm you, your pass
// completion, their slide tackles, and (separately) how often placed shots from set spots beat their keeper. Then checks tools/difficulty-targets.json.
// Usage: node tools/difficulty.cjs [matchesPerCell=6] [file=sunday-kickabout.html] [--json out.json] [--no-check]
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const N=+process.argv[2]||6,FILE=process.argv[3]&&!process.argv[3].startsWith('--')?process.argv[3]:'sunday-kickabout.html';
const OUT=(i=>i>0?process.argv[i+1]:null)(process.argv.indexOf('--json')),CHECK=!process.argv.includes('--no-check');
const MODES=['volta','classical','expanded'],LEVELS=['chill','normal','hard','extreme'];
async function cell(b,gm,lv){const pg=await b.newPage();
  await pg.addInitScript(sd=>{let a=sd*2654435761>>>0;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},MODES.indexOf(gm)*10+LEVELS.indexOf(lv)+3);
  await pg.goto('file://'+path.resolve(FILE));await pg.waitForTimeout(300);
  const r=await pg.evaluate(async([N,gm,lv])=>{const K=window.__kick,c0=K.club();c0.mgr='Tester';c0.tut={done:true};for(const id of ['prof','tut']){const e=document.getElementById(id);if(e)e.hidden=true}
    const key=(c,d)=>window.dispatchEvent(new KeyboardEvent(d?'keydown':'keyup',{code:c}));const hold={};const set=(c,v)=>{if(!!hold[c]!==v){hold[c]=v;key(c,v)}};
    document.querySelector(`[data-lv=${lv}]`).click();if(gm==='volta')document.querySelector('[data-gm=volta]').click();else{document.querySelector('[data-gm=classical]').click();document.querySelector('[data-pitch='+(gm==='expanded'?'expanded':'standard')+']').click()}
    // a friendly, so leagues/cups don't change the opponent's strength between runs
    {const f=document.querySelector('[data-d=friendly]');if(f)f.click()}
    const tot={gUs:0,gThem:0,carryF:0,tackled:0,swarmF:0,tk:0,sl:0,pAtt:0,pOk:0,pLost:0,frames:0};
    for(let m=0;m<N;m++){const a0=JSON.parse(JSON.stringify(K.dbg.aiStat()));document.querySelector('#go').click();let shotT=0,frames=0,lastMine=null,looseF=0,pend=null,released=false;
      while(K.state()!=='fulltime'&&frames<26000){frames++;const st=K.state(),S=K.sim(),B=K.B,c=S.ctrl;
        if(st==='goal'||st==='replay'||st==='concede'){set('KeyD',false);set('KeyA',false);set('KeyW',false);set('KeyS',false);if(frames%40===0){key('Space',true);key('Space',false)}K.update(1);continue}
        if(st==='pens'){if(frames%30===0){key('Space',true);key('Space',false)}K.update(1);continue}
        if(st!=='play'){K.update(1);continue}
        // on the ball: frames carried, swarmed (2+ of theirs within reach), and losing it to a tackle (straight to them, or
        // knocked loose and picked up by them within a few frames, with no pass or shot in between)
        const o=B.owner&&B.owner.team===0&&!B.owner.keeper?B.owner:null;
        if(o){tot.carryF++;const R=90*Math.sqrt(S.FX1-S.FX0>1800?1.37:1);let n=0;for(const q of K.players())if(q.team===1&&!q.keeper&&Math.hypot(q.x-o.x,q.y-o.y)<R)n++;if(n>=2)tot.swarmF++;lastMine=o;looseF=0;released=false}
        else if(lastMine){if(B.pass&&B.pass.from===lastMine||B.shot)released=true;
          if(B.owner&&B.owner.team===1&&!B.owner.keeper){if(!released&&looseF<10)tot.tackled++;lastMine=null}else if(B.owner||released||++looseF>10)lastMine=null}
        // your passes: completed to a team-mate or lost to them
        if(B.pass&&B.pass.from&&B.pass.from.team===0&&!B.pass.from.keeper&&B.pass!==pend){pend=B.pass;pend._f=B.pass.from;tot.pAtt++}
        if(pend&&B.owner){if(B.owner.team===0&&B.owner!==pend._f)tot.pOk++;else if(B.owner.team===1)tot.pLost++;pend=null}
        if(c){const own=B.owner===c,gx=S.FX1;let tx,ty;
          if(own){tx=gx;ty=S.MY+(c.y<S.MY?20:-20);const near=Math.hypot(gx-c.x,S.MY-c.y)<330,opp=K.players().filter(p=>p.team===1&&!p.keeper&&Math.hypot(p.x-c.x,p.y-c.y)<55&&p.x>c.x);
            c._still=Math.hypot(c.vx,c.vy)<.2?(c._still||0)+1:0;// standing still on it (a kick-off): play it
            if(near&&!shotT){shotT=40;key('Space',true)}else if((opp.length&&frames%25===0||c._still>45)&&!shotT){c._still=0;key('ShiftLeft',true);key('ShiftLeft',false)}}
          else{tx=B.x;ty=B.y;if(B.owner&&B.owner.team===1&&Math.hypot(B.x-c.x,B.y-c.y)<40&&frames%12===0){key('ShiftLeft',true);key('ShiftLeft',false)}}
          if(shotT){shotT--;if(shotT===0)key('Space',false)}
          set('KeyD',tx>c.x+8);set('KeyA',tx<c.x-8);set('KeyS',ty>c.y+8);set('KeyW',ty<c.y-8)}
        K.update(1)}
      const sc=K.score(),s=K.stats(),a1=K.dbg.aiStat();tot.gUs+=sc[0];tot.gThem+=sc[1];tot.tk+=(a1.tkTry-a0.tkTry);tot.sl+=(a1.slTry-a0.slTry);tot.frames+=frames;
      for(const k of ['KeyD','KeyA','KeyW','KeyS'])set(k,false);
      for(let i=0;i<200;i++)K.update(1);for(let i=0;i<40&&K.state()!=='menu';i++){key('Space',true);key('Space',false);K.update(1);await new Promise(r=>setTimeout(r,2))}
      document.getElementById('menu').hidden=false}
    // placed shots at their keeper: fixed spots, average finisher, settled keeper
    const gk={g:0,n:0};{document.querySelector('#go').click();for(let i=0;i<300;i++)K.update(1);const S=K.sim(),gx=S.FX1,ps=K.players(),c=ps.find(p=>p.team===0&&!p.keeper),k=ps.find(p=>p.keeper&&p.team===1);
      for(const [dx,dy] of [[180,30],[260,70],[320,10]])for(let i=0;i<32;i++){K.dbg.forcePlay();K.setScore(0,0);K.setClock(100);
        for(const p of ps){p.vx=p.vy=0;p.anim=null;p.push=null;p.lunge=0;p.slide=false;p.aiSlide=0;p.aiLunge=0;p.windup=0;if(p!==c&&p!==k){p.stun=9999;p.x=S.MIDX-200;p.y=S.FY0+30}}
        k.diving=false;k.track=false;k.react=0;k.planY=null;k.sweep=null;k.stun=0;k.wide=false;k.x=gx-16;k.y=S.MY;const sy=i%2?1:-1;c.stun=0;c.x=gx-dx;c.y=S.MY+dy*sy;c.st.fin=.7;c.st.shot=.75;K.setCtrl(c);
        for(let f=0;f<45;f++){c.vx=c.vy=0;c.x=gx-dx;c.y=S.MY+dy*sy;if(K.B.owner!==c){Object.assign(K.B,{x:c.x+12,y:c.y,z:0,vx:0,vy:0,vz:0,owner:null,shot:null,pass:null,lobTo:null});K.dbg.give(c)}K.update(1)}
        const aim=(i%4<2)?S.GY0+18:S.GY1-18;c.dir=Math.atan2(aim-K.B.y,gx-K.B.x);const s0=K.score()[0];K.dbg.shoot(c,'normal',.8,aim);let touched=false;
        for(let f=0;f<150;f++){K.update(1);if(K.B.lockBy===k||K.B.owner===k)touched=true;if(K.score()[0]>s0||K.state()!=='play'||touched)break;if(K.B.x>gx+30)break}
        if(K.score()[0]>s0){gk.g++;gk.n++}else if(touched)gk.n++}}
    const n=N,mins=tot.carryF/3600;return{aiGoals:+(tot.gThem/n).toFixed(2),yourGoals:+(tot.gUs/n).toFixed(2),tackledPerMin:+(tot.tackled/Math.max(.01,mins)).toFixed(1),secsPerTackle:+(tot.carryF/60/Math.max(1,tot.tackled)).toFixed(1),
      swarmedPct:+(tot.swarmF/Math.max(1,tot.carryF)*100).toFixed(1),passPct:Math.round(tot.pOk/Math.max(1,tot.pOk+tot.pLost)*100),slides:+(tot.sl/n).toFixed(1),keeperBeaten:Math.round(gk.g/Math.max(1,gk.n)*100),errs:K.errs()}},[N,gm,lv]);
  await pg.close();return r}
(async()=>{const b=await chromium.launch();const res={};
  const jobs=[];for(const gm of MODES)for(const lv of LEVELS)jobs.push([gm,lv]);
  // four at a time
  for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(async([gm,lv])=>{res[gm+'/'+lv]=await cell(b,gm,lv)}));
  await b.close();
  const cols=[['aiGoals','their goals'],['yourGoals','your goals'],['secsPerTackle','secs on ball per tackle'],['swarmedPct','swarmed %'],['passPct','your passes %'],['slides','their slides'],['keeperBeaten','keeper beaten %']];
  console.log('mode/level'.padEnd(20)+cols.map(c=>c[1].padStart(c[1].length+2)).join(''));
  for(const gm of MODES)for(const lv of LEVELS){const r=res[gm+'/'+lv];console.log((gm+'/'+lv).padEnd(20)+cols.map(c=>String(r[c[0]]).padStart(c[1].length+2)).join('')+(r.errs?'  ERRORS '+r.errs:''))}
  if(OUT)fs.writeFileSync(OUT,JSON.stringify(res,null,1));
  if(!CHECK)return;
  const T=JSON.parse(fs.readFileSync(path.join(__dirname,'difficulty-targets.json'),'utf8'));let fail=0;
  for(const r of Object.values(res))r.goalDiff=+(r.yourGoals-r.aiGoals).toFixed(2);
  const match=(pat,name)=>pat.split('/').every((x,i)=>x==='*'||x===name.split('/')[i]);
  for(const [cellName,rules] of Object.entries(T.cells||{})){for(const ck of Object.keys(res).filter(n=>match(cellName,n))){const r=res[ck];if(!r)continue;
    for(const [k,[op,v]] of Object.entries(rules)){const x=r[k],ok=op==='<='?x<=v:op==='>='?x>=v:op==='=='?x===v:true;if(!ok){fail++;console.log('FAIL',ck,k,x,op,v)}}}}
  // Chill, Medium and Hard must stay in order (easier levels: fewer of their goals, fewer slides)
  for(const gm of MODES){const L=LEVELS.slice(0,3).map(l=>res[gm+'/'+l]);
    for(const [k,dirn,slack] of T.order||[]){for(let i=0;i+1<L.length;i++){const a=L[i][k],b2=L[i+1][k];if(dirn==='up'?a>b2+slack:a<b2-slack){fail++;console.log('FAIL order',gm,k,LEVELS[i],a,LEVELS[i+1],b2)}}}}
  console.log(fail?`${fail} difficulty check(s) failed`:'all difficulty checks passed');process.exitCode=fail?1:0})();
