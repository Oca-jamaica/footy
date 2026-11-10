// ---------- the transfer market ----------
/* Sell your footballers to other managers for coins, buy theirs, or sell one straight back to the game.

   The developer's dashboard server is the referee (server/lib/market.js). Listing, changing a price, cancelling and
   buying are requests sent inside the game's encrypted messages; the server applies them one at a time (so a player
   can only ever be sold once) and sends each result back signed with its private key. This game acts only on signed
   results, and applies each one once:
   - selling: the player is locked the moment you list him (out of your line-ups, can't be played, developed or sold
     again) until he sells (he leaves your club and the price is added to your coins), you cancel, or the listing
     expires after three days (he's back);
   - buying: the price leaves your coins straight away and is held while the server decides. Bought: the player joins
     your club with his development. Refused (someone else was quicker, the price changed, the listing went): the coins
     come back. A request the server never received is cleared after a few seconds and the coins come back too.
   If you're offline when your player sells, the coins arrive the next time the game connects.

   Instant sale: straight to the game for half of what the player originally cost, which is the price of the pack he was
   signed from (an Icon from a 50,000-coin Icon Pack sells for 25,000). Players who didn't come from a pack (your
   starters, rewards, anyone signed before this version) count at their rarity's own pack price. A player keeps his
   original price when he's sold on the market, so buying a player and selling him back to the game can't make coins. */
const MKT_T='sundaykickabout/mkt1/',MKT_MIN=100,MKT_MAX=10000000,MKT_PER=10;
const PACKOF={bronze:250,silver:750,gold:2000,special:12500,icon:50000};
const MKS={idxTs:0,idxAt:0,ids:null,L:new Map(),subL:false,mid:'',midOf:'',view:'browse',sel:null,ask:null,msg:'',f:{rar:'all',pmin:'',pmax:'',rmin:'',rmax:'',sort:'new'},cl:new WeakSet(),tick:null};
const mktRand=n=>opsHex(crypto.getRandomValues(new Uint8Array(n)));
function mktSt(){const m=club.mkt=club.mkt||{};if(!/^[0-9a-f]{64}$/.test(m.sk||''))m.sk=mktRand(32);
  m.list=m.list&&typeof m.list==='object'?m.list:{};m.pend=m.pend&&typeof m.pend==='object'?m.pend:{};m.done=Array.isArray(m.done)?m.done:[];m.hist=Array.isArray(m.hist)?m.hist:[];return m}
async function mktMid(){const m=mktSt();if(!MKS.mid||MKS.midOf!==m.sk){MKS.mid=(await opsSha('sk-mkt1:'+m.sk)).slice(0,16);MKS.midOf=m.sk}return MKS.mid}
const mktOn=()=>ops.on;
// open = the server's signed index of listings arrived in the last 90 s (it sends one every 30 s)
const mktOpen=()=>MKS.idxAt>0&&performance.now()-MKS.idxAt<90000;
// a listed player is locked: not in your line-ups, can't be played, developed, listed again or sold to the game
function mktLocked(id){const m=club.mkt;if(!m||!m.list)return false;for(const k in m.list)if(m.list[k].pid===id)return true;return false}
const origOf=id=>{const p=byId(id),r=p?tier(p):'bronze',v=(club.paid||{})[id];return Number.isFinite(v)&&v>0?v:PACKOF[r]||250};
const instantOf=id=>Math.floor(origOf(id)/2);
// the prices a player of this rarity can legitimately have cost (the packs that can give him)
const origOk=(r,v)=>PACKS.some(k=>k.odds[r]>0&&k.cost===v)||PACKOF[r]===v;
function mktWhyNot(id){const p=byId(id);if(!p||p.isCustom)return'Your created player can’t be sold.';if(id==='wes')return'Wes is your club’s own player and can’t be sold.';
  if(!club.owned.includes(id))return'He isn’t in your club.';if(mktLocked(id))return'He’s already on the market.';
  if(ownedPlayers().length<=4)return'You need at least four other players to keep a team.';return''}
