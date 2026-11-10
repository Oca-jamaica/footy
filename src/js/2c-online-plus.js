/* ===================== Online: Ranked, Friendly, club directory, help and tutorial =====================
   Ranked and Friendly find an opponent automatically through the same public relays the online mode already uses
   (no server of our own), then play through the existing, tested Host / Join machinery: one laptop hosts a room with a
   fresh code, the other joins it, and the usual readiness checks run before kick-off.

   What a game file can and can't do: there is no server here, so ratings and the club directory live on each player's
   laptop and on public relays (published as retained messages). The game checks what it reads (sizes, ranges, that a
   rank matches its points) and never lets anyone change another club, but it cannot stop a determined cheat from
   publishing a fake profile or editing their own save. A secure, cheat-proof ladder needs a real backend (see README). */

// ---------- ranks ----------
const RANKS=[{n:'Bronze',rp:0,c:'#cd7f32',c2:'#7a4a1c'},{n:'Silver',rp:300,c:'#d7dde3',c2:'#7d8792'},{n:'Gold',rp:700,c:'#f6cd4f',c2:'#a2761a'},
  {n:'Platinum',rp:1100,c:'#8ff0f5',c2:'#2b8f9c'},{n:'Diamond',rp:1500,c:'#5d9cff',c2:'#1d3fb3'},{n:'Champion',rp:1900,c:'#b57bff',c2:'#5a2aa8'},{n:'Legendary',rp:2300,c:'#ffd24a',c2:'#d2321e'}];
const PLACE_N=10,MMR0=1000;
const rankIx=rp=>{let i=0;for(let k=0;k<RANKS.length;k++)if(rp>=RANKS[k].rp)i=k;return i};
const famOf=fmt=>fmt==='volta'?'volta':'classical';// Standard and Expanded share the Classical ladder
const seasonId=()=>{const d=new Date();return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')};
const seasonLeft=()=>{const d=new Date(),e=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);return Math.max(0,Math.ceil((e-Date.now())/864e5))};
const PROMO=[null,{coins:1000},{coins:2000,cos:'badge_gold'},{coins:3500,pack:'gold'},{coins:5000,pack:'premium'},{coins:8000,pack:'elite'},{coins:12000,pack:'icon'}];
const SEASONREW=[{coins:500},{coins:1000},{coins:2000},{coins:3500,pack:'gold'},{coins:5000,pack:'premium'},{coins:8000,pack:'elite'},{coins:12000,pack:'elite',tt:10}];
function rkState(){const R=club.rk=club.rk||{};R.fam=R.fam||{};for(const f of ['volta','classical'])R.fam[f]=R.fam[f]||{mmr:MMR0,rp:0,pl:0,placed:false,w:0,d:0,l:0,best:-1,promo:{}};
  R.done=R.done||[];R.badges=R.badges||[];R.fr=R.fr||{day:'',n:0};
  // a new season: rewards for the best rank reached last season, then points come part of the way back towards the middle
  const s=seasonId();if(!R.season)R.season=s;
  if(R.season!==s){const got=[];for(const f of ['volta','classical']){const F=R.fam[f];if(F.placed&&F.best>=0){got.push(`${f==='volta'?'Volta':'Classical'} ${RANKS[F.best].n}: `+grant(SEASONREW[F.best]))}
      if(F.placed){F.rp=Math.round(F.rp*.6+300*.4);F.best=rankIx(F.rp);F.promo={}}}
    R.lastSeason={id:R.season,got};R.season=s;saveClub()}
  return R}
// Elo: the expected score from the two ratings, so beating a stronger opponent is worth more than beating a weaker one
const eloE=(a,b)=>1/(1+Math.pow(10,(b-a)/400));
function rankedResult(fam,S,oppMmr,key){const R=rkState(),F=R.fam[fam];if(R.done.includes(key))return null;R.done.push(key);if(R.done.length>80)R.done.shift();
  const E=eloE(F.mmr,oppMmr),K=F.placed?28:44;F.mmr=Math.round(F.mmr+K*(S-E));
  if(S===1)F.w++;else if(S===0)F.l++;else F.d++;
  const out={fam,S,before:{rp:F.rp,ix:F.placed?rankIx(F.rp):-1,pl:F.pl}};
  if(!F.placed){F.pl=Math.min(PLACE_N,F.pl+1);
    if(F.pl>=PLACE_N){F.placed=true;F.rp=clamp(Math.round((F.mmr-820)*2.4),0,2100);out.reveal=true}}// placement decides the starting rank
  else{const d=Math.round(34*(S-E))+(S===1?4:S===0?-2:0);F.rp=Math.max(0,F.rp+d);out.delta=d}
  if(F.placed){const ix=rankIx(F.rp);out.ix=ix;if(ix>F.best){F.best=ix}
    // first time reaching a rank this season: a promotion reward (and a badge for your club)
    for(let k=1;k<=ix;k++)if(!F.promo[k]){F.promo[k]=1;const r=PROMO[k];out.promo=(out.promo?out.promo+' · ':'')+RANKS[k].n+': '+grant(r);if(!R.badges.includes('rank'+k))R.badges.push('rank'+k)}}
  saveClub();return out}

// ---------- the badge ----------
function rankBadgeHTML(ix,size=64,label=true){if(ix<0)return `<span class="rkb un" style="--s:${size}px"><i>?</i></span>`;const r=RANKS[ix];
  return `<span class="rkb ${ix===6?'leg':''}" style="--s:${size}px;--c:${r.c};--c2:${r.c2}"><i>${'★'.repeat(Math.min(3,1+(ix>3?2:ix>1?1:0)))}</i>${label?`<b>${r.n.toUpperCase()}</b>`:''}</span>`}
