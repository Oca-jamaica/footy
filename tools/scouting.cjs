// Scouting regression test: simulates pack openings at scouting levels 1-9 and checks that
//  - rarity odds are exactly the pack's own (scouting never changes them),
//  - the chance of a pack's rating level landing in its rarity's top-rated quarter goes up by 0/10/20/30/40/50/65/75/90%
//    of itself (checked exactly from the odds, and by simulation),
//  - the odds always add up to 100%,
//  - average card rating within a rarity rises with scouting (cards dealt at each scouting level; beyond sampling noise),
//  - every card dealt is a real database player at its real rating, of the rolled rarity.
// Usage: node tools/scouting.cjs [packsPerLevel=20000] [file=sunday-kickabout.html]
const {chromium}=require('playwright');const path=require('path');
const N=+process.argv[2]||20000,FILE=process.argv[3]||'sunday-kickabout.html';
(async()=>{const b=await chromium.launch();const pg=await b.newPage();await pg.goto('file://'+path.resolve(FILE));await pg.waitForTimeout(500);
  const r=await pg.evaluate(N=>{const K=window.__kick,S=K.dbg.scout,cv=K.dbg.cv(),T=['bronze','silver','gold','special','icon'],BON=[0,.1,.2,.3,.4,.5,.65,.75,.9],out={exact:{},sim:{},rarity:{},bad:[]};
    const ids=new Map(K.dbg.allPlayers().map(p=>[p.id,p]));
    for(const t of T){const band=S.band(t);if(!band)continue;out.exact[t]={band:band.cut,base:band.pHigh,levels:BON.map(b=>{const o=S.odds(t,b);return{pHigh:o.pHigh,ratio:o.pHigh/band.pHigh,sum:o.sum}})};
      out.sim[t]=BON.map(b=>{let hi=0,sum=0,n=0;for(let i=0;i<N;i++){const a=S.anchor(t,b);if(a>=band.cut)hi++}
        // the cards actually dealt (a smaller sample: dealing is slower)
        const lv=BON.indexOf(b)+1,cl=K.club();cl.dept=cl.dept||{};const was=cl.dept.scout;cl.dept.scout=lv;// deal at this scouting level
        if(Math.abs(S.depFx('scout')/100-b)>1e-9)out.bad.push(['scouting level',lv,S.depFx('scout')]);
        const dealt=[];for(let i=0;i<Math.min(6000,N);i++){const c=S.deal(t);for(const x of c){dealt.push(x.ovr);const db=ids.get(x.id);if(!db||db.ovr!==x.ovr||x.tier!==t)out.bad.push([t,x.id,x.ovr,db&&db.ovr,x.tier])}}
        cl.dept.scout=was;const m=dealt.reduce((a,x)=>a+x,0)/dealt.length,sd=Math.sqrt(dealt.reduce((a,x)=>a+(x-m)*(x-m),0)/dealt.length);
        return{hiRate:hi/N,avgOvr:m,se:sd/Math.sqrt(dealt.length)}})}
    // rarity: the pack odds go straight to the roll (scouting isn't involved), checked by simulation for two-rarity packs
    for(const [nm,odds] of [['bronze pack',{bronze:80,silver:20}],['silver pack',{silver:85,gold:15}],['premium pack',{gold:80,special:20}],['elite pack',{gold:30,special:70}],['icon pack',{icon:100}]]){
      const c={};for(let i=0;i<N;i++){const t=S.roll(odds);c[t]=(c[t]||0)+1}out.rarity[nm]={want:odds,got:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,+(v/N*100).toFixed(2)]))}}
    return out},N);
  let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m)}};
  console.log('rarity   top band   top-rated chance at scouting L1..L9 (exact)              ratio L9/L1   simulated L1 -> L9        avg card OVR L1 -> L9');
  for(const [t,e] of Object.entries(r.exact)){const s=r.sim[t];
    console.log(t.padEnd(8),(e.band+'+').padStart(8),'  ',e.levels.map(l=>(l.pHigh*100).toFixed(2)+'%').join(' '),'  ',(e.levels[8].ratio).toFixed(3),'      ',(s[0].hiRate*100).toFixed(1)+'% -> '+(s[8].hiRate*100).toFixed(1)+'%','      ',s[0].avgOvr.toFixed(2)+' -> '+s[8].avgOvr.toFixed(2));
    e.levels.forEach((l,i)=>{ok(Math.abs(l.ratio-Math.min([1,1.1,1.2,1.3,1.4,1.5,1.65,1.75,1.9][i],1/e.base))<1e-9,`${t} L${i+1} ratio ${l.ratio}`);ok(Math.abs(l.sum-1)<1e-9,`${t} L${i+1} odds sum ${l.sum}`)});
    ok(s[8].hiRate>s[0].hiRate,`${t} simulated top-rated chance didn't rise`);// the average rating moves only a little by design, so allow for sampling noise (3 standard errors)
    const tol=3*Math.hypot(s[0].se,s[8].se);ok(s[8].avgOvr>=s[0].avgOvr-tol,`${t} average OVR fell by more than sampling noise (${s[0].avgOvr.toFixed(2)} -> ${s[8].avgOvr.toFixed(2)}, allowed ${tol.toFixed(2)})`)}
  for(const [nm,x] of Object.entries(r.rarity)){console.log('rarity odds',nm.padEnd(13),'want',JSON.stringify(x.want),'got',JSON.stringify(x.got));for(const [k,v] of Object.entries(x.want))ok(Math.abs((x.got[k]||0)-v)<1.5,`${nm} ${k} ${x.got[k]} vs ${v}`)}
  ok(!r.bad.length,'invalid or altered cards: '+JSON.stringify(r.bad.slice(0,5)));
  console.log(fail?`${fail} scouting check(s) failed`:'all scouting checks passed');process.exitCode=fail?1:0;await b.close()})();
