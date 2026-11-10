// Tests for the transfer market's referee (lib/market.js), with no network: node market.test.js
'use strict';
const MK=require('./lib/market');const crypto=require('node:crypto');
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log(c?'ok  ':'FAIL',m)};
const hex=n=>crypto.randomBytes(n).toString('hex');
let T=1e12;const S={},pubs={listing:[],clear:[],out:[],idx:0},audits=[];let susp=new Set();
const mk=MK.create(S,{now:()=>T,audit:(w,a,t,d)=>audits.push(a),suspended:(rid,h)=>susp.has(rid),allow:()=>true,
  publishListing:v=>pubs.listing.push(v),clearListing:l=>pubs.clear.push(l),publishOutbox:m=>pubs.out.push(m),publishIndex:()=>pubs.idx++});
const user=(nm,rid)=>({msk:hex(32),nm,rid});
const A=user('Alpha FC','alphaclub01'),B=user('Bravo FC','bravoclub01'),C=user('Charlie FC','charlie0001');
const mid=u=>MK.midOf(u.msk),box=u=>mk.outbox(mid(u)),last=u=>box(u)[box(u).length-1];
const req=(u,a,x)=>mk.handle({a,rq:hex(6),msk:u.msk,...x},{rid:u.rid,nm:u.nm,mg:'',h:''});
const card=(id,extra)=>({id,rar:'gold',xp:300,up:{pace:2},abl:2,evo:1,orig:2000,...extra});
// listing
const l1=hex(6);let r=req(A,'list',{lid:l1,price:3000,card:card('p1')});
ok(r&&r.t==='listed'&&mk.active().length===1&&pubs.listing.length===1,'a player is listed and published');
ok(!('mid' in pubs.listing[0])&&!('h' in pubs.listing[0]),'the public listing carries no market id or device link');
ok(req(A,'list',{lid:hex(6),price:3000,card:card('p1')}).t==='list-no','the same player can’t be listed twice');
ok(req(A,'list',{lid:hex(6),price:50,card:card('p2')}).t==='list-no','a price under 100 is refused');
ok(req(A,'list',{lid:hex(6),price:2e7,card:card('p2')}).t==='list-no','a price over 10,000,000 is refused');
ok(req(A,'list',{lid:hex(6),price:1000,card:{id:'<script>'}}).t==='list-no','a malformed player is refused');
// the request id makes every request happen once (it arrives once per relay)
const rq=hex(6),lp=hex(6);mk.handle({a:'list',rq,msk:A.msk,lid:lp,price:1500,card:card('p9')},{rid:A.rid,nm:A.nm});const n0=mk.active().length;
ok(mk.handle({a:'list',rq,msk:A.msk,lid:hex(6),price:1500,card:card('p8')},{rid:A.rid,nm:A.nm})===null&&mk.active().length===n0,'a repeated request is ignored');
// only the seller can change the price or cancel
ok(req(B,'price',{lid:l1,price:100}).t==='price-no'&&mk.M.listings[l1].price===3000,'someone else can’t change the price');
ok(req(B,'cancel',{lid:l1}).t==='cancel-no'&&mk.M.listings[l1].st==='active','someone else can’t cancel');
ok(req(A,'price',{lid:l1,price:3500}).t==='priced'&&mk.M.listings[l1].price===3500,'the seller changes the price');
// buying
ok(req(A,'buy',{lid:l1,price:3500}).t==='buy-no','you can’t buy your own player');
const B2={...user('Alt FC','alphaclub01')};ok(req(B2,'buy',{lid:l1,price:3500}).t==='buy-no','another save claiming the same club can’t buy it either');
let rb=req(B,'buy',{lid:l1,price:3000});ok(rb.t==='buy-no'&&/price changed/.test(rb.why)&&mk.M.listings[l1].st==='active','buying at an old price is refused (no charge)');
rb=req(B,'buy',{lid:l1,price:3500});ok(rb.t==='bought'&&rb.card.id==='p1'&&rb.price===3500,'bought at the current price, with the player card');
const sold=box(A).find(x=>x.t==='sold'&&x.lid===l1);ok(sold&&sold.price===3500&&sold.pid==='p1','the seller gets a signed "sold" record for the price');
ok(pubs.clear.includes(l1)&&mk.active().every(l=>l.lid!==l1),'the listing comes off the market');
const rc=req(C,'buy',{lid:l1,price:3500});ok(rc.t==='buy-no'&&/first/.test(rc.why),'a second buyer is refused (sold once only)');
ok(req(A,'cancel',{lid:l1}).t==='cancel-no','a sold listing can’t be cancelled');
ok(audits.includes('market-sale')&&mk.M.txs.length===1,'the sale is recorded and audited');
// cancel
const l2=hex(6);req(A,'list',{lid:l2,price:900,card:card('p2')});ok(req(A,'cancel',{lid:l2}).t==='cancelled'&&mk.M.listings[l2].st==='cancelled','the seller cancels');
ok(req(B,'buy',{lid:l2,price:900}).t==='buy-no','a cancelled listing can’t be bought');
// at most ten listings per save
for(let i=0;i<12;i++)req(C,'list',{lid:hex(6),price:500+i,card:card('c'+i)});ok(mk.active().filter(l=>l.nm==='Charlie FC').length===10,'at most 10 listings per save');
// requests the server never got are voided for good, so the game can refund
const ghost=hex(6);req(B,'sync',{pend:[ghost]});ok(box(B).some(x=>x.t==='void'&&x.rq===ghost),'an unknown request is voided on sync');
const l3=hex(6);req(A,'list',{lid:l3,price:777,card:card('p3')});
ok(mk.handle({a:'buy',rq:ghost,msk:B.msk,lid:l3,price:777},{rid:B.rid,nm:B.nm})===null&&mk.M.listings[l3].st==='active','a voided request arriving late is never applied');
// a suspended club can't trade
susp.add(B.rid);ok(req(B,'buy',{lid:l3,price:777}).t==='buy-no'&&mk.M.listings[l3].st==='active','a suspended club can’t buy');susp.clear();
// expiry
T+=3*864e5+1;mk.tick();ok(mk.M.listings[l3].st==='expired'&&box(A).some(x=>x.t==='expired'&&x.lid===l3),'after three days the listing expires and goes back to the seller');
ok(req(B,'buy',{lid:l3,price:777}).t==='buy-no','an expired listing can’t be bought');
// moderator removal
const l4=hex(6);req(A,'list',{lid:l4,price:1234,card:card('p4')});ok(mk.remove(l4,'test')&&box(A).some(x=>x.t==='removed'&&x.lid===l4),'a moderator takes a listing down; the seller is told');
// cards are cleaned
const c=MK.cardOf({id:'p5',rar:'mythic',xp:-5,up:{pace:99,hack:3},abl:99,evo:9,orig:-1});ok(c.rar==='bronze'&&c.xp===0&&c.up.pace===5&&!('hack' in c.up)&&c.abl===10&&c.evo===5&&c.orig===0,'card values are clamped');
ok(JSON.stringify(S.market).length>0&&S.market===mk.M,'state is kept in the server’s saved state');
console.log(`${pass} passed, ${fail} failed`);process.exitCode=fail?1:0;
