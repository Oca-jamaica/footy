#!/usr/bin/env node
// Sunday Kickabout developer dashboard: a small private web server you run yourself.
// It is never part of the game file. The game only ever carries this server's two PUBLIC keys.
//
// How it reaches the players: the game already talks over public MQTT relays (that's how online matches, matchmaking
// and the leaderboard work). This server joins the same relays and
//  - reads live-status heartbeats, online results, player reports, problem reports and appeals, which every copy of the
//    game encrypts to this server's public key, so nobody else can read them;
//  - watches the public matchmaking queues and the public club directory;
//  - publishes one control message (maintenance, announcements, suspensions, progression corrections) signed with the
//    server's private key. Every copy of the game checks the signature and ignores anything that isn't genuine.
// So the server can run on your own computer (it only makes outgoing connections) and the dashboard is a local web page.
//
// Configuration (environment variables):
//   PORT (8787) HOST (127.0.0.1)   where the dashboard listens. Anything other than this computer needs TLS_CERT+TLS_KEY,
//                                  or TRUST_PROXY=1 behind an HTTPS reverse proxy.
//   TLS_CERT, TLS_KEY              serve the dashboard over HTTPS with these files
//   TRUST_PROXY=1                  behind a reverse proxy that terminates HTTPS (uses X-Forwarded-For / -Proto)
//   SECRETS_FILE (server/secrets/keys.json)   private keys made by setup.js
//   DATA_DIR (server/data)         admins.json, state.json and the audit log
//   RELAYS                         comma-separated relay URLs (wss://user:pass@host/path); defaults to the game's list
'use strict';
const http=require('node:http'),https=require('node:https'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('./lib/opscrypto');
const E=process.env;
const DEFAULT_RELAYS=['wss://mqtt.eclipseprojects.io:443/mqtt','wss://public:public@public.cloud.shiftr.io','wss://broker.hivemq.com:8884/mqtt','wss://broker.emqx.io:8084/mqtt','wss://test.mosquitto.org:8081'];
const CFG={host:E.HOST||'127.0.0.1',port:+(E.PORT||8787),secrets:E.SECRETS_FILE||path.join(__dirname,'secrets','keys.json'),data:E.DATA_DIR||path.join(__dirname,'data'),
  tlsCert:E.TLS_CERT,tlsKey:E.TLS_KEY,trustProxy:E.TRUST_PROXY==='1',relays:(E.RELAYS?E.RELAYS.split(',').map(s=>s.trim()).filter(Boolean):DEFAULT_RELAYS),
  ns:E.TOPIC_NS||'sundaykickabout',mm:E.MM_VERSION||'6',ctlEvery:+(E.CTL_EVERY_MS||60000)};
const T_TEL=`${CFG.ns}/ops1/t/`,T_CTL=`${CFG.ns}/ops1/ctl`,T_REG=`${CFG.ns}/clubs2/p/`,T_MM=`${CFG.ns}/mm${CFG.mm}/`;
const isLoop=h=>h==='127.0.0.1'||h==='::1'||h==='localhost';
const secure=!!(CFG.tlsCert&&CFG.tlsKey);
if(!isLoop(CFG.host)&&!secure&&!CFG.trustProxy){console.error(`Refusing to listen on ${CFG.host} without HTTPS. Set TLS_CERT and TLS_KEY, or run behind an HTTPS reverse proxy with TRUST_PROXY=1, or keep HOST=127.0.0.1.`);process.exit(1)}

let KEYS;try{KEYS=C.loadKeys(CFG.secrets)}catch(e){console.error(`Can't read the private keys (${e.message}).\nRun "node setup.js" first, or set SECRETS_FILE.`);process.exit(1)}
// the private keys must belong to the public keys built into the game, or players' games will ignore this server
try{const pk=JSON.parse(fs.readFileSync(E.PUBLIC_KEYS_FILE||path.join(__dirname,'public-keys.json'),'utf8'));
  if(pk.sig!==KEYS.pub.sig||pk.enc!==KEYS.pub.enc)console.warn('WARNING: these private keys do not match public-keys.json, the keys built into the game. Players\u2019 games will ignore this dashboard until you use the matching keys, or rebuild the game ("node build.mjs") and share it again.')}catch(e){}
fs.mkdirSync(CFG.data,{recursive:true,mode:0o700});

// ---------------------------------------------------------------- small helpers
const now=()=>Date.now();
const rid6=()=>crypto.randomBytes(6).toString('hex');
const CTRL=/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g;
const str=(x,max)=>String(x??'').replace(CTRL,' ').replace(/\s+/g,' ').trim().slice(0,max);
const txt=(x,max)=>String(x??'').replace(/\r\n?/g,'\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/g,' ').trim().slice(0,max);
const RID=/^[a-z0-9]{10,16}$/,HASH=/^[0-9a-f]{32}$/,MID=/^[0-9a-f]{16}$/,SID=/^[0-9a-f]{16}$/;
const oneOf=(x,list,d)=>list.includes(x)?x:d;
const int=(x,a,b)=>{x=Math.round(+x);return Number.isFinite(x)?Math.min(b,Math.max(a,x)):a};
const num=(x,a,b)=>{x=+x;return Number.isFinite(x)?Math.min(b,Math.max(a,x)):a};

// ---------------------------------------------------------------- stored state (DATA_DIR/state.json) and audit log
const STATE_FILE=path.join(CFG.data,'state.json'),AUDIT_FILE=path.join(CFG.data,'audit.jsonl'),ADMINS_FILE=path.join(CFG.data,'admins.json');
const S=Object.assign({v:1,seq:0,maint:{on:false,msg:'',since:0,by:''},ann:[],susp:[],grants:[],reports:[],problems:[],matches:[],clubs:{}},
  (()=>{try{return JSON.parse(fs.readFileSync(STATE_FILE,'utf8'))}catch(e){return{}}})());
let saveT=null;
function saveSoon(){if(saveT)return;saveT=setTimeout(()=>{saveT=null;saveNow()},1500)}
function saveNow(){// keep the lists bounded: oldest finished items go first
  const trim=(a,max,done)=>{while(a.length>max){const i=a.findIndex(done);a.splice(i>=0?i:0,1)}};
  trim(S.reports,3000,r=>r.status!=='open');trim(S.problems,3000,p=>p.status!=='open');trim(S.matches,1000,()=>true);
  trim(S.grants,2000,g=>g.status!=='pending');trim(S.susp,5000,s=>s.status!=='active');
  const ids=Object.keys(S.clubs);if(ids.length>50000){ids.sort((a,b)=>S.clubs[a].last-S.clubs[b].last);for(const k of ids.slice(0,ids.length-50000))delete S.clubs[k]}
  const tmp=STATE_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(S),{mode:0o600});fs.renameSync(tmp,STATE_FILE)}
// append-only audit log; each line carries a hash of the previous one, so an edited or deleted line shows up
const auditMem=[];let auditPrev='0'.repeat(64);
try{const lines=fs.readFileSync(AUDIT_FILE,'utf8').split('\n').filter(Boolean);for(const l of lines.slice(-2000)){try{auditMem.push(JSON.parse(l))}catch(e){}}if(lines.length){auditPrev=crypto.createHash('sha256').update(lines[lines.length-1]).digest('hex')}}catch(e){}
function audit(who,action,target,details,reason){const e={at:new Date().toISOString(),admin:who?who.user:'system',role:who?who.role:'system',action,target:target||'',details:details||{},reason:reason||'',prev:auditPrev};
  const line=JSON.stringify(e);fs.appendFileSync(AUDIT_FILE,line+'\n',{mode:0o600});auditPrev=crypto.createHash('sha256').update(line).digest('hex');auditMem.push(e);if(auditMem.length>2000)auditMem.shift();return e}
function auditVerify(){let prev='0'.repeat(64),n=0;try{for(const l of fs.readFileSync(AUDIT_FILE,'utf8').split('\n').filter(Boolean)){const e=JSON.parse(l);if(e.prev!==prev)return{ok:false,line:n+1};prev=crypto.createHash('sha256').update(l).digest('hex');n++}}catch(e){if(e.code!=='ENOENT')return{ok:false,line:n+1}}return{ok:true,lines:n}}

// ---------------------------------------------------------------- live data (memory only)
const sessions=new Map();// sid -> latest heartbeat (a page of the game that is open right now)
const seenN=new Map();// sid -> {max, set}: drops repeats (each message arrives once per relay) and replays
const queues=new Map();// "ranked-volta" -> Map(searchId -> {at, r, busy})
const registry=new Map();// public club directory (the leaderboard's own data)
const LIVE_MS=60000;
function fresh(sid,n,t){if(Math.abs(now()-t)>24*3600e3)return false;// generous: some players' clocks are wrong
  let s=seenN.get(sid);if(!s){s={max:0,set:new Set(),at:now()};seenN.set(sid,s)}s.at=now();
  if(s.set.has(n)||n<s.max-200)return false;s.set.add(n);if(n>s.max)s.max=n;if(s.set.size>256){for(const x of s.set){if(x<s.max-200)s.set.delete(x)}}return true}
setInterval(()=>{const t=now();for(const [k,v] of sessions)if(t-v.at>10*60000)sessions.delete(k);for(const [k,v] of seenN)if(t-v.at>48*3600e3)seenN.delete(k);
  for(const q of queues.values())for(const [k,v] of q)if(t-v.at>30000)q.delete(k)},30000).unref();
const per=new Map();// simple per-key rate limiter for incoming player messages
function allow(key,n,ms){const t=now();let a=per.get(key);if(!a){a=[];per.set(key,a)}while(a.length&&t-a[0]>ms)a.shift();if(a.length>=n)return false;a.push(t);return true}
setInterval(()=>{const t=now();for(const [k,a] of per)if(!a.length||t-a[a.length-1]>24*3600e3)per.delete(k)},600000).unref();

const ST=['menu','match','pens','online','search','lobby','idle'],MD=['volta','classical','expanded'],LV=['chill','normal','hard','extreme'],KIND=['ranked','friendly','private'];
function who(d){return{rid:RID.test(d.rid)?d.rid:'',nm:str(d.nm,20),mg:str(d.mg,16)}}
function onTelemetry(topic,buf){if(buf.length>32000)return;const sid=topic.slice(T_TEL.length);if(!SID.test(sid))return;
  if(!allow('tel',400,1000))return;// overall cap on work per second
  const d=C.openTelemetry(KEYS,buf.toString('utf8'));if(!d||d.sid!==sid||!fresh(sid,int(d.n,0,1e9),+d.t||0))return;
  if(!allow('sid:'+sid,30,60000))return;
  const t=now(),me=who(d),h=HASH.test(d.h)?d.h:'';
  // a club id is public, so anyone could claim one: every device link (a hash of the save's private id) reported for a club
  // is kept, and corrections are refused when more than one save claims the same club
  if(me.rid){const c=S.clubs[me.rid]||(S.clubs[me.rid]={first:t,sessions:0,hs:[]});if(!c.hs)c.hs=c.h?[c.h]:[];if(c.lastSid!==sid){c.sessions++;c.lastSid=sid}Object.assign(c,{nm:me.nm,mg:me.mg,last:t});
    if(h){c.h=h;if(!c.hs.includes(h)){c.hs.push(h);if(c.hs.length>6)c.hs.shift()}}saveSoon()}
  if(d.k==='hb'){const om=d.om&&typeof d.om==='object'?{mid:MID.test(d.om.mid)?d.om.mid:'',kind:oneOf(d.om.kind,KIND,'private'),role:oneOf(d.om.role,['host','guest'],''),
      fmt:oneOf(d.om.fmt,MD,''),sc:Array.isArray(d.om.sc)?[int(d.om.sc[0],0,99),int(d.om.sc[1],0,99)]:[0,0],clk:int(d.om.clk,0,9999),rtt:int(d.om.rtt,0,99999),
      rt:oneOf(d.om.rt,['direct','relay',''],''),opp:str(d.om.opp,20),wait:int(d.om.wait,0,1e6)}:null;
    const old=sessions.get(sid);
    sessions.set(sid,{sid,at:t,first:old?old.first:t,...me,h,st:oneOf(d.st,ST,'menu'),md:oneOf(d.md,MD,'volta'),lv:oneOf(d.lv,LV,''),om,ver:str(d.ver,24),stSince:old&&old.st===d.st?old.stSince:t});
    // a game confirms corrections it has applied (informational: the correction stays in the signed message for 14 days
    // either way, so a forged confirmation can't stop it reaching the player)
    if(Array.isArray(d.ack)&&h)for(const id of d.ack.slice(0,20)){const g=S.grants.find(x=>x.id===id&&x.h===h&&x.status==='pending');
      if(g){g.status='applied';g.appliedAt=t;audit(null,'correction-applied',g.rid,{id:g.id,coins:g.coins,tt:g.tt},'reported as applied by the player’s game');saveSoon()}}}
  else if(d.k==='res'){if(!MID.test(d.mid))return;const role=oneOf(d.role,['host','guest'],'');if(!role)return;
    const my=int(d.my,0,99),th=int(d.their,0,99),opp=who(d.opp||{});let m=S.matches.find(x=>x.mid===d.mid);
    if(!m){m={mid:d.mid,at:t,kind:oneOf(d.kind,KIND,'private'),fmt:oneOf(d.fmt,MD,'volta'),host:null,guest:null,sc:null,by:[]};S.matches.push(m)}
    if(m.by.includes(role))return;m.by.push(role);m[role]=me;const other=role==='host'?'guest':'host';if(!m[other]&&opp.nm)m[other]={...opp,unconfirmed:true};
    const sc=role==='host'?[my,th]:[th,my];if(!m.sc)m.sc=sc;else if(m.sc[0]!==sc[0]||m.sc[1]!==sc[1])m.disagree=[m.sc,sc];m.at=t;saveSoon()}
  else if(d.k==='rep'){if(!allow('rep:'+(me.rid||sid),6,3600e3))return;const tg=who(d.target||{});if(!tg.rid&&!tg.nm)return;
    S.reports.push({id:rid6(),at:t,from:me,target:tg,cat:oneOf(d.cat,['cheating','name','abuse','other'],'other'),txt:txt(d.txt,500),ctx:oneOf(d.ctx,['squad','opponent','board'],'squad'),status:'open'});saveSoon()}
  else if(d.k==='prob'){if(!allow('prob:'+(me.rid||sid),d.auto?3:6,3600e3))return;
    const errs=Array.isArray(d.errs)?d.errs.slice(0,6).map(x=>str(x,240)):[];
    S.problems.push({id:rid6(),at:t,from:me,auto:!!d.auto,cat:oneOf(d.cat,['bug','online','performance','account','other'],'other'),txt:txt(d.txt,800),info:{ver:str(d.ver,24),st:oneOf(d.st,ST,''),md:oneOf(d.md,MD,''),rt:str(d.rt,16),errs},status:'open'});saveSoon()}
  else if(d.k==='app'){if(!allow('app:'+(me.rid||sid),3,24*3600e3))return;
    const s=S.susp.find(x=>x.status==='active'&&x.id===d.sus&&((h&&x.h===h)||(me.rid&&x.rid===me.rid)));if(!s)return;
    if(s.appeal&&s.appeal.status==='pending')return;if(s.appeal&&t-(s.appeal.decidedAt||0)<24*3600e3)return;
    s.appeal={txt:txt(d.txt,800),at:t,status:'pending'};saveSoon()}}

function onQueue(topic,buf){if(buf.length>2000)return;const rest=topic.slice(T_MM.length).split('/');if(rest.length!==3||rest[1]!=='q')return;
  const q=rest[0];if(!/^(ranked|friendly)-(volta|classical|expanded)$/.test(q))return;let d;try{d=JSON.parse(buf.toString())}catch(e){return}
  const id=String(d&&d.id||'');if(!/^[a-z0-9]{8,16}$/.test(id))return;if(!queues.has(q))queues.set(q,new Map());queues.get(q).set(id,{at:now(),r:int(d.r,0,4000),busy:!!d.busy})}
function onRegistry(topic,buf){if(buf.length>40000)return;const id=topic.slice(T_REG.length);if(!RID.test(id))return;if(!buf.length){registry.delete(id);return}
  let d;try{d=JSON.parse(buf.toString())}catch(e){return}if(!d||d.v!==1||d.id!==id)return;
  const fam=f=>{const r=d.rk&&d.rk[f]||{};return{rp:r.pd?int(r.rp,0,5000):0,pd:r.pd?1:0,w:int(r.w,0,1e5),d:int(r.d,0,1e5),l:int(r.l,0,1e5)}};
  const lin=s=>s&&Array.isArray(s.p)?{f:str(s.f,8),r:int(s.r,0,130),p:s.p.slice(0,9).filter(Array.isArray).map(x=>[str(x[0],16),str(x[1],4),int(x[2],1,130),oneOf(x[3],['bronze','silver','gold','special','icon'],'bronze')])}:{f:'',r:0,p:[]};
  const p={id,n:str(d.n,20),mg:str(d.mg,16),b:str(d.b,4),t:int(d.t,0,9e15),pl:int(d.pl,0,1e6),rk:{volta:fam('volta'),classical:fam('classical')},sq:{volta:lin(d.sq&&d.sq.volta),classical:lin(d.sq&&d.sq.classical)}};
  const o=registry.get(id);if(!o||p.t>=o.t)registry.set(id,p)}

// ---------------------------------------------------------------- control message (signed, retained on every relay)
function suspActive(s,t=now()){return s.status==='active'&&(!s.until||s.until>t)}
function ctlPayload(){const t=now();S.seq=Math.max(S.seq+1,t);
  for(const s of S.susp)if(s.status==='active'&&s.until&&s.until<=t){s.status='expired';audit(null,'suspension-expired',s.rid,{id:s.id},'time served')}
  return{v:1,seq:S.seq,ts:t,exp:t+2*3600e3,
    maint:S.maint.on?{on:1,msg:S.maint.msg}:{on:0},
    ann:S.ann.filter(a=>!a.until||a.until>t).slice(-3).map(a=>({id:a.id,txt:a.text,lvl:a.lvl,until:a.until||0})),
    susp:S.susp.filter(s=>suspActive(s,t)).slice(-800).map(s=>({id:s.id,rid:s.rid,h:s.h||'',until:s.until||0,why:s.cat})),
    grants:S.grants.filter(g=>(g.status==='pending'||g.status==='applied')&&t-g.at<14*864e5&&g.h).slice(-300).map(g=>({id:g.id,h:g.h,c:g.coins,tt:g.tt,msg:g.msg}))}}
let ctlMsg='',ctlSeq=0;
function ctlChanged(){ctlMsg=C.signControl(KEYS,ctlPayload());ctlSeq=S.seq;saveSoon();for(const r of relays)publishCtl(r)}
function publishCtl(r){if(!r.c.connected||!ctlMsg)return;r.c.publish(T_CTL,ctlMsg,{qos:1,retain:true},e=>{if(e)r.err=String(e.message||e).slice(0,120);else r.ctlAt=now()})}

// ---------------------------------------------------------------- relays
let mqtt;try{mqtt=require('mqtt')}catch(e){console.error('The "mqtt" package is missing: run "npm install" in the server folder.');process.exit(1)}
const relays=CFG.relays.map(u0=>{let url;try{url=new URL(u0)}catch(e){console.error('Bad relay URL: '+u0);process.exit(1)}
  const opts={clientId:'skops_'+crypto.randomBytes(5).toString('hex'),keepalive:30,connectTimeout:10000,reconnectPeriod:5000,clean:true};
  if(url.username){opts.username=decodeURIComponent(url.username);opts.password=decodeURIComponent(url.password);url.username='';url.password=''}
  const r={name:url.host,up:false,since:0,msgs:0,err:'',ctlAt:0,c:null};
  r.c=mqtt.connect(url.toString(),opts);
  r.c.on('connect',()=>{r.up=true;r.since=now();r.err='';r.c.subscribe([T_TEL+'+',T_REG+'+',T_MM+'+/q/+',T_CTL],{qos:0});publishCtl(r)});
  r.c.on('close',()=>{r.up=false});r.c.on('offline',()=>{r.up=false});r.c.on('error',e=>{r.err=String(e&&e.message||e).slice(0,120)});
  r.c.on('message',(tp,buf)=>{r.msgs++;try{
    if(tp.startsWith(T_TEL))onTelemetry(tp,buf);else if(tp.startsWith(T_REG))onRegistry(tp,buf);else if(tp.startsWith(T_MM))onQueue(tp,buf);
    // someone replaced our retained control message on this relay: put the current one back (at most every 10 s)
    else if(tp===T_CTL&&buf.toString()!==ctlMsg&&now()-(r.fixAt||0)>10000){r.fixAt=now();publishCtl(r)}}catch(e){}});
  return r});
ctlChanged();setInterval(ctlChanged,CFG.ctlEvery).unref();

// ---------------------------------------------------------------- admins and sessions
let adminsCache={at:0,d:null};
function admins(){if(now()-adminsCache.at>3000){try{adminsCache={at:now(),d:JSON.parse(fs.readFileSync(ADMINS_FILE,'utf8'))}}catch(e){adminsCache={at:now(),d:{v:1,users:{}}}}}return adminsCache.d.users||{}}
const ROLE_RANK={viewer:1,moderator:2,admin:3};
const sess=new Map();const IDLE=30*60000,ABS=8*3600e3;
const totpUsed=new Map();// user -> last accepted time step (a code works once)
function getSession(req){const m=/(?:^|;\s*)skadm=([0-9a-f]{64})/.exec(req.headers.cookie||'');if(!m)return null;const s=sess.get(m[1]);if(!s)return null;
  const t=now();if(t-s.last>IDLE||t-s.created>ABS){sess.delete(m[1]);return null}
  const u=admins()[s.user];if(!u||!ROLE_RANK[u.role]||u.hash!==s.hash){sess.delete(m[1]);return null}// removed, demoted or password changed
  s.role=u.role;s.last=t;s.id=m[1];return s}
const fails=new Map();// ip or user -> failure times
function failCount(k){const t=now(),a=(fails.get(k)||[]).filter(x=>t-x<15*60000);fails.set(k,a);return a.length}
function ipOf(req){return CFG.trustProxy&&req.headers['x-forwarded-for']?String(req.headers['x-forwarded-for']).split(',')[0].trim():req.socket.remoteAddress||''}
const isSecureReq=req=>secure||(CFG.trustProxy&&req.headers['x-forwarded-proto']==='https');

// ---------------------------------------------------------------- HTTP
const HEAD={'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Cross-Origin-Opener-Policy':'same-origin',
  'Cross-Origin-Resource-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=(), interest-cohort=()'};
function send(req,res,code,body,type,extra){const h={...HEAD,'Content-Type':type||'application/json; charset=utf-8',...(extra||{})};if(isSecureReq(req))h['Strict-Transport-Security']='max-age=31536000';
  res.writeHead(code,h);res.end(typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body))}