// the placement ring: grey with UNRANKED in the middle; each placement match fills exactly a tenth in glowing cyan
let ringShown={};
function placeRingHTML(fam){const F=rkState().fam[fam],n=F.placed?PLACE_N:F.pl,from=ringShown[fam]??n,C=2*Math.PI*54;
  const off=k=>(C*(1-k/PLACE_N)).toFixed(1);
  return `<div class="pring" data-fam="${fam}" data-from="${from}" data-to="${n}"><svg viewBox="0 0 128 128" width="150" height="150"><circle cx="64" cy="64" r="54" class="pr-bg"/>
    <circle cx="64" cy="64" r="54" class="pr-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off(from)}" data-off="${off(n)}"/></svg>
    <div class="pr-in">${F.placed?rankBadgeHTML(rankIx(F.rp),58,false)+`<b style="color:${RANKS[rankIx(F.rp)].c}">${RANKS[rankIx(F.rp)].n.toUpperCase()}</b>`:'<b>UNRANKED</b>'}</div></div>
    <p class="pr-lab">${F.placed?`${F.rp.toLocaleString()} RP`:`Placement Matches: ${F.pl}/${PLACE_N}`}</p>`}
function animateRings(){document.querySelectorAll('.pring').forEach(el=>{const fg=el.querySelector('.pr-fg');if(!fg)return;requestAnimationFrame(()=>requestAnimationFrame(()=>{fg.style.strokeDashoffset=fg.dataset.off}));ringShown[el.dataset.fam]=+el.dataset.to})}

// ---------- the Online screen ----------
let olMode='ranked',lbTab='clubs',lbSort='rp',lbFam='volta';
function renderOnlinePlus(){const el=$('ol-plus');if(!el)return;const R=rkState(),fmt=NETMODES[club.netMode]?club.netMode:'volta',fam=famOf(fmt);
  const card=(k,t,s,ic)=>`<button class="olm" data-olm="${k}" aria-pressed="${olMode===k}"><span class="olic">${ic}</span><b>${t}</b><small>${s}</small></button>`;
  let body='';
  if(olMode==='ranked'){const F=R.fam[fam],ix=F.placed?rankIx(F.rp):-1,nx=ix>=0&&ix<6?RANKS[ix+1]:null;
    body=`<div class="olpanel rk"><div class="rkleft">${placeRingHTML(fam)}</div><div class="rkright">
      <h3>${fam==='volta'?'Volta':'Classical'} Ranked · Season ${R.season}</h3>
      <p>${F.placed?`${RANKS[ix].n} · ${F.rp.toLocaleString()} RP${nx?` · ${(nx.rp-F.rp).toLocaleString()} RP to ${nx.n}`:' · the top rank'}`:`Play ${PLACE_N-F.pl} more placement match${PLACE_N-F.pl===1?'':'es'} to get your rank.`}</p>
      <p class="hint">Record: ${F.w} won · ${F.d} drawn · ${F.l} lost · season ends in ${seasonLeft()} day${seasonLeft()===1?'':'s'}. Ranked is only ever against a real person. Wins earn RP and losses cost RP, more for beating a stronger player. Volta and Classical have separate ranks (Standard and Expanded share the Classical rank).</p>
      <div class="rkladder">${RANKS.map((r,i)=>`<span class="rkst ${i===ix?'on':''}" title="${r.n}: ${r.rp} RP">${rankBadgeHTML(i,30,false)}<small>${r.n}</small></span>`).join('')}</div>
      <button class="go" data-mm="ranked">Find Ranked match</button></div></div>`}
  else if(olMode==='friendly'){body=`<div class="olpanel"><h3>Friendly</h3><p>Play a real person straight away: you're paired with someone else who chose Friendly with the same match type. No RP, no effect on placements.</p>
      <p class="hint">Coins as for any online match. The first 8 friendlies each day pay full coins, later ones a quarter (so rewards can't be farmed).</p><button class="go" data-mm="friendly">Find Friendly match</button></div>`}
  el.innerHTML=`${opsOnlineTop()}<div class="olmodes">${card('ranked','Ranked','Climb the ranks','🏆')}${card('friendly','Friendly','Find an opponent','🤝')}${card('host','Host / Join','Private matches','🔑')}</div>
    <div class="olfmt"><span class="lab">MATCH</span>${Object.entries(NETMODES).map(([k,n])=>`<button data-nm="${k}" aria-pressed="${fmt===k}">${n}</button>`).join('')}</div>${body}
    ${mm.on?`<div class="mmsearch"><div class="mmspin"></div><div><b>Searching for ${mm.kind==='ranked'?'a Ranked':'a Friendly'} opponent…</b><p class="hint" id="mm-info">${mmInfo()}</p></div><button class="ghost" data-mmcancel="1">Cancel</button></div>`:''}
    ${opsOnlineHTML()}
    ${R.lastSeason&&R.lastSeason.got&&R.lastSeason.got.length?`<p class="flash">Season ${R.lastSeason.id} rewards: ${esc(R.lastSeason.got.join(' · '))}</p>`:''}`;
  $('ol-host').hidden=olMode!=='host';animateRings();renderBoards()}
document.addEventListener('click',e=>{const t=e.target.closest('#ol-plus [data-olm],#ol-plus [data-mm],#ol-plus [data-mmcancel],#ol-plus [data-nm]');if(!t)return;const d=t.dataset;
  if(d.olm){olMode=d.olm;renderOnlinePlus()}
  else if(d.nm){if(mm.on||NET.on)return;club.netMode=d.nm;saveClub();renderNetModes();renderOnlinePlus()}
  else if(d.mm)mmStart(d.mm);else if(d.mmcancel)mmStop('Search cancelled.')});

// ---------- matchmaking over the public relays ----------
/* Everyone searching publishes a small "I'm looking" message every second on the queue for their exact match type
   (Ranked or Friendly, and Volta / Classical Standard / Classical Expanded), so a Friendly is never paired with a Ranked
   search and both always play the same pitch. Ranked looks for a similar rating first and widens the range the longer
   it waits. The searcher with the lower id offers a match with a fresh room code; the other accepts; then one hosts
   and one joins through the normal online code, with all its readiness checks. Nobody is ever given an AI opponent. */
