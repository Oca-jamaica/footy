/* ---------- your nickname, and SAVE YOUR ACCOUNT (optional) ----------
   A nickname is all you need to play. It's asked for the first time the game opens (existing saves are kept; they're
   just asked for one), checked for length and characters, and shown next to your club on the leaderboard, in View
   Squad, in matchmaking and to opponents online. It's never used to identify you: every install gets a random internal
   id (club.pid, from the browser's secure random generator) and your public club profile has its own random id.

   Saving: progress is always saved on this device (browser storage). That copy goes if the browser's data is cleared,
   in a private window, or on another browser or device, so it can't always be recovered.
   SAVE YOUR ACCOUNT is optional. There's no Sunday Kickabout server, so it works like this: your email and password are
   turned on this device into a lock (PBKDF2-SHA256, 600,000 rounds) and a private address. Your save is locked
   (AES-GCM) here and the locked copy is kept on the public relays the online game uses, at that address. Only the same
   email AND password can find it or open it; the relays only ever see scrambled data, and the email and password never
   leave this device (the email is never shown anywhere public). After every save the game reads the copy back and
   opens it, and only then says it's saved, with how many relays confirmed it. No email is sent: there's no address
   check and no password reset. The relays are free public services and could clear a copy, so the device keeps its own
   save and the save code under Club is a further backup. Logins made with the first version (210,000 rounds) are moved
   to the stronger lock the next time you log in. */
const ACCT_T='sundaykickabout/acct1/';
let acct=null,acctTimer=null,acctBusy=false,acctMsgTxt='',acctMsgBad=false,acctFound=null,acctMigrated=null;const acctWait=new Map();
try{const a=JSON.parse(localStorage.getItem('kickabout-acct')||'null');if(a&&/^[0-9a-f]{32}$/.test(a.id)&&a.k)acct=a}catch(e){}
const acctSave=()=>{try{if(acct)localStorage.setItem('kickabout-acct',JSON.stringify(acct));else localStorage.removeItem('kickabout-acct')}catch(e){}};
const b64u8=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)};
const u8b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function acctDerive(email,pw,v=2){const te=new TextEncoder(),base=await crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveBits']);
  const b=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:te.encode((v===1?'sundaykickabout-acct-v1|':'sundaykickabout-acct-v2|')+email),iterations:v===1?210000:600000},base,512));
  // first half: the address; second half (an independent block): the lock
  return{id:[...b.slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join(''),k:b64u8(b.slice(32,64)),v}}
// where a login's copies live: first-version logins kept their address; newer ones use the stronger lock's
const acctTopic=a=>(a.v===2?ACCT_T2:ACCT_T)+a.id;const ACCT_T2='sundaykickabout/acct2/';
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
function acctMsg(tp,buf){const id=tp.slice(tp.lastIndexOf('/')+1),w=acctWait.get(id);if(w){w.list.push(new TextDecoder().decode(buf));if(!w.first)w.first=performance.now()}}
// read every relay's copy for this address and open the newest
async function acctFetch(id,k,v=2,wait=4500){const cl=await regConnect();if(!cl.length)return{ok:false,sv:null,n:0};const w={list:[],first:0,by:new Set()},tp=(v===2?ACCT_T2:ACCT_T)+id;acctWait.set(id,w);
  for(const c of cl){const sub=()=>{try{c.subscribe(tp,{qos:1})}catch(e){}};if(c.connected)sub();else c.once('connect',sub)}
  const t0=performance.now();await new Promise(r=>{const iv=setInterval(()=>{const n=performance.now();if(n-t0>wait||(w.first&&n-w.first>1500)){clearInterval(iv);r()}},100)});
  for(const c of cl)try{c.unsubscribe(tp)}catch(e){}acctWait.delete(id);
  let best=null,ats=[];for(const s of w.list){const sv=await acctOpen(s,k);if(sv){ats.push(+sv.at||0);if(!best||(+sv.at||0)>(+best.at||0))best=sv}}
  return{ok:cl.some(c=>c.connected),sv:best,ats,relays:cl.filter(c=>c.connected).length}}
