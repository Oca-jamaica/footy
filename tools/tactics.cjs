// In-match tactics test: whole offline matches with the casual-player bot from tools/difficulty.cjs, played with each
// tactic (switched with the T key at kick-off, as a player would). Measures what the tactic does to your AI team-mates:
// where your line sits when they have the ball, how often you win it back in their half, how close your nearest
// team-mate is when you have it, possession, and the goals both ways.
// Usage: node tools/tactics.cjs [matchesPerCell=6] [file=sunday-kickabout.html]   (env MODES=volta,classical  LEVEL=normal)
const {chromium}=require('playwright');const path=require('path');
const N=+process.argv[2]||6,FILE=process.argv[3]||'sunday-kickabout.html',MODES=(process.env.MODES||'volta,classical').split(','),LEVEL=process.env.LEVEL||'normal';
const TAC=['Normal','High Press','Haram Ball'];
async function cell(b,gm,tac){const pg=await b.newPage();
  await pg.addInitScript(sd=>{let a=sd*2654435761>>>0;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},MODES.indexOf(gm)*10+tac+5);
  await pg.goto('file://'+path.resolve(FILE));await pg.waitForTimeout(300);
  const r=await pg.evaluate(async([N,gm,tac,lv])=>{const K=window.__kick,c0=K.club();c0.mgr='Tester';c0.tut={done:true};for(const id of ['prof','tut']){const e=document.getElementById(id);if(e)e.hidden=true}
    const key=(c,d)=>window.dispatchEvent(new KeyboardEvent(d?'keydown':'keyup',{code:c}));const hold={};const set=(c,v)=>{if(!!hold[c]!==v){hold[c]=v;key(c,v)}};
    document.querySelector(`[data-lv=${lv}]`).click();if(gm==='volta')document.querySelector('[data-gm=volta]').click();else{document.querySelector('[data-gm=classical]').click();document.querySelector('[data-pitch=standard]').click()}
    {const f=document.querySelector('[data-d=friendly]');if(f)f.click()}
    const tot={gUs:0,gThem:0,lineSum:0,lineN:0,rec:0,recHigh:0,own0:0,own1:0,supSum:0,supN:0,tacSeen:-1};
    let sh0=0,xg0=0,far0=0;
    for(let m=0;m<N;m++){const a0={...K.dbg.aiStat()};document.querySelector('#go').click();let frames=0,shotT=0,prevTeam=-1,tacSet=false;
      while(K.state()!=='fulltime'&&frames<26000){frames++;const st=K.state(),S=K.sim(),B=K.B,c=S.ctrl;
        if(st==='goal'||st==='replay'||st==='concede'){set('KeyD',false);set('KeyA',false);set('KeyW',false);set('KeyS',false);if(frames%40===0){key('Space',true);key('Space',false)}K.update(1);continue}
        if(st==='pens'){if(frames%30===0){key('Space',true);key('Space',false)}K.update(1);continue}
        if(st!=='play'){K.update(1);continue}
        // the tactic, chosen with T like a player would
        if(!tacSet){for(let i=0;i<tac;i++){key('KeyT',true);key('KeyT',false)}tacSet=true;tot.tacSeen=K.dbg.liveTac()[0]}
        const ps=K.players(),W=S.FX1-S.FX0,own=B.owner;
        if(own&&!own.keeper){if(own.team===0)tot.own0++;else tot.own1++}
        // your line (AI team-mates, not you) while they have the ball: how far up from your goal, 0 to 1
        if(own&&own.team===1&&!own.keeper){for(const p of ps)if(p.team===0&&!p.keeper&&p!==c){tot.lineSum+=(p.x-S.FX0)/W;tot.lineN++}}
        // winning it back (from them to you), and where
        const tm=own?own.team:-1;if(tm===0&&prevTeam===1){tot.rec++;if(B.x>S.MIDX)tot.recHigh++}if(tm>=0)prevTeam=tm;
        // your nearest team-mate when you have it
        if(own&&own.team===0&&own===c){let d=1e9;for(const p of ps)if(p.team===0&&!p.keeper&&p!==c)d=Math.min(d,Math.hypot(p.x-c.x,p.y-c.y));tot.supSum+=d;tot.supN++}
        if(c){const mine=B.owner===c,gx=S.FX1;let tx,ty;
          if(mine){tx=gx;ty=S.MY+(c.y<S.MY?20:-20);const near=Math.hypot(gx-c.x,S.MY-c.y)<330,opp=ps.filter(p=>p.team===1&&!p.keeper&&Math.hypot(p.x-c.x,p.y-c.y)<55&&p.x>c.x);
            c._still=Math.hypot(c.vx,c.vy)<.2?(c._still||0)+1:0;if(near&&!shotT){shotT=40;key('Space',true)}else if((opp.length&&frames%25===0||c._still>45)&&!shotT){c._still=0;key('ShiftLeft',true);key('ShiftLeft',false)}}
          else{tx=B.x;ty=B.y;if(B.owner&&B.owner.team===1&&Math.hypot(B.x-c.x,B.y-c.y)<40&&frames%12===0){key('ShiftLeft',true);key('ShiftLeft',false)}}
          if(shotT){shotT--;if(shotT===0)key('Space',false)}
          set('KeyD',tx>c.x+8);set('KeyA',tx<c.x-8);set('KeyS',ty>c.y+8);set('KeyW',ty<c.y-8)}
        K.update(1)}
      const sc=K.score(),a1=K.dbg.aiStat();sh0+=a1.aiShots-a0.aiShots;xg0+=(a1.shXG||0)-(a0.shXG||0);far0+=(a1.shFar||0)-(a0.shFar||0);tot.gUs+=sc[0];tot.gThem+=sc[1];for(const k of ['KeyD','KeyA','KeyW','KeyS'])set(k,false);
      for(let i=0;i<200;i++)K.update(1);for(let i=0;i<40&&K.state()!=='menu';i++){key('Space',true);key('Space',false);K.update(1);await new Promise(r=>setTimeout(r,2))}
      document.getElementById('menu').hidden=false}
    return{tac:tot.tacSeen,yourGoals:+(tot.gUs/N).toFixed(2),theirGoals:+(tot.gThem/N).toFixed(2),line:+(tot.lineSum/Math.max(1,tot.lineN)).toFixed(3),
      winsBackPerMatch:+(tot.rec/N).toFixed(1),winsBackInTheirHalf:+(tot.recHigh/N).toFixed(1),possession:Math.round(tot.own0/Math.max(1,tot.own0+tot.own1)*100),nearestMate:Math.round(tot.supSum/Math.max(1,tot.supN)),theirShots:+(sh0/N).toFixed(1),theirXG:+(xg0/N).toFixed(2),theirLongShots:+(far0/N).toFixed(1),errs:K.errs()}},[N,gm,tac,LEVEL]);
  await pg.close();return r}
