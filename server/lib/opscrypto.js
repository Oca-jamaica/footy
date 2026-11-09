// Cryptography shared by the admin server and its tools.
//  - Control messages (maintenance, announcements, suspensions, corrections) are signed with an ECDSA P-256 private
//    key that only the server holds. The game carries the matching PUBLIC key and ignores anything not signed by it.
//  - Telemetry from the game (live status, results, reports, problems, appeals) is encrypted to the server's ECDH P-256
//    public key: the game makes a throwaway key pair per page load, both sides derive the same AES-256-GCM key
//    (HKDF-SHA256), and only the server's private key can open the messages.
'use strict';
const crypto=require('node:crypto');const fs=require('node:fs');const path=require('node:path');

const b64=b=>Buffer.from(b).toString('base64');
const unb64=s=>Buffer.from(String(s||''),'base64');

function rawPub(keyObject){const j=keyObject.export({format:'jwk'});return Buffer.concat([Buffer.from([4]),Buffer.from(j.x,'base64url'),Buffer.from(j.y,'base64url')])}

function generateKeys(){
  const sign=crypto.generateKeyPairSync('ec',{namedCurve:'P-256'});
  const ecdh=crypto.createECDH('prime256v1');ecdh.generateKeys();
  return{v:1,created:new Date().toISOString(),
    sign:{priv:b64(sign.privateKey.export({format:'der',type:'pkcs8'})),pub:b64(rawPub(sign.publicKey))},
    enc:{priv:b64(ecdh.getPrivateKey()),pub:b64(ecdh.getPublicKey())}}}

function loadKeys(file){
  const raw=JSON.parse(fs.readFileSync(file,'utf8'));
  if(raw.v!==1||!raw.sign||!raw.enc)throw new Error('secrets file has the wrong format: '+file);
  const signKey=crypto.createPrivateKey({key:unb64(raw.sign.priv),format:'der',type:'pkcs8'});
  const ecdh=crypto.createECDH('prime256v1');ecdh.setPrivateKey(unb64(raw.enc.priv));
  // the public halves must match the private ones
  if(b64(rawPub(crypto.createPublicKey(signKey)))!==raw.sign.pub)throw new Error('signing key pair does not match');
  if(b64(ecdh.getPublicKey())!==raw.enc.pub)throw new Error('encryption key pair does not match');
  return{signKey,ecdh,pub:{v:1,sig:raw.sign.pub,enc:raw.enc.pub},created:raw.created}}

function writeSecret(file,obj){fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});const tmp=file+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(obj,null,1),{mode:0o600});fs.renameSync(tmp,file);try{fs.chmodSync(file,0o600)}catch(e){}}

// control: {v:1, p:"<payload json>", s:"<base64 64-byte r||s signature>"}
function signControl(keys,payload){const p=JSON.stringify(payload);
  const s=crypto.sign('sha256',Buffer.from(p),{key:keys.signKey,dsaEncoding:'ieee-p1363'});return JSON.stringify({v:1,p,s:b64(s)})}
function verifyControl(pubB64,msg){try{const d=JSON.parse(msg);if(d.v!==1||typeof d.p!=='string')return null;
    const pk=crypto.createPublicKey({key:{kty:'EC',crv:'P-256',x:b64url(unb64(pubB64).subarray(1,33)),y:b64url(unb64(pubB64).subarray(33,65))},format:'jwk'});
    return crypto.verify('sha256',Buffer.from(d.p),{key:pk,dsaEncoding:'ieee-p1363'},unb64(d.s))?JSON.parse(d.p):null}catch(e){return null}}
const b64url=b=>Buffer.from(b).toString('base64url');

// telemetry: {v:1, e:"<ephemeral raw public key>", iv:"<12 bytes>", c:"<AES-GCM ciphertext + tag>"}
const SALT=Buffer.from('sk-ops1'),INFO=Buffer.from('telemetry'),AAD=Buffer.from('sk-ops1');
const keyCache=new Map();
function telemetryKey(keys,ephB64){let k=keyCache.get(ephB64);if(k)return k;
  const eph=unb64(ephB64);if(eph.length!==65||eph[0]!==4)return null;
  let shared;try{shared=keys.ecdh.computeSecret(eph)}catch(e){return null}
  k=Buffer.from(crypto.hkdfSync('sha256',shared,SALT,INFO,32));
  if(keyCache.size>5000)keyCache.delete(keyCache.keys().next().value);keyCache.set(ephB64,k);return k}