// a card as it travels: the database player plus his development and original price
function mktCard(id){const p=byId(id);return{id,rar:tier(p),xp:xpOf(id),up:{...upOf(id)},abl:ablOf(id),evo:evoOf(id).st,orig:origOf(id)}}
// a card from the market, checked against this game's own rules (rarity from the database; development and original
// price clamped to what's actually possible for him)
function mktClean(c){if(!c||typeof c!=='object')return null;const p=byId(String(c.id||''));if(!p||p.isCustom||p.id==='wes')return null;const r=tier(p),n=v=>Math.round(+v)||0;
  const up={};let left=UPCAP[r];for(const [k] of STATK){const v=clamp(n((c.up||{})[k]),0,Math.min(STATMAX,left));if(v){up[k]=v;left-=v}}
  return{id:p.id,rar:r,xp:clamp(n(c.xp),0,XPL[XPL.length-1]),up,abl:clamp(n(c.abl)||1,1,ABMAX),evo:clamp(n(c.evo),0,EVO[r].boost.length),orig:origOk(r,n(c.orig))?n(c.orig):PACKOF[r]}}
// look at a market card as if he were in your club (his development applied), without touching your club
function withCard(c,fn){const id=c.id,K=['xp','up','abl','evo'],old={};for(const k of K){club[k]=club[k]||{};old[k]=Object.prototype.hasOwnProperty.call(club[k],id)?club[k][id]:undefined}
  club.xp[id]=c.xp;club.up[id]=c.up;club.abl[id]=c.abl;club.evo[id]={st:c.evo,m:0,g:0,p:0,t:0};
  try{return fn(byId(id))}finally{for(const k of K){if(old[k]===undefined)delete club[k][id];else club[k][id]=old[k]}}}
// a player leaves your club; if you still have a spare copy of him, that copy takes his place (back to his base card)
function mktGone(id){for(const q of [...club.squads,...club.csquads])q.s=q.s.map(x=>x===id?null:x);
  for(const k of ['xp','up','abl','evo','paid'])if(club[k])delete club[k][id];
  if((club.dupes||{})[id]>0){club.dupes[id]--;if(!club.dupes[id])delete club.dupes[id];return'spare'}
  club.owned=club.owned.filter(x=>x!==id);return'gone'}
// a player you've bought joins your club with his development (as a spare copy if you already have him)
function mktJoin(c){if(club.owned.includes(c.id)){club.dupes=club.dupes||{};club.dupes[c.id]=(club.dupes[c.id]||0)+1;return'spare'}
  club.owned.push(c.id);club.xp=club.xp||{};club.up=club.up||{};club.abl=club.abl||{};club.evo=club.evo||{};club.paid=club.paid||{};
  club.xp[c.id]=c.xp;club.up[c.id]=c.up;club.abl[c.id]=c.abl;club.evo[c.id]={st:c.evo,m:0,g:0,p:0,t:0};club.paid[c.id]=c.orig;try{careerSigned(byId(c.id))}catch(e){}return'new'}
const mktName=id=>{const p=byId(id);return p?p.name:'that player'};
function mktNote(t){MKS.msg=t;try{toast(t)}catch(e){}}
function mktHist(o){const m=mktSt();m.hist.unshift({...o,at:Date.now()});m.hist=m.hist.slice(0,40)}

// ---- talking to the server ----
async function mktSend(a,data,rq=mktRand(6)){if(!mktOn())return false;const m=mktSt();const ok=await opsSend('mkt',{a,rq,msk:m.sk,...data},true);return ok?rq:false}
async function mktSub(withListings){if(!mktOn()||!await opsInit())return;const mid=await mktMid(),cl=await regConnect();if(withListings)MKS.subL=true;
  const topics=[MKT_T+'idx',MKT_T+'u/'+mid,...(MKS.subL?[MKT_T+'l/+']:[])];
  for(const c of cl){const sub=()=>{try{c.subscribe(topics,{qos:1})}catch(e){}};if(c.connected)sub();if(!MKS.cl.has(c)){MKS.cl.add(c);c.on('connect',()=>{try{c.subscribe([MKT_T+'idx',MKT_T+'u/'+MKS.mid,...(MKS.subL?[MKT_T+'l/+']:[])],{qos:1})}catch(e){}})}}}