const mm=window.__mm={on:false,kind:'',fmt:'',id:'',t0:0,seen:new Map(),offer:null,timer:null,cl:[]};
let netKind='private',netMM=null;
const mmTopic=()=>`sundaykickabout/mm${NETPV}/${mm.kind}-${mm.fmt}`;
function mmWindow(){const s=(performance.now()-mm.t0)/1000;return mm.kind==='ranked'?Math.round(Math.min(800,90+18*s)):99999}
function mmInfo(){if(!mm.on)return'';const s=Math.round((performance.now()-mm.t0)/1000),n=[...mm.seen.values()].filter(x=>performance.now()-x.at<3000).length;
  // can't reach any relay: say so plainly (it keeps retrying in the background)
  if(!mm.cl.some(c=>c.connected)&&(s>=12||navigator.onLine===false))return `${NETMODES[mm.fmt]} · ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} · ⚠ ${NET_DOWN}`;
  return `${NETMODES[mm.fmt]} · ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} · ${mm.cl.filter(c=>c.connected).length?'connected to matchmaking':'connecting to matchmaking…'}${mm.kind==='ranked'?` · rating range ±${mmWindow()}`:''} · ${n} other${n===1?'':'s'} searching${mm.offer?' · opponent found, connecting…':''}`}
async function mmConnect(){if(mm.cl.length)return;const M=await loadMqtt();if(!M){netStatus('Matchmaking needs the internet (the relay library didn’t load).',true);return}
  for(const u0 of RELAYS()){const U=typeof u0==='string'?{url:u0}:u0;let c;try{c=M.connect(U.url,{clientId:'skmm_'+Math.random().toString(36).slice(2,10),keepalive:20,connectTimeout:8000,reconnectPeriod:3000,clean:true,...(U.username?{username:U.username,password:U.password}:{})})}catch(e){continue}
    c.on('connect',()=>{c.subscribe([mmTopic()+'/q/+',mmTopic()+'/o/'+mm.id],{qos:0});mmSubbed(c)});c.on('message',(tp,buf)=>{try{mmMsg(tp,JSON.parse(new TextDecoder().decode(buf)))}catch(e){}});c.on('error',()=>{});mm.cl.push(c)}}
const mmSubbed=c=>{c.__topic=mmTopic()};
function mmPub(sub,obj){const s=JSON.stringify(obj);for(const c of mm.cl)if(c.connected)try{c.publish(mmTopic()+sub,s,{qos:0})}catch(e){}}
function mmMsg(tp,d){if(!mm.on||!d||typeof d!=='object')return;const parts=tp.split('/'),kind=parts[parts.length-2];
  if(opsHidden(d.rg))return;// a suspended club (the developer's signed list) isn't matched
  if(kind==='q'){const id=String(d.id||'');if(!/^[a-z0-9]{8,16}$/.test(id)||id===mm.id||+d.pv!==NETPV)return;mm.seen.set(id,{id,r:clamp(+d.r||MMR0,0,4000),n:String(d.n||'').slice(0,16),mg:nameOk(String(d.mg||'')),at:performance.now(),busy:!!d.busy})}
  else if(kind==='o'){const from=String(d.from||'');if(!/^[a-z0-9]{8,16}$/.test(from))return;
    if(d.acc){if(mm.offer&&mm.offer.to===from&&d.code===mm.offer.code)mmGo('host',mm.offer)}// they accepted our offer
    else if(!mm.offer&&from<mm.id&&typeof d.code==='string'&&/^[A-Z]{6}$/.test(d.code)){const ok=mm.kind!=='ranked'||Math.abs(clamp(+d.r||MMR0,0,4000)-mmRating())<=mmWindow()+60;
      if(ok){const o={to:from,code:d.code,r:clamp(+d.r||MMR0,0,4000),n:String(d.n||'').slice(0,16),mg:nameOk(String(d.mg||''))},acc={from:mm.id,acc:1,code:d.code,r:mmRating(),n:club.name,mg:club.mgr||'',rg:club.reg&&club.reg.id||''};
        // say yes a few times (messages can be lost), keeping the matchmaking connection open a moment so they actually go
        mmPub('/o/'+from,acc);const pub=mm.cl.slice(),tp=mmTopic()+'/o/'+from;for(const ms of [400,900,1500])setTimeout(()=>{for(const c of pub)if(c.connected)try{c.publish(tp,JSON.stringify(acc),{qos:0})}catch(e){}},ms);mmGo('guest',o)}}}}
const mmRating=()=>rkState().fam[famOf(mm.fmt)].mmr;
function mmTick(){if(!mm.on)return;const now=performance.now();for(const [k,v] of mm.seen)if(now-v.at>4000)mm.seen.delete(k);
  mmPub('/q/'+mm.id,{id:mm.id,r:mmRating(),n:(club.name||'Club').slice(0,16),mg:club.mgr||'',pv:NETPV,busy:!!mm.offer,rg:club.reg&&club.reg.id||''});
  if(mm.offer&&now-mm.offer.at>4000)mm.offer=null;// no answer: try someone else
  if(!mm.offer){const W=mmWindow(),me=mmRating();let best=null;for(const v of mm.seen.values()){if(v.busy||v.id<mm.id)continue;const d=Math.abs(v.r-me);if(d<=W&&(!best||d<Math.abs(best.r-me)))best=v}
    // the lower id makes the offer, with a fresh 6-letter room code
    if(best){const code=Array.from({length:6},()=>'ABCDEFGHJKMNPQRSTUVWXYZ'[(Math.random()*23)|0]).join('');mm.offer={to:best.id,code,r:best.r,n:best.n,mg:best.mg,at:now};mmPub('/o/'+best.id,{from:mm.id,code,r:me,n:club.name,mg:club.mgr||'',rg:club.reg&&club.reg.id||''})}}
  const i=$('mm-info');if(i)i.textContent=mmInfo()}
async function mmStart(kind){if(mm.on||NET.on)return;{const ob=opsBlock();if(ob){toast(ob);netStatus(ob,true);renderOnlinePlus();return}}if(nroom)await netLeave();initAudio();
  mm.on=true;mm.kind=kind;mm.fmt=NETMODES[club.netMode]?club.netMode:'volta';mm.id=Math.random().toString(36).slice(2,12).padEnd(10,'0');mm.t0=performance.now();mm.seen.clear();mm.offer=null;
  netLogAdd('searching '+kind+' '+mm.fmt);renderOnlinePlus();await mmConnect();for(const c of mm.cl)if(c.connected){c.subscribe([mmTopic()+'/q/+',mmTopic()+'/o/'+mm.id],{qos:0})}
  clearInterval(mm.timer);mm.timer=setInterval(mmTick,1000);mmTick()}