const STATIC={'/static/login.js':['login.js','text/javascript; charset=utf-8'],'/static/admin.js':['admin.js','text/javascript; charset=utf-8'],'/static/admin.css':['admin.css','text/css; charset=utf-8']};
function readBody(req){return new Promise((ok,no)=>{let n=0;const parts=[];req.on('data',c=>{n+=c.length;if(n>16384){no(Object.assign(new Error('too large'),{code:413}));req.destroy()}else parts.push(c)});
  req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(parts).toString('utf8')||'{}'))}catch(e){no(Object.assign(new Error('bad json'),{code:400}))}});req.on('error',no)})}
// a write must come from this dashboard's own page: same origin, JSON, a valid session and its anti-forgery token
function sameOrigin(req){const o=req.headers.origin,site=req.headers['sec-fetch-site'];if(site&&site!=='same-origin')return false;
  if(o){const want=(isSecureReq(req)?'https://':'http://')+req.headers.host;if(o!==want)return false}return true}
const PERM={view:1,moderate:2,admin:3};
class Bad extends Error{constructor(code,msg){super(msg);this.code=code}}
function need(s,level){if(!s)throw new Bad(401,'Please log in again.');if(ROLE_RANK[s.role]<PERM[level])throw new Bad(403,`Your role (${s.role}) can’t do this.`)}
function stepUp(s,b){const u=admins()[s.user];if(!u||!C.checkPassword(b.password||'',u.hash))throw new Bad(403,'That password is wrong. Sensitive actions need your password again.')}
function reasonOf(b){const r=txt(b.reason,500);if(r.length<5)throw new Bad(400,'Give a reason (at least 5 characters). It goes in the audit log.');if(b.confirm!==true)throw new Bad(400,'The action wasn’t confirmed.');return r}

