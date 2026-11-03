// Plays whole matches with a simple keyboard bot (in the page, no rendering) and reports what happened.
// Usage: node tools/autoplay.cjs [matches] [level]
const {chromium}=require('playwright');const path=require('path');
(async()=>{const N=+process.argv[2]||3,LV=process.argv[3]||'normal';const b=await chromium.launch();const res=[];for(let mm=0;mm<N;mm++){const pg=await b.newPage();
  await pg.goto('file://'+path.resolve('sunday-kickabout.html'));await pg.waitForTimeout(400);
  res.push(...await pg.evaluate(async([N,LV])=>{const K=window.__kick,out=[];
    const key=(c,down)=>window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code:c}));
    const hold={};const set=(c,v)=>{if(!!hold[c]!==v){hold[c]=v;key(c,v)}};
    document.querySelector(`[data-lv=${LV}]`).click();
    for(let m=0;m<N;m++){document.querySelector('#go').click();let shotT=0,frames=0;const tel={poss:[0,0],shotsThem:0,ownGoalsCons:0,ballZone:[0,0,0],goals:[]};let lastShot=null,lastSc='0-0';
      while(K.state()!=='fulltime'&&frames<20000){frames++;const st=K.state(),S=K.sim(),B=K.B,c=S.ctrl;
        {const sc=K.score().join('-');if(sc!==lastSc){lastSc=sc;const sh=lastShot||{};const kp=K.players().find(p=>p.keeper&&p.team!==(sh.team??0));tel.goals.push({by:sh.team,type:sh.type,dist:Math.round(Math.abs((sh.team?S.FX0:S.FX1)-(sh.fx||0))),ch:+(sh.ch||0).toFixed(2),kdiv:!!(kp&&kp.diving),kstun:kp?Math.round(kp.stun):0})}}
        if(st==='goal'||st==='replay'||st==='concede'){set('KeyD',false);set('KeyW',false);set('KeyS',false);if(frames%40===0){key('Space',true);key('Space',false)}K.update(1);continue}
        if(st==='pens'){if(frames%30===0){key('Space',true);key('Space',false)}K.update(1);continue}
        if(st!=='play'){K.update(1);continue}
        if(B.owner)tel.poss[B.owner.team]++;tel.ballZone[B.x<S.FX0+380?0:B.x>S.FX1-380?2:1]++;
        if(B.shot&&B.shot!==lastShot){lastShot=B.shot;if(B.shot.team===1)tel.shotsThem++}
        if(c){const own=B.owner===c,gx=S.FX1;let tx,ty;
          if(own){tx=gx;ty=S.MY+(c.y<S.MY?20:-20);
            const near=Math.hypot(gx-c.x,S.MY-c.y)<330;
            const opp=K.players().filter(p=>p.team===1&&!p.keeper&&Math.hypot(p.x-c.x,p.y-c.y)<55&&p.x>c.x);
            if(near&&!shotT){shotT=40;key('Space',true)}
            else if(opp.length&&frames%25===0&&!shotT){key('ShiftLeft',true);key('ShiftLeft',false)}}
          else{tx=B.x;ty=B.y;if(B.owner&&B.owner.team===1&&Math.hypot(B.x-c.x,B.y-c.y)<40&&frames%12===0){key('ShiftLeft',true);key('ShiftLeft',false)}}
          if(shotT){shotT--;if(shotT===0)key('Space',false)}
          set('KeyD',tx>c.x+8);set('KeyA',tx<c.x-8);set('KeyS',ty>c.y+8);set('KeyW',ty<c.y-8)}
        K.update(1)}
      const s=K.stats(),sc=K.score();out.push({score:sc.join('-'),shots:s.shots,onT:s.on,shotsThem:tel.shotsThem,tackles:s.tackles,passes:s.passes,skills:s.skills,possUs:Math.round(tel.poss[0]/(tel.poss[0]+tel.poss[1])*100)+'%',
        goals:tel.goals,zone:tel.ballZone.map(v=>Math.round(v/(tel.ballZone[0]+tel.ballZone[1]+tel.ballZone[2])*100)).join('/'),frames});
      for(let i=0;i<200;i++)K.update(1);key('Space',true);key('Space',false);await new Promise(r=>setTimeout(r,50));
      if(K.state()==='fulltime'){key('Space',true);key('Space',false)}document.querySelector('#menu').hidden=false;while(K.state()!=='menu'){key('Space',true);key('Space',false);K.update(1);await new Promise(r=>setTimeout(r,5))}}
    return out},[1,LV]));await pg.close()}
  console.table(res.map(r=>({...r,goals:undefined})));for(const r of res)console.table(r.goals);await b.close()})();
