// Goalkeeper test: placed shots at the opposition keeper from three set spots (the same spots and shooter as
// tools/difficulty.cjs, but many more shots), on every pitch and difficulty. Prints the share of on-target shots that
// beat him ("beaten %") and his save rate (100 - beaten).
// Usage: node tools/keepers.cjs [shotsPerSpot=100] [file=sunday-kickabout.html]   (env ONLY=volta/hard,classical/extreme; SEED=n for another set of random shots)
const {chromium}=require('playwright');const path=require('path');
const N=+process.argv[2]||100,FILE=process.argv[3]||'sunday-kickabout.html';
const MODES=['volta','classical','expanded'],LEVELS=['chill','normal','hard','extreme'];
async function cell(b,gm,lv){const pg=await b.newPage();
  await pg.addInitScript(sd=>{let a=sd*2654435761>>>0;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}},MODES.indexOf(gm)*10+LEVELS.indexOf(lv)+11+(+process.env.SEED||0)*1000);
  await pg.goto('file://'+path.resolve(FILE));await pg.waitForTimeout(300);
  const r=await pg.evaluate(([N,gm,lv])=>{const K=window.__kick,c0=K.club();c0.mgr='Tester';c0.tut={done:true};for(const id of ['prof','tut']){const e=document.getElementById(id);if(e)e.hidden=true}
    document.querySelector(`[data-lv=${lv}]`).click();if(gm==='volta')document.querySelector('[data-gm=volta]').click();else{document.querySelector('[data-gm=classical]').click();document.querySelector('[data-pitch='+(gm==='expanded'?'expanded':'standard')+']').click()}
    {const f=document.querySelector('[data-d=friendly]');if(f)f.click()}
    const out={};document.querySelector('#go').click();for(let i=0;i<300;i++)K.update(1);const S=K.sim(),gx=S.FX1,ps=K.players(),c=ps.find(p=>p.team===0&&!p.keeper),k=ps.find(p=>p.keeper&&p.team===1);
    for(const [dx,dy] of [[180,30],[260,70],[320,10]]){let g=0,n=0;for(let i=0;i<N;i++){K.dbg.forcePlay();K.setScore(0,0);K.setClock(100);
        for(const p of ps){p.vx=p.vy=0;p.anim=null;p.push=null;p.lunge=0;p.slide=false;p.aiSlide=0;p.aiLunge=0;p.windup=0;if(p!==c&&p!==k){p.stun=9999;p.x=S.MIDX-200;p.y=S.FY0+30}}
        k.diving=false;k.track=false;k.react=0;k.planY=null;k.sweep=null;k.stun=0;k.wide=false;k.x=gx-16;k.y=S.MY;const sy=i%2?1:-1;c.stun=0;c.x=gx-dx;c.y=S.MY+dy*sy;c.st.fin=.7;c.st.shot=.75;K.setCtrl(c);
        for(let f=0;f<45;f++){c.vx=c.vy=0;c.x=gx-dx;c.y=S.MY+dy*sy;if(K.B.owner!==c){Object.assign(K.B,{x:c.x+12,y:c.y,z:0,vx:0,vy:0,vz:0,owner:null,shot:null,pass:null,lobTo:null});K.dbg.give(c)}K.update(1)}
        const aim=(i%4<2)?S.GY0+18:S.GY1-18;c.dir=Math.atan2(aim-K.B.y,gx-K.B.x);const s0=K.score()[0];K.dbg.shoot(c,'normal',.8,aim);let touched=false;
        for(let f=0;f<150;f++){K.update(1);if(K.B.lockBy===k||K.B.owner===k)touched=true;if(K.score()[0]>s0||K.state()!=='play'||touched)break;if(K.B.x>gx+30)break}
        if(K.score()[0]>s0){g++;n++}else if(touched)n++}
      out[dx]={g,n}}
    const G=Object.values(out).reduce((a,x)=>a+x.g,0),T=Object.values(out).reduce((a,x)=>a+x.n,0);
    return{beaten:Math.round(G/Math.max(1,T)*1000)/10,onTarget:T,bySpot:Object.fromEntries(Object.entries(out).map(([d,x])=>[d,Math.round(x.g/Math.max(1,x.n)*100)])),errs:K.errs()}},[N,gm,lv]);
  await pg.close();return r}
(async()=>{const b=await chromium.launch();const ONLY=(process.env.ONLY||'').split(',').filter(Boolean),res={};
  const jobs=[];for(const gm of MODES)for(const lv of LEVELS)if(!ONLY.length||ONLY.includes(gm+'/'+lv))jobs.push([gm,lv]);
  for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(async([gm,lv])=>{res[gm+'/'+lv]=await cell(b,gm,lv)}));
  console.log('mode/level'.padEnd(20)+'beaten %   save %   on target   beaten % from 180 / 260 / 320 px');
  for(const k of Object.keys(res).sort((a,b)=>MODES.indexOf(a.split('/')[0])-MODES.indexOf(b.split('/')[0])||LEVELS.indexOf(a.split('/')[1])-LEVELS.indexOf(b.split('/')[1]))){const r=res[k];
    console.log(k.padEnd(20)+String(r.beaten).padStart(8)+String(Math.round((100-r.beaten)*10)/10).padStart(9)+String(r.onTarget).padStart(12)+'   '+Object.values(r.bySpot).join(' / ')+(r.errs?'  ERRORS':''))}
  if(process.env.JSON)require('fs').writeFileSync(process.env.JSON,JSON.stringify(res));await b.close()})();