function overview(){const t=now(),live=[...sessions.values()].filter(s=>t-s.at<LIVE_MS);
  const by=k=>live.reduce((o,s)=>(o[s[k]]=(o[s[k]]||0)+1,o),{});
  const matches=new Map();for(const s of live)if(s.st==='online'&&s.om&&s.om.mid){const m=matches.get(s.om.mid)||{mid:s.om.mid,kind:s.om.kind,fmt:s.om.fmt||s.md,players:[],sc:null,clk:0,rtt:0,rt:'',since:s.stSince};
    m.players.push({nm:s.nm,mg:s.mg,rid:s.rid,role:s.om.role});if(s.om.role==='host'||!m.sc){m.sc=s.om.sc;m.clk=s.om.clk}if(s.om.role==='guest'){m.rtt=s.om.rtt;m.rt=s.om.rt}m.since=Math.min(m.since,s.stSince);matches.set(s.om.mid,m)}
  const lobbies=live.filter(s=>s.st==='lobby').map(s=>({nm:s.nm,mg:s.mg,rid:s.rid,role:s.om&&s.om.role||'',fmt:s.om&&s.om.fmt||s.md,waiting:Math.round((t-s.stSince)/1000)}));
  const q={};for(const [k,m] of queues){let n=0,busy=0;for(const v of m.values())if(t-v.at<5000){n++;if(v.busy)busy++}q[k]={searching:n,pairing:busy}}
  const day=t-24*3600e3;let reg24=0;for(const p of registry.values())if(p.t>day)reg24++;
  const seen24=Object.values(S.clubs).filter(c=>c.last>day).length;
  return{t,relays:relays.map(r=>({name:r.name,up:r.up&&r.c.connected,since:r.since,msgs:r.msgs,err:r.up?'':r.err,ctlAt:r.ctlAt})),
    live:{players:live.length,byState:by('st'),byMode:by('md'),list:live.sort((a,b)=>a.first-b.first).slice(0,300).map(s=>({nm:s.nm,mg:s.mg,rid:s.rid,st:s.st,md:s.md,lv:s.lv,for:Math.round((t-s.stSince)/1000),ver:s.ver}))},
    matches:[...matches.values()],lobbies,queues:q,searchingByHeartbeat:by('st').search||0,
    clubs:{directory:registry.size,directoryActive24h:reg24,seen24h:seen24,known:Object.keys(S.clubs).length},
    recent:S.matches.slice(-15).reverse(),
    open:{reports:S.reports.filter(r=>r.status==='open').length,problems:S.problems.filter(p=>p.status==='open').length,appeals:S.susp.filter(s=>s.status==='active'&&s.appeal&&s.appeal.status==='pending').length,
      suspensions:S.susp.filter(s=>suspActive(s,t)).length,corrections:S.grants.filter(g=>g.status==='pending').length},
    maint:S.maint,ann:S.ann.filter(a=>!a.until||a.until>t),ctl:{seq:ctlSeq,bytes:ctlMsg.length},keys:{created:KEYS.created}}}