// signed messages from the server (listings, the index, your results); anything else is ignored
async function mktMsg(tp,buf){if(!mktOn()||!await opsInit())return;const lid=tp.startsWith(MKT_T+'l/')?tp.slice(MKT_T.length+2):'';
  if(!buf||!buf.length){if(lid&&MKS.L.delete(lid))mktRefresh();return}
  let d;try{d=JSON.parse(new TextDecoder().decode(buf))}catch(e){return}if(!d||d.v!==1||typeof d.p!=='string'||typeof d.s!=='string'||d.p.length>400000)return;
  let ok=false;try{ok=await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},ops.sigK,opsUnB64(d.s),opsTE(d.p))}catch(e){}if(!ok)return;
  let p;try{p=JSON.parse(d.p)}catch(e){return}if(!p||!Number.isFinite(+p.ts))return;
  if(p.k==='mki'&&tp===MKT_T+'idx'){if(+p.ts<MKS.idxTs)return;const fresh=+p.ts>MKS.idxTs&&(MKS.idxTs>0||Math.abs(Date.now()-p.ts)<300000);MKS.idxTs=+p.ts;MKS.ids=new Set((Array.isArray(p.ids)?p.ids:[]).map(String));if(fresh&&p.open)MKS.idxAt=performance.now();mktRefresh()}
  else if(p.k==='mkl'&&lid&&p.l&&p.l.lid===lid){const o=MKS.L.get(lid);if(o&&o.ts>p.ts)return;const c=mktClean(p.l.card);if(!c)return;
    MKS.L.set(lid,{lid,card:c,price:Math.round(+p.l.price)||0,at:+p.l.at||0,exp:+p.l.exp||0,nm:String(p.l.nm||'').slice(0,20),mg:String(p.l.mg||'').slice(0,16),rid:String(p.l.rid||''),ts:+p.ts});mktRefresh()}
  else if(p.k==='mko'&&tp===MKT_T+'u/'+MKS.mid&&p.mid===MKS.mid&&Array.isArray(p.recs))mktApply(p.recs)}
// your results, each applied once
function mktApply(recs){const m=mktSt();let ch=false;
  for(const r of recs){if(!r||typeof r.id!=='string'||m.done.includes(r.id))continue;m.done.push(r.id);ch=true;const l=m.list[r.lid],why=String(r.why||'').slice(0,120);
    switch(r.t){
      case 'listed':if(l&&l.rq===r.rq){l.st='active';l.exp=+r.exp||0;delete l.rq;mktNote(`${mktName(l.pid)} is on the transfer market for ${l.price.toLocaleString()} coins.`)}break;
      case 'list-no':if(l&&l.rq===r.rq){delete m.list[r.lid];mktNote(`Couldn’t list ${mktName(l.pid)}: ${why}. He’s back in your club.`)}break;
      case 'priced':if(l){l.price=Math.round(+r.price)||l.price;if(l.prq===r.rq){delete l.prq;mktNote(`${mktName(l.pid)} is now ${l.price.toLocaleString()} coins.`)}}break;
      case 'price-no':if(l&&l.prq===r.rq){delete l.prq;mktNote(`Couldn’t change the price: ${why}.`)}break;
      case 'cancelled':if(l){delete m.list[r.lid];mktNote(`${mktName(l.pid)} is off the market and back in your club.`);mktHist({t:'cancelled',pid:l.pid,price:l.price})}break;
      case 'cancel-no':if(l&&l.crq===r.rq){delete l.crq;mktNote(`Couldn’t cancel: ${why}.`)}break;
      case 'sold':if(l&&l.pid===r.pid){delete m.list[r.lid];const price=clamp(Math.round(+r.price)||0,0,MKT_MAX),spare=mktGone(l.pid)==='spare';club.coins+=price;
        mktHist({t:'sold',pid:l.pid,price,who:String(r.to||'').slice(0,20)});mktNote(`Sold ${mktName(l.pid)} to ${String(r.to||'another manager').slice(0,20)} for ${price.toLocaleString()} coins!${spare?' Your spare copy of him takes his place.':''}`)}break;
      case 'bought':{const P=m.pend[r.rq];if(P&&P.lid===r.lid){delete m.pend[r.rq];const c=mktClean(r.card);const paid=Math.round(+r.price)||P.price;if(paid!==P.price)club.coins+=P.price-paid;
        if(c){const how=mktJoin(c);mktHist({t:'bought',pid:c.id,price:paid,who:String(r.from||'').slice(0,20)});mktNote(`Signed ${mktName(c.id)} for ${paid.toLocaleString()} coins!${how==='spare'?' You already had him, so he’s kept as a spare copy.':''}`)}}break}
      case 'buy-no':{const P=m.pend[r.rq];if(P){delete m.pend[r.rq];club.coins+=P.price;mktNote(`Couldn’t buy ${mktName(P.pid)}: ${why}. Your ${P.price.toLocaleString()} coins are back.`)}break}
      case 'void':{const P=m.pend[r.rq];if(P){delete m.pend[r.rq];club.coins+=P.price;mktNote(`The market didn’t get your offer for ${mktName(P.pid)}. Your coins are back; try again.`)}
        for(const k of Object.keys(m.list)){const x=m.list[k];if(x.rq===r.rq){delete m.list[k];mktNote(`The market didn’t get your listing for ${mktName(x.pid)}. He’s back in your club; try again.`)}if(x.prq===r.rq)delete x.prq;if(x.crq===r.rq)delete x.crq}break}
      case 'expired':if(l){delete m.list[r.lid];mktNote(`${mktName(l.pid)} didn’t sell in three days and is back in your club.`);mktHist({t:'expired',pid:l.pid,price:l.price})}break;
      case 'removed':if(l){delete m.list[r.lid];mktNote(`${mktName(l.pid)} was taken off the market by a moderator${why?': '+why:''}. He’s back in your club.`)}break}}
  if(m.done.length>400)m.done.splice(0,m.done.length-400);
  if(ch){saveClub();if(state==='menu')renderMenu()}}
