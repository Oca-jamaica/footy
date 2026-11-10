// Builds the single-file game: src/index.html + src/js/*.js + vendor libraries -> sunday-kickabout.html
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
const html=readFileSync('src/index.html','utf8');
const js=readdirSync('src/js').filter(f=>f.endsWith('.js')).sort().map(f=>readFileSync('src/js/'+f,'utf8')).join('\n');
// a literal "</script" inside inlined code would end the tag early
const safe=s=>s.replace(/<\/script/gi,'<\\/script');
let out=html.replace(/\/\*@VENDOR:([\w.\-]+)\*\//g,(_,f)=>safe(readFileSync('vendor/'+f,'utf8')));
// The developer dashboard's PUBLIC keys (server/public-keys.json, made by "node server/setup.js") go into the game so it
// can check the dashboard's signed messages and encrypt what it sends. Never a private key: the build refuses anything
// that isn't exactly two public keys. OPS_KEYS=path picks another file; OPS_KEYS=none builds with the dashboard link off.
const keyFile=process.env.OPS_KEYS||'server/public-keys.json';let keys=null;
if(keyFile!=='none'&&existsSync(keyFile)){const k=JSON.parse(readFileSync(keyFile,'utf8'));const ok=s=>typeof s==='string'&&/^[A-Za-z0-9+/]{86}[A-Za-z0-9+/=]{2}$/.test(s)&&Buffer.from(s,'base64').length===65&&Buffer.from(s,'base64')[0]===4;
  if(!ok(k.sig)||!ok(k.enc)||Object.keys(k).some(x=>!['v','sig','enc','created'].includes(x)))throw new Error(keyFile+' must hold only the two public keys');keys={v:1,sig:k.sig,enc:k.enc}}
const build=new Date().toISOString().slice(0,10);
const game=js.replace('/*@OPSKEYS*/null',()=>JSON.stringify(keys)).replace("/*@BUILD*/'dev'",()=>JSON.stringify(build)).replace('/*@KEEPSAVES*/false',()=>process.env.KEEP_SAVES==='1'?'true':'false');
out=out.replace('/*@GAME*/',()=>safe(game));
// sunday-kickabout.html is the working copy; Sunday-Kickabout-Final.html is the same game, named for sharing
const files=(process.env.OUT||'sunday-kickabout.html,Sunday-Kickabout-Final.html').split(',');
for(const f of files)writeFileSync(f,out);
console.log('built'+(process.env.KEEP_SAVES==='1'?' (keeps test-version progress)':''),files.join(', '),(out.length/1024).toFixed(0)+' KB',keys?'· dashboard link on ('+keyFile+')':'· dashboard link off (no public keys)');
