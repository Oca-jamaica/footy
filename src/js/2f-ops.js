// ---------- link to the developer's dashboard (optional) ----------
/* The build puts the dashboard server's two PUBLIC keys here (from server/public-keys.json). With no keys this whole
   section stays off and none of its buttons appear. Nothing secret is ever in the game file:
   - the game only obeys control messages (maintenance, announcements, suspensions, corrections) carrying a valid
     signature from the server's private key, which never leaves the developer's computer. Anyone can read them on the
     public relays; nobody else can make one the game will accept, and an older one can't replace a newer one;
   - what the game sends (live status, online results, reports, problem reports, appeals) is encrypted to the server's
     public key, so only the server can read it. It never contains an email, password, room code or location. Live
     status can be switched off in your profile. */
const OPSK=/*@OPSKEYS*/null;
const GAMEVER=/*@BUILD*/'dev';
const OPS_T='sundaykickabout/ops1/',OPS_CTL=OPS_T+'ctl';
const OPS_WHY={cheating:'cheating',name:'an offensive name',abuse:'abuse or harassment',other:'breaking the rules'};
const ops={on:!!(OPSK&&OPSK.sig&&OPSK.enc&&window.crypto&&crypto.subtle),ready:null,sid:'',n:0,sigK:null,aesK:null,eph:'',seq:0,h:'',hOf:'',
  maint:null,ann:[],suspR:new Set(),mine:null,exp:0,acks:[],hbAt:0,hbSt:'',ctlAt:0,bad:0,opp:null,mid:'',midKey:'',errSeen:0,errSent:0,sent:{}};
const opsTE=s=>new TextEncoder().encode(s);
const opsB64=u=>btoa(String.fromCharCode(...u));
const opsUnB64=s=>Uint8Array.from(atob(String(s)),c=>c.charCodeAt(0));
const opsHex=u=>Array.from(u,x=>x.toString(16).padStart(2,'0')).join('');
async function opsSha(s){return opsHex(new Uint8Array(await crypto.subtle.digest('SHA-256',opsTE(s))))}
const opsShare=()=>club.opsShare!==false;
function opsInit(){if(!ops.on)return Promise.resolve(false);if(ops.ready)return ops.ready;
  ops.ready=(async()=>{try{const S=crypto.subtle;
      ops.sigK=await S.importKey('raw',opsUnB64(OPSK.sig),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
      // a throwaway key pair for this page: with the server's public key it gives an AES key only the server can match
      const srv=await S.importKey('raw',opsUnB64(OPSK.enc),{name:'ECDH',namedCurve:'P-256'},false,[]);
      const kp=await S.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
      const hk=await S.importKey('raw',await S.deriveBits({name:'ECDH',public:srv},kp.privateKey,256),'HKDF',false,['deriveKey']);
      ops.aesK=await S.deriveKey({name:'HKDF',hash:'SHA-256',salt:opsTE('sk-ops1'),info:opsTE('telemetry')},hk,{name:'AES-GCM',length:256},false,['encrypt']);
      ops.eph=opsB64(new Uint8Array(await S.exportKey('raw',kp.publicKey)));ops.sid=opsHex(crypto.getRandomValues(new Uint8Array(8)));
      try{ops.seq=+localStorage.getItem('kickabout-ops-seq')||0}catch(e){}await opsPid();return true}
    catch(e){ops.on=false;return false}})();return ops.ready}
// the server knows a save only by a one-way hash of its private id (so a correction reaches the right save)
async function opsPid(){if(club.pid&&ops.hOf!==club.pid){ops.h=(await opsSha('sk-pid1:'+club.pid)).slice(0,32);ops.hOf=club.pid}}
async function opsSeal(obj){const iv=crypto.getRandomValues(new Uint8Array(12));
  const c=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:opsTE('sk-ops1')},ops.aesK,opsTE(JSON.stringify(obj))));
  return JSON.stringify({v:1,e:ops.eph,iv:opsB64(iv),c:opsB64(c)})}