// requests not answered after a few seconds: ask the server; any it never got are cleared (coins back, player unlocked)
function mktWaiting(){const m=club.mkt;if(!m)return[];const t=Date.now(),out=[];
  for(const [rq,P] of Object.entries(m.pend||{}))if(t-P.at>8000)out.push(rq);
  for(const l of Object.values(m.list||{}))for(const [k,a] of [['rq','at'],['prq','pat'],['crq','cat']])if(l[k]&&t-(l[a]||0)>8000)out.push(l[k]);return out}
async function mktSync(){const w=mktWaiting();if(!w.length||!mktOpen())return;await mktSend('sync',{pend:w.slice(0,40)})}
function mktRefresh(){if(state==='menu'&&tab==='club'&&ctab==='market'&&$('mk-body'))mktDraw()}
function mktBoot(){if(!mktOn())return;const m=club.mkt;// if you've anything going on the market, listen for the results straight away
  if(m&&(Object.keys(m.list||{}).length||Object.keys(m.pend||{}).length))mktSub(false);
  MKS.tick=setInterval(()=>{if(club.mkt&&mktWaiting().length)mktSync();if(state==='menu'&&tab==='club'&&ctab==='market')mktRefresh()},12000)}

// ---- the three actions ----
async function mktList(id,price){const why=mktWhyNot(id);if(why){mktNote(why);return}price=Math.round(+price);
  if(!(price>=MKT_MIN&&price<=MKT_MAX)){mktNote(`Pick a price from ${MKT_MIN.toLocaleString()} to ${MKT_MAX.toLocaleString()} coins.`);return}
  const m=mktSt();if(Object.keys(m.list).length>=MKT_PER){mktNote(`You can have at most ${MKT_PER} players on the market at once.`);return}
  if(!mktOpen()){mktNote('The market is closed right now. Try again later.');return}
  const lid=mktRand(6),rq=mktRand(6);m.list[lid]={lid,pid:id,price,st:'pending',at:Date.now(),rq};
  for(const q of [...club.squads,...club.csquads])q.s=q.s.map(x=>x===id?null:x);saveClub();
  if(!await mktSend('list',{lid,price,card:mktCard(id)},rq)){delete m.list[lid];saveClub();mktNote('Couldn’t reach the market. Check your connection and try again.');renderMenu();return}
  mktNote(`Listing ${mktName(id)}…`);renderMenu()}
async function mktReprice(lid,price){const m=mktSt(),l=m.list[lid];price=Math.round(+price);if(!l||l.st!=='active')return;
  if(!(price>=MKT_MIN&&price<=MKT_MAX)){mktNote(`Pick a price from ${MKT_MIN.toLocaleString()} to ${MKT_MAX.toLocaleString()} coins.`);return}
  const rq=mktRand(6);l.prq=rq;l.pat=Date.now();saveClub();if(!await mktSend('price',{lid,price},rq)){delete l.prq;saveClub();mktNote('Couldn’t reach the market. Check your connection and try again.');return}mktNote('Changing the price…');renderMenu()}
