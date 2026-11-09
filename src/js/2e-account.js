/* ---------- your name, and an optional email login that keeps your progress ----------
   Your name (the manager) is shown next to your club on the leaderboard, in View Squad and to your opponent online,
   so people can see whose team is whose. It's asked for once, the first time the game opens.

   The login is optional. There's no Sunday Kickabout server, so it works like this: your email and password are
   turned on this device into a lock (PBKDF2, 210,000 rounds) and a private address. Your save is locked (AES-GCM)
   here with it and the locked copy is kept on the same public relays the online game uses, at that address. Only
   someone with the same email AND password can find it or open it; the relays only ever see scrambled data, and your
   email and password never leave this device. No email is sent, so there's no address check and no password reset:
   forget the password and that copy can't be opened (your progress on this device is unaffected). The relays are
   free public services, so a copy could be cleared; this device always keeps its own save too. */
const ACCT_T='sundaykickabout/acct1/';
let acct=null,acctTimer=null,acctBusy=false,acctMsgTxt='',acctMsgBad=false,acctFound=null;const acctWait=new Map();
try{const a=JSON.parse(localStorage.getItem('kickabout-acct')||'null');if(a&&/^[0-9a-f]{32}$/.test(a.id)&&a.k)acct=a}catch(e){}
const acctSave=()=>{try{if(acct)localStorage.setItem('kickabout-acct',JSON.stringify(acct));else localStorage.removeItem('kickabout-acct')}catch(e){}};
const b64u8=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)};
const u8b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function acctDerive(email,pw){const te=new TextEncoder(),base=await crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveBits']);
  const b=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:te.encode('sundaykickabout-acct-v1|'+email),iterations:210000},base,512));
  // first half: the address; second half (an independent block): the lock
  return{id:[...b.slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join(''),k:b64u8(b.slice(32,64))}}
async function acctSeal(obj){const key=await crypto.subtle.importKey('raw',u8b64(acct.k),'AES-GCM',false,['encrypt']);
  let data=new TextEncoder().encode(JSON.stringify(obj)),z=0;
  if(window.CompressionStream){try{data=new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());z=1}catch(e){}}
  const iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data));
  return JSON.stringify({v:1,z,iv:b64u8(iv),ct:b64u8(ct)})}
async function acctOpen(txt,k){try{const d=JSON.parse(txt);if(!d||d.v!==1)return null;const key=await crypto.subtle.importKey('raw',u8b64(k),'AES-GCM',false,['decrypt']);
  let pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:u8b64(d.iv)},key,u8b64(d.ct)));
  if(d.z)pt=new Uint8Array(await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const sv=JSON.parse(new TextDecoder().decode(pt));return sv&&sv.club&&Array.isArray(sv.club.owned)?sv:null}catch(e){return null}}
// copies arriving from the relays (routed here by the leaderboard connection, which these share)
function acctMsg(tp,buf){const id=tp.slice(ACCT_T.length),w=acctWait.get(id);if(w){w.list.push(new TextDecoder().decode(buf));if(!w.first)w.first=performance.now()}}
// read every relay's copy for this address and open the newest
async function acctFetch(id,k){const cl=await regConnect();if(!cl.length)return{ok:false,sv:null};const w={list:[],first:0};acctWait.set(id,w);
  for(const c of cl){const sub=()=>{try{c.subscribe(ACCT_T+id,{qos:1})}catch(e){}};if(c.connected)sub();else c.once('connect',sub)}
  const t0=performance.now();await new Promise(r=>{const iv=setInterval(()=>{const n=performance.now();if(n-t0>4500||(w.first&&n-w.first>1200)){clearInterval(iv);r()}},100)});
  for(const c of cl)try{c.unsubscribe(ACCT_T+id)}catch(e){}acctWait.delete(id);
  let best=null;for(const s of w.list){const sv=await acctOpen(s,k);if(sv&&(!best||(+sv.at||0)>(+best.at||0)))best=sv}
  return{ok:cl.some(c=>c.connected),sv:best}}
const svKey=sv=>JSON.stringify([sv.club,sv.names||{},sv.custom||{}]);let acctKey='';
// save to the account, but only if something changed, and never over a newer copy another device saved meanwhile
// (that's asked about instead); "keep" is the player's explicit choice to replace the account's copy
async function acctPushNow(keep){if(!acct||acct.hold&&!keep)return false;const cl=await regConnect();if(!cl.some(c=>c.connected))return false;
  const sv=snapshotSave(),key=svKey(sv);if(key===acctKey&&!keep)return true;
  if(!keep){const r=await acctFetch(acct.id,acct.k);if(r.ok&&r.sv&&(+r.sv.at||0)>(+acct.at||0)+1000&&svKey(r.sv)!==key){acct.hold=true;acctFound=r.sv;acctSave();acctPill();profOpen();return false}}
  const s=await acctSeal(sv);
  for(const c of cl){const go=()=>{try{c.publish(ACCT_T+acct.id,s,{qos:1,retain:true})}catch(e){}};if(c.connected)go();else c.once('connect',go)}
  acct.at=sv.at;acct.hold=false;acctKey=key;acctSave();acctPill();if(!$('prof').hidden)profRender();return true}