async function opsSend(k,data,important){if(!await opsInit())return false;await opsPid();const cl=(await regConnect()).filter(c=>c.connected);if(!cl.length)return false;
  const msg=await opsSeal({k,sid:ops.sid,n:++ops.n,t:Date.now(),ver:GAMEVER,pv:NETPV,h:ops.h,rid:club.reg&&club.reg.id||'',nm:String(club.name||'').slice(0,20),mg:club.mgr||'',...data});
  for(const c of cl)try{c.publish(OPS_T+'t/'+ops.sid,msg,{qos:important?1:0})}catch(e){}return true}

// ---- what this page is doing right now (the heartbeat) ----
function opsState(){if(document.hidden)return'idle';if(mm.on)return'search';if(NET.on)return'online';if(netRole)return'lobby';
  return state==='menu'?'menu':pen?'pens':'match'}
async function opsMid(){const key=netCode+':'+(NET.host?netMatch:netGotMatch);if(key!==ops.midKey){ops.midKey=key;ops.mid=(await opsSha('sk-match1:'+key)).slice(0,16)}return ops.mid}
async function opsHB(force){if(!ops.on||!opsShare())return;const st=opsState(),t=performance.now(),key=st==='online'?st+score.join('-'):st;// a goal online updates the live score straight away
  if(!force&&key===ops.hbSt&&t-ops.hbAt<20000)return;ops.hbAt=t;ops.hbSt=key;const md=st==='search'?mm.fmt:st==='online'?PITCH:st==='lobby'?(NETMODES[club.netMode]?club.netMode:'volta'):PITCH;let om=null;
  if(st==='online'){const okR=Object.keys(netRoutes).filter(k=>netRoutes[k]==='ok'),rt=NET.host&&nroom&&nroom.prefer?nroom.prefer.kind:okR.includes('peer')?'peer':okR.length?'relay':'';om={mid:await opsMid(),kind:netKind,role:NET.host?'host':'guest',fmt:PITCH,
      sc:NET.host?[score[0],score[1]]:[score[1],score[0]],clk:Math.round(clock),rtt:NET.guest?Math.round(netRtt):0,rt:rt==='peer'?'direct':rt?'relay':'',opp:OPP&&OPP.name||''}}
  else if(st==='lobby')om={role:netRole||'',fmt:md};
  const ack=ops.acks.slice(-20);if(await opsSend('hb',{st,md,lv:st==='match'?club.level||'':'',om,ack}))ops.acks=[]}
// the same final score goes from both laptops at full time; the server checks they agree
async function opsResult(){if(!ops.on||!opsShare()||!NET.on)return;const o=ops.opp||{};
  opsSend('res',{mid:await opsMid(),kind:netKind,fmt:PITCH,role:NET.host?'host':'guest',my:score[0],their:score[1],opp:{rid:o.rid||'',nm:o.nm||'',mg:o.mg||''}},true)}
function opsOpp(pr){if(!pr)return;const rid=String(pr.rid||'');ops.opp={rid:/^[a-z0-9]{10,16}$/.test(rid)?rid:'',nm:String(pr.club||'').slice(0,20),mg:nameOk(String(pr.mg||'')),kind:netKind,at:Date.now()};if(ops.on)renderOnlinePlus()}
// game errors (if any) are reported automatically, at most three a session, with file paths taken out
function opsErrs(){if(!ops.on||!opsShare()||loopErrs<=ops.errSeen||ops.errSent>=3)return;ops.errSeen=loopErrs;ops.errSent++;
  const e=String(window.__lastErr||'').replace(/\b(?:file|https?|blob):\/\/[^\s)]+/g,'<file>').slice(0,240);
  opsSend('prob',{auto:1,cat:'bug',txt:'',errs:[e],st:opsState(),md:PITCH},true)}

