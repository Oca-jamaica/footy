// Builds the single-file game: src/index.html + src/js/*.js + vendor libraries -> sunday-kickabout.html
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
const html=readFileSync('src/index.html','utf8');
const js=readdirSync('src/js').filter(f=>f.endsWith('.js')).sort().map(f=>readFileSync('src/js/'+f,'utf8')).join('\n');
// a literal "</script" inside inlined code would end the tag early
const safe=s=>s.replace(/<\/script/gi,'<\\/script');
let out=html.replace(/\/\*@VENDOR:([\w.\-]+)\*\//g,(_,f)=>safe(readFileSync('vendor/'+f,'utf8')));
out=out.replace('/*@GAME*/',()=>safe(js));
writeFileSync('sunday-kickabout.html',out);
console.log('built sunday-kickabout.html',(out.length/1024).toFixed(0)+' KB');