// after anything is saved on this device: a fresh locked copy a few seconds later (only from the menus, never mid-match)
function acctPush(){if(!acct||acct.hold)return;clearTimeout(acctTimer);acctTimer=setTimeout(async()=>{if(NET.on||state!=='menu'){acctPush();return}if(acctBusy){acctPush();return}acctBusy=true;try{await acctPushNow()}catch(e){}acctBusy=false},4000)}
function acctLoad(sv){try{localStorage.setItem('kickabout-club-before-load',JSON.stringify(snapshotSave()))}catch(e){}
  club={...club,...sv.club};loadClubFrom(JSON.parse(JSON.stringify(sv.club)));NAMES={...(sv.names||{})};applyNames();
  if(sv.custom&&sv.custom.name)custom={...custom,...sv.custom,isCustom:true};best=Math.max(best,+sv.best||0);
  try{localStorage.setItem('kickabout-club',JSON.stringify(club));localStorage.setItem('kickabout-names',JSON.stringify(NAMES));localStorage.setItem('kickabout-custom',JSON.stringify(custom));localStorage.setItem('kickabout-best3',best)}catch(e){}
  acct.at=+sv.at||Date.now();acct.hold=false;acctKey=svKey(snapshotSave());acctSave();cloudPush();setup();renderMenu();regAuto()}
// nothing to lose on this device yet: no matches played, starting players and coins untouched
const freshClub=()=>(club.played||0)===0&&club.owned.length<=13&&(club.coins||0)>=1400;
const svLine=sv=>{const c=sv.club;return `${esc(c.name||'My Club')}${c.mgr?' · manager '+esc(c.mgr):''} · ${c.owned.length} players · ${(+c.coins||0).toLocaleString()} coins · ${c.played||0} matches played`};
const emailOk=e=>/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(e);
async function acctLogin(create){const e=($('pf-email').value||'').trim().toLowerCase(),pw=$('pf-pw').value||'';
  if(!emailOk(e)){acctMsgSet('That email doesn’t look right.',true);return}
  if(pw.length<8){acctMsgSet('Use a password of at least 8 characters (one you don’t use anywhere else).',true);return}
  if(!window.crypto||!crypto.subtle){acctMsgSet('This browser can’t lock saves (it needs a secure page). Use the save code under Club instead.',true);return}
  acctMsgSet(create?'Creating your account…':'Looking for your save…');const d=await acctDerive(e,pw);const r=await acctFetch(d.id,d.k);
  if(!r.ok){acctMsgSet('Couldn’t reach the save relays (are you online?). Nothing was changed; try again in a moment.',true);return}
  acct={e,id:d.id,k:d.k,at:0};
  if(r.sv){if(freshClub()){acctLoad(r.sv);acctMsgSet('Welcome back! Your progress has been loaded.');toast('Progress loaded from your account');profRender();return}
    acct.hold=true;acctSave();acctFound=r.sv;acctMsgSet('');profRender();return}
  if(!create){acct=null;acctMsgSet('No save found for that email and password. Check both, or press Create account to start one with this device’s progress.',true);return}
  acctSave();const ok=await acctPushNow();acctMsgSet(ok?'Account created. Your progress is saved and will keep saving automatically.':'Account created, but the first save didn’t go through yet; it will retry.');profRender()}
function acctMsgSet(m,bad){acctMsgTxt=m;acctMsgBad=!!bad;const el=$('pf-msg');if(el){el.textContent=m;el.style.color=bad?'var(--coral)':''}}
// on start-up: if another device saved since this one last did, ask before anything is overwritten
async function acctBoot(){if(!acct)return;try{const r=await acctFetch(acct.id,acct.k);if(!r.ok)return;
  if(r.sv&&(+r.sv.at||0)>(+acct.at||0)+1000&&JSON.stringify(r.sv.club)!==JSON.stringify(club)){acct.hold=true;acctFound=r.sv;acctSave();profOpen();return}
  acct.hold=false;acctSave();acctPush()}catch(e){}}