// ---- the signed control message ----
async function opsCtl(buf){if(!await opsInit())return;let d;try{d=JSON.parse(new TextDecoder().decode(buf))}catch(e){return}
  if(!d||d.v!==1||typeof d.p!=='string'||typeof d.s!=='string'||d.p.length>300000)return;
  let ok=false;try{ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},ops.sigK,opsUnB64(d.s),opsTE(d.p))}catch(e){}
  if(!ok){ops.bad++;return}// not from the server: ignored
  let p;try{p=JSON.parse(d.p)}catch(e){return}const now=Date.now();
  // only ever move forward: an older signed message (a replay) can't replace a newer one, and stale ones expire
  if(p.v!==1||!Number.isFinite(p.seq)||!(p.seq>ops.seq||(p.seq===ops.seq&&!ops.ctlAt))||!(now<=p.exp+600000))return;
  ops.seq=p.seq;try{localStorage.setItem('kickabout-ops-seq',String(p.seq))}catch(e){}ops.ctlAt=now;ops.exp=+p.exp;opsApply(p)}
// if the dashboard goes quiet, its last message lapses (maintenance and announcements stop) once it expires
const opsFresh=()=>ops.ctlAt&&Date.now()<=ops.exp+600000;
function opsApply(p){const now=Date.now(),list=x=>Array.isArray(x)?x:[];
  ops.maint=p.maint&&p.maint.on?{msg:String(p.maint.msg||'').slice(0,200)}:null;
  ops.ann=list(p.ann).slice(0,3).filter(a=>a&&(!a.until||a.until>now)).map(a=>({id:String(a.id||''),txt:String(a.txt||'').slice(0,220),lvl:a.lvl==='warn'?'warn':'info'}));
  const S=list(p.susp);ops.suspR=new Set(S.map(s=>String(s&&s.rid||'')));const myRid=club.reg&&club.reg.id;
  const m=S.find(s=>s&&((ops.h&&s.h===ops.h)||(myRid&&s.rid===myRid)));ops.mine=m?{id:String(m.id||''),until:+m.until||0,why:OPS_WHY[m.why]?m.why:'other'}:null;
  let dirty=JSON.stringify(club.opsSusp||null)!==JSON.stringify(ops.mine);club.opsSusp=ops.mine;
  // corrections for this save: each is applied once, and a removal never takes a balance below zero
  club.opsDone=Array.isArray(club.opsDone)?club.opsDone:[];const notes=[];
  for(const g of list(p.grants)){if(!g||!ops.h||g.h!==ops.h)continue;const id=String(g.id||'');if(!id||club.opsDone.includes(id))continue;
    const c=clamp(Math.round(+g.c)||0,-1e6,1e6),tt=clamp(Math.round(+g.tt)||0,-1000,1000);
    club.coins=Math.max(0,(club.coins||0)+c);club.tt=Math.max(0,(club.tt||0)+tt);club.opsDone.push(id);if(club.opsDone.length>300)club.opsDone.shift();ops.acks.push(id);dirty=true;
    notes.push(`${String(g.msg||'A correction from the Sunday Kickabout team.').slice(0,140)} (${[c?`${c>0?'+':''}${c.toLocaleString()} coins`:'',tt?`${tt>0?'+':''}${tt} Training Token${Math.abs(tt)===1?'':'s'}`:''].filter(Boolean).join(', ')})`)}
  if(dirty){saveClub();if(state==='menu')renderMenu()}
  if(notes.length){ops.note=notes.join(' · ');toast(ops.note);opsHB(true)}
  opsBar();if(state==='menu'){renderOnlinePlus();renderBoards()}}
// online play is closed during maintenance and to a suspended club (everything offline still works)
function opsMineNow(){const m=ops.ctlAt?ops.mine:club.opsSusp;return m&&(!m.until||m.until>Date.now())?m:null}
function opsBlock(){if(!ops.on)return'';if(ops.maint&&opsFresh())return ops.maint.msg||'Online play is paused for maintenance. Please try again soon.';
  const m=opsMineNow();return m?`Your club is suspended from online play until ${new Date(m.until).toLocaleString()} for ${OPS_WHY[m.why]||OPS_WHY.other}. Everything offline still works, and you can appeal from the Online tab.`:''}
