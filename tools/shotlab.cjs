// Shooting range: fires many shots from set spots at their keeper and reports how often they go in.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const LV=process.argv[2]||'normal';const b=await chromium.launch();const pg=await b.newPage();
  await pg.goto('file://'+path.resolve('sunday-kickabout.html'));await pg.waitForTimeout(400);await pg.click('#go');await pg.waitForTimeout(300);
  const r=await pg.evaluate((LV)=>{const K=window.__kick,D=K.dbg,S=K.sim(),B=K.B;D.setDF(LV);const out={};
    const shooter=K.players().find(p=>p.team===0&&!p.keeper);
    const trial=(d,off,aimOff,ch,type='normal',n=150,perf=false)=>{let g=0,sv=0,ms=0;for(let i=0;i<n;i++){K.setScore(0,0);K.setClock(150);D.forcePlay();
      for(const p of K.players()){if(p===shooter||p.keeper)continue;p.x=S.FX0+100;p.y=200;p.stun=9999;p.vx=p.vy=0}
      shooter.x=S.FX1-d;shooter.y=S.MY+off;D.give(shooter);B.x=shooter.x+10;B.y=shooter.y;B.z=0;B.vx=B.vy=B.vz=0;
      const k=D.keeperOf(1);k.x=S.FX1-16;k.y=S.MY;k.vx=k.vy=0;k.stun=0;k.hold=0;k.track=false;k.react=0;k.diving=false;
      for(let f=0;f<40;f++){shooter.x=S.FX1-d;shooter.y=S.MY+off;shooter.vx=shooter.vy=0;K.update(1)}// let the keeper settle into position
      shooter.x=S.FX1-d;shooter.y=S.MY+off;shooter.vx=shooter.vy=0;shooter.stun=0;D.give(shooter);B.x=shooter.x+10;B.y=shooter.y;
      for(let f=0;f<30;f++){shooter.x=S.FX1-d;shooter.y=S.MY+off;shooter.vx=shooter.vy=0;K.update(1)}
      const ty=S.MY+aimOff;shooter.dir=Math.atan2(ty-B.y,S.FX1-B.x);const sc=K.score()[0];shooter.perfectShot=perf;D.shoot(shooter,type,ch,ty);shooter.perfectShot=false;
      let res='miss';for(let f=0;f<120;f++){K.update(1);if(K.score()[0]>sc){res='goal';break}if(B.owner===k){res='save';break}if(K.state()!=='play')break;if(!B.shot&&f>3){res=B.owner===k?'save':'block';break}}
      if(i<3&&d===120&&aimOff===52&&ch===.55)(out._log=out._log||[]).push({res,st:K.state(),bx:Math.round(B.x),by:Math.round(B.y),shot:!!B.shot,own:B.owner?B.owner.team+(B.owner.keeper?'k':''):'-',sx:Math.round(shooter.x),kx:Math.round(k.x)});
      if(res==='goal')g++;else if(res==='save'||res==='block')sv++;else ms++}
      return `${Math.round(g/n*100)}% in · ${Math.round(sv/n*100)}% saved · ${Math.round(ms/n*100)}% off`};
    for(const d of [120,220,320,450])for(const [lab,a] of [['near corner',52],['far corner',-52],['centre',0]]){out[`${d} ${lab} soft`]=trial(d,30,a,.55);out[`${d} ${lab} full`]=trial(d,30,a,1);out[`${d} ${lab} PERFECT`]=trial(d,30,a,.86,'normal',150,true)}
    out['220 curler far']=trial(220,30,-52,.85,'curler');out['320 curler far']=trial(320,30,-52,.85,'curler');out['320 rocket far']=trial(320,30,-52,.85,'rocket');out['320 knuckle far']=trial(320,30,-52,.85,'knuckle');
    return out},LV);
  console.table(r._log);delete r._log;console.table(r);await b.close()})();