async function mktCancel(lid){const m=mktSt(),l=m.list[lid];if(!l||l.st!=='active')return;
  const rq=mktRand(6);l.crq=rq;l.cat=Date.now();saveClub();if(!await mktSend('cancel',{lid},rq)){delete l.crq;saveClub();mktNote('Couldn’t reach the market. Check your connection and try again.');return}mktNote('Taking him off the market…');renderMenu()}
async function mktBuy(lid){const L=MKS.L.get(lid),m=mktSt();if(!L||!mktOpen()){mktNote('That listing isn’t available right now.');return}
  if(Object.values(m.list).some(x=>x.lid===lid)){mktNote('That’s your own listing.');return}
  if(Object.values(m.pend).some(P=>P.lid===lid)){mktNote('You’ve already made an offer for him.');return}
  if(club.coins<L.price){mktNote('You don’t have enough coins.');return}
  // the coins are held while the server decides; refused or never received, they come back
  club.coins-=L.price;const rq=mktRand(6);m.pend[rq]={lid,pid:L.card.id,price:L.price,at:Date.now()};saveClub();
  if(!await mktSend('buy',{lid,price:L.price},rq)){delete m.pend[rq];club.coins+=L.price;saveClub();mktNote('Couldn’t reach the market. Your coins weren’t taken.');renderMenu();return}
  mktNote(`Buying ${mktName(L.card.id)}…`);renderMenu()}
function mktInstant(id){const why=mktWhyNot(id);if(why){mktNote(why);return}const v=instantOf(id),nm=mktName(id),spare=mktGone(id)==='spare';club.coins+=v;
  mktHist({t:'instant',pid:id,price:v});saveClub();mktNote(`Sold ${nm} to the game for ${v.toLocaleString()} coins.${spare?' Your spare copy of him takes his place.':''}`);MKS.sel=null;renderMenu()}

// ---- the screen: Club → Transfer Market (Browse Market, My Listings, Sell Players) ----
const RARN={bronze:'Bronze',silver:'Silver',gold:'Gold',special:'Special',icon:'Icon'};
const MKST=[['pace','PAC'],['shot','SHO'],['fin','FIN'],['skill','SKI'],['pass','PAS'],['tackle','TAC'],['str','STR']];
const mkLeft=ms=>{ms=Math.max(0,ms);const m=Math.floor(ms/60000),h=Math.floor(m/60),d=Math.floor(h/24);return d?`${d}d ${h%24}h`:h?`${h}h ${m%60}m`:`${m}m`};
// one player row: rating, name, rarity, position, level and his seven stats as they'd be in your club
function mktRow(c,right){return withCard(c,p=>{const s=playStats(p),o=ovr(s);
  return `<div class="mkrow t-${c.rar}"><div class="mkp"><b class="mko">${o}</b><span><b>${esc(p.name)}</b><small>${RARN[c.rar]} · ${natPos(p)} · Level ${lvlOf(c.id)}${c.evo?` · Evolution ${c.evo}`:''}</small></span></div>
    <div class="mkst">${MKST.map(([k,n])=>`<span><i>${n}</i>${Math.round((s[k]||0)*100)}</span>`).join('')}</div><div class="mkr">${right}</div></div>`})}
function mktHTML(){const m=mktSt(),nL=Object.keys(m.list).length,nP=Object.keys(m.pend).length;
  return `<div class="mk"><div class="mkhead"><b>Transfer Market</b><span id="mk-state"></span></div>
    <div class="mktabs" role="tablist">${[['browse','Browse Market'],['mine','My Listings'],['sell','Sell Players']].map(([k,n])=>`<button role="tab" data-mkv="${k}" aria-selected="${MKS.view===k}">${n}${k==='mine'&&nL+nP?` <em>${nL+nP}</em>`:''}</button>`).join('')}</div>
    <p class="mkmsg" id="mk-msg" role="status"></p><div id="mk-ask"></div><div id="mk-body"></div></div>`}
function mktStateHTML(){if(!mktOn())return'<span class="mkoff">Not available in this copy of the game</span>';
  return mktOpen()?'<span class="mkon">● Market open</span>':'<span class="mkoff">○ Market closed right now (its server isn’t running). Instant sales still work.</span>'}