function openTelemetry(keys,text){try{const d=JSON.parse(text);if(d.v!==1||typeof d.e!=='string'||typeof d.c!=='string')return null;
    const key=telemetryKey(keys,d.e);if(!key)return null;const iv=unb64(d.iv),c=unb64(d.c);if(iv.length!==12||c.length<17||c.length>24000)return null;
    const dc=crypto.createDecipheriv('aes-256-gcm',key,iv);dc.setAAD(AAD);dc.setAuthTag(c.subarray(c.length-16));
    const out=Buffer.concat([dc.update(c.subarray(0,c.length-16)),dc.final()]);return JSON.parse(out.toString('utf8'))}catch(e){return null}}
// the same sealing the game does (used by the tests and the self-check)
function sealTelemetry(pubB64,obj){const eph=crypto.createECDH('prime256v1');eph.generateKeys();
  const key=Buffer.from(crypto.hkdfSync('sha256',eph.computeSecret(unb64(pubB64)),SALT,INFO,32)),iv=crypto.randomBytes(12);
  const ci=crypto.createCipheriv('aes-256-gcm',key,iv);ci.setAAD(AAD);const c=Buffer.concat([ci.update(JSON.stringify(obj)),ci.final(),ci.getAuthTag()]);
  return JSON.stringify({v:1,e:b64(eph.getPublicKey()),iv:b64(iv),c:b64(c)})}

// admin passwords: scrypt (N=2^15, r=8, p=1), stored as scrypt$N$r$p$salt$hash
function hashPassword(pw){const salt=crypto.randomBytes(16),N=32768,r=8,p=1;
  const h=crypto.scryptSync(String(pw).normalize('NFKC'),salt,32,{N,r,p,maxmem:64*1024*1024});return `scrypt$${N}$${r}$${p}$${b64(salt)}$${b64(h)}`}
function checkPassword(pw,stored){const parts=String(stored||'').split('$');
  if(parts.length!==6||parts[0]!=='scrypt'){// still spend the time, so a wrong user name answers as slowly as a wrong password
    crypto.scryptSync(String(pw),'sk-dummy-salt',32,{N:32768,r:8,p:1,maxmem:64*1024*1024});return false}
  const [,N,r,p,salt,hash]=parts,want=unb64(hash);
  const got=crypto.scryptSync(String(pw).normalize('NFKC'),unb64(salt),want.length,{N:+N,r:+r,p:+p,maxmem:64*1024*1024});
  return got.length===want.length&&crypto.timingSafeEqual(got,want)}

// optional second factor: RFC 6238 time-based codes (any authenticator app)
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32decode(s){s=String(s).toUpperCase().replace(/[^A-Z2-7]/g,'');let bits=0,v=0;const out=[];for(const ch of s){v=(v<<5)|B32.indexOf(ch);bits+=5;if(bits>=8){out.push((v>>>(bits-8))&255);bits-=8}}return Buffer.from(out)}
function b32encode(buf){let bits=0,v=0,out='';for(const x of buf){v=(v<<8)|x;bits+=8;while(bits>=5){out+=B32[(v>>>(bits-5))&31];bits-=5}}if(bits>0)out+=B32[(v<<(5-bits))&31];return out}
function totpAt(secret,step){const key=b32decode(secret),msg=Buffer.alloc(8);msg.writeBigUInt64BE(BigInt(step));
  const h=crypto.createHmac('sha1',key).update(msg).digest(),o=h[h.length-1]&15;
  return String((h.readUInt32BE(o)&0x7fffffff)%1e6).padStart(6,'0')}
// accepts the current 30-second code or one either side (clock drift); returns the step used so it can't be reused
function totpCheck(secret,code,now=Date.now()){code=String(code||'').replace(/\s/g,'');if(!/^\d{6}$/.test(code))return -1;const t=Math.floor(now/30000);
  for(const s of [t,t-1,t+1]){const c=totpAt(secret,s);if(c.length===code.length&&crypto.timingSafeEqual(Buffer.from(c),Buffer.from(code)))return s}return -1}

module.exports={generateKeys,loadKeys,writeSecret,signControl,verifyControl,openTelemetry,sealTelemetry,hashPassword,checkPassword,totpAt,totpCheck,b32encode,b64,unb64};