const svKey=sv=>JSON.stringify([sv.club,sv.names||{},sv.custom||{}]);let acctKey='';
// save to the account, but only if something changed, and never over a newer copy another device saved meanwhile
// (that's asked about instead); "keep" is the player's explicit choice to replace the account's copy
async function acctPushNow(keep){if(!acct||acct.hold&&!keep)return false;const cl=await regConnect();if(!cl.some(c=>c.connected))return false;
  const sv=snapshotSave(),key=svKey(sv);if(key===acctKey&&!keep)return true;
  if(!keep){const r=await acctFetch(acct.id,acct.k,acct.v||1);if(r.ok&&r.sv&&(+r.sv.at||0)>(+acct.at||0)+1000&&svKey(r.sv)!==key){acct.hold=true;acctFound=r.sv;acctSave();acctPill();profOpen();return false}}
  const s=await acctSeal(sv);
  for(const c of cl){const go=()=>{try{c.publish(acctTopic(acct),s,{qos:1,retain:true})}catch(e){}};if(c.connected)go();else c.once('connect',go)}
  acct.at=sv.at;acct.hold=false;acctKey=key;acctSave();acctPill();if(!$('prof').hidden)profRender();
  acctVerify(sv.at);return true}
// read the copy back from the relays and open it: only a copy that's been shown to come back counts as saved
async function acctVerify(at){if(!acct)return;await new Promise(r=>setTimeout(r,1200));const r=await acctFetch(acct.id,acct.k,acct.v||1,3500);
  const n=r.ats.filter(a=>a===at).length;acct.ver={at,n,of:r.relays,t:Date.now()};acctSave();acctPill();if(!$('prof').hidden)profRender();
  // moved to the stronger lock and the new copy is confirmed: clear the old copy off the relays
  if(n&&acctMigrated){const old=ACCT_T+acctMigrated.id;acctMigrated=null;for(const c of await regConnect())if(c.connected)try{c.publish(old,'',{qos:1,retain:true})}catch(e){}}
  return n}
// after anything is saved on this device: a fresh locked copy a few seconds later (only from the menus, never mid-match)
function acctPush(){if(!acct||acct.hold)return;clearTimeout(acctTimer);acctTimer=setTimeout(async()=>{if(NET.on||state!=='menu'){acctPush();return}if(acctBusy){acctPush();return}acctBusy=true;try{await acctPushNow()}catch(e){}acctBusy=false},4000)}
function acctLoad(sv){try{localStorage.setItem('kickabout-club-before-load',JSON.stringify(snapshotSave()))}catch(e){}
  club={...club,...sv.club};loadClubFrom(JSON.parse(JSON.stringify(sv.club)));NAMES={...(sv.names||{})};applyNames();
  if(sv.custom&&sv.custom.name)custom={...custom,...sv.custom,isCustom:true};best=Math.max(best,+sv.best||0);
  try{localStorage.setItem('kickabout-club',JSON.stringify(club));localStorage.setItem('kickabout-names',JSON.stringify(NAMES));localStorage.setItem('kickabout-custom',JSON.stringify(custom));localStorage.setItem('kickabout-best3',best)}catch(e){}
  acct.at=+sv.at||Date.now();acct.hold=false;acctKey=svKey(snapshotSave());acctSave();cloudPush();setup();renderMenu();regAuto();
  if(acctMigrated)setTimeout(()=>acctPushNow(true),100)}
// nothing to lose on this device yet: no matches played, starting players and coins untouched
const freshClub=()=>(club.played||0)===0&&club.owned.length<=13&&(club.coins||0)>=1400;
const svLine=sv=>{const c=sv.club;return `${esc(c.name||'My Club')}${c.mgr?' · manager '+esc(c.mgr):''} · ${c.owned.length} players · ${(+c.coins||0).toLocaleString()} coins · ${c.played||0} matches played`};
const emailOk=e=>/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(e);
// a password that would take real work to guess: 10+ characters with some variety (or 16+), not a well-known one,
// and not just the email's name
const COMMONPW=['password','passw0rd','1234567890','qwertyuiop','iloveyou','football','sunday','kickabout','letmein','welcome','abc123','123456789'];
function pwProblem(pw,e){if(pw.length<10)return 'Use a password of at least 10 characters.';const kinds=[/[a-z]/,/[A-Z]/,/[0-9]/,/[^A-Za-z0-9]/].filter(r=>r.test(pw)).length;
  if(pw.length<16&&kinds<2)return 'Mix letters with numbers or symbols (or use 16+ characters).';const lo=pw.toLowerCase();
  if(COMMONPW.some(c=>lo.includes(c))&&pw.length<16)return 'That password is too easy to guess.';const nm=(e.split('@')[0]||'').toLowerCase();if(nm.length>=4&&lo.includes(nm))return 'Don’t use your email’s name in the password.';return ''}
