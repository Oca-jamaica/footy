// The transfer market's referee. It runs inside the dashboard server, the one place every copy of the game trusts.
//
// The game sends market requests inside its usual encrypted messages (nobody else on the relays can read them), and
// this module applies them strictly one at a time, so a listing can only ever be sold once. Every result goes back
// signed with the server's private key; the game only acts on signed results, so nobody can fake a sale, a refund or a
// listing. What players see:
//  - market listings: one signed, retained message per active listing (mkt1/l/<listing id>), plus a signed index of
//    the active listing ids (mkt1/idx) that the game uses to ignore old or replayed listings;
//  - each player's results: a signed, retained "outbox" (mkt1/u/<market id>) of their recent market records (listed,
//    sold, bought, refused, cancelled, expired...). The game applies each record once, so a seller who is offline when
//    his player sells gets the coins the next time his game connects.
//
// Who is who: each save makes a random 32-byte market secret. Its market id is a hash of the secret; requests carry the
// secret (encrypted), so only that save can list, re-price, cancel or buy as that id. The id is not shown publicly on
// listings (only the seller's club name and manager name are).
//
// What this module checks, for every request (see handle()):
//  - the request is new: each has a random id and is applied once however many relays deliver it;
//  - the save isn't sending too fast (30 requests a minute) and its club isn't suspended from online play;
//  - list: a sensible player id, a whole-number price from 100 to 10,000,000 coins, at most 10 active listings per save,
//    and that player isn't already listed by the same save;
//  - re-price / cancel: only the seller, and only while the listing is still active (not sold, cancelled or expired);
//  - buy: the listing is active, the price the buyer agreed to is exactly the current price (a price change in between
//    is refused, not charged), and the buyer isn't the seller (different save and different club). The first valid buy
//    wins; any later one is refused and the buyer's coins come back;
//  - sync: a save asks about requests it hasn't heard back on; any the server never received are marked void (and can
//    never be applied later), so the save can safely refund or unlock.
// Every completed sale, cancellation and moderator removal is written to the audit log.
//
// What it can't check: coins and squads live on each player's device (the game has no central account server), so the
// server can't see a balance or a squad. The game itself refuses to list a player you don't own or to buy without the
// coins (it takes the coins into escrow before the request goes), but a deliberately modified copy of the game could lie
// about its own balance or squad. See the README.
'use strict';
const crypto=require('node:crypto');
const LID=/^[0-9a-f]{12}$/,RQ=/^[0-9a-f]{12}$/,MSK=/^[0-9a-f]{64}$/,PID=/^[A-Za-z0-9_-]{1,32}$/,RID=/^[a-z0-9]{10,16}$/;
const PRICE_MIN=100,PRICE_MAX=10000000,PER_SELLER=10,MAX_ACTIVE=3000,LIFE=3*864e5,OUTBOX=60,RARS=['bronze','silver','gold','special','icon'];
const midOf=msk=>crypto.createHash('sha256').update('sk-mkt1:'+msk).digest('hex').slice(0,16);
const hex=n=>crypto.randomBytes(n).toString('hex');
const str=(x,max)=>String(x??'').replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029‪-‮⁦-⁩﻿]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const int=(x,a,b)=>{x=Math.round(+x);return Number.isFinite(x)?Math.min(b,Math.max(a,x)):a};

// a player card as listed: the database id plus his development, all clamped to sane ranges (each game clamps again to
// its own rules before applying them)
function cardOf(c){if(!c||typeof c!=='object'||!PID.test(String(c.id)))return null;const up={};
  if(c.up&&typeof c.up==='object')for(const k of ['pace','shot','fin','skill','pass','tackle','str'])if(c.up[k])up[k]=int(c.up[k],0,5);
  return{id:String(c.id),rar:RARS.includes(c.rar)?c.rar:'bronze',xp:int(c.xp,0,100000),up,abl:int(c.abl,1,10),evo:int(c.evo,0,5),orig:int(c.orig,0,10000000)}}