function acctPill(){const el=$('mgrpill');if(!el)return;el.textContent=(club.mgr||'Add your name')+(acct?' ☁':'');el.title=acct?'Your profile · progress saving to '+acct.e:'Your profile · log in to save your progress'}
function profOpen(){profRender();$('prof').hidden=false;setTimeout(()=>{const i=$(club.mgr?'pf-email':'pf-name');if(i&&!acct)i.focus()},50)}
function profRender(){const box=$('prof'),first=!club.mgr,ago=a=>{const s=Math.round((Date.now()-a)/1000);return !a?'not yet':s<60?'just now':s<3600?Math.round(s/60)+' min ago':Math.round(s/3600)+' h ago'};
  const found=acctFound&&acct&&acct.hold?`<div class="pfound"><b>Progress found on your account</b><p>${svLine(acctFound)}<br><small>saved ${ago(+acctFound.at)}</small></p><p><b>On this device:</b> ${svLine({club})}</p>
    <div class="pfrow"><button class="btn gold" data-pf="load">Load my account’s progress</button><button class="btn" data-pf="keep">Keep this device’s (replaces the account copy)</button></div></div>`:'';
  box.innerHTML=`<div class="sqbox pbox" role="dialog" aria-label="Your profile">${first?'':'<button class="ghost sqx" data-pf="x">Close</button>'}
    <h3>${first?'Welcome to Sunday Kickabout!':'Your profile'}</h3>
    <label class="pfl">Your name<input type="text" id="pf-name" maxlength="16" placeholder="e.g. Sam" value="${esc(club.mgr||'')}" autocomplete="nickname"></label>
    <small class="hint">Shown next to your club on the leaderboard, in View Squad and to your opponents online, so everyone can see whose team is whose.</small>
    <label class="pfl">Club name<input type="text" id="pf-club" maxlength="14" value="${esc(club.name||'')}"></label>
    <div class="pfrow"><button class="btn gold pfgo" data-pf="go">${first?'Let’s play':'Save'}</button></div>
    <div class="pacct"><h4>Save your progress with email <small>(optional)</small></h4>${found}
    ${acct&&!acct.hold?`<p>Logged in as <b>${esc(acct.e)}</b> · last saved ${ago(acct.at)}</p><div class="pfrow"><button class="btn" data-pf="sync">Save now</button><button class="btn" data-pf="out">Log out</button></div>`
      :acct&&acct.hold?'':`<div class="pfin"><input type="email" id="pf-email" placeholder="Email" autocomplete="username"><input type="password" id="pf-pw" placeholder="Password (8+ characters)" autocomplete="current-password"></div>
      <div class="pfrow"><button class="btn gold" data-pf="create">Create account</button><button class="btn" data-pf="login">Log in</button></div>`}
    <p class="hint" id="pf-msg">${esc(acctMsgTxt)}</p>
    <details><summary class="hint">How this works</summary><p class="hint">Log in on any device with the same email and password to carry on where you left off; it saves automatically after every change. Your save is locked on this device with your password before it’s stored on public relays, so nobody else can read it, and your email and password never leave this device. No email is sent, so there is no password reset: if you forget it, that copy can’t be opened. This device always keeps its own save too, and the save code under Club still works as a backup.</p></details></div></div>`;
  acctMsgSet(acctMsgTxt,acctMsgBad)}
const nameOk=s=>s.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,16);
$('prof').addEventListener('click',async e=>{const b=e.target.closest('[data-pf]');if(!b)return;const k=b.dataset.pf;
  if(k==='go'){const n=nameOk($('pf-name').value||'');if(n.length<2){$('pf-name').focus();acctMsgSet('Type your name (at least 2 letters) so others know whose team this is.',true);return}
    const wasFirst=!club.mgr;club.mgr=n;const cn=($('pf-club').value||'').trim().slice(0,14);if(cn)club.name=cn;acctMsgSet('');saveClub();renderMenu();regAuto();
    if(!acct||!acct.hold){$('prof').hidden=true;if(wasFirst&&club.tut&&!club.tut.done)setTimeout(tutShow,400)}else profRender();return}
  if(k==='x'){$('prof').hidden=true;return}
  if(k==='create'||k==='login'){b.disabled=true;try{await acctLogin(k==='create')}catch(err){acctMsgSet('Something went wrong; nothing was changed.',true)}b.disabled=false;acctPill();return}
  if(k==='sync'){const ok=await acctPushNow();acctMsgSet(ok?'Saved.':'Couldn’t reach the relays; it will keep trying.',!ok);return}
  if(k==='out'){acct=null;acctFound=null;acctSave();acctMsgSet('Logged out. Your progress stays on this device.');acctPill();profRender();return}
  if(k==='load'&&acctFound){acctLoad(acctFound);acctFound=null;acctMsgSet('Your account’s progress is loaded.');toast('Progress loaded from your account');acctPill();profRender();return}
  if(k==='keep'){acctFound=null;const ok=await acctPushNow(true);acctMsgSet(ok?'This device’s progress is now saved to your account.':'Couldn’t reach the relays; it will keep trying.',!ok);acctPill();profRender()}});
$('prof').addEventListener('keydown',e=>{if(e.key==='Enter'){if(e.target.id==='pf-name'||e.target.id==='pf-club'){const b=$('prof').querySelector('[data-pf="go"]');if(b)b.click()}else if(e.target.id==='pf-pw'){const b=$('prof').querySelector('[data-pf="login"]');if(b)b.click()}}e.stopPropagation()});
$('mgrpill').onclick=profOpen;
function profBoot(){acctPill();if(!club.mgr)setTimeout(profOpen,300);acctBoot()}