function mktDraw(){const st=$('mk-state'),msg=$('mk-msg'),body=$('mk-body'),ask=$('mk-ask');if(!body)return;st.innerHTML=mktStateHTML();msg.textContent=MKS.msg||'';
  ask.innerHTML=MKS.ask?mktAskHTML():'';body.innerHTML=MKS.view==='mine'?mktMineHTML():MKS.view==='sell'?mktSellHTML():mktBrowseHTML()}
// the confirmation step every action goes through
function mktAskHTML(){const a=MKS.ask,co=n=>n.toLocaleString();let t='',go='Confirm';
  if(a.kind==='buy'){const L=MKS.L.get(a.lid);if(!L)return'';t=`Buy <b>${esc(mktName(L.card.id))}</b> for <b>${co(L.price)} coins</b>? The coins are held while the market confirms. If someone beats you to him, they come straight back.`;go='Buy him'}
  else if(a.kind==='list'){t=`Put <b>${esc(mktName(a.id))}</b> on the market for <b>${co(a.price)} coins</b>? He leaves your line-ups and can’t play until he sells, you cancel, or the listing ends after three days.`;go='List him'}
  else if(a.kind==='instant'){t=`Sell <b>${esc(mktName(a.id))}</b> to the game for <b>${co(instantOf(a.id))} coins</b> (half his original ${co(origOf(a.id))})? This can’t be undone.`;go='Sell now'}
  else if(a.kind==='cancel'){const l=mktSt().list[a.lid];if(!l)return'';t=`Take <b>${esc(mktName(l.pid))}</b> off the market? He’ll be back in your club.`;go='Take him off'}
  else if(a.kind==='price'){const l=mktSt().list[a.lid];if(!l)return'';t=`Change the price of <b>${esc(mktName(l.pid))}</b> from ${co(l.price)} to <b>${co(a.price)} coins</b>?`;go='Change price'}
  return `<div class="mkask" role="alertdialog" aria-label="Confirm"><p>${t}</p><div><button class="btn gold" data-mkdo="yes">${go}</button><button class="btn" data-mkdo="no">Cancel</button></div></div>`}
function mktBrowseHTML(){const f=MKS.f,m=mktSt(),now=Date.now(),n=v=>v===''?null:+v;const pmin=n(f.pmin),pmax=n(f.pmax),rmin=n(f.rmin),rmax=n(f.rmax);
  let rows=[...MKS.L.values()].filter(L=>(!MKS.ids||MKS.ids.has(L.lid))&&L.exp>now);
  const rated=rows.map(L=>({L,o:withCard(L.card,p=>effOvr(p))}));
  let list=rated.filter(({L,o})=>(f.rar==='all'||L.card.rar===f.rar)&&(pmin==null||L.price>=pmin)&&(pmax==null||L.price<=pmax)&&(rmin==null||o>=rmin)&&(rmax==null||o<=rmax));
  list.sort((a,b)=>f.sort==='cheap'?a.L.price-b.L.price:f.sort==='dear'?b.L.price-a.L.price:f.sort==='rating'?b.o-a.o:b.L.at-a.L.at);
  const mine=new Set(Object.keys(m.list)),offered=new Set(Object.values(m.pend).map(P=>P.lid)),open=mktOpen();
  const filt=`<div class="mkfilt"><label>Rarity<select data-mkf="rar">${['all','bronze','silver','gold','special','icon'].map(r=>`<option value="${r}"${f.rar===r?' selected':''}>${r==='all'?'Any':RARN[r]}</option>`).join('')}</select></label>
    <label>Price from<input type="number" min="0" inputmode="numeric" data-mkf="pmin" value="${esc(f.pmin)}" placeholder="any"></label><label>to<input type="number" min="0" inputmode="numeric" data-mkf="pmax" value="${esc(f.pmax)}" placeholder="any"></label>
    <label>Rating from<input type="number" min="0" max="130" inputmode="numeric" data-mkf="rmin" value="${esc(f.rmin)}" placeholder="any"></label><label>to<input type="number" min="0" max="130" inputmode="numeric" data-mkf="rmax" value="${esc(f.rmax)}" placeholder="any"></label>
    <label>Sort<select data-mkf="sort">${[['new','Newest'],['cheap','Price: low to high'],['dear','Price: high to low'],['rating','Rating: high to low']].map(([k,t])=>`<option value="${k}"${f.sort===k?' selected':''}>${t}</option>`).join('')}</select></label></div>`;
  if(!MKS.L.size)return filt+`<p class="hint">${open?'Nobody has listed a player yet. Be the first: Sell Players.':'Waiting for the market…'}</p>`;
  return filt+`<p class="hint">${list.length} of ${rows.length} players · you have ${club.coins.toLocaleString()} coins</p><div class="mklist">`+list.slice(0,120).map(({L})=>{const own=mine.has(L.lid),off=offered.has(L.lid),have=club.owned.includes(L.card.id);
      const btn=own?'<span class="mktag">Your listing</span>':off?'<span class="mktag">Buying…</span>':`<button class="btn gold" data-mkbuy="${L.lid}" ${!open||club.coins<L.price?'disabled':''}>${club.coins<L.price?'Not enough coins':'Buy'}</button>`;
      return mktRow(L.card,`<b class="mkprice">${L.price.toLocaleString()} coins</b><small>${esc(L.nm||'A club')}${L.mg?' · '+esc(L.mg):''} · ${mkLeft(L.exp-now)} left${have&&!own?' · you have him (he’d be a spare copy)':''}</small>${btn}`)}).join('')+`</div>`}
