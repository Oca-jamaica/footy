// Headless smoke test: loads the built game, plays a short match with scripted keys, screenshots, reports errors.
const {chromium}=require('playwright');const path=require('path');
(async()=>{
  const out=process.argv[2]||'.';
  const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1200,height:900}});
  const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|net::|Failed to load/.test(m.text()))errs.push(m.text())});
  await pg.goto('file://'+path.resolve('sunday-kickabout.html'));await pg.waitForTimeout(800);
  await pg.screenshot({path:out+'/menu.png'});
  await pg.click('#go');await pg.waitForTimeout(900);await pg.screenshot({path:out+'/intro.png'});await pg.keyboard.press('Space');await pg.waitForTimeout(600);
  await pg.keyboard.down('KeyD');await pg.waitForTimeout(1500);await pg.keyboard.down('Space');await pg.waitForTimeout(500);await pg.keyboard.up('Space');
  await pg.waitForTimeout(400);await pg.screenshot({path:out+'/play1.png'});await pg.keyboard.up('KeyD');
  for(let i=0;i<6;i++){await pg.keyboard.press(['ShiftLeft','KeyE','KeyR','Space'][i%4]);await pg.waitForTimeout(600)}
  await pg.screenshot({path:out+'/play2.png'});
  // force a goal and walk through celebration + replay
  await pg.evaluate(()=>{const k=window.__kick;k.B.shot={team:0,by:k.players()[0],fx:900,type:'normal'};k.goalFor(0)});
  await pg.waitForTimeout(1600);await pg.screenshot({path:out+'/goal.png'});
  await pg.waitForTimeout(3600);await pg.screenshot({path:out+'/replay.png'});
  await pg.evaluate(()=>window.__kick.setClock(0.02));await pg.waitForTimeout(2500);await pg.screenshot({path:out+'/end.png'});
  const r=await pg.evaluate(()=>({errs:window.__kick.errs(),last:window.__lastErr||null,state:window.__kick.state(),perf:window.__perf}));
  console.log(JSON.stringify({pageErrors:errs,...r,avgMs:(r.perf.u+r.perf.d)/r.perf.n}));
  await b.close();
})();