const opsHidden=rid=>ops.on&&!!rid&&ops.suspR.has(String(rid))&&!(club.reg&&rid===club.reg.id);

// ---- what players see ----
let opsGone=new Set();try{opsGone=new Set(JSON.parse(localStorage.getItem('kickabout-ops-gone')||'[]'))}catch(e){}
function opsBar(){const el=$('opsbar');if(!el)return;const rows=[];if(ops.ctlAt&&!opsFresh()){ops.maint=null;ops.ann=[]}
  if(ops.maint)rows.push(`<p class="opsann warn">🔧 ${esc(ops.maint.msg||'Online play is paused for maintenance.')}</p>`);
  for(const a of ops.ann)if(!opsGone.has(a.id))rows.push(`<p class="opsann ${a.lvl}">📣 ${esc(a.txt)} <button class="ghost" data-opsgone="${esc(a.id)}" aria-label="Hide">✕</button></p>`);
  if(ops.note)rows.push(`<p class="opsann info">🎁 ${esc(ops.note)} <button class="ghost" data-opsgone="note" aria-label="Hide">✕</button></p>`);
  el.innerHTML=rows.join('');el.hidden=!rows.length}
// the Online tab's extra lines: maintenance, a suspension (with appeal), reporting the last opponent, reporting a problem
function opsOnlineTop(){if(!ops.on)return'';const m=opsMineNow();
  return `${ops.maint&&opsFresh()?`<p class="opsann warn">🔧 ${esc(ops.maint.msg||'Online play is paused for maintenance.')}</p>`:''}
    ${m?`<div class="opsann warn"><b>Your club is suspended from online play</b> until ${esc(new Date(m.until).toLocaleString())} for ${esc(OPS_WHY[m.why]||OPS_WHY.other)}. Single-player, packs and everything offline still work. <button class="btn" data-ops="appeal">Appeal</button></div>`:''}`}
function opsOnlineHTML(){if(!ops.on)return'';const o=ops.opp;
  return `<p class="hint opsline">${o&&(o.rid||o.nm)?`Last online opponent: <b>${esc(o.nm||'unknown')}</b>${o.mg?' ('+esc(o.mg)+')':''} <button class="btn" data-ops="repopp">Report</button> · `:''}<button class="btn" data-ops="prob">Report a problem</button></p>`}