async function acctLogin(create){const e=($('pf-email').value||'').trim().toLowerCase(),pw=$('pf-pw').value||'';
  if(!emailOk(e)){acctMsgSet('That email doesn’t look right.',true);return}
  {const pp=create?pwProblem(pw,e):pw.length<8?'That password is too short.':'';if(pp){acctMsgSet(pp+' Pick one you don’t use anywhere else.',true);return}}
  if(!window.crypto||!crypto.subtle){acctMsgSet('This browser can’t lock saves (it needs a secure page). Use the save code under Club instead.',true);return}
  acctMsgSet(create?'Creating your account…':'Looking for your save…');const d=await acctDerive(e,pw,2);let r=await acctFetch(d.id,d.k,2);
  if(!r.ok){acctMsgSet('Couldn’t reach the save relays (are you online?). Nothing was changed; try again in a moment.',true);return}
  // a save made with the first version of the lock: open it, then it moves to the stronger lock on the next save
  if(!r.sv){const d1=await acctDerive(e,pw,1),r1=await acctFetch(d1.id,d1.k,1);if(r1.sv){r=r1;acctMigrated={id:d1.id}}}
  acct={e,id:d.id,k:d.k,v:2,at:0};
  if(r.sv){if(freshClub()){acctLoad(r.sv);acctMsgSet('Welcome back! Your progress has been loaded.');toast('Progress loaded from your account');profRender();return}
    acct.hold=true;acctSave();acctFound=r.sv;acctMsgSet('');profRender();return}
  if(!create){acct=null;acctMsgSet('No save found for that email and password. Check both, or press Create account to start one with this device’s progress.',true);return}
  acctSave();const ok=await acctPushNow();acctMsgSet(ok?'Account created. Your progress is saved and will keep saving automatically.':'Account created, but the first save didn’t go through yet; it will retry.');profRender()}
function acctMsgSet(m,bad){acctMsgTxt=m;acctMsgBad=!!bad;const el=$('pf-msg');if(el){el.textContent=m;el.style.color=bad?'var(--coral)':''}}
// on start-up: if another device saved since this one last did, ask before anything is overwritten
async function acctBoot(){if(!acct)return;try{const r=await acctFetch(acct.id,acct.k,acct.v||1);if(!r.ok)return;
  if(r.sv&&(+r.sv.at||0)>(+acct.at||0)+1000&&JSON.stringify(r.sv.club)!==JSON.stringify(club)){acct.hold=true;acctFound=r.sv;acctSave();profOpen();return}
  acct.hold=false;acctSave();acctPush()}catch(e){}}