function mmStop(msg){if(!mm.on&&!mm.cl.length)return;clearInterval(mm.timer);mm.on=false;mm.offer=null;
  const cl=mm.cl;mm.cl=[];setTimeout(()=>{for(const c of cl)try{c.end(false)}catch(e){}},2500);if(msg)netStatus(msg);renderOnlinePlus()}
// paired: one hosts, one joins, through the normal online code
async function mmGo(role,o){const kind=mm.kind,fmt=mm.fmt;mmStop('');netKind=kind;netMM={role,code:o.code,oppId:o.to,oppMmr:o.r,oppName:o.n,fam:famOf(fmt),fmt,at:performance.now(),started:false};
  club.netMode=fmt;renderNetModes();netStatus(`Opponent found: ${o.n||'a player'}${o.mg?' ('+o.mg+')':''}. Connecting…`);netLogAdd('paired as '+role+' with '+o.n);
  await netJoin(o.code,role);
  // if they never turn up, go back to searching rather than wait forever
  setTimeout(()=>{if(netMM&&netMM.code===o.code&&!netMM.started&&!NET.on){netLeave();netKind='private';const k=netMM.fmt;netMM=null;club.netMode=k;netStatus('The opponent didn’t connect. Searching again…');mmStart(kind)}},25000)}
// host side of a matched game: kick off as soon as the right opponent is in the room (the usual readiness checks follow)
function mmHostAuto(g){if(!netMM||netMM.role!=='host'||netMM.started||!g||+g.presence.pv!==NETPV)return;netMM.started=true;netLogAdd('opponent in the room: kick-off');netStart()}
function mmGuestBegan(){if(netMM)netMM.started=true}
// full time in a Ranked or Friendly match (both laptops run this with the same final score)
function onlineResult(){if(netKind==='private'||!netMM)return;const S=score[0]>score[1]?1:score[0]<score[1]?0:.5,key=netKind+':'+netMatchKey();
  if(netKind==='ranked'){const r=rankedResult(netMM.fam,S,netMM.oppMmr,key);if(r){netMM.result=r;const F=rkState().fam[netMM.fam];
      earnNote+=r.reveal?` · placement complete: ${RANKS[rankIx(F.rp)].n}`:F.placed?` · ${r.delta>=0?'+':''}${r.delta} RP (${F.rp} RP, ${RANKS[rankIx(F.rp)].n})`:` · placement ${F.pl}/${PLACE_N}`;if(r.promo)earnNote+=' · promoted: '+r.promo}}
  else{const R=rkState(),day=new Date().toISOString().slice(0,10);if(R.fr.day!==day){R.fr.day=day;R.fr.n=0}R.fr.n++;
    if(R.fr.n>8){const cut=Math.round(earned*.75);club.coins-=cut;earned-=cut;earnNote+=' · friendly coins ×0.25 after 8 today'}}
  regPublishSoon()}
const netMatchKey=()=>(NET.host?netMatch:netGotMatch)+'-'+(netMM?netMM.code:'');
// leaving a Ranked match early counts as a loss, so nobody can dodge a defeat by quitting
function onlineLeft(){if(netKind==='ranked'&&netMM&&(netMM.started||NET.on)&&!netMM.result&&state!=='fulltime'){const r=rankedResult(netMM.fam,0,netMM.oppMmr,'ranked:'+netMatchKey());if(r)toast('Left a Ranked match: it counts as a loss.')}
  netKind='private';netMM=null}

// ---------- club directory (both leaderboards and View Squad) ----------
/* Registering gives your club a random public id and publishes a public profile: name, badge, kit, team ratings,
   ranks and records, and your two line-ups (names, positions, ratings, rarities, specials). Nothing personal. It is
   re-published after every online match and when your team changes, as a retained message on the public relays, so
   anyone who opens the leaderboard sees the latest copy. Profiles that don't look right are ignored. */
const REG='sundaykickabout/clubs2/p/';// a fresh board for the release (clubs1 was the test versions')
function regProfile(){const R=rkState(),g0=GM;const lin=(cl)=>{GM=cl?'classical':'volta';const q=sq(),f=FORMS[q.f];const ps=q.s.map((id,i)=>{const p=byId(id);return p?[String(p.name).slice(0,16),f[i]?f[i].r:natPos(p),effOvr(p),tier(p),SPECIALS[p.sp]?SPECIALS[p.sp].name:'',ablOf(p.id),lvlOf(p.id)]:null}).filter(Boolean);const r=teamRating(q);return{f:q.f,r,p:ps}};
  let v,c;try{v=lin(false);c=lin(true)}finally{GM=g0}
  const fam=f=>{const F=R.fam[f];return{rp:F.placed?F.rp:0,pl:F.pl,pd:F.placed?1:0,ix:F.placed?rankIx(F.rp):-1,w:F.w,d:F.d,l:F.l}};
  return{v:1,id:club.reg.id,n:String(club.name||'My Club').slice(0,20),mg:String(club.mgr||'').slice(0,16),b:String(club.badge||'⚽').slice(0,4),k:club.kit,t:Date.now(),pl:club.played||0,rk:{volta:fam('volta'),classical:fam('classical')},sq:{volta:v,classical:c}}}
