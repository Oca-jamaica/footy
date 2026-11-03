// Simulates thousands of penalties inside the page to check the balance of the shoot-out.
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const pg=await b.newPage();
  await pg.goto('file://'+path.resolve('sunday-kickabout.html'));await pg.waitForTimeout(400);await pg.click('#go');await pg.waitForTimeout(300);
  const r=await pg.evaluate(()=>{const K=window.__kick;K.startPens();const A=K.penApi(),pen=A.pen;const out={};
    const run=(setup,act,n=400)=>{const c={goal:0,saved:0,miss:0};for(let i=0;i<n;i++){pen.kicks=[[],[]];pen.n=[0,0];setup();A.penSetup();act();
      for(let f=0;f<400&&pen.phase!=='result';f++)A.updatePens(1);c[pen.res==='goal'?'goal':pen.res==='saved'?'saved':'miss']++}
      return Object.fromEntries(Object.entries(c).map(([k,v])=>[k,Math.round(v/n*100)+'%']))};
    for(const lv of ['easy','normal','hard']){A.setDF(lv);
      const shoot=(x,z,p)=>()=>{pen.turn=0};
      const mine=(x,z,p)=>()=>{pen.aim={x,z};pen.calm=1;A.setCharge(p);A.penRelease()};
      out[lv+' you: perfect corner']=run(()=>{pen.turn=0},mine(3.1,.4,.86));
      out[lv+' you: perfect mid']=run(()=>{pen.turn=0},mine(2,.8,.86));
      out[lv+' you: ok power corner']=run(()=>{pen.turn=0},mine(3.1,.4,.7));
      out[lv+' you: ok power mid']=run(()=>{pen.turn=0},mine(2,.8,.7));
      out[lv+' you: centre']=run(()=>{pen.turn=0},mine(0,1,.75));
      out[lv+' you: panenka']=run(()=>{pen.turn=0},mine(0,1,.2));
      // in goal: stand still / react after strike to the right side / guess early
      out[lv+' keep: stand still']=run(()=>{pen.turn=1},()=>{});
      // keeper strategies need driving frame by frame
      const keep=(name,brain)=>{const c={goal:0,saved:0,miss:0},n=400;for(let i=0;i<n;i++){pen.kicks=[[],[]];pen.n=[0,0];pen.turn=1;A.penSetup();const m={};
        for(let f=0;f<500&&pen.phase!=='result';f++){A.updatePens(1);if(!pen.K.dive)brain(m)}c[pen.res==='goal'?'goal':pen.res==='saved'?'saved':'miss']++}
        out[lv+' keep: '+name]=Object.fromEntries(Object.entries(c).map(([k,v])=>[k,Math.round(v/n*100)+'%']))};
      keep('react 12f after strike',m=>{if(pen.phase==='fly'){m.f=(m.f||0)+1;if(m.f===12){const b=pen.ball;pen.glove={x:b.tx+(Math.random()-.5)*.6,z:b.tz+(Math.random()-.5)*.4};A.myDive()}}});
      keep('read hips, dive at strike',m=>{if(pen.phase==='kwait'&&pen.runK>.8)m.side=Math.sign(pen.run.lean);if(pen.phase==='fly'){pen.glove={x:(m.side||1)*2.2,z:.9};A.myDive()}});
      keep('guess side early',m=>{if(pen.phase==='kwait'&&pen.runK>.6){pen.glove={x:(Math.random()<.5?-1:1)*2.2,z:.9};A.myDive()}});
    }
    return out});
  console.table(r);await b.close()})();