function opsDlg(kind,target){const box=$('opsdlg');if(!box)return;const t=target||{};
  const head={rep:`Report ${esc(t.nm||'this club')}`,prob:'Report a problem',appeal:'Appeal your suspension'}[kind];
  const cats=kind==='rep'?[['cheating','Cheating'],['name','Offensive name or club name'],['abuse','Abuse or harassment'],['other','Something else']]:kind==='prob'?[['bug','Something isn’t working'],['online','Online / connection'],['performance','Slow or jerky'],['account','Account or save'],['other','Something else']]:null;
  box.innerHTML=`<div class="sqbox pbox" role="dialog" aria-label="${head}"><button class="ghost sqx" data-opsd="x">Close</button><h3>${head}</h3>
    ${kind==='rep'?'<p class="hint">Goes privately to the game’s developer with this club’s public id. Please only report real problems.</p>':kind==='prob'?'<p class="hint">Goes privately to the game’s developer with your game version and any recent error messages. Nothing personal is sent.</p>':'<p class="hint">Tell the developer why the suspension should be lifted. You’ll see the result here.</p>'}
    ${cats?`<label class="pfl">What’s it about?<select id="opsd-cat">${cats.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label>`:''}
    <label class="pfl">${kind==='appeal'?'Your appeal':'Details (optional)'}<textarea id="opsd-txt" rows="4" maxlength="${kind==='rep'?500:800}"></textarea></label>
    <div class="pfrow"><button class="btn gold" data-opsd="send">Send</button></div><p class="hint" id="opsd-msg"></p></div>`;
  box.dataset.kind=kind;box.dataset.t=JSON.stringify(t);box.hidden=false}
async function opsDlgSend(){const box=$('opsdlg'),kind=box.dataset.kind,t=JSON.parse(box.dataset.t||'{}'),msg=$('opsd-msg'),txt=($('opsd-txt').value||'').trim(),cat=$('opsd-cat')?$('opsd-cat').value:'';
  const gap={rep:120000,prob:60000,appeal:600000}[kind];if(performance.now()-(ops.sent[kind]||-1e9)<gap){msg.textContent='You’ve just sent one. Please wait a little before sending another.';return}
  if(kind==='appeal'&&txt.length<10){msg.textContent='Say a little more (10+ characters).';return}
  msg.textContent='Sending…';let ok=false;
  if(kind==='rep')ok=await opsSend('rep',{target:{rid:t.rid||'',nm:t.nm||'',mg:t.mg||''},cat,txt,ctx:t.ctx||'squad'},true);
  else if(kind==='prob')ok=await opsSend('prob',{cat,txt,errs:loopErrs?[String(window.__lastErr||'').replace(/\b(?:file|https?|blob):\/\/[^\s)]+/g,'<file>').slice(0,240)]:[],st:opsState(),md:PITCH,rt:Object.keys(netRoutes).filter(k=>netRoutes[k]==='ok').join(' ')},true);
  else if(kind==='appeal'){const m=opsMineNow();if(m)ok=await opsSend('app',{sus:m.id,txt},true)}
  if(ok){ops.sent[kind]=performance.now();msg.textContent='Sent. Thank you.';setTimeout(()=>{box.hidden=true},1400)}
  else msg.textContent='Couldn’t send: the game can’t reach the internet relays right now. Check your connection and try again.'}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ops],[data-opsd],[data-opsgone],[data-opsrep]');if(!b)return;const d=b.dataset;
  if(d.opsgone){if(d.opsgone==='note')ops.note='';else{opsGone.add(d.opsgone);try{localStorage.setItem('kickabout-ops-gone',JSON.stringify([...opsGone].slice(-30)))}catch(e){}}opsBar()}
  else if(d.ops==='appeal')opsDlg('appeal');else if(d.ops==='prob')opsDlg('prob');
  else if(d.ops==='repopp'&&ops.opp)opsDlg('rep',{...ops.opp,ctx:'opponent'});
  else if(d.opsrep){const p=regBoard.get(d.opsrep);if(p)opsDlg('rep',{rid:p.id,nm:p.n,mg:p.mg,ctx:'squad'})}
  else if(d.opsd==='x')$('opsdlg').hidden=true;else if(d.opsd==='send')opsDlgSend()});
function opsBoot(){if(!ops.on)return;
  HELP.push(['Live status, reports and appeals','<p>This copy of the game is linked to its developer’s dashboard. While you play it sends a small encrypted status every 20 seconds: your nickname, club name and public club id, what you’re doing (menus, a match against the computer, searching, a private lobby or an online match with its score), the difficulty and the game version. Only the developer can read it. It never includes your email, password, room codes or location. Turn it off in your profile (tap your nickname) whenever you like.</p><p><b>Report</b> a club from View Squad, or your last online opponent from the Online tab. <b>Report a problem</b> from the Online tab or your profile. The developer can post announcements, pause online play for maintenance, suspend a club from online play (single-player always works, and you can appeal from the Online tab) and correct coins or Training Tokens. The game only obeys messages signed by the developer’s own key, so nobody else can do any of this.</p>']);opsInit();setInterval(()=>{opsHB(false);opsErrs();if((ops.maint||ops.ann.length)&&!opsFresh())opsBar()},5000);setTimeout(()=>opsHB(true),4000);opsBar()}