let regCl=[],regTimer=null,regBoard=new Map(),regLoading=false;
async function regConnect(){if(regCl.length)return regCl;const M=await loadMqtt();if(!M)return[];
  for(const u0 of RELAYS()){const U=typeof u0==='string'?{url:u0}:u0;let c;try{c=M.connect(U.url,{clientId:'skreg_'+Math.random().toString(36).slice(2,10),keepalive:30,connectTimeout:8000,reconnectPeriod:5000,clean:true,...(U.username?{username:U.username,password:U.password}:{})})}catch(e){continue}
    c.on('message',(tp,buf)=>{if(tp.startsWith(ACCT_T)||tp.startsWith(ACCT_T2)){acctMsg(tp,buf);return}if(tp===OPS_CTL){opsCtl(buf);return}try{regIn(JSON.parse(new TextDecoder().decode(buf)))}catch(e){}});c.on('connect',()=>c.subscribe(ops.on?[REG+'+',OPS_CTL]:REG+'+',{qos:0}));c.on('error',()=>{});regCl.push(c)}return regCl}
// only well-formed, believable profiles get onto the board
function regIn(d){if(!d||d.v!==1||!/^[a-z0-9]{10,16}$/.test(String(d.id)))return;const num=(x,a,b)=>Number.isFinite(+x)?clamp(+x,a,b):a;
  const fam=f=>{const r=d.rk&&d.rk[f]||{};const rp=num(r.rp,0,5000),pd=r.pd?1:0;return{rp:pd?rp:0,pl:num(r.pl,0,10),pd,ix:pd?rankIx(rp):-1,w:num(r.w,0,1e5)|0,d:num(r.d,0,1e5)|0,l:num(r.l,0,1e5)|0}};
  const lin=s=>{if(!s||!Array.isArray(s.p))return{f:'',r:0,p:[]};return{f:String(s.f||'').slice(0,8),r:num(s.r,0,130)|0,p:s.p.slice(0,9).filter(Array.isArray).map(x=>[String(x[0]||'').slice(0,16),String(x[1]||'').slice(0,4),num(x[2],1,130)|0,['bronze','silver','gold','special','icon'].includes(x[3])?x[3]:'bronze',String(x[4]||'').slice(0,16),num(x[5],1,10)|0,num(x[6],0,8)|0])}};
  const p={id:String(d.id),n:String(d.n||'Club').slice(0,20),mg:nameOk(String(d.mg||'')),b:String(d.b||'⚽').slice(0,4),k:/^#[0-9a-f]{6}$/i.test(d.k)?d.k:'#888888',t:num(d.t,0,9e15),pl:num(d.pl,0,1e6)|0,rk:{volta:fam('volta'),classical:fam('classical')},sq:{volta:lin(d.sq&&d.sq.volta),classical:lin(d.sq&&d.sq.classical)}};
  const old=regBoard.get(p.id);if(!old||p.t>=old.t)regBoard.set(p.id,p);if(!regLoading)renderBoards()}
async function regPublish(){if(!club.reg)return;const cl=await regConnect(),s=JSON.stringify(regProfile());
  for(const c of cl){const go=()=>{try{c.publish(REG+club.reg.id,s,{qos:0,retain:true})}catch(e){}};if(c.connected)go();else c.once('connect',go)}}
function regPublishSoon(){clearTimeout(regTimer);regTimer=setTimeout(regPublish,1500)}
async function regLoad(){regLoading=true;renderBoards();await regConnect();setTimeout(()=>{regLoading=false;renderBoards()},2500)}
// Every club is on the leaderboard automatically: it gets a random public id the first time the game opens, and its
// public profile is published then and again whenever anything on it changes (name, badge, line-ups, ratings, ranks).
function regEnsure(){if(!club.reg){const r=crypto.getRandomValues(new Uint8Array(12));club.reg={id:Array.from(r,x=>'abcdefghjkmnpqrstuvwxyz23456789'[x%31]).join(''),at:Date.now()};saveClub()}}
let regKey='',regLoadedAt=0;
function regAuto(){regEnsure();const p=regProfile();delete p.t;const k=JSON.stringify(p);if(k!==regKey){regKey=k;regPublish()}}
function regBoot(){regEnsure();setTimeout(regAuto,2500);setInterval(regAuto,20000)}
// opening the Leaderboard tab fetches the latest board (again if it's more than half a minute old)
function regOpenBoard(){regAuto();if(!regLoadedAt||performance.now()-regLoadedAt>30000){regLoadedAt=performance.now();regLoad()}else renderBoards()}
function renderBoards(){const el=$('ol-board');if(!el)return;const me=club.reg&&club.reg.id;const list=[...regBoard.values()].filter(p=>!opsHidden(p.id));if(me&&!regBoard.has(me)&&club.reg)list.push(regInFromMine());
  const fam=lbFam,wr=p=>{const t=p.rk[fam],n=t.w+t.d+t.l;return n>=10?t.w/n:-1};
  const sorts={rp:(a,b)=>(b.rk[fam].pd-a.rk[fam].pd)||b.rk[fam].rp-a.rk[fam].rp,rank:(a,b)=>b.rk[fam].ix-a.rk[fam].ix||b.rk[fam].rp-a.rk[fam].rp,ovr:(a,b)=>b.sq[fam].r-a.sq[fam].r,wins:(a,b)=>(b.rk.volta.w+b.rk.classical.w)-(a.rk.volta.w+a.rk.classical.w),wr:(a,b)=>wr(b)-wr(a)};
  let rows=lbTab==='ranked'?list.filter(p=>p.rk[fam].pd):list;rows.sort(lbTab==='ranked'?sorts.rp:(sorts[lbSort]||sorts.ovr));if(lbSort==='wr'&&lbTab==='clubs')rows=rows.filter(p=>wr(p)>=0);
  el.innerHTML=`<div class="lbhead"><h3>Leaderboards</h3><div class="subtabs">${[['clubs','Global clubs'],['ranked','Ranked']].map(([k,n])=>`<button data-lbt="${k}" aria-pressed="${lbTab===k}">${n}</button>`).join('')}</div>
    <div class="subtabs">${[['volta','Volta'],['classical','Classical']].map(([k,n])=>`<button data-lbf="${k}" aria-pressed="${lbFam===k}">${n}</button>`).join('')}</div>
    ${lbTab==='clubs'?`<select id="lb-sort" aria-label="Sort">${[['ovr','Team rating'],['rp','Ranked Points'],['rank','Online rank'],['wins','Total ranked wins'],['wr','Win % (10+ matches)']].map(([k,n])=>`<option value="${k}" ${lbSort===k?'selected':''}>Sort: ${n}</option>`).join('')}</select>`:''}
    <button class="btn" data-lbload="1">Refresh</button></div>
    ${!regLoading&&regLoadedAt&&!regCl.some(c=>c.connected)?`<p class="opsann warn">⚠ ${NET_DOWN} The board will fill in once it connects.</p>`:''}
    <p class="hint">${lbTab==='ranked'?'Ordered by competitive results only (Ranked Points), never by squad strength.':'Every club playing Sunday Kickabout, whatever its rank. Yours is added automatically and kept up to date.'} Shared through public relays: profiles are checked, but this isn't a secure server, so treat it as a friendly board rather than an official ranking.${regLoading?' Loading…':''}</p>
    <div class="ltwrap"><table class="lt lbt"><tr><th>#</th><th>Club</th><th>Team</th><th>Rank</th><th>RP</th><th>W-D-L</th><th>Played</th><th></th></tr>
    ${rows.slice(0,100).map((p,i)=>{const t=p.rk[fam];return `<tr class="${p.id===me?'me':''}"><td>${i+1}</td><td><span class="kitdot" style="background:${p.k}"></span> ${esc(p.b)} ${esc(p.n)}${p.mg?`<small class="lbmg">${esc(p.mg)}</small>`:''}</td><td>${p.sq[fam].r||'–'}</td><td>${t.pd?rankBadgeHTML(t.ix,24,false)+' '+RANKS[t.ix].n:`<span class="hint">Unranked ${t.pl}/10</span>`}</td><td>${t.pd?t.rp.toLocaleString():'–'}</td><td>${t.w}-${t.d}-${t.l}</td><td>${p.pl}</td><td><button class="btn" data-vsq="${p.id}">View squad</button></td></tr>`}).join('')||`<tr><td colspan="8" class="hint">${regLoading?'Loading…':'No clubs yet. Press Refresh, or put your club on the board.'}</td></tr>`}</table></div>`}
function regInFromMine(){const raw=regProfile();regIn(raw);const p=regBoard.get(raw.id);return p}
function viewSquad(id){const p=regBoard.get(id);if(!p)return;const box=$('sqview');const lin=(s,t)=>`<h4>${t} · ${esc(s.f||'')} · team ${s.r||'–'}</h4><div class="sqv">${s.p.map(x=>`<div class="sqc t-${x[3]}"><b>${x[2]}</b><span>${esc(x[0])}</span><small>${esc(x[1])} · ${TIERS[x[3]].name}</small><small>${x[4]?esc(x[4])+' Lv '+x[5]:''}${x[6]?' · player Lv '+x[6]:''}</small></div>`).join('')||'<p class="hint">No line-up shared.</p>'}</div>`;
  box.innerHTML=`<div class="sqbox" role="dialog" aria-label="Squad"><button class="ghost sqx" data-sqx="1">Close</button><h3><span class="kitdot" style="background:${p.k}"></span> ${esc(p.b)} ${esc(p.n)}</h3>
    <p class="sqmg">Manager: <b>${p.mg?esc(p.mg):'not given'}</b></p>
    ${ops.on&&p.id!==(club.reg&&club.reg.id)?`<p class="hint">Something wrong with this club? <button class="btn" data-opsrep="${esc(p.id)}">Report</button></p>`:''}
    <p class="hint">Read-only. Volta ${p.rk.volta.pd?RANKS[p.rk.volta.ix].n+' '+p.rk.volta.rp+' RP':'unranked'} · Classical ${p.rk.classical.pd?RANKS[p.rk.classical.ix].n+' '+p.rk.classical.rp+' RP':'unranked'}</p>${lin(p.sq.volta,'Volta')}${lin(p.sq.classical,'Classical')}</div>`;box.hidden=false}
document.addEventListener('click',e=>{const t=e.target.closest('#ol-board button,#sqview [data-sqx]');if(!t)return;const d=t.dataset;
  if(d.lbt){lbTab=d.lbt;renderBoards()}else if(d.lbf){lbFam=d.lbf;renderBoards()}else if(d.lbload){regLoadedAt=performance.now();regLoad()}else if(d.vsq)viewSquad(d.vsq);else if(d.sqx)$('sqview').hidden=true});
document.addEventListener('change',e=>{if(e.target.id==='lb-sort'){lbSort=e.target.value;renderBoards()}});
$('sqview').addEventListener('click',e=>{if(e.target.id==='sqview')$('sqview').hidden=true});

// ---------- placement reveal ----------
function rankReveal(fam){const F=rkState().fam[fam],ix=rankIx(F.rp),r=RANKS[ix],el=$('rkreveal');
  el.innerHTML=`<div class="rkrv"><p>${fam==='volta'?'VOLTA':'CLASSICAL'} PLACEMENT COMPLETE</p>${placeRingHTML(fam)}<div class="rkrvb">${rankBadgeHTML(ix,120,true)}</div><h2 style="color:${r.c}">${r.n.toUpperCase()}</h2><p>${F.rp.toLocaleString()} RP</p><button class="go" data-rkok="1">Continue</button></div>`;
  el.hidden=false;ringShown[fam]=PLACE_N-1;el.querySelectorAll('.pring').forEach(x=>x.dataset.from=PLACE_N-1);animateRings();S.goal&&S.goal()}
$('rkreveal').addEventListener('click',e=>{if(e.target.closest('[data-rkok]'))$('rkreveal').hidden=true});

// ---------- help ----------
const HELP=[
 ['Getting started','<p>Sunday Kickabout is arcade football. Build a club, collect footballers from packs, develop them, and win leagues, cups and online matches.</p><p>Start on the <b>Play</b> tab: pick Volta (5v5) or Classical (9v9), a difficulty and a competition, then press the big orange button.</p>'],
 ['Basic controls','<div class="hkeys"><p><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</p><p><kbd>Shift</kbd> pass · without the ball: steal</p><p>Hold <kbd>Space</kbd> to shoot (longer = harder), <kbd>W</kbd>/<kbd>S</kbd> while holding to aim</p><p><kbd>F</kbd> cross · <kbd>C</kbd> slide tackle · <kbd>R</kbd> burst / lunge</p><p><kbd>E</kbd> skill move · <kbd>X</kbd> special ability · <kbd>Q</kbd> switch player</p><p><kbd>Esc</kbd> pause · <kbd>V</kbd> full screen · <kbd>N</kbd> connection details online</p></div><p>Control switches to whoever receives the ball, and to the best-placed defender when you defend.</p>'],
 ['Special abilities','<p>Every footballer has a special on <kbd>X</kbd>: Through Ball, Curler, Knuckleball, Rocket, Bicycle Kick, Interceptor, Turbo, Chip Pass or Chip. After using it, it recharges (the ring on the HUD).</p><p>Each footballer\'s special has 10 levels (Club → Special Abilities). Every level costs coins plus 2 Training Tokens and shortens the cooldown: Through Ball 25 s → 7 s, the shots and Interceptor 20 s → 5 s, Turbo and the chips 10 s → 3.5 s.</p><p><b>Through Ball</b> floats the ball over everyone to just outside their penalty area, where it lands after one second, for the team-mate nearest that spot. He chases it at his own normal pace (no speed boost), so it works best when your striker is already near the box. Nobody can touch it while it’s high and a slide only works once it’s down, but a defender who gets to the spot first can win it.</p><p><b>Offside</b> is only given for clear goal-hanging: a Through Ball, or a long ball crossed from far away, to a team-mate standing well beyond their last defender with no defender anywhere near him. The flag goes up and they get the ball. Normal runs and crosses into the box are never offside.</p>'],
 ['Player collection','<p>Open packs in Club → Packs. Each pack shows three footballers of one rarity and you sign one. Rarities: Bronze, Silver, Gold, Special and Icon (the very best). Odds are printed on every pack. Duplicates can be exchanged.</p>'],
 ['Player development','<p>Club → Development. Footballers gain XP from matches (or training with Training Tokens: the cost per 100 XP rises from 2 to 20 tokens as they level up). Levels unlock upgrade points (+1 to a stat for coins) and every two levels add +1 to their five best stats. Evolutions add more. The screen shows the current and maximum achievable OVR and exactly what each upgrade does.</p><p>There’s no 99 cap: the very best footballers can be developed past 99, up to their own maximum potential (Messi, for example, can reach 106). When a footballer has nothing left to gain, his card says <b>MAX POTENTIAL REACHED</b>.</p><p>Your Player (the footballer you create) trains +8 points at a time; prices climb to 75,000 coins for the last session.</p>'],
 ['Club development','<p>Club → Club Development: six departments, levels 1 to 5, paid with coins plus Club Tokens (one per Club Legacy level).</p><p>Fanbase: more match coins. Coaching Staff: up to 20% off every coin cost for training and abilities. Training Facilities: more XP. Stadium: bigger crowd and a small coin bonus. Scouting: a better chance of a top-rated footballer within each pack’s rarity (+2.5% per level after the first, up to +10%); it never changes the chance of a rarer card. Commercial: more objective coins and sponsor money.</p>'],
 ['Game modes','<p><b>Volta 5v5</b>: fast football in a cage, 2 minutes, 1× coins.</p><p><b>Classical Standard 9v9</b>: full pitch, 3 minutes, 1.5× coins. <b>Classical Expanded</b>: a bigger pitch, 3½ minutes, 1.875× coins. The green bubble shows the coin multiplier for your mode, pitch and difficulty.</p><p><b>Difficulty</b>: <b>Chill</b> is relaxed (opponents press less, tackle rarely and miss more), <b>Medium</b> is a fair game that’s still on your side, <b>Hard</b> is a genuine challenge and <b>Extreme</b> is for experts. Harder levels pay more coins.</p>'],
 ['Leagues and tournaments','<p>Volta and Classical each have five divisions (Amateur → Legendary). Ten clubs, nine rounds, top three promoted, bottom three relegated. A top-three finish earns a World Club Championship place (64-club knockout). There are also the Sunday Cup, the Grand Tournament, friendlies, challenges and skill games.</p>'],
 ['Online multiplayer','<p><b>Ranked</b>: matched with a real person of similar rating. Ten placement matches give your first rank (Bronze → Silver → Gold → Platinum → Diamond → Champion → Legendary), then wins earn RP and losses cost RP. Volta and Classical are ranked separately. Seasons last a month; rewards come from your best rank.</p><p><b>Friendly</b>: matched with anyone choosing Friendly, no RP. <b>Host / Join</b>: a private match with a 4-letter code.</p><p>Both players control their own team; the host\'s laptop runs the match. You both need the same version of the game.</p><p>If the game can’t reach the online services (no internet, or a school or work network that blocks them) it says so instead of waiting for ever, and keeps trying. Everything offline still works.</p>'],
 ['Nickname and saving','<p>A nickname is all you need to play (tap it at the top of the menu to change it). It is shown next to your club on the leaderboard, in View Squad, in matchmaking and to your opponent online.</p><p><b>Saved on this device</b>: always, automatically, in this browser. Clearing the browser\'s data, a private window, or another browser or device won\'t have it.</p><p><b>SAVE YOUR ACCOUNT</b> (optional): add an email and password to keep a locked copy of your progress online, then log in with the same two on another device to carry on. It saves by itself after every change and each save is read back before it counts. Your progress is locked on your device with your password, and your email and password never leave the device or appear anywhere public. There is no password reset, so keep the password safe; the save code under Club works as a backup.</p>'],
 ['Rewards','<p>Coins for every match (more for wins, goals, harder difficulty and bigger pitches). Training Tokens for half your winning margin, rounded down (win 2-0 or 3-1: 1 token; 4-0: 2; 1-0 or a draw: none). Club Legacy XP from every match, with a reward at every level, plus a Club Token. Challenges, achievements, league seasons, cups and Ranked promotions pay out too.</p>']];
let helpPg=0;
function renderHelp(){const h=$('help');h.innerHTML=`<div class="hbox" role="dialog" aria-label="Help"><div class="hnav">${HELP.map(([t],i)=>`<button data-hp="${i}" aria-pressed="${i===helpPg}">${i+1}. ${t}</button>`).join('')}<button data-hp="tut" class="btn">Replay tutorial</button></div>
  <div class="hmain"><h3>${HELP[helpPg][0]}</h3><div class="htext">${HELP[helpPg][1]}</div><div class="hfoot"><button class="ghost" data-hprev="1" ${helpPg?'':'disabled'}>Previous</button><span>${helpPg+1} / ${HELP.length}</span><button class="go" data-hnext="1">${helpPg<HELP.length-1?'Next':'Done'}</button></div></div>
  <button class="ghost hx" data-hx="1" aria-label="Close help">Close</button></div>`;h.hidden=false}
function openHelp(pg){if(pg!=null)helpPg=pg;renderHelp();if(state==='play'&&!NET.on&&!paused)setPause(true)}
$('help').addEventListener('click',e=>{const t=e.target.closest('button');if(e.target.id==='help'){$('help').hidden=true;return}if(!t)return;const d=t.dataset;
  if(d.hp==='tut'){$('help').hidden=true;tutStart()}else if(d.hp){helpPg=+d.hp;renderHelp()}else if(d.hprev){helpPg=Math.max(0,helpPg-1);renderHelp()}else if(d.hnext){if(helpPg<HELP.length-1){helpPg++;renderHelp()}else $('help').hidden=true}else if(d.hx)$('help').hidden=true});
for(const id of ['helpbtn','helpbtn2','helpbtn3'])$(id).onclick=()=>openHelp();

// ---------- first-time tutorial ----------
/* Eight steps with the relevant part of the screen highlighted. Step 5 plays a real first match (Volta, Chill, a
   friendly) with control hints on the pitch; the tutorial picks up again afterwards. Skippable, saved, and replayable
   from Help. */
const TUT=[
 {t:'Welcome to Sunday Kickabout!',d:'Build a club, collect footballers, and win leagues, cups and online matches. This short tour shows you the basics.',sel:'#menu h1'},
 {t:'Your club',d:'This is your club: tap the name to rename it, pick a kit colour, and keep an eye on your coins and Training Tokens up here.',sel:'.clubbar'},
 {t:'Your players',d:'The Squad tab shows your line-up. Each card has an overall rating (OVR), a position, a rarity (Bronze up to Icon) and a special ability on X.',sel:'#tab-squad'},
 {t:'Controls',d:'WASD to move · Shift to pass · hold Space to shoot (W/S to aim) · C slide tackle · E skill move · X special · Q switch player. Help has the full list any time.',sel:'#helpbtn'},
 {t:'Play your first match',d:'Let’s play! A quick Volta friendly on Chill against an easy side. Press Play below when you’re ready.',sel:'#go',play:1},
 {t:'Rewards',d:'Every match pays coins, Club Legacy XP and (with a winning margin) Training Tokens. Harder difficulties and bigger pitches pay more.',sel:'#coins'},
 {t:'Upgrade a player',d:'Club → Development: spend coins to raise a stat, train with Training Tokens, and see exactly how much better each upgrade makes him.',sel:'#tab-club'},
 {t:'More to explore',d:'Try Classical 9v9, climb the leagues, enter cups, and test yourself online in Ranked, Friendly or a private match. Have fun!',sel:'#tab-online'}];
function tutStart(){club.tut={step:0,done:false};saveClub();tab='team';renderMenu();tutShow()}
function tutShow(){const T=club.tut;if(!T||T.done)return;const s=TUT[T.step];if(!s){T.done=true;saveClub();$('tut').hidden=true;tutMark(null);return}
  const el=$('tut');el.innerHTML=`<div class="tbox"><small>Tutorial · ${T.step+1} of ${TUT.length}</small><h3>${s.t}</h3><p>${s.d}</p><div class="tfoot"><button class="ghost" data-tskip="1">Skip tutorial</button>${T.step?'<button class="ghost" data-tprev="1">Back</button>':''}<button class="go" data-tnext="1">${s.play?'Play':T.step===TUT.length-1?'Finish':'Next'}</button></div></div>`;
  el.hidden=false;tutMark(s.sel)}
function tutMark(sel){document.querySelectorAll('.tutmark').forEach(x=>x.classList.remove('tutmark'));if(!sel)return;const t=document.querySelector(sel);if(t){t.classList.add('tutmark');t.scrollIntoView({block:'nearest'})}}
$('tut').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const T=club.tut;const d=t.dataset;
  if(d.tskip){T.done=true;saveClub();$('tut').hidden=true;tutMark(null);toast('Tutorial skipped. Replay it any time from Help.');return}
  if(d.tprev){T.step=Math.max(0,T.step-1);saveClub();tutShow();return}
  if(d.tnext){const s=TUT[T.step];T.step++;saveClub();
    if(s.play){$('tut').hidden=true;tutMark(null);club.tutMatch=1;setGM('volta');club.level='chill';club.comp='friendly';comp='friendly';saveClub();tab='team';renderMenu();$('go').click();return}
    tutShow()}});
// in the first match: control hints on the pitch for the first 25 seconds
function drawTutHints(){if(!club.tutMatch||state!=='play'||NET.on||stT>1500)return;const k=Math.min(1,stT/30);ctx.globalAlpha=k*.95;ctx.fillStyle='rgba(8,14,22,.8)';rr(W/2-300,H-118,600,44,22);ctx.fill();
  txt(stT<500?'WASD to move · run onto the ball':stT<1000?'Shift to pass · hold Space to shoot, release to strike':'Lost it? Shift or Space near them to steal · C to slide · Q to switch',W/2,H-90,16,C.cream,'center',false);ctx.globalAlpha=1}
function tutAfterMatch(){if(club.tutMatch){club.tutMatch=0;saveClub();if(club.tut&&!club.tut.done)setTimeout(tutShow,600)}}
function tutBoot(){if(!club.tut){club.tut={step:0,done:(club.played||0)>0};saveClub()}if(!club.tut.done&&club.mgr)setTimeout(tutShow,700)}// players who already have matches behind them aren't shown it