function acctPill(){const el=$('mgrpill');if(!el)return;el.textContent=(club.mgr||'Pick a nickname')+(acct?' ☁':'');el.title=acct?'Your profile · saving to your account':'Your profile · saved on this device (SAVE YOUR ACCOUNT is optional)'}
function profOpen(){profRender();$('prof').hidden=false;setTimeout(()=>{const i=$(club.mgr?'pf-email':'pf-name');if(i&&!acct)i.focus()},50)}
function profRender(){const box=$('prof'),first=!club.mgr,ago=a=>{const s=Math.round((Date.now()-a)/1000);return !a?'not yet':s<60?'just now':s<3600?Math.round(s/60)+' min ago':Math.round(s/3600)+' h ago'};
  const found=acctFound&&acct&&acct.hold?`<div class="pfound"><b>Progress found on your account</b><p>${svLine(acctFound)}<br><small>saved ${ago(+acctFound.at)}</small></p><p><b>On this device:</b> ${svLine({club})}</p>
    <div class="pfrow"><button class="btn gold" data-pf="load">Load my account’s progress</button><button class="btn" data-pf="keep">Keep this device’s (replaces the account copy)</button></div></div>`:'';
  const v=acct&&acct.ver&&acct.ver.at===acct.at?acct.ver:null;
  const cloudLine=!acct?'<span class="pfoff">Off</span> · optional':acct.hold?'<span class="pfwarn">Waiting for you to choose below</span>'
    :v?(v.n?`<span class="pfok">On</span> · last saved ${ago(acct.at)}, read back from ${v.n} of ${v.of} relay${v.of===1?'':'s'}`:`<span class="pfwarn">Not confirmed</span> · the last save couldn’t be read back yet; keep a save code (Club tab) as a backup`)
    :acct.at?`<span class="pfok">On</span> · saved ${ago(acct.at)}, checking…`:'<span class="pfok">On</span>';
  box.innerHTML=`<div class="sqbox pbox" role="dialog" aria-label="Your profile">${first?'':'<button class="ghost sqx" data-pf="x">Close</button>'}
    <h3>${first?'Welcome to Sunday Kickabout!':'Your profile'}</h3>
    ${first?'<p class="hint">Pick a nickname and you’re ready to play. No email needed.</p>':''}
    <label class="pfl">Nickname<input type="text" id="pf-name" maxlength="16" placeholder="e.g. Sam" value="${esc(club.mgr||'')}" autocomplete="nickname"></label>
    <small class="hint">2–16 characters: letters, numbers, spaces and . _ - '. Shown next to your club on the leaderboard, in View Squad, in matchmaking and to opponents online.</small>
    <label class="pfl">Club name<input type="text" id="pf-club" maxlength="14" value="${esc(club.name||'')}"></label>
    <div class="pfrow"><button class="btn gold pfgo" data-pf="go">${first?'Let’s play':'Save'}</button></div>
    <div class="psaves"><p><b>Saved on this device:</b> <span class="pfok">On</span> · automatic, in this browser. Clearing the browser’s data, a private window, or another browser or device won’t have it, so on its own it can’t always be recovered.</p>
      <p><b>Saved to your account:</b> ${cloudLine}</p></div>
    ${ops.on&&!first?`<div class="psaves"><p><b>Share live status with the game’s developer:</b> <span class="${opsShare()?'pfok':'pfoff'}">${opsShare()?'On':'Off'}</span> <button class="btn" data-pf="share">${opsShare()?'Turn off':'Turn on'}</button></p>
      <p class="hint">Sends your nickname, club, what you’re doing (menus, a match, an online game and its score) and the game version, encrypted so only the developer can read it. It helps them see how many people are playing and fix problems. Never your email, password or location. <button class="btn" data-ops="prob">Report a problem</button></p></div>`:''}
    <details class="pacct" ${first&&!acct?'':'open'}><summary><h4>SAVE YOUR ACCOUNT <small>(optional)</small></h4></summary>${found}
    <p class="hint">Email is optional: you can play everything without it. Add an email and password to keep a locked copy of your progress online, which can help you recover it or carry on on another device. Your email is never shown to anyone.</p>
    ${acct&&!acct.hold?`<p>Logged in as <b>${esc(acct.e)}</b></p><div class="pfrow"><button class="btn" data-pf="sync">Save now</button><button class="btn" data-pf="out">Log out</button></div>`
      :acct&&acct.hold?'':`<div class="pfin"><input type="email" id="pf-email" placeholder="Email" autocomplete="username"><input type="password" id="pf-pw" placeholder="Password (10+ characters)" autocomplete="current-password"></div>
      <div class="pfrow"><button class="btn gold" data-pf="create">Create account</button><button class="btn" data-pf="login">Log in</button></div>`}
    <p class="hint" id="pf-msg">${esc(acctMsgTxt)}</p>
    <details><summary class="hint">How it works</summary><p class="hint">Log in on any device with the same email and password to carry on; it saves by itself after every change, and each save is read back from the relays before it counts. Your progress is locked on this device with your password (PBKDF2 + AES-GCM) before it leaves, so the relays only see scrambled data, and your email and password never leave this device. There’s no Sunday Kickabout server: copies are kept on free public relays, which could clear them, so this device keeps its own save too and the save code under Club is a further backup. No email is sent, so there’s no password reset: if you forget the password, that copy can’t be opened.</p></details></details></div>`;
  acctMsgSet(acctMsgTxt,acctMsgBad)}