function create(S,o){const now=o.now||Date.now,audit=o.audit||(()=>{}),suspended=o.suspended||(()=>false),allow=o.allow||(()=>true);
  const pub={listing:o.publishListing||(()=>{}),clear:o.clearListing||(()=>{}),outbox:o.publishOutbox||(()=>{}),index:o.publishIndex||(()=>{}),save:o.save||(()=>{})};
  const M=S.market=Object.assign({listings:{},txs:[],out:{},reqs:{}},S.market||{});
  const active=()=>Object.values(M.listings).filter(l=>l.st==='active');
  function rec(mid,r){const box=M.out[mid]=M.out[mid]||[];r.id=hex(6);r.at=now();box.push(r);while(box.length>OUTBOX)box.shift();pub.outbox(mid);return r}
  // the public face of a listing: no market id, no device link
  const view=l=>({lid:l.lid,card:l.card,price:l.price,at:l.at,exp:l.exp,nm:l.nm,mg:l.mg,rid:l.rid});
  function end(l,st,t){l.st=st;l.endAt=t;pub.clear(l.lid);pub.index()}
  function handle(d,who){// d: the decrypted request; who: {rid,nm,mg,h} as the game reported them
    if(!d||typeof d!=='object'||!MSK.test(String(d.msk))||!RQ.test(String(d.rq)))return null;
    const mid=midOf(d.msk),rq=String(d.rq),t=now();
    if(M.reqs[rq])return null;// already applied (it arrives once per relay)
    if(!allow('mkt:'+mid,30,60000))return null;
    M.reqs[rq]={mid,a:String(d.a||''),at:t};
    const me={mid,rid:RID.test(who&&who.rid)?who.rid:'',nm:str(who&&who.nm,20),mg:str(who&&who.mg,16),h:String(who&&who.h||'')};
    const blocked=suspended(me.rid,me.h);
    const L=LID.test(String(d.lid))?M.listings[d.lid]:null;
    let out=null;
    switch(d.a){
      case 'list':{const lid=String(d.lid),card=cardOf(d.card),price=Math.round(+d.price);let why='';
        if(!LID.test(lid)||M.listings[lid])why='bad listing';else if(!card)why='bad player';
        else if(!Number.isFinite(price)||price<PRICE_MIN||price>PRICE_MAX)why=`price must be ${PRICE_MIN.toLocaleString()} to ${PRICE_MAX.toLocaleString()} coins`;
        else if(blocked)why='your club is suspended from online play';
        else if(active().filter(x=>x.mid===mid).length>=PER_SELLER)why=`at most ${PER_SELLER} players on the market at once`;
        else if(active().some(x=>x.mid===mid&&x.card.id===card.id))why='that player is already on the market';
        else if(active().length>=MAX_ACTIVE)why='the market is full right now, try again later';
        if(why){out=rec(mid,{t:'list-no',rq,lid,why});break}
        const l=M.listings[lid]={lid,mid,rid:me.rid,nm:me.nm,mg:me.mg,h:me.h,card,price,at:t,exp:t+LIFE,st:'active'};
        pub.listing(view(l));pub.index();out=rec(mid,{t:'listed',rq,lid,pid:card.id,price,exp:l.exp});break}
      case 'price':{const price=Math.round(+d.price);let why='';
        if(!L||L.mid!==mid)why='not your listing';else if(L.st!=='active')why='no longer on the market';
        else if(!Number.isFinite(price)||price<PRICE_MIN||price>PRICE_MAX)why=`price must be ${PRICE_MIN.toLocaleString()} to ${PRICE_MAX.toLocaleString()} coins`;
        if(why){out=rec(mid,{t:'price-no',rq,lid:String(d.lid||''),why});break}
        L.price=price;L.priceAt=t;pub.listing(view(L));out=rec(mid,{t:'priced',rq,lid:L.lid,price});break}
      case 'cancel':{let why='';if(!L||L.mid!==mid)why='not your listing';else if(L.st!=='active')why=L.st==='sold'?'already sold':'no longer on the market';
        if(why){out=rec(mid,{t:'cancel-no',rq,lid:String(d.lid||''),why});break}
        end(L,'cancelled',t);audit(null,'market-cancel',L.rid||L.lid,{lid:L.lid,player:L.card.id,price:L.price},'cancelled by the seller');
        out=rec(mid,{t:'cancelled',rq,lid:L.lid,pid:L.card.id});break}
      case 'buy':{const price=Math.round(+d.price);let why='';
        if(!L)why='that listing doesn’t exist';else if(L.st==='sold')why='someone else bought him first';else if(L.st!=='active')why='no longer on the market';
        else if(L.exp<=t)why='the listing has expired';else if(L.mid===mid||(me.rid&&L.rid&&me.rid===L.rid))why='you can’t buy your own player';
        else if(blocked)why='your club is suspended from online play';
        else if(price!==L.price)why=`the price changed to ${L.price.toLocaleString()} coins`;
        if(why){out=rec(mid,{t:'buy-no',rq,lid:String(d.lid||''),why,price});break}
        // sold: one buyer, once
        end(L,'sold',t);L.buyer={mid,rid:me.rid,nm:me.nm,mg:me.mg};
        const tx={id:hex(6),at:t,lid:L.lid,player:L.card.id,rar:L.card.rar,price:L.price,seller:{rid:L.rid,nm:L.nm,mg:L.mg},buyer:{rid:me.rid,nm:me.nm,mg:me.mg}};M.txs.push(tx);while(M.txs.length>5000)M.txs.shift();
        audit(null,'market-sale',L.rid||L.lid,{lid:L.lid,player:L.card.id,price:L.price,buyer:me.rid||me.nm},'sold on the transfer market');
        rec(L.mid,{t:'sold',lid:L.lid,pid:L.card.id,price:L.price,to:me.nm||'a manager'});
        out=rec(mid,{t:'bought',rq,lid:L.lid,price:L.price,card:L.card,from:L.nm||'a club'});break}
      case 'sync':{// requests this save is still waiting on: any the server never got are void for good
        const pend=Array.isArray(d.pend)?d.pend.slice(0,40).map(String).filter(x=>RQ.test(x)):[];
        for(const p of pend){if(M.reqs[p])continue;M.reqs[p]={mid,a:'void',at:t};rec(mid,{t:'void',rq:p})}
        pub.outbox(mid);out={t:'synced'};break}
      default:delete M.reqs[rq];return null}
    pub.save();return out}
  // listings that have run out go back to their sellers
  function tick(){const t=now();let ch=false;
    for(const l of active())if(l.exp<=t){end(l,'expired',t);rec(l.mid,{t:'expired',lid:l.lid,pid:l.card.id});ch=true}
    for(const [k,v] of Object.entries(M.reqs))if(t-v.at>14*864e5)delete M.reqs[k];
    for(const [k,l] of Object.entries(M.listings))if(l.st!=='active'&&t-(l.endAt||l.at)>30*864e5)delete M.listings[k];
    for(const [k,box] of Object.entries(M.out))if(!box.length||t-box[box.length-1].at>120*864e5)delete M.out[k];
    if(ch)pub.save()}
  // a moderator takes a listing down (it goes back to the seller)
  function remove(lid,why){const l=M.listings[lid];if(!l||l.st!=='active')return null;end(l,'removed',now());rec(l.mid,{t:'removed',lid,pid:l.card.id,why:str(why,140)});pub.save();return l}
  return{handle,tick,remove,active,view,M,midOf,
    // everything to republish (on connect, and now and then in case a relay lost or someone overwrote a retained copy)
    all:()=>({listings:active().map(view),outboxes:Object.keys(M.out).filter(m=>M.out[m].length&&now()-M.out[m][M.out[m].length-1].at<30*864e5)}),
    outbox:mid=>(M.out[mid]||[]).slice(),index:()=>active().map(l=>l.lid)}}
module.exports={create,midOf,cardOf,PRICE_MIN,PRICE_MAX,PER_SELLER,LIFE};