function clubView(rid){const p=registry.get(rid)||null,c=S.clubs[rid]||null,t=now();
  return{rid,profile:p,seen:c?{nm:c.nm,mg:c.mg,first:c.first,last:c.last,sessions:c.sessions,devices:(c.hs||[]).length}:null,live:[...sessions.values()].some(s=>s.rid===rid&&t-s.at<LIVE_MS),
    suspensions:S.susp.filter(s=>s.rid===rid).map(pub),corrections:S.grants.filter(g=>g.rid===rid).map(g=>({...g,h:undefined})),reports:S.reports.filter(r=>r.target.rid===rid).slice(-50),
    matches:S.matches.filter(m=>(m.host&&m.host.rid===rid)||(m.guest&&m.guest.rid===rid)).slice(-30).reverse()}}
function clubName(rid){const p=registry.get(rid),c=S.clubs[rid];return(p&&p.n)||(c&&c.nm)||''}
const pub=x=>({...x,h:undefined});// the device link stays on the server

async function api(req,res,url,s){const m=req.method,p=url.pathname;
  if(m==='GET'){need(s,'view');
    if(p==='/api/me')return{user:s.user,role:s.role,csrf:s.csrf};
    if(p==='/api/state')return overview();
    if(p==='/api/clubs'){const q=str(url.searchParams.get('q'),40).toLowerCase(),out=[];const ids=new Set([...registry.keys(),...Object.keys(S.clubs)]);
      for(const id of ids){const r=registry.get(id),c=S.clubs[id];const nm=(r&&r.n)||(c&&c.nm)||'',mg=(r&&r.mg)||(c&&c.mg)||'';
        if(q&&!(nm.toLowerCase().includes(q)||mg.toLowerCase().includes(q)||id.includes(q)))continue;
        out.push({rid:id,nm,mg,team:r?Math.max(r.sq.volta.r,r.sq.classical.r):0,played:r?r.pl:0,last:Math.max(c?c.last:0,r?r.t:0),susp:S.susp.some(x=>x.rid===id&&suspActive(x))});if(out.length>=2000)break}
      out.sort((a,b)=>b.last-a.last);return{clubs:out.slice(0,200),total:ids.size}}
    if(p.startsWith('/api/club/')){const rid=p.slice(10);if(!RID.test(rid))throw new Bad(400,'Bad club id');return clubView(rid)}
    if(p==='/api/matches')return{matches:S.matches.slice(-200).reverse()};
    if(p==='/api/reports')return{reports:S.reports.slice(-500).reverse()};
    if(p==='/api/problems')return{problems:S.problems.slice(-500).reverse()};
    if(p==='/api/suspensions')return{suspensions:S.susp.slice(-500).reverse().map(pub).map(x=>({...x,active:suspActive(x)}))};
    if(p==='/api/corrections')return{corrections:S.grants.slice(-500).reverse().map(pub)};
    if(p==='/api/audit')return{entries:auditMem.slice(-int(url.searchParams.get('n')||300,1,2000)).reverse(),chain:auditVerify()};
    throw new Bad(404,'Not found')}
  if(m!=='POST')throw new Bad(405,'Method not allowed');
  if(!s)throw new Bad(401,'Please log in again.');
  if(!sameOrigin(req))throw new Bad(403,'Cross-site request refused.');
  const tok=String(req.headers['x-csrf-token']||'');if(tok.length!==s.csrf.length||!crypto.timingSafeEqual(Buffer.from(tok),Buffer.from(s.csrf)))throw new Bad(403,'Missing or wrong anti-forgery token. Reload the page.');
  if(!/^application\/json\b/.test(req.headers['content-type']||''))throw new Bad(415,'JSON only');
  const b=await readBody(req);const t=now();
  if(p==='/api/maintenance'){need(s,'admin');const reason=reasonOf(b);stepUp(s,b);const on=!!b.on,msg=str(b.msg,200)||'Online play is paused for maintenance. Please try again soon.';
    S.maint={on,msg:on?msg:'',since:t,by:s.user};audit(s,on?'maintenance-on':'maintenance-off','all players',on?{message:msg}:{},reason);ctlChanged();return{ok:true,maint:S.maint}}
  if(p==='/api/announce'){need(s,'moderate');const reason=reasonOf(b);const text=str(b.text,220);if(text.length<3)throw new Bad(400,'Write the announcement.');
    const hours=num(b.hours,0,24*30),a={id:rid6(),text,lvl:oneOf(b.lvl,['info','warn'],'info'),from:t,until:hours?t+hours*3600e3:0,by:s.user};
    S.ann.push(a);while(S.ann.length>3)S.ann.shift();audit(s,'announce','all players',{id:a.id,text,lvl:a.lvl,hours},reason);ctlChanged();return{ok:true,ann:a}}
  let mm;
  if((mm=/^\/api\/announce\/([0-9a-f]{12})\/remove$/.exec(p))){need(s,'moderate');const reason=reasonOf(b);const i=S.ann.findIndex(a=>a.id===mm[1]);if(i<0)throw new Bad(404,'No such announcement');
    const [a]=S.ann.splice(i,1);audit(s,'announce-remove','all players',{id:a.id,text:a.text},reason);ctlChanged();return{ok:true}}
  if((mm=/^\/api\/report\/([0-9a-f]{12})$/.exec(p))){need(s,'moderate');const reason=reasonOf(b);const r=S.reports.find(x=>x.id===mm[1]);if(!r)throw new Bad(404,'No such report');
    const st=oneOf(b.status,['open','reviewed','dismissed','actioned'],'');if(!st)throw new Bad(400,'Pick a status');
    const was=r.status;Object.assign(r,{status:st,note:reason,by:s.user,reviewedAt:t});audit(s,'report-'+st,r.target.rid||r.target.nm,{report:r.id,was},reason);saveSoon();return{ok:true,report:r}}
  if((mm=/^\/api\/problem\/([0-9a-f]{12})$/.exec(p))){need(s,'moderate');const reason=reasonOf(b);const r=S.problems.find(x=>x.id===mm[1]);if(!r)throw new Bad(404,'No such problem report');
    const st=oneOf(b.status,['open','investigating','resolved','not-a-bug'],'');if(!st)throw new Bad(400,'Pick a status');
    const was=r.status;Object.assign(r,{status:st,note:reason,by:s.user,reviewedAt:t});audit(s,'problem-'+st,r.from.rid||r.from.nm,{problem:r.id,was},reason);saveSoon();return{ok:true,problem:r}}
  if(p==='/api/suspend'){need(s,'moderate');const reason=reasonOf(b);const rid=String(b.rid||'');if(!RID.test(rid))throw new Bad(400,'Pick a club');
    if(!clubName(rid))throw new Bad(404,'That club isn’t known to the server.');if(S.susp.some(x=>x.rid===rid&&suspActive(x)))throw new Bad(409,'That club is already suspended.');
    const days=num(b.days,0,365);if(!(days>0))throw new Bad(400,'Choose how many days (up to 365).');stepUp(s,b);
    const c=S.clubs[rid];const hs=c&&c.hs&&c.hs.length===1?c.hs[0]:'';const x={id:rid6(),rid,nm:clubName(rid),mg:(registry.get(rid)||{}).mg||(c&&c.mg)||'',h:hs,cat:oneOf(b.cat,['cheating','name','abuse','other'],'other'),
      at:t,until:t+days*864e5,by:s.user,reason,status:'active',appeal:null};S.susp.push(x);
    audit(s,'suspend',rid,{id:x.id,club:x.nm,days,category:x.cat,deviceLinked:!!x.h},reason);ctlChanged();return{ok:true,suspension:pub(x)}}
  if((mm=/^\/api\/suspension\/([0-9a-f]{12})\/(lift|uphold)$/.exec(p))){need(s,'moderate');const reason=reasonOf(b);const x=S.susp.find(y=>y.id===mm[1]);if(!x)throw new Bad(404,'No such suspension');
    if(!suspActive(x))throw new Bad(409,'That suspension isn’t active.');
    if(mm[2]==='lift'){x.status='lifted';x.liftedAt=t;x.liftedBy=s.user;if(x.appeal&&x.appeal.status==='pending')Object.assign(x.appeal,{status:'accepted',decidedAt:t,by:s.user,note:reason})}
    else{if(!x.appeal||x.appeal.status!=='pending')throw new Bad(409,'There’s no appeal waiting.');Object.assign(x.appeal,{status:'rejected',decidedAt:t,by:s.user,note:reason})}
    audit(s,mm[2]==='lift'?'suspension-lift':'appeal-reject',x.rid,{id:x.id,club:x.nm,appeal:x.appeal?x.appeal.status:null},reason);ctlChanged();return{ok:true,suspension:pub(x)}}
  if(p==='/api/correction'){need(s,'admin');const reason=reasonOf(b);const rid=String(b.rid||'');if(!RID.test(rid))throw new Bad(400,'Pick a club');
    const c=S.clubs[rid];if(!c||!c.hs||!c.hs.length)throw new Bad(409,'This club’s game hasn’t reported in to the server yet (or the player turned live status off), so a correction can’t reach it.');
    if(c.hs.length>1)throw new Bad(409,'More than one game save has claimed this club, so a correction can’t be targeted safely.');
    const coins=int(b.coins,-1e6,1e6),tt=int(b.tt,-1000,1000);if(!coins&&!tt)throw new Bad(400,'Enter a coin or Training Token change.');
    const msg=str(b.msg,140)||'A correction from the Sunday Kickabout team.';stepUp(s,b);
    const g={id:rid6(),rid,nm:clubName(rid),h:c.hs[0],coins,tt,msg,at:t,by:s.user,reason,status:'pending'};S.grants.push(g);
    audit(s,'correction',rid,{id:g.id,club:g.nm,coins,tt,message:msg},reason);ctlChanged();return{ok:true,correction:pub(g)}}
  if((mm=/^\/api\/correction\/([0-9a-f]{12})\/cancel$/.exec(p))){need(s,'admin');const reason=reasonOf(b);const g=S.grants.find(x=>x.id===mm[1]);if(!g)throw new Bad(404,'No such correction');
    if(g.status!=='pending')throw new Bad(409,'Only a correction that hasn’t been applied yet can be cancelled.');g.status='cancelled';g.cancelledAt=t;
    audit(s,'correction-cancel',g.rid,{id:g.id},reason);ctlChanged();return{ok:true}}
  throw new Bad(404,'Not found')}