// nicknames: 2-16 characters, letters (any language), numbers, spaces and . _ - ' (starting with a letter or number)
function nickCheck(raw){const s=String(raw||'').replace(/\s+/g,' ').trim();
  if(s.length<2)return{err:'Your nickname needs at least 2 characters.'};if(s.length>16)return{err:'Keep your nickname to 16 characters or fewer.'};
  if(!/^[\p{L}\p{N}][\p{L}\p{N} ._'\-]*$/u.test(s))return{err:'Use letters, numbers, spaces and . _ - \' only, starting with a letter or number.'};return{ok:s}}
// other players' names as they arrive: anything outside those characters is dropped
const nameOk=s=>String(s||'').replace(/[^\p{L}\p{N} ._'\-]/gu,'').replace(/\s+/g,' ').trim().slice(0,16);
// every install gets its own random internal id (never the nickname); the public club id is random too
function pidEnsure(){if(!club.pid||!/^[0-9a-f]{32}$/.test(club.pid)){const b=crypto.getRandomValues(new Uint8Array(16));club.pid=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');saveClub()}}
$('prof').addEventListener('click',async e=>{const b=e.target.closest('[data-pf]');if(!b)return;const k=b.dataset.pf;
  if(k==='go'){const c=nickCheck($('pf-name').value);if(c.err){$('pf-name').focus();acctMsgSet(c.err,true);return}const n=c.ok;
    const wasFirst=!club.mgr;club.mgr=n;pidEnsure();const cn=($('pf-club').value||'').trim().slice(0,14);if(cn)club.name=cn;acctMsgSet('');saveClub();renderMenu();regAuto();
    if(!acct||!acct.hold){$('prof').hidden=true;if(wasFirst&&club.tut&&!club.tut.done)setTimeout(tutShow,400)}else profRender();return}
  if(k==='x'){$('prof').hidden=true;return}
  if(k==='share'){club.opsShare=!opsShare();saveClub();if(opsShare())opsHB(true);profRender();return}
  if(k==='create'||k==='login'){b.disabled=true;try{await acctLogin(k==='create')}catch(err){acctMsgSet('Something went wrong; nothing was changed.',true)}b.disabled=false;acctPill();return}
  if(k==='sync'){const ok=await acctPushNow();acctMsgSet(ok?'Saved.':'Couldn’t reach the relays; it will keep trying.',!ok);return}
  if(k==='out'){acct=null;acctFound=null;acctSave();acctMsgSet('Logged out. Your progress stays on this device.');acctPill();profRender();return}
  if(k==='load'&&acctFound){acctLoad(acctFound);acctFound=null;acctMsgSet('Your account’s progress is loaded.');toast('Progress loaded from your account');acctPill();profRender();return}
  if(k==='keep'){acctFound=null;const ok=await acctPushNow(true);acctMsgSet(ok?'This device’s progress is now saved to your account.':'Couldn’t reach the relays; it will keep trying.',!ok);acctPill();profRender()}});
$('prof').addEventListener('keydown',e=>{if(e.key==='Enter'){if(e.target.id==='pf-name'||e.target.id==='pf-club'){const b=$('prof').querySelector('[data-pf="go"]');if(b)b.click()}else if(e.target.id==='pf-pw'){const b=$('prof').querySelector('[data-pf="login"]');if(b)b.click()}}e.stopPropagation()});
$('mgrpill').onclick=profOpen;
function profBoot(){if(club.mgr)pidEnsure();acctPill();if(!club.mgr)setTimeout(profOpen,300);acctBoot()}
// the club name follows the nickname until you choose one yourself
$('prof').addEventListener('input',e=>{if(e.target.id==='pf-club')e.target.dataset.touched='1';if(e.target.id==='pf-name'&&!club.mgr){const c=$('pf-club');if(c&&!c.dataset.touched&&/^(Sunday XI|.*FC)$/.test(c.value)){const n=nickCheck(e.target.value);c.value=n.ok?(n.ok+' FC').slice(0,14):'Sunday XI'}}});