function mktMineHTML(){const m=mktSt(),now=Date.now(),L=Object.values(m.list).sort((a,b)=>b.at-a.at),P=Object.entries(m.pend);
  const rows=L.map(l=>{const p=byId(l.pid);if(!p)return'';const c=mktCard(l.pid);
    const st=l.st!=='active'?'<span class="mktag">Sending to the market…</span>':`<small>On the market · ${mkLeft((l.exp||now)-now)} left</small>`;
    const ctl=l.st==='active'?`<div class="mkprc"><input type="number" min="${MKT_MIN}" max="${MKT_MAX}" inputmode="numeric" id="mkp-${l.lid}" value="${l.price}" aria-label="New price"><button class="btn" data-mkprice="${l.lid}" ${l.prq?'disabled':''}>${l.prq?'Saving…':'Change price'}</button><button class="btn" data-mkcancel="${l.lid}" ${l.crq?'disabled':''}>${l.crq?'Cancelling…':'Cancel listing'}</button></div>`:'';
    return mktRow(c,`<b class="mkprice">${l.price.toLocaleString()} coins</b>${st}${ctl}`)}).join('');
  const pend=P.map(([rq,x])=>`<p class="hint">Buying ${esc(mktName(x.pid))} for ${x.price.toLocaleString()} coins: waiting for the market (your coins are held).</p>`).join('');
  const H=m.hist.slice(0,12).map(h=>`<li>${new Date(h.at).toLocaleDateString()} · ${{sold:'Sold',bought:'Bought',instant:'Sold to the game',expired:'Listing ended',cancelled:'Took off the market'}[h.t]||h.t} ${esc(mktName(h.pid))}${h.t==='expired'||h.t==='cancelled'?'':` for ${h.price.toLocaleString()} coins`}${h.who?` (${h.t==='sold'?'to':'from'} ${esc(h.who)})`:''}</li>`).join('');
  return `<p class="hint">${L.length} of ${MKT_PER} listing places used. Listed players can’t play until they’re sold or taken off the market. Listings end after three days.</p>`+
    (rows?`<div class="mklist">${rows}</div>`:'<p class="hint">You have no players on the market. Use Sell Players to list one.</p>')+pend+(H?`<h4 class="mkh">Recent activity</h4><ul class="mkhist">${H}</ul>`:'')}