async function handle(req,res){const url=new URL(req.url,'http://x');const p=url.pathname;
  try{
    if(p==='/api/login'&&req.method==='POST'){
      if(!sameOrigin(req)||!/^application\/json\b/.test(req.headers['content-type']||''))throw new Bad(403,'Refused.');
      const ip=ipOf(req);if(failCount('ip:'+ip)>=5)throw new Bad(429,'Too many failed attempts. Wait 15 minutes.');
      const b=await readBody(req);const user=str(b.user,32);if(failCount('user:'+user)>=10)throw new Bad(429,'This account is locked for 15 minutes after repeated failures.');
      const u=admins()[user];const okPw=C.checkPassword(b.password||'',u&&u.hash);let ok=okPw&&!!u&&!!ROLE_RANK[u.role];
      // with an authenticator set up, the code is checked too (each code works once); the answer never says which part was wrong
      if(ok&&u.totp){const step=C.totpCheck(u.totp,b.code);if(step<0||step<=(totpUsed.has(user)?totpUsed.get(user):-1))ok=false;else totpUsed.set(user,step)}
      if(!ok){(fails.get('ip:'+ip)||fails.set('ip:'+ip,[]).get('ip:'+ip)).push(now());(fails.get('user:'+user)||fails.set('user:'+user,[]).get('user:'+user)).push(now());
        audit(null,'login-failed',user||'(blank)',{},'wrong name, password or code');throw new Bad(401,'Wrong name, password or code.')}
      const mine=[...sess].filter(([,v])=>v.user===user).sort((a,b)=>a[1].created-b[1].created);while(mine.length>=5)sess.delete(mine.shift()[0]);// 5 sign-ins per account at most
      const id=crypto.randomBytes(32).toString('hex'),csrf=crypto.randomBytes(32).toString('hex');sess.set(id,{user,role:u.role,hash:u.hash,csrf,created:now(),last:now()});
      audit({user,role:u.role},'login',user,{},'signed in');
      send(req,res,200,{ok:true,user,role:u.role,csrf},null,{'Set-Cookie':`skadm=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${ABS/1000}${isSecureReq(req)?'; Secure':''}`});return}
    const s=getSession(req);
    if(p==='/api/logout'&&req.method==='POST'){if(s&&sameOrigin(req)&&req.headers['x-csrf-token']===s.csrf){sess.delete(s.id);audit(s,'logout',s.user,{},'signed out')}
      send(req,res,200,{ok:true},null,{'Set-Cookie':`skadm=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isSecureReq(req)?'; Secure':''}`});return}
    if(p.startsWith('/api/')){const out=await api(req,res,url,s);send(req,res,200,out);return}
    if(req.method!=='GET'){send(req,res,405,'Method not allowed','text/plain');return}
    if(p==='/'||p==='/login'){if(s){send(req,res,302,'',null,{Location:'/admin'});return}send(req,res,200,fs.readFileSync(path.join(__dirname,'admin','login.html')),'text/html; charset=utf-8');return}
    if(p==='/admin'){if(!s){send(req,res,302,'',null,{Location:'/'});return}send(req,res,200,fs.readFileSync(path.join(__dirname,'admin','admin.html')),'text/html; charset=utf-8');return}
    const st=STATIC[p];if(st){send(req,res,200,fs.readFileSync(path.join(__dirname,'admin',st[0])),st[1]);return}
    send(req,res,404,'Not found','text/plain')}
  catch(e){const code=e instanceof Bad||[400,413,415].includes(e.code)?e.code:500;if(code===500)console.error(e);send(req,res,code,{error:code===500?'Server error':e.message})}}

const srv=secure?https.createServer({cert:fs.readFileSync(CFG.tlsCert),key:fs.readFileSync(CFG.tlsKey),minVersion:'TLSv1.2'},handle):http.createServer(handle);
srv.headersTimeout=15000;srv.requestTimeout=20000;
srv.listen(CFG.port,CFG.host,()=>{const n=Object.keys(admins()).length;
  console.log(`Sunday Kickabout dashboard: ${secure?'https':'http'}://${CFG.host.includes(':')?'['+CFG.host+']':CFG.host}:${CFG.port}/  (${n} account${n===1?'':'s'}${n?'':' - add one with "node admin-user.js add <name> admin"'})`);
  console.log(`Relays: ${relays.map(r=>r.name).join(', ')}`)});
const bye=()=>{try{saveNow()}catch(e){}process.exit(0)};process.on('SIGINT',bye);process.on('SIGTERM',bye);
module.exports={S,sessions,registry,queues};