(async()=>{const b=await chromium.launch();const res={};const jobs=[];for(const gm of MODES)for(let tac=0;tac<3;tac++)jobs.push([gm,tac]);
  await Promise.all(jobs.map(async([gm,tac])=>{res[gm+'/'+tac]=await cell(b,gm,tac)}));await b.close();
  console.log(`${LEVEL}, ${N} matches each`);console.log('mode/tactic'.padEnd(24)+'your line*  wins back  in their half  possession  nearest mate px  your goals  their goals  their shots  their xG');
  for(const gm of MODES)for(let tac=0;tac<3;tac++){const r=res[gm+'/'+tac];
    console.log(`${gm}/${TAC[tac]}`.padEnd(24)+String(r.line).padStart(9)+String(r.winsBackPerMatch).padStart(11)+String(r.winsBackInTheirHalf).padStart(14)+String(r.possession+'%').padStart(12)+String(r.nearestMate).padStart(17)+String(r.yourGoals).padStart(12)+String(r.theirGoals).padStart(13)+String(r.theirShots).padStart(13)+String(r.theirXG).padStart(10)+(r.tac!==tac?'  TACTIC NOT SET ('+r.tac+')':'')+(r.errs?'  ERRORS':''))}
  console.log('* your AI team-mates\' average position while they have the ball: 0 = your goal line, 1 = theirs');
  if(process.env.JSON)require('fs').writeFileSync(process.env.JSON,JSON.stringify(res))})();