function mktSellHTML(){const open=mktOpen(),mine=ownedPlayers().filter(p=>!p.isCustom&&p.id!=='wes');
  if(MKS.sel&&!mktWhyNot(MKS.sel)){const id=MKS.sel,c=mktCard(id),o=origOf(id),v=instantOf(id),pr=MKS.price&&MKS.price[id]||Math.max(MKT_MIN,o);
    return `<button class="btn" data-mksel="">← All your players</button>`+mktRow(c,`<small>Original price ${o.toLocaleString()} coins</small>`)+
      `<div class="mkopts"><div class="mkopt"><h4>List on the transfer market</h4><p class="hint">Choose your price (${MKT_MIN.toLocaleString()} to ${MKT_MAX.toLocaleString()} coins). Another manager can buy him at that price for three days; you can change the price or cancel any time before he sells.</p>
        <div class="mkprc"><input type="number" min="${MKT_MIN}" max="${MKT_MAX}" inputmode="numeric" id="mk-lp" data-mkpid="${id}" value="${pr}" aria-label="Asking price"><button class="btn gold" data-mkask="list" ${open?'':'disabled'}>List him</button></div>${open?'':'<p class="hint">The market is closed right now.</p>'}</div>
       <div class="mkopt"><h4>Instant sale</h4><p class="hint">Sell him to the game straight away for half his original price.</p><p class="mkbig">${v.toLocaleString()} coins</p><button class="btn" data-mkask="instant">Sell now</button></div></div>`}
  MKS.sel=null;
  return `<p class="hint">Pick a player to list on the market or sell to the game. A player’s original price is the price of the pack he was signed from; selling to the game pays half of it.</p><div class="mklist">`+
    mine.map(p=>{const why=mktWhyNot(p.id);return mktRow(mktCard(p.id),`<small>Original price ${origOf(p.id).toLocaleString()} · instant sale ${instantOf(p.id).toLocaleString()}</small>${why?`<small class="mkno">${esc(why)}</small>`:`<button class="btn" data-mksel="${p.id}">Sell…</button>`}`)}).join('')+`</div>`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-mkv],[data-mkbuy],[data-mksel],[data-mkdo],[data-mkask],[data-mkcancel],[data-mkprice]');if(!b)return;const d=b.dataset;
  if(d.mkv){MKS.view=d.mkv;MKS.ask=null;MKS.msg='';mktDraw();for(const x of document.querySelectorAll('[data-mkv]'))x.setAttribute('aria-selected',x.dataset.mkv===MKS.view);return}
  if(d.mksel!==undefined){MKS.sel=d.mksel||null;MKS.ask=null;mktDraw();return}
  if(d.mkbuy){MKS.ask={kind:'buy',lid:d.mkbuy};mktDraw();return}
  if(d.mkcancel){MKS.ask={kind:'cancel',lid:d.mkcancel};mktDraw();return}
  if(d.mkprice){const v=Math.round(+($('mkp-'+d.mkprice)||{}).value);if(!(v>=MKT_MIN&&v<=MKT_MAX)){mktNote(`Pick a price from ${MKT_MIN.toLocaleString()} to ${MKT_MAX.toLocaleString()} coins.`);mktDraw();return}MKS.ask={kind:'price',lid:d.mkprice,price:v};mktDraw();return}
  if(d.mkask==='list'){const v=Math.round(+$('mk-lp').value);if(!(v>=MKT_MIN&&v<=MKT_MAX)){mktNote(`Pick a price from ${MKT_MIN.toLocaleString()} to ${MKT_MAX.toLocaleString()} coins.`);mktDraw();return}MKS.ask={kind:'list',id:MKS.sel,price:v};mktDraw();return}
  if(d.mkask==='instant'){MKS.ask={kind:'instant',id:MKS.sel};mktDraw();return}
  if(d.mkdo==='no'){MKS.ask=null;mktDraw();return}
  if(d.mkdo==='yes'){const a=MKS.ask;MKS.ask=null;if(!a)return;
    if(a.kind==='buy')mktBuy(a.lid);else if(a.kind==='list'){MKS.sel=null;MKS.view='mine';mktList(a.id,a.price)}else if(a.kind==='instant')mktInstant(a.id);
    else if(a.kind==='cancel')mktCancel(a.lid);else if(a.kind==='price')mktReprice(a.lid,a.price);mktDraw()}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.mkf){MKS.f[t.dataset.mkf]=t.value;const body=$('mk-body');if(body&&MKS.view==='browse'){const a=document.activeElement,k=a&&a.dataset&&a.dataset.mkf,pos=a&&a.selectionStart;body.innerHTML=mktBrowseHTML();if(k){const n=body.querySelector(`[data-mkf="${k}"]`);if(n){n.focus();try{if(pos!=null)n.setSelectionRange(pos,pos)}catch(x){}}}}}
  else if(t.id==='mk-lp'&&t.dataset.mkpid){MKS.price=MKS.price||{};MKS.price[t.dataset.mkpid]=t.value}});
