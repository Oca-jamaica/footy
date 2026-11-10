(()=>{
const cv=document.getElementById('pitch'),ctx0=cv.getContext('2d');let ctx=ctx0;
const W=1000,H=620,DPR=Math.min(2,window.devicePixelRatio||1);
cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Pitch is now ~55% longer and ~47% wider than before; the broadcast camera pans to follow play.
// pitch geometry: Volta (5-a-side) by default, swapped for the big Classical pitch by setPitch()
let FX0=175,FX1=1325,FY0=122,FY1=762,MIDX=750,MY=442,GY0=MY-62,GY1=MY+62,BOX=175,BOXH=165,SPOT=135,PITCH='volta',PSC=1;const BAR=32;// PSC: how much bigger than the standard Classical pitch (1 on Volta and Standard)
const C={g1:'#6fbe77',g2:'#64b26c',line:'rgba(255,250,235,.85)',coral:'#ff6f59',lilac:'#8e8ff0',sun:'#ffd166',mint:'#7fe0b4',cream:'#fff6e4',muted:'#a9c4cf',ink:'#14303f',stand:'#1c4053',stand2:'#183849'};
const CONF=['#ff6f59','#ffd166','#7fe0b4','#8e8ff0','#ff9ecb','#fff6e4','#5ec8ff'];
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const pick=a=>a[(Math.random()*a.length)|0];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- abilities ---------- */
const SKILLS={
  stepover:{name:'STEP-OVER',cd:50,stam:12,d:'Wrong-foot everyone in front: they freeze leaning the wrong way while you carry on.'},
  roulette:{name:'ROULETTE',cd:80,stam:18,d:'Spin round the man in front. Never fails against one defender, but it is slow.'},
  rainbow:{name:'RAINBOW FLICK',cd:100,stam:20,d:'Flick it over the defender’s head and run onto it. Nobody can touch it in the air.'},
  elastico:{name:'ELASTICO',cd:60,stam:14,d:'Violent side-snap. The best chance in the game of putting the man in front on the floor.'},
  burst:{name:'KNOCK-ON',cd:70,stam:15,d:'Knock it ahead and explode after it with a big burst of speed.'},
  fakeshot:{name:'FAKE SHOT',cd:55,stam:12,d:'Shape to shoot, then chop it sharply the other way. Blockers and keepers buy it.'},
  dragback:{name:'DRAG-BACK',cd:45,stam:9,d:'Stop dead and pull it back: anyone charging at you sails straight past.'},
  shield:{name:'SHIELD',cd:100,stam:15,d:'Turn your back on the defender and hold him off. Can’t be tackled for about a second.'}};
const SPECIALS={
  curler:{name:'CURLER',cd:1080,d:'Auto-aimed bender into the corner the keeper isn’t covering.'},
  rocket:{name:'ROCKET',cd:1200,d:'Hardest shot in the game. Can burst through the keeper’s hands.'},
  knuckle:{name:'KNUCKLEBALL',cd:1140,d:'Wobbling, dipping strike. Keepers react late.'},
  chip:{name:'CHIP',cd:960,d:'Lob over a keeper who has come off his line.'},
  through:{name:'THROUGH BALL',cd:900,d:'Floats it over everyone to the edge of their penalty area after one second, for the team-mate nearest it. He chases it at his own pace, so a defender who gets there first can win it.'},
  bicycle:{name:'BICYCLE KICK',cd:900,d:'Only straight off a teammate’s pass: flip and volley it first time. Very likely to go in.'},
  lob:{name:'CHIP PASS',cd:960,d:'Lofted pass over the defence to your best-placed teammate. Defenders can still attack it as it drops.'},

  slide:{name:'INTERCEPTOR',cd:960,d:'Lightning lunge that always wins the ball if you reach the carrier.'},
  turbo:{name:'TURBO',cd:1080,d:'Three seconds of top speed without using stamina.'}};
const STATK=[['pace','PAC'],['shot','SHO'],['fin','FIN'],['skill','DRI'],['pass','PAS'],['tackle','DEF'],['str','PHY']];
// [id,name,short,num,tag,pace,shot,fin,skill,pass,tackle,str,skill,special,celeb,skin,hair]
// Stat shapes: how a player's seven stats sit relative to their rating. Stats are then shifted so the card rating matches.
const SHAPES={
  finisher:[4,6,9,2,-8,-36,0],speed:[10,4,2,3,-8,-36,-4],dribbler:[5,-2,3,10,2,-40,-14],power:[-2,9,4,-6,-10,-26,10],
  playmaker:[-8,-2,3,7,10,-16,-10],b2b:[2,0,-2,0,3,3,3],destroyer:[3,-16,-16,-6,1,10,3],cb:[-5,-20,-26,-16,-2,9,8],
  fb:[8,-14,-18,0,3,5,-2],ballcb:[-2,-18,-22,-4,6,7,4],wingback:[9,-6,-10,6,6,0,-6]};
const SKMAP={Elastico:'elastico','Step-over':'stepover',Knock:'burst',Roulette:'roulette','Rainbow flick':'rainbow',Shield:'shield',Dragback:'dragback','Fake shot':'fakeshot'};
const SPMAP={Curler:'curler',Rocket:'rocket',Turbo:'turbo','Through ball':'through',Interceptor:'slide','Lob pass':'lob','Bicycle kick':'bicycle'};
function statsFor(rating,shape){
  const d=SHAPES[shape];let shift=0,v;
  for(let it=0;it<12;it++){v=d.map(x=>clamp(rating+x+shift,25,99));const top=[...v].sort((a,b)=>b-a).slice(0,5),o=Math.round(top.reduce((a,b)=>a+b,0)/5);if(o===rating)break;shift+=rating-o}
  return v.map(x=>x/100);
}
// [id, name, short, shirt, tag, position, rating, shape, skill, ultimate, celebration, skin, hair colour, look, how they play]
const ROWS=[
 ['rafa','Rafa Nuñez','NUÑEZ',10,'The Magician','ATT',96,'dribbler','Elastico','Curler',5,'#e8b88c','#4a2c1a',['short',0,1,.92],'Low centre of gravity, glued-on dribbling, curled finishes'],
 ['marco','Marco Vance','VANCE',7,'The Machine','ATT',95,'power','Step-over','Bicycle kick',1,'#d9a07a','#2a1d17',['quiff',0,0,1.06],'Powerhouse athlete with a ferocious shot'],
 ['kai','Kai Okafor','OKAFOR',10,'The Rocket','ATT',89,'speed','Knock','Turbo',0,'#6e432b','#111111',['bald',0,0,1],'Blistering pace, knocks it past and goes'],
 ['lucien','Lucien Varenne','VARENNE',14,'The Glider','ATT',87,'speed','Roulette','Turbo',2,'#7a4b30','#111111',['bald',0,0,1.07],'Elegant, long-striding, side-foots into corners'],
 ['tiago','Tiago Brisa','BRISA',11,'Samba Winger','ATT',90,'dribbler','Rainbow flick','Curler',3,'#a8724f','#1a1412',['mohawk','#e8cf7a',0,.98],'Flair winger who lives for tricks'],
 ['sverre','Sverre Holm','HOLM',9,'The Cyborg','ATT',85,'power','Fake shot','Rocket',5,'#f2cfae','#e2c27a',['bun',0,0,1.13],'Huge, relentless goal machine'],
 ['yusuf','Yusuf Amari','AMARI',11,'Inside Forward','ATT',83,'finisher','Fake shot','Curler',4,'#a8724f','#1f1a17',['afro',0,1,.96],'Cuts in off the right and curls it far post'],
 ['diego','Diego Larrea','LARREA',9,'Street Fighter','ATT',81,'finisher','Fake shot','Rocket',0,'#e8b88c','#2a1d17',['short',0,0,1.02],'Nasty, clever, finishes from anywhere'],
 ['han','Han Seo-jun','HAN',7,'Two-Footed Finisher','ATT',79,'finisher','Knock','Curler',4,'#f2cfae','#111111',['short',0,0,1],'Lethal off either foot'],
 ['tyrese','Tyrese Okoye','OKOYE',10,'Direct Runner','ATT',76,'speed','Step-over','Turbo',2,'#6e432b','#111111',['buzz',0,1,1.03],'Pacy, direct, loves running at full-backs'],
 ['callum','Callum Barlow','BARLOW',11,'Channel Runner','ATT',73,'speed','Knock','Turbo',0,'#c68d63','#1f1a17',['buzz',0,0,1.02],'Runs the channels all day'],
 ['gary','Gary Hartley','HARTLEY',9,'Non-League Hero','ATT',70,'speed','Knock','Rocket',0,'#f2cfae','#6b4b2e',['short',0,0,1],'Came up the hard way. Lives on the shoulder'],
 ['dario','Dario Neves','NEVES',27,'Chaos Merchant','ATT',67,'power','Step-over','Bicycle kick',3,'#c68d63','#1a1412',['curly',0,0,1.07],'Wild, unpredictable, occasionally brilliant'],
 ['anderson','Anderson Lino','LINO',21,'Spin Specialist','ATT',62,'dribbler','Elastico','Curler',3,'#8d5a3b','#111111',['dreads',0,0,.95],'Every trick in the book, every time'],
 ['nico','Nico Baldé','BALDÉ',19,'Wonderkid','ATT',87,'dribbler','Rainbow flick','Through ball',4,'#8d5a3b','#111111',['curly',0,0,.98],'Teenage prodigy with a wand of a left foot'],
 ['dimi','Dimitri Valen','VALEN',5,'The Artist','MID',91,'playmaker','Roulette','Through ball',5,'#f2cfae','#2a1d17',['balding',0,0,1.04],'Elegant playmaker with silky turns and vision'],
 ['kees','Kees Van Loon','VAN LOON',17,'Assist King','MID',89,'playmaker','Roulette','Through ball',2,'#f2cfae','#c4622d',['short',0,0,1.04],'Sees passes nobody else does, hits them hard'],
 ['ilya','Ilya Petrov','PETROV',10,'The Maestro','MID',88,'playmaker','Dragback','Through ball',5,'#f2cfae','#b08a5a',['long',0,0,.94,1],'Metronome passer who never gives it away'],
 ['jordan','Jordan Ashby','ASHBY',5,'Box Crasher','MID',86,'b2b','Step-over','Turbo',3,'#8d5a3b','#111111',['buzz',0,0,1.05],'Arrives in the box at exactly the right time'],
 ['pau','Pau Iriarte','IRIARTE',8,'Silent Genius','MID',87,'playmaker','Dragback','Through ball',5,'#f2cfae','#4a2c1a',['balding',0,0,.95],'Glides past people and threads the needle'],
 ['marc','Marc Ferrer','FERRER',6,'Tiki-Taka','MID',85,'playmaker','Shield','Lob pass',5,'#e8b88c','#2a1d17',['short',0,1,.95],'Never misplaces a pass'],
 ['davi','Davi Lenz','LENZ',22,'Gliding Runner','MID',84,'b2b','Knock','Turbo',1,'#e8b88c','#2a1d17',['short',0,0,1.03],'Surges through midfield at full speed'],
 ['rui','Rui Calado','CALADO',8,'Captain Creator','MID',82,'playmaker','Roulette','Through ball',3,'#e8b88c','#2a1d17',['bun',0,0,1],'Always looking for the killer ball or the long shot'],
 ['omar','Omar Diallo','DIALLO',7,'Destroyer','MID',81,'destroyer','Dragback','Interceptor',2,'#5e3a24','#111111',['buzz',0,0,.9],'Tireless ball-winner who covers every blade of grass'],
 ['dylan','Dylan Rhodes','RHODES',41,'Anchor','MID',79,'destroyer','Shield','Interceptor',2,'#f2cfae','#4a2c1a',['short',0,0,1.05],'Screens the defence and drives forward'],
 ['cal','Cal Moreton','MORETON',20,'Ice Cold','MID',78,'playmaker','Fake shot','Curler',5,'#f2cfae','#b5562b',['short',0,0,1.02],'Unbothered, unhurried, deadly'],
 ['jake','Jake Mallory','MALLORY',10,'Set-Piece Wizard','MID',74,'playmaker','Roulette','Through ball',4,'#f2cfae','#2a1d17',['short',0,0,1],'Dead-ball specialist with a sweet right foot'],
 ['rory','Rory Keane','KEANE',23,'Energizer','MID',71,'b2b','Knock','Interceptor',2,'#f2cfae','#6b4b2e',['buzz',0,0,1],'Presses all day long'],
 ['femi','Femi Adler','ADLER',20,'Flick Artist','MID',65,'b2b','Dragback','Turbo',0,'#8d5a3b','#111111',['buzz',0,0,1.04],'Cheeky flicks and late runs'],
 ['tomas','Tomáš Sedlák','SEDLÁK',28,'Aerial Threat','MID',58,'destroyer','Shield','Interceptor',2,'#f2cfae','#4a2c1a',['short',0,1,1.12],'Big, honest, wins every header'],
 ['alessio','Alessio Marchetti','MARCHETTI',3,'Il Capitano','DEF',91,'ballcb','Shield','Interceptor',5,'#e8b88c','#2a1d17',['long',0,0,1.05],'Reads the game so well he barely needs to tackle'],
 ['ade','Ade Kaluu','KALUU',4,'Colossus','DEF',89,'cb','Shield','Interceptor',2,'#5e3a24','#111111',['bun',0,1,1.1],'Dominant, quick and strong at the back'],
 ['rodrigo','Rodrigo Salas','SALAS',4,'Last-Minute Header','DEF',88,'cb','Shield','Rocket',1,'#e8b88c','#2a1d17',['long',0,1,1.03],'Fearsome leader who pops up with big goals'],
 ['joao','João Castro','CASTRO',6,'Cannon Foot','DEF',87,'wingback','Step-over','Rocket',1,'#a8724f','#111111',['bald',0,0,.9],'Tiny full-back with the hardest shot around'],
 ['marcos','Marcos Cavalcante','CAVALCANTE',2,'Pendulum','DEF',85,'fb','Knock','Turbo',0,'#6e432b','#111111',['bald',0,0,1],'Up and down the flank all game'],
 ['edinho','Edinho Barros','BARROS',2,'Wing-Back Showman','DEF',84,'wingback','Elastico','Through ball',3,'#a8724f','#e8cf7a',['curly',0,0,.97],'Attacking full-back who plays like a winger'],
 ['moussa','Moussa Kaboré','KABORÉ',2,'Calm Colossus','DEF',83,'cb','Shield','Interceptor',5,'#5e3a24','#111111',['short',0,1,1.08],'Unflappable, quick, wins everything'],
 ['jack','Jack Flint','FLINT',5,'Ball-Player','DEF',80,'ballcb','Dragback','Lob pass',4,'#f2cfae','#2a1d17',['short',0,0,1.05],'Centre-back who steps into midfield'],
 ['shaun','Shaun Dalton','DALTON',3,'Winger Stopper','DEF',78,'fb','Shield','Interceptor',2,'#8d5a3b','#111111',['buzz',0,0,.97],'Nobody gets past him on the outside'],
 ['toby','Toby Grey','GREY',4,'Versatile','DEF',75,'fb','Knock','Interceptor',2,'#f2cfae','#4a2c1a',['short',0,1,1.02],'Plays anywhere across the back'],
 ['hamish','Hamish Strachan','STRACHAN',5,'Aerial Rock','DEF',70,'cb','Shield','Interceptor',2,'#f2cfae','#6b4b2e',['short',0,0,1.1],'Big unit, strong in the air'],
 ['evan','Evan Dreyer','DREYER',15,'Utility Man','DEF',66,'cb','Shield','Rocket',2,'#f2cfae','#4a2c1a',['buzz',0,0,1.08],'Solid, unspectacular, gets the job done'],
 ['pete','Pete Jennings','JENNINGS',4,'Committed','DEF',60,'cb','Dragback','Interceptor',2,'#f2cfae','#4a2c1a',['short',0,0,1.04],'Throws himself into everything'],
 ['jens','Jens van Dam','VAN DAM',37,'Speed Demon','DEF',82,'fb','Knock','Turbo',0,'#f2cfae','#d9b56a',['short',0,0,1.1],'Fastest centre-back you’ll ever see'],
 ['dave','Dave Pike','PIKE',14,'Old Reliable','DEF',59,'cb','Shield','Turbo',2,'#f2cfae','#b5562b',['short',0,0,1],'Has played every Sunday since 1998'],
 ['leon','Leon Fry','FRY',17,'Pub Winger','ATT',57,'speed','Step-over','Curler',3,'#c68d63','#111111',['quiff',0,0,1],'Thinks he’s a winger. Sometimes is'],
 ['gaz','Gaz Moss','MOSS',3,'Sunday Stopper','DEF',59,'cb','Dragback','Interceptor',5,'#e8b88c','#4a2c1a',['buzz',0,1,1.04],'Will put a foot in. Always'],
 ['wes','Wes Hollis','HOLLIS',12,'Keen Bean','MID',56,'b2b','Step-over','Turbo',0,'#f2cfae','#b5562b',['curly',0,0,.98],'Keen as mustard']];
// the original cards, rated to match the real players behind them: Messi and Ronaldo top the whole game
const ORATE={rafa:99,marco:98,kai:94,lucien:93,tiago:92,sverre:93,yusuf:91,diego:88,han:85,tyrese:81,callum:83,gary:79,dario:81,anderson:78,nico:90,dimi:96,kees:89,ilya:88,jordan:91,
  pau:94,marc:94,davi:93,rui:87,omar:85,dylan:88,cal:88,jake:81,rory:80,femi:72,tomas:78,alessio:95,ade:90,rodrigo:91,joao:92,marcos:92,edinho:90,moussa:88,jack:83,shaun:89,toby:81,hamish:79,evan:76,pete:68,jens:84};
const OICON=new Set(['rafa','marco','tiago','diego','lucien','dimi','pau','marc','davi','alessio','rodrigo','joao','marcos','edinho','shaun']);
// every card starts a little lower, so training and upgrades have room to matter; retired greats outside the
// very top drop a little more, so today's stars mix into the top 50
const BASE_DROP=2,legDrop=(rt,legend)=>!legend||rt>=97?0:rt>=95?1:4;
const PLAYERS0=ROWS.map(r=>{const rt=ORATE[r[0]]??r[6],v=statsFor(rt-BASE_DROP-legDrop(rt,OICON.has(r[0])&&!['rafa','marco'].includes(r[0])),r[7]);return{id:r[0],name:r[1],short:r[2],num:r[3],tag:r[4],pos:r[5],pace:v[0],shot:v[1],fin:v[2],skill:v[3],pass:v[4],tackle:v[5],str:v[6],
  sk:SKMAP[r[8]],sp:SPMAP[r[9]],celeb:r[10],skin:r[11],hair:r[12],look:r[13],plays:r[14],...(OICON.has(r[0])?{rar:'icon'}:rt>=86?{rar:'special'}:{})}});
// saves from older versions: carry over players whose inspiration survived, refund the rest
const OLDMAP={lena:'marc',andre:'sverre',finn:'nico',baz:'alessio',ze:'lucien',bruno:'moussa',sami:'jordan',nia:'shaun',luca:'jake',theo:'diego',yuki:'han',kofi:'edinho',ama:'rui',jonny:'callum',pablo:'anderson',ivo:'hamish',max:'rory',ray:'evan',tom:'femi',sid:'toby',joe:'gary'};

const SKINS=['#f2cfae','#e8b88c','#c68d63','#8d5a3b','#5e3a24'],HAIRS=['#111111','#4a2c1a','#c9a15b','#b5562b','#e8e2d6','#5ec8ff'];
const PLAYERS=PLAYERS0;
// the wider database: about a thousand made-up footballers, the same for everyone (see 1b-career.js)
for(const p of genPlayers())PLAYERS.push(p);
let cloud=null,cloudTm=0,cloudBusy=false;
let NAMES={};try{NAMES=JSON.parse(localStorage.getItem('kickabout-names')||'{}')||{}}catch(e){}
for(const p of PLAYERS){p.name0=p.name;p.short0=p.short;if(NAMES[p.id]){p.name=NAMES[p.id];p.short=NAMES[p.id].split(' ').pop().toUpperCase().slice(0,10)}}
const ROSTER=PLAYERS,STARTERS=PLAYERS.filter(p=>['dave','leon','gaz'].includes(p.id)),MID=[];
const BUDGET=470;
// Your Player's training: 23 sessions of +8 points (470 → 650). Prices climb steadily from 400 coins to exactly 75,000
// for the last session (before any Coaching Staff discount).
const MYTRAIN_N=Math.ceil((650-BUDGET)/8),myTrainIx=()=>clamp(Math.ceil(((custom.budget||BUDGET)-BUDGET)/8),0,MYTRAIN_N-1),
  myTrainCost=i=>i>=MYTRAIN_N-1?75000:Math.round(400*Math.pow(75000/400,i/(MYTRAIN_N-1))/50)*50,myTrainBase=()=>myTrainCost(myTrainIx());
let custom={id:'custom',name:'Your Name',short:'NAME',num:99,tag:'Created player',pace:.75,shot:.75,fin:.7,skill:.7,pass:.7,tackle:.5,str:.6,sk:'roulette',sp:'curler',celeb:0,skin:SKINS[1],hair:HAIRS[0],isCustom:true};
// Release reset: progress from the test versions (saves without this stamp) doesn't carry over; everyone starts fresh.
// The old save is set aside under its own key (not used by the game) rather than deleted.
const SAVE_EPOCH=2;
// KEEP_SAVES is switched on only in a separately built copy (KEEP_SAVES=1 node build.mjs) that keeps everyone's progress
// from the test versions. In that copy, a test-version save that the release copy set aside on this device is put back.
const KEEP_SAVES=/*@KEEPSAVES*/false;
const saveOk=c=>!!c&&(KEEP_SAVES||(c.epoch|0)>=SAVE_EPOCH);
if(KEEP_SAVES)try{const old=localStorage.getItem('kickabout-club-test-version');if(old&&JSON.parse(old)){const cur=localStorage.getItem('kickabout-club'),cu=localStorage.getItem('kickabout-custom');
  if(cur)localStorage.setItem('kickabout-club-release-version',cur);if(cu)localStorage.setItem('kickabout-custom-release-version',cu);
  localStorage.setItem('kickabout-club',old);const oc=localStorage.getItem('kickabout-custom-test-version');if(oc)localStorage.setItem('kickabout-custom',oc);else localStorage.removeItem('kickabout-custom');
  localStorage.removeItem('kickabout-club-test-version');localStorage.removeItem('kickabout-custom-test-version')}}catch(e){}
try{const raw=localStorage.getItem('kickabout-club'),c=JSON.parse(raw||'null');if(c&&!saveOk(c)){localStorage.setItem('kickabout-club-test-version',raw);const cu=localStorage.getItem('kickabout-custom');if(cu)localStorage.setItem('kickabout-custom-test-version',cu);localStorage.removeItem('kickabout-club');localStorage.removeItem('kickabout-custom')}}catch(e){}
try{const c=JSON.parse(localStorage.getItem('kickabout-custom')||'null');if(c&&c.name)custom={...custom,...c,isCustom:true}}catch(e){}
function natPos(p){if(p.pos)return p.pos;const d=p.tackle*1.6+p.str*.6,m=p.pass*1.3+p.skill*.7,a=(p.shot+p.fin)*.8+p.pace*.3;return d>=m&&d>=a?'DEF':m>=a?'MID':'ATT'}
const allPlayers=()=>[...PLAYERS,custom];
const everyone=allPlayers;
const PMAP=new Map();
function byId(id){if(id==='custom')return custom;if(PMAP.size!==PLAYERS.length){PMAP.clear();for(const p of PLAYERS)PMAP.set(p.id,p)}return PMAP.get(id)}
const KITS=['#ff6f59','#4fb3ff','#e8475f','#f4f1ea','#2f2f3a','#b06cf0'];
// 5-a-side: a keeper plus four outfield slots. x = how far up the pitch (0 own goal, 1 their goal), y = 0 left touchline to 1 right.
const FORMS={
  '2-2':[{r:'DEF',x:.2,y:.3},{r:'DEF',x:.2,y:.7},{r:'ATT',x:.56,y:.32},{r:'ATT',x:.56,y:.68}],
  '1-2-1':[{r:'DEF',x:.18,y:.5},{r:'MID',x:.38,y:.24},{r:'MID',x:.38,y:.76},{r:'ATT',x:.6,y:.5}],
  '2-1-1':[{r:'DEF',x:.2,y:.3},{r:'DEF',x:.2,y:.7},{r:'MID',x:.4,y:.5},{r:'ATT',x:.6,y:.5}],
  '1-1-2':[{r:'DEF',x:.18,y:.5},{r:'MID',x:.36,y:.5},{r:'ATT',x:.58,y:.3},{r:'ATT',x:.58,y:.7}],
  '3-1':[{r:'DEF',x:.24,y:.2},{r:'DEF',x:.18,y:.5},{r:'DEF',x:.24,y:.8},{r:'ATT',x:.56,y:.5}],
  // Classical 9-a-side: a keeper plus eight outfield slots
  '3-3-2':[{r:'DEF',x:.17,y:.22},{r:'DEF',x:.15,y:.5},{r:'DEF',x:.17,y:.78},{r:'MID',x:.37,y:.2},{r:'MID',x:.34,y:.5},{r:'MID',x:.37,y:.8},{r:'ATT',x:.6,y:.36},{r:'ATT',x:.6,y:.64}],
  '3-2-3':[{r:'DEF',x:.17,y:.22},{r:'DEF',x:.15,y:.5},{r:'DEF',x:.17,y:.78},{r:'MID',x:.36,y:.36},{r:'MID',x:.36,y:.64},{r:'ATT',x:.58,y:.16},{r:'ATT',x:.62,y:.5},{r:'ATT',x:.58,y:.84}],
  '2-4-2':[{r:'DEF',x:.16,y:.34},{r:'DEF',x:.16,y:.66},{r:'MID',x:.36,y:.12},{r:'MID',x:.33,y:.38},{r:'MID',x:.33,y:.62},{r:'MID',x:.36,y:.88},{r:'ATT',x:.6,y:.36},{r:'ATT',x:.6,y:.64}],
  '3-4-1':[{r:'DEF',x:.17,y:.22},{r:'DEF',x:.15,y:.5},{r:'DEF',x:.17,y:.78},{r:'MID',x:.37,y:.12},{r:'MID',x:.34,y:.38},{r:'MID',x:.34,y:.62},{r:'MID',x:.37,y:.88},{r:'ATT',x:.62,y:.5}],
  '4-3-1':[{r:'DEF',x:.18,y:.14},{r:'DEF',x:.15,y:.38},{r:'DEF',x:.15,y:.62},{r:'DEF',x:.18,y:.86},{r:'MID',x:.36,y:.24},{r:'MID',x:.34,y:.5},{r:'MID',x:.36,y:.76},{r:'ATT',x:.6,y:.5}]};
const FORM_KEYS={volta:['2-2','1-2-1','2-1-1','1-1-2','3-1'],classical:['3-3-2','3-2-3','2-4-2','3-4-1','4-3-1']};
const posFit=(pos,r)=>pos===r?1:(pos==='MID'||r==='MID')?.93:.86;
const E8=()=>[null,null,null,null,null,null,null,null];
let club={name:'Sunday XI',kit:KITS[0],coins:400,owned:['dave','leon','gaz','custom','wes'],squads:[{f:'2-2',s:['gaz','dave','leon','custom']},{f:'1-2-1',s:[null,null,null,null]},{f:'2-1-1',s:[null,null,null,null]}],active:0,
  csquads:[{f:'3-3-2',s:E8()},{f:'3-2-3',s:E8()},{f:'2-4-2',s:E8()}],cactive:0,gm:'volta',gift:true,played:0};
function loadClubFrom(c){if(c&&c.cup&&!Array.isArray(c.cup.opps))delete c.cup;if(c&&Array.isArray(c.owned)){club={...club,...c};delete club.squad;
  club.squads=(club.squads||[]).map((q,i)=>Array.isArray(q)?{f:['2-2','1-2-1','2-1-1'][i]||'2-2',s:[...q,null,null,null,null].slice(0,4)}:q);
  while(club.squads.length<3)club.squads.push({f:'2-2',s:[null,null,null,null]});
  if(!Array.isArray(club.csquads))club.csquads=[{f:'3-3-2',s:E8()},{f:'3-2-3',s:E8()},{f:'2-4-2',s:E8()}];
  for(const q of club.csquads){if(!FORM_KEYS.classical.includes(q.f))q.f='3-3-2';q.s=[...(q.s||[]),...E8()].slice(0,8)}club.cactive=clamp(club.cactive|0,0,2);
  if(!club.owned.includes('wes'))club.owned.push('wes');
  const known=new Set([...PLAYERS0.map(p=>p.id),'custom']);let refund=0;
  club.owned=[...new Set(club.owned.map(id=>known.has(id)?id:OLDMAP[id]?OLDMAP[id]:(refund+=150,null)).filter(Boolean))];
  for(const q of club.squads)q.s=q.s.map(id=>id&&known.has(id)?id:id&&OLDMAP[id]&&club.owned.includes(OLDMAP[id])?OLDMAP[id]:null);
  for(const q of club.csquads)q.s=q.s.map(id=>id&&(known.has(id)||club.owned.includes(id))?id:null);
  club.coins+=refund}}
try{loadClubFrom(JSON.parse(localStorage.getItem('kickabout-club')||'null'))}catch(e){}
club.epoch=SAVE_EPOCH;
// Volta (5-a-side) and Classical (9-a-side) each keep their own line-ups, picked from the one shared collection
let GM=club.gm==='classical'?'classical':'volta';
const sqList=()=>GM==='classical'?club.csquads:club.squads;
const sq=()=>GM==='classical'?club.csquads[club.cactive||0]:club.squads[club.active];
// a player on the transfer market is locked: not available for line-ups, matches or development until he's sold or back
const ownedPlayers=()=>club.owned.filter(id=>!mktLocked(id)).map(id=>byId(id)).filter(Boolean).sort((a,b)=>effOvr(b)-effOvr(a));
function slotRating(id,i,q=sq()){const p=byId(id);if(!p)return 0;return Math.round(effOvr(p)*posFit(natPos(p),FORMS[q.f][i].r))}
function teamRating(q=sq()){const v=q.s.map((id,i)=>slotRating(id,i,q)).filter(Boolean);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/q.s.length):0}
function autoPick(q=sq()){
  const used=new Set(),slots=FORMS[q.f];q.s=slots.map(()=>null);
  // fill each slot with the best owned player for that role, best-fit first
  const order=slots.map((x,i)=>i).sort((a,b)=>({DEF:0,ATT:1,MID:2}[slots[a].r]-{DEF:0,ATT:1,MID:2}[slots[b].r]));
  for(const i of order){let best=null,bs=-1;for(const p of ownedPlayers()){if(used.has(p.id))continue;const v=effOvr(p)*posFit(natPos(p),slots[i].r);if(v>bs){bs=v;best=p}}if(best){q.s[i]=best.id;used.add(best.id)}}
}
const saveClub=()=>{try{localStorage.setItem('kickabout-club',JSON.stringify(club))}catch(e){}cloudPush()};
/* ---------- cloud save: your club, names and created player follow your Claude account ---------- */
// Browser storage alone can vanish (another browser, the app vs the web, cleared data). This keeps a copy in the
// artifact's private per-person store; whichever save has more progress wins, so a fresh start never overwrites a real club.
const progressOf=sv=>{const c=sv&&sv.club;if(!c||!Array.isArray(c.owned))return -1;return (c.played||0)*1000+c.owned.length*10+Object.keys(sv.names||{}).length};
const snapshotSave=()=>JSON.parse(JSON.stringify({club,names:NAMES,custom,best,at:Date.now(),v:1}));
const shortOf=(nm,country)=>{const t=nm.split(' ');if(t.length<2)return nm.toUpperCase().slice(0,12);if(['South Korea','China'].includes(country))return t[0].toUpperCase();
  if(/^(Júnior|Jr|Neto|Filho)$/.test(t[t.length-1]))return t[0].toUpperCase().slice(0,12);const rest=t.slice(1).join(' ');return (rest.length<=12?rest:t[t.length-1]).toUpperCase().slice(0,12)};
const realOn=()=>club.realNames!==false;
function applyNames(){for(const p of PLAYERS){const ins=typeof inspOf==='function'?inspOf(p.id):['',''];
  if(NAMES[p.id]){p.name=NAMES[p.id];p.short=NAMES[p.id].split(' ').pop().toUpperCase().slice(0,10)}
  else if(realOn()&&ins[0]){p.name=ins[0];p.short=shortOf(ins[0],ins[1])}
  else{p.name=p.name0;p.short=p.short0}}}
function cloudPush(){try{acctPush()}catch(e){}if(!cloud)return;clearTimeout(cloudTm);cloudTm=setTimeout(async()=>{if(cloudBusy){cloudPush();return}cloudBusy=true;
  try{await cloud.set(snapshotSave())}catch(e){if(e&&e.code==='unavailable')setTimeout(cloudPush,4000)}cloudBusy=false},1500)}
async function cloudInit(){try{
  const cl=window.claude;if(!cl||!cl.use)return;const [db,user]=await Promise.all([cl.use('db'),cl.use('user')]);if(!db||!user)return;
  const id=await user.id();if(!id)return;const ref=db.doc('data/users/'+id+'/save');
  const snap=await ref.get();const remote=snap.exists?snap.data():null,local=snapshotSave();
  if(remote&&progressOf(remote)>progressOf(local)){
    loadClubFrom(JSON.parse(JSON.stringify(remote.club)));NAMES={...NAMES,...(remote.names||{})};applyNames();
    if(remote.custom&&remote.custom.name)custom={...custom,...remote.custom,isCustom:true};best=Math.max(best,+remote.best||0);
    try{localStorage.setItem('kickabout-club',JSON.stringify(club));localStorage.setItem('kickabout-names',JSON.stringify(NAMES));localStorage.setItem('kickabout-custom',JSON.stringify(custom))}catch(e){}
    if(state==='menu')renderMenu();toast('Your saved club has been loaded from your account');
  }else if(remote&&remote.names){const extra=Object.keys(remote.names).filter(k=>!NAMES[k]);if(extra.length){for(const k of extra)NAMES[k]=remote.names[k];applyNames();try{localStorage.setItem('kickabout-names',JSON.stringify(NAMES))}catch(e){}if(state==='menu')renderMenu()}}
  cloud=ref;if(!remote||progressOf(remote)<=progressOf(snapshotSave()))cloudPush();
}catch(e){}}
let mode='club';
// rarity: generated cards carry their own; the original cards and your created player go by rating
const tier=p=>{if(p.rar)return p.rar;const o=ovr(p);if(p.isCustom)return tierAt(o);return o>=87?'icon':o>=75?'gold':o>=65?'silver':'bronze'};
const TIERS={bronze:{name:'Bronze',sell:40},silver:{name:'Silver',sell:120},gold:{name:'Gold',sell:350},special:{name:'Special',sell:900},icon:{name:'Icon',sell:2500}};
const price=p=>Math.max(150,Math.round(Math.pow(Math.max(0,ovr(p)-50),2)*1.8/50)*50);
// Every pack shows three players of one rarity and you sign one. Odds are shown on each pack. No real money anywhere.
const PACKS=[
  {id:'bronze',name:'Bronze Pack',cost:250,odds:{bronze:80,silver:20,gold:0,special:0,icon:0},d:'Three bronzes, or three silvers 20% of the time. Sign one.'},
  {id:'silver',name:'Silver Pack',cost:750,odds:{bronze:0,silver:85,gold:15,special:0,icon:0},d:'Three silvers, or three golds 15% of the time. Sign one.'},
  {id:'gold',name:'Gold Pack',cost:2000,odds:{bronze:0,silver:0,gold:100,special:0,icon:0},d:'Three golds. Sign one.'},
  {id:'premium',name:'Premium Gold Pack',cost:5000,odds:{bronze:0,silver:0,gold:80,special:20,icon:0},d:'Three golds, or three Specials 20% of the time. Sign one.'},
  {id:'elite',name:'Elite Pack',cost:12500,odds:{bronze:0,silver:0,gold:30,special:70,icon:0},d:'Three Specials 70% of the time, otherwise top golds. Sign one.'},
  {id:'icon',name:'Icon Pack',cost:50000,odds:{bronze:0,silver:0,gold:0,special:0,icon:100},d:'Guaranteed: three Icons. Sign one.'}];
// overall rating: the average of a player's best five stats. No 99 ceiling: a fully developed star whose stats go past
// 99 (through levels, upgrades and evolutions) is rated above 99. Each player still stops at his own maximum potential.
const ovr=p=>{if(p.isCustom)return customOvr(p);const v=[p.pace,p.shot,p.fin,p.skill,p.pass,p.tackle,p.str].sort((a,b)=>b-a).slice(0,5);return Math.round(v.reduce((a,b)=>a+b,0)/5*100)};
// a numeric safety limit for developed stats (well above anything development can reach), so physics never sees runaway values
const STATCAP=1.2;

// Your created player: every stat point counts towards the rating, so training always moves it up.
function customOvr(p){const all=[p.pace,p.shot,p.fin,p.skill,p.pass,p.tackle,p.str],top=[...all].sort((a,b)=>b-a).slice(0,5);
  const t5=top.reduce((a,b)=>a+b,0)/5,av=all.reduce((a,b)=>a+b,0)/7;return Math.round((t5*.5+av*.5)*100+2)}
// Training spreads its points over your best stats straight away (you can still move them in the editor).
function autoSpend(c,pts){const ks=STATK.map(([k])=>k);let guard=0;
  while(pts>0&&guard++<200){const order=ks.filter(k=>c[k]<.99).sort((a,b)=>c[b]-c[a]).slice(0,3);if(!order.length)break;
    for(const k of order){if(pts<=0)break;c[k]=Math.min(.99,Math.round(c[k]*100+1)/100);pts--}}
  return pts}
const DIFFS={
  beginner:{spd:1.8,tackle:.17,react:22,dive:1.8,shoot:.25,err:34,press:.5,range:190,read:0,skills:false,gk:.8,slide:false,coin:.6,note:'Slow, gentle opponents. Learn the controls.'},
  easy:{spd:2,tackle:.25,react:19,dive:2,shoot:.35,err:26,press:.6,range:220,read:0,skills:false,gk:.85,slide:false,coin:.8,note:'Relaxed. Room to try skills.'},
  normal:{spd:2.3,tackle:.38,react:15,dive:2.4,shoot:.48,err:17,press:.75,range:245,read:.06,skills:true,gk:.95,slide:false,coin:1,note:'A fair game. Opponents press and use skills.'},
  hard:{spd:2.45,tackle:.47,react:12,dive:2.7,shoot:.6,err:12,press:.88,range:270,read:.1,skills:true,gk:1.05,slide:true,coin:1.4,note:'Sharp keepers, slide tackles, clinical finishing. 1.4× coins.'},
  legend:{spd:2.6,tackle:.56,react:10,dive:3,shoot:.75,err:9,press:1,range:290,read:.16,skills:true,gk:1.15,slide:true,coin:2,note:'Brutal. 2× coins.'}};
let diffKey='easy';// only the Sunday Cup is left besides the Grand Tournament
let DF=DIFFS[diffKey];
// Chill / Normal / Hard sit on top of whatever the opponent is: they shift the AI a level down or up, change how often
// defenders bite on your cuts (overcommit), and scale the coins.
const LEVELS={chill:{shift:-1,ai:.9,bite:.62,coin:.8,name:'Chill',note:'Relaxed opponents: they bite on your cuts, press gently and rarely read your passes. Fewer coins.'},
  normal:{shift:0,half:.8,ai:1.22,bite:.3,coin:1,name:'Medium',note:'A fair game. They mark your runners, sometimes cut out a pass, and still bite on a sharp cut now and then.'},
  hard:{shift:2.6,ai:1.75,bite:.04,coin:1.8,boost:.07,name:'Hard',note:'A genuine challenge: opponents beyond Legend level who track your runs, block passing lanes, time their through balls and almost never bite. Keepers sweep up behind. 1.8× coins.'},
  extreme:{shift:4.2,ai:2.1,bite:0,coin:2.5,boost:.12,extreme:true,name:'Extreme',note:'For veterans only: whoever you face, even a poor side plays at the very top level, +12 on every opponent (past 99), near-instant reactions, relentless pressing and slide tackles, and elite decisions: they cut out loose passes, counter in numbers, pick the open corner and never bite. 2.5× coins.'}};
// the Icon Cup is always played at the hardest level, whatever difficulty is chosen
const lvKey=()=>!NET.on&&comp==='icon'?'extreme':club.level;
const LV=()=>NET.on?{shift:0,ai:1,bite:.3,coin:1,name:'Online'}:LEVELS[lvKey()]||LEVELS.normal;
const DKEYS=['beginner','easy','normal','hard','legend'];
// Hard can push an opponent past Legend: the numbers carry on from Normal → Hard → Legend, within sensible limits
const DFCAP={spd:[1.5,3.15],tackle:[0,.8],react:[5,40],dive:[1,3.7],shoot:[0,1.1],err:[3,40],press:[0,1.35],range:[100,345],read:[0,.34],gk:[.7,1.42]};
const DFCAPX={spd:[1.5,3.35],tackle:[0,.92],react:[3,40],dive:[1,4],shoot:[0,1.25],err:[2,40],press:[0,1.5],range:[100,370],read:[0,.42],gk:[.7,1.55]};
// the numbers for one point on the scale (beyond Legend they carry on, within limits)
function dfAt(x,X){
  if(x>4){const L=DIFFS.legend,Hd=DIFFS.hard,o={...L};for(const key in L)if(typeof L[key]==='number'&&key!=='coin'){const v=L[key]+(L[key]-Hd[key])*(x-4)*1.15,c=(X?DFCAPX:DFCAP)[key];o[key]=c?clamp(v,c[0],c[1]):v}if(X)o.slide=true;return o}
  const lo=DIFFS[DKEYS[Math.floor(x)]],hi=DIFFS[DKEYS[Math.ceil(x)]],f=x-Math.floor(x);
  if(!f)return lo;const o={...lo};for(const key in lo)if(typeof lo[key]==='number')o[key]=lo[key]+(hi[key]-lo[key])*f;else o[key]=f>=.5?hi[key]:lo[key];return o}
const levelDF=k=>{const L=LV(),X=L.extreme;let b=DKEYS.indexOf(k);
  // above Chill, weak sides still put up a fight: the bottom of the range is lifted a little
  if(L.shift>=0&&b<2)b+=(2-b)*.25;
  const x=clamp(b+L.shift+(L.half||0),0,X?8:6);
  // Extreme: whoever the opponent is, their outfield players play at (nearly) the very top level; their goalkeeper stays
  // at the opponent's own level (reactions, diving, handling), so Extreme keepers stay beatable as before
  if(X&&x<7.6){const o=dfAt(7.6,X),kp=dfAt(x,X);o.react=kp.react;o.dive=kp.dive;o.gk=kp.gk;return o}
  return dfAt(x,X)};
const CELEBS=['KNEE SLIDE','SIUUU','ROBOT','AIRPLANE','BACKFLIP','CALM DOWN'];
// announcer lines for named goals (also spoken aloud when sound is on)
const ANN={'SCREAMER':['FROM ABSOLUTELY MILES!','HE HAS LEATHERED IT!'],'TOP BINS':['RIGHT IN THE TOP CORNER!','WHERE THE OWL SLEEPS!'],'CURLER':['BENT IT LIKE A BANANA!','WHAT A CURLER!'],
  'ROCKET':['THAT NEARLY BROKE THE NET!','ROCKET!'],'BICYCLE KICK':['A BICYCLE KICK! ARE YOU KIDDING ME?','OVERHEAD! UNREAL!'],'CHIPPED IT':['A DELICATE LITTLE DINK!','CHEEKY CHIP!'],
  'SOLO GOAL':['HE BEAT THE LOT OF THEM!','ONE MAN ARMY!'],'ANKLE BREAKER':['ANKLES GONE, BALL IN THE NET!'],'SKILL GOAL':['SKILL AND THE FINISH!'],'TEAM GOAL':['WHAT A TEAM MOVE!','PASS, PASS, GOAL!'],
  'NUTMEG FINISH':['THROUGH HIS LEGS AND IN!'],'IN OFF THE POST':['OFF THE POST AND IN!','KISSED THE POST!'],'COUNTER-ATTACK':['DEVASTATING ON THE BREAK!','FROM DEFENCE TO GOAL IN SECONDS!'],
  'LAST GASP':['RIGHT AT THE DEATH!','LAST KICK OF THE GAME!'],'COMEBACK':['WHAT A COMEBACK!','THEY HAVE TURNED IT AROUND!'],'REBOUND':['FIRST TO THE REBOUND!'],'HAT-TRICK':['HAT-TRICK! TAKE A BOW!'],'FIRST TIME':['FIRST TIME! CLINICAL!'],'HEADER':['WHAT A HEADER!','POWERED IT IN WITH HIS HEAD!'],'VOLLEY':['STRAIGHT ON THE VOLLEY!','HIT IT FIRST TIME AND IT FLEW!']};
function speak(line){try{if(muted||!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(line.toLowerCase().replace(/!/g,'.'));u.rate=1.08;u.pitch=1.05;u.volume=.9;speechSynthesis.speak(u)}catch(e){}}
const PHRASES=['GET IN!','WHAT A HIT!','SENSATIONAL!','CHEF’S KISS','ABSOLUTE SCENES','PURE CLASS','ONE FOR THE REEL','UNSTOPPABLE','LIMBS!'];

/* ---------- state ---------- */
let ctrl2=null,RIN=null,swT2=0,RS=null;// online: the guest's player (host side) and their input while it runs
const NET={on:false,host:false,guest:false};const pvp=()=>NET.on;const hum=p=>p===ctrl||p===ctrl2;
let state='menu',t=0,stT=0,players=[],ctrl=null,score=[0,0],clock=180,style=0,shownStyle=0,hype=0,fire=0,kickT=0,streak=0;
let stats={shots:0,on:0,skills:0,passes:0,tackles:0};
let charging=false,charge=0,shake=0,flash=0,netShake=[0,0],parts=[],pops=[],rec=[],replay=null,replayIdx=0,labels=[],phrase='',celebType=0,scorer=null,lastSkillT=-999,passChain=0;
const B={x:MIDX,y:MY,z:0,vx:0,vy:0,vz:0,owner:null,lockBy:null,lockT:0,curl:0,knuckle:0,rocket:false,shot:null,pass:null,spin:0,px:MIDX};
let best=0;try{best=+localStorage.getItem('kickabout-best3')||0}catch(e){}

/* ---------- menu ---------- */
const $=id=>document.getElementById(id);
const rosterEl=$('roster'),menuEl=$('menu'),resultEl=$('result'),goBtn=$('go');
/* who each card is inspired by, and the country (the real player's nationality). Editable in Collection > Who's who. */
const COUNTRIES={Argentina:['ARG','\u{1F1E6}\u{1F1F7}'],Portugal:['POR','\u{1F1F5}\u{1F1F9}'],France:['FRA','\u{1F1EB}\u{1F1F7}'],Brazil:['BRA','\u{1F1E7}\u{1F1F7}'],Norway:['NOR','\u{1F1F3}\u{1F1F4}'],Egypt:['EGY','\u{1F1EA}\u{1F1EC}'],
  Uruguay:['URU','\u{1F1FA}\u{1F1FE}'],'South Korea':['KOR','\u{1F1F0}\u{1F1F7}'],England:['ENG','\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}'],Scotland:['SCO','\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}'],Wales:['WAL','\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}'],
  Spain:['ESP','\u{1F1EA}\u{1F1F8}'],Belgium:['BEL','\u{1F1E7}\u{1F1EA}'],Croatia:['CRO','\u{1F1ED}\u{1F1F7}'],Germany:['GER','\u{1F1E9}\u{1F1EA}'],Ireland:['IRL','\u{1F1EE}\u{1F1EA}'],'Czech Republic':['CZE','\u{1F1E8}\u{1F1FF}'],Italy:['ITA','\u{1F1EE}\u{1F1F9}'],
  Senegal:['SEN','\u{1F1F8}\u{1F1F3}'],Netherlands:['NED','\u{1F1F3}\u{1F1F1}'],Nigeria:['NGA','\u{1F1F3}\u{1F1EC}'],Ghana:['GHA','\u{1F1EC}\u{1F1ED}'],'Ivory Coast':['CIV','\u{1F1E8}\u{1F1EE}'],Cameroon:['CMR','\u{1F1E8}\u{1F1F2}'],Morocco:['MAR','\u{1F1F2}\u{1F1E6}'],
  Japan:['JPN','\u{1F1EF}\u{1F1F5}'],USA:['USA','\u{1F1FA}\u{1F1F8}'],Colombia:['COL','\u{1F1E8}\u{1F1F4}'],Denmark:['DEN','\u{1F1E9}\u{1F1F0}'],Sweden:['SWE','\u{1F1F8}\u{1F1EA}'],Poland:['POL','\u{1F1F5}\u{1F1F1}'],Switzerland:['SUI','\u{1F1E8}\u{1F1ED}'],Austria:['AUT','\u{1F1E6}\u{1F1F9}'],
  Serbia:['SRB','\u{1F1F7}\u{1F1F8}'],Algeria:['ALG','\u{1F1E9}\u{1F1FF}'],Canada:['CAN','\u{1F1E8}\u{1F1E6}'],Mexico:['MEX','\u{1F1F2}\u{1F1FD}'],Turkey:['TUR','\u{1F1F9}\u{1F1F7}'],Georgia:['GEO','\u{1F1EC}\u{1F1EA}'],Ukraine:['UKR','\u{1F1FA}\u{1F1E6}'],Australia:['AUS','\u{1F1E6}\u{1F1FA}'],
  'Burkina Faso':['BFA','\u{1F1E7}\u{1F1EB}'],Finland:['FIN','\u{1F1EB}\u{1F1EE}'],Russia:['RUS','\u{1F1F7}\u{1F1FA}']};
const INSP0={rafa:['Lionel Messi','Argentina'],marco:['Cristiano Ronaldo','Portugal'],kai:['Kylian Mbappé','France'],lucien:['Thierry Henry','France'],tiago:['Neymar','Brazil'],sverre:['Erling Haaland','Norway'],
  yusuf:['Mohamed Salah','Egypt'],diego:['Luis Suárez','Uruguay'],han:['Son Heung-min','South Korea'],tyrese:['Marcus Rashford','England'],callum:['Ollie Watkins','England'],gary:['Jamie Vardy','England'],
  dario:['Darwin Núñez','Uruguay'],anderson:['Antony','Brazil'],nico:['Lamine Yamal','Spain'],dimi:['Zinedine Zidane','France'],kees:['Kevin De Bruyne','Belgium'],ilya:['Luka Modrić','Croatia'],
  jordan:['Jude Bellingham','England'],pau:['Andrés Iniesta','Spain'],marc:['Xavi','Spain'],davi:['Kaká','Brazil'],rui:['Bruno Fernandes','Portugal'],omar:['N’Golo Kanté','France'],
  dylan:['Declan Rice','England'],cal:['Cole Palmer','England'],jake:['James Maddison','England'],rory:['Conor Gallagher','England'],femi:['Dele Alli','England'],tomas:['Tomáš Souček','Czech Republic'],
  alessio:['Paolo Maldini','Italy'],ade:['Virgil van Dijk','Netherlands'],rodrigo:['Sergio Ramos','Spain'],joao:['Roberto Carlos','Brazil'],marcos:['Cafu','Brazil'],edinho:['Dani Alves','Brazil'],
  moussa:['William Saliba','France'],jack:['John Stones','England'],shaun:['Ashley Cole','England'],toby:['Ben White','England'],hamish:['Harry Maguire','England'],evan:['Eric Dier','England'],
  pete:['Phil Jones','England'],jens:['Micky van de Ven','Netherlands'],dave:['James Milner','England'],leon:['Theo Walcott','England'],gaz:['Ryan Shawcross','England'],wes:['James Garner','England']};
for(const p of PLAYERS)if(p.insp)INSP0[p.id]=p.insp;
// flags for every country a real player comes from
for(const [code,[nm,iso]] of Object.entries(realCC()))if(!COUNTRIES[nm])COUNTRIES[nm]=[code,iso?String.fromCodePoint(...[...iso].map(c=>127397+c.charCodeAt(0))):''];
const inspOf=id=>{const o=club.insp&&club.insp[id];const d=INSP0[id]||['',''];return o?[o[0]??d[0],o[1]??d[1]]:d};
const natHTML=p=>{if(p.isCustom)return '';const c=inspOf(p.id)[1],k=COUNTRIES[c];return c?`<span class="nat" title="${esc(c)}">${k?k[1]+' '+k[0]:esc(c).slice(0,3).toUpperCase()}</span>`:''};
function cardHTML(p,o={}){
  const sel=o.sel??-1,mineC=!p.isCustom&&club.owned.includes(p.id)&&!o.base,ps=mineC?playStats(p):p;
  return `<div class="card t-${tier(p)}${o.inteam?' inteam':''}" ${o.pickable?`role="button" tabindex="0"`:''} data-id="${p.id}" ${o.pickable?'':'style="cursor:default"'}>
    ${o.badge?`<span class="badge">${o.badge}</span>`:''}
    <div class="top"><span class="ovr">${mineC?effOvr(p):ovr(p)}</span><div style="min-width:0"><h2>${esc(p.name)}</h2><span class="tag">#${p.num} · ${esc(p.tag).toUpperCase()}</span><br><span class="tier">${TIERS[tier(p)].name.toUpperCase()}</span><span class="pos">${natPos(p)}</span>${natHTML(p)}${mineC&&effOvr(p)>ovr(p)?` <span class="eff">card ${ovr(p)}${evoOf(p.id).st?' · evo '+evoOf(p.id).st:''}${upSpent(p.id)?' · +'+upSpent(p.id)+' up':''}</span>`:''}${p.ab?`<span class="abl">★ ${ABIL[p.ab].name}</span>`:''}</div></div>
    ${o.nolv?'':lvlHTML(p)}
    ${p.plays?`<p class="plays">${esc(p.plays)}</p>`:''}
    <div class="nums">${STATK.map(([k,l])=>`<span>${l} <b>${Math.round(ps[k]*100)}</b></span>`).join('')}</div>
    <div class="abil"><span class="chip">E ${SKILLS[p.sk].name}</span><span class="chip sp">X ${SPECIALS[p.sp].name}</span></div>
    ${o.extra||''}</div>`;
}
let tab='team',selSlot=0,lastSlotClick=-1,renaming=null,renameIn=null;
const CUPS={beginner:'Park Cup',easy:'Sunday Cup',normal:'County Cup',hard:'National Cup',legend:'Legends Cup'},ROUNDS=['Quarter-final','Semi-final','Final'],RBONUS=[40,80,250],ROFF=[-.04,0,.04];
const OPPS=[['Lilac FC','#8e8ff0'],['Harbour Rovers','#3f8fd8'],['Brickfield United','#b94a2c'],['Meadow Athletic','#5fc79a'],['Ironbridge Town','#8d97a3'],['Copper Lane','#d9965f'],['Northgate City','#5262e0'],['Riverside Wanderers','#2aa58c'],['Old Mill Albion','#d8bd5a'],['Kingsway Rangers','#c23a52']];
function kitClash(a,b){const f=h=>{const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]},x=f(a),y=f(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2])<110}
function newCup(tier){const pool=OPPS.map((o,i)=>i).filter(i=>!kitClash(OPPS[i][1],club.kit));const opps=[];while(opps.length<3&&pool.length)opps.push(pool.splice((Math.random()*pool.length)|0,1)[0]);
  club.cup={tier,round:0,alive:true,opps,res:[]};saveClub()}
const cupOver=()=>!club.cup||!club.cup.alive||club.cup.round>=3;
let OPP={name:'LILAC FC',kit:'#8e8ff0',off:0},cupEvent=null,eventText=null;
let comp='cup';
/* ---------- Grand Tournament: 16 clubs, straight knockout ---------- */
const CLUBS=[
 ['Galácticos FC','#f4f1ea','#6d3fb5',['rafa','marco','dimi','alessio']],
 ['Samba United','#f5d33c','#2a6fd6',['tiago','davi','joao','marcos']],
 ['French Connection','#2a4fb5','#f4f1ea',['kai','lucien','omar','moussa']],
 ['Azzurri Legends','#3d8de0','#f4f1ea',['rodrigo','ade','edinho','ilya']],
 ['Tiki-Taka FC','#c8243a','#f2c230',['pau','marc','nico','jordan']],
 ['Total Football','#f28a1e','#1e2a5e',['sverre','kees','moussa','jens']],
 ['Pharaohs FC','#d8bd5a','#1f1f1f',['yusuf','rui','jack','shaun']],
 ['Premier XI','#5b2a86','#56d4c4',['cal','dylan','han','toby']],
 ['Lusitano FC','#8f1e2c','#2f8a4c',['diego','omar','edinho','toby']],
 ['Gegenpress FC','#ffd400','#222222',['tyrese','jake','rory','hamish']],
 ['Rising Stars FC','#2aa58c','#ff8fb1',['callum','gary','evan','femi']],
 ['Silver Wolves','#9aa3ad','#1e2a3a',['dario','anderson','tomas','pete']],
 ['Phoenix FC','#e2572b','#2b2b2b',['gary','hamish','evan','femi']],
 ['Lightning FC','#5262e0','#ffe14d',['callum','jake','tyrese','shaun']],
 ['Underdogs United','#6b8e23','#f4f1ea',['rory','toby','tomas','pete']]];
const ME=15,TROUNDS=['Round of 16','Quarter-finals','Semi-finals','Final'],TPRIZE=[0,120,250,500,1200];// prize for reaching: QF, SF, Final, winning
const clubRating=i=>i===ME?teamRating():Math.round(CLUBS[i][3].map(id=>ovr(byId(id))).reduce((a,b)=>a+b,0)/4);
const clubName=i=>i===ME?(club.name||'My Club'):CLUBS[i][0];
const clubKit=i=>i===ME?club.kit:(kitClash(CLUBS[i][1],club.kit)?CLUBS[i][2]:CLUBS[i][1]);
// Simulated result: the stronger side usually wins, but upsets happen (about 1 in 7 at a 10-point gap)
function simMatch(a,b){
  const ra=clubRating(a),rb=clubRating(b),p=1/(1+Math.pow(10,-(ra-rb)/12)),aw=Math.random()<p;
  const gap=Math.abs(ra-rb),wg=1+((Math.random()*(1.6+gap/12))|0),pens=Math.random()<.18;
  let sa,sb;if(pens){const g=(Math.random()*3)|0;sa=sb=g}else{const lg=Math.min(wg-1,(Math.random()*wg)|0);sa=aw?wg:lg;sb=aw?lg:wg}
  return{a,b,sa,sb,pen:pens,w:aw?a:b,up:(aw?ra<rb-3:rb<ra-3)};
}
function newTour(){const ids=[...Array(16).keys()];for(let i=15;i>0;i--){const j=(Math.random()*(i+1))|0;[ids[i],ids[j]]=[ids[j],ids[i]]}
  const r0=[];for(let i=0;i<16;i+=2)r0.push({a:ids[i],b:ids[i+1]});club.tour={rounds:[r0],round:0,alive:true,done:false,news:[]};saveClub()}
const tourOver=()=>!club.tour||club.tour.done||!club.tour.alive;
const myMatch=()=>club.tour.rounds[club.tour.round].find(m=>m.a===ME||m.b===ME);
// finish the current round (everyone except your match), then build the next one
function simRound(){const T=club.tour,R=T.rounds[T.round];
  for(const m of R){if(m.w!=null)continue;if(m.a===ME||m.b===ME)continue;Object.assign(m,simMatch(m.a,m.b));if(m.up)T.news.push(`UPSET! ${clubName(m.w)} knock out ${clubName(m.w===m.a?m.b:m.a)}`)}
  if(T.round<3){const nx=[];for(let i=0;i<R.length;i+=2)nx.push({a:R[i].w,b:R[i+1].w});T.rounds.push(nx)}
}
function playOutRest(){const T=club.tour;while(true){simRound();if(T.round>=3){const f=T.rounds[3][0];if(f.w==null)Object.assign(f,simMatch(f.a,f.b));break}T.round++}T.done=true;T.champ=T.rounds[3][0].w}
function tourDF(i){const r=clubRating(i);return r<66?'beginner':r<72?'easy':r<80?'normal':r<86?'hard':'legend'}
let viewClub=null;
function squadView(){
  const T=club.tour;let i=viewClub;if(i==null){const m=!tourOver()&&myMatch();i=m?(m.a===ME?m.b:m.a):0}
  const cards=i===ME?sq().s.map(byId).filter(Boolean):CLUBS[i][3].map(byId);
  const pills=[...Array(15).keys(),ME].map(j=>`<button class="clubpill${j===i?' on':''}" data-club="${j}" style="--k:${clubKit(j)}">${esc(clubName(j))} <b>${clubRating(j)}</b></button>`).join('');
  return `<div class="sv"><div class="cup-head"><b style="font-size:19px">${esc(clubName(i))}</b><span>Club rating ${clubRating(i)}${i===viewClub||viewClub==null?'':''}</span></div>
    <div class="roster">${cards.map(p=>cardHTML(p)).join('')}</div>
    <details class="allclubs"><summary>All 16 clubs</summary><div class="pills">${pills}</div></details></div>`;
}
function renderTour(){
  const T=club.tour,tro=(club.trophies||{}).tour||0;
  const cell=(m,ri)=>{const row=(i,sc,w)=>`<div class="tm${i===ME?' me':''}${w?' w':''}${i===viewClub?' sel':''}" data-club="${i}" role="button" tabindex="0" title="See ${esc(clubName(i))}'s squad"><span style="--k:${clubKit(i)}">${esc(clubName(i))}</span><b>${sc}</b></div>`;
    if(m.a==null||m.b==null)return '<div class="tmatch tbd"><div class="tm"><span>TBD</span><b></b></div><div class="tm"><span>TBD</span><b></b></div></div>';
    const played=m.w!=null;return `<div class="tmatch${(m.a===ME||m.b===ME)?' mine':''}${m.up?' upset':''}">${row(m.a,played?m.sa+(m.pen&&m.w===m.a?'*':''):clubRating(m.a),played&&m.w===m.a)}${row(m.b,played?m.sb+(m.pen&&m.w===m.b?'*':''):clubRating(m.b),played&&m.w===m.b)}</div>`};
  const cols=[0,1,2,3].map(ri=>{const R=T.rounds[ri]||Array(8>>ri).fill({});return `<div class="tcol"><i>${TROUNDS[ri].toUpperCase()}</i>${R.map(m=>cell(m,ri)).join('')}</div>`}).join('');
  const status=T.done?(T.champ===ME?'\u{1F3C6} You won the Grand Tournament!':`Champions: ${clubName(T.champ)}`+(T.alive?'':` · you went out in the ${TROUNDS[T.exitRound||0]}`)):`Next: ${TROUNDS[T.round]} vs ${clubName(myMatch().a===ME?myMatch().b:myMatch().a)} (${clubRating(myMatch().a===ME?myMatch().b:myMatch().a)})`;
  $('cup').innerHTML=`<div class="cup-head"><b>Grand Tournament</b><span>${tro?'\u{1F3C6} ×'+tro+' won · ':''}Prize money: QF 300 · SF 600 · Final 1,200 · Winner 3,000</span></div>
    <p class="hint" style="margin:0;text-align:left">${esc(status)} · your team ${teamRating()}</p>
    ${T.news.length?`<p class="toast" style="margin:0;text-align:left;color:var(--coral)">${T.news.slice(-3).map(esc).join(' · ')}</p>`:''}
    <div class="tbracket">${cols}</div><p class="hint" style="margin:0;text-align:left">Numbers before kick-off are club ratings. * won on penalties. Tap any club to see its squad.</p>
    ${squadView()}`;
}

const renameUI=(p,where)=>renaming===p.id&&renameIn===where?`<div class="rn"><input type="text" id="rn-input" maxlength="16" value="${esc(NAMES[p.id]||p.name)}" aria-label="Player name"><button class="buy" data-rn-save="${p.id}">Save</button>${NAMES[p.id]?`<button class="edit" data-rn-reset="${p.id}">Reset</button>`:''}</div>`:`<button class="edit" data-rename="${p.id}">Rename</button>`;
let ctab='coll',lgView='table',benchAll=false,cmpIds=[],upId=null;const collF={q:'',r:'all',pos:'all',own:'owned',sort:'ovr',page:0};
const COMPS={volta:['league','wcc','easy','icon','tour','friendly','chal','skill'],classical:['league','wcc','easy','icon','friendly']};
const COMPN={league:'League',wcc:'World Club Championship',easy:'Sunday Cup',icon:'Icon Cup',tour:'Grand Tournament',friendly:'Friendly',chal:'Challenges',skill:'Skill games'};
const compKey=()=>comp==='cup'?'easy':comp;
// switching game mode swaps the line-up, the league season and the competition you were looking at
function setGM(g){if(g===GM)return;club.compBy=club.compBy||{};club.compBy[GM]=club.comp;cupSwap(GM,g);GM=g;club.gm=g;club.comp=club.compBy[g]||'league';
  if(!COMPS[g].includes(club.comp==='cup'?'easy':club.comp))club.comp='league';selSlot=0;saveClub();renderMenu()}
function renderMenu(){
  careerInit();applyNames();
  for(const k of ['team','squad','club','online','board'])$('tab-'+k).setAttribute('aria-selected',tab===k);
  $('sec-team').hidden=tab!=='team';$('sec-squad').hidden=tab!=='squad';$('sec-club').hidden=tab!=='club';$('sec-online').hidden=tab!=='online';$('sec-board').hidden=tab!=='board';if(tab==='online')renderOnlinePlus();if(tab==='board')regOpenBoard();
  $('sec-packs').hidden=!(tab==='club'&&ctab==='packs');$('sec-coll').hidden=!(tab==='club'&&ctab==='coll');
  comp=club.comp||'league';if(!COMPS[GM].includes(compKey())){comp=club.comp='league'}
  document.querySelectorAll('.lvl button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.lv===(club.level||'normal')?'true':'false'));
  renderModes();
  $('comps').innerHTML=COMPS[GM].map(c=>c==='icon'?iconTabHTML():`<button data-d="${c}" aria-pressed="${compKey()===c}">${COMPN[c]}</button>`).join('');
  if(!club.cup||club.cup.tier!==diffKey)newCup(diffKey);
  if(comp==='league')renderLeague();else if(comp==='wcc')renderWcc();else if(comp==='icon')renderIcon();
  else if(comp==='friendly')renderFriendly();else if(comp==='chal')renderChal();else if(comp==='skill')renderSkill();
  else if(comp==='tour'){if(!club.tour)newTour();$('diff-note').textContent=`${LV().name}: ${LV().note} 16 clubs, straight knockout. Four wins to lift the trophy.`;renderTour()}
  else{$('diff-note').textContent=`${LV().name}: ${LV().note} Coins ×${+(DIFFS[diffKey].coin*LV().coin).toFixed(2)}.`;const c=club.cup,tro=(club.trophies||{})[c.tier]||0;
   $('cup').innerHTML=`<div class="cup-head"><b>${CUPS[c.tier]}</b><span>${tro?'\u{1F3C6} ×'+tro+' won':'Win three in a row to lift the trophy'}</span></div>${c.tier==='easy'&&inIconDiv()?`<div class="prize"><span class="iconprize">Icon Division prize for winning it: ${ICON_SUNDAY.toLocaleString()} coins</span></div>`:''}<div class="rounds">`+ROUNDS.map((r,i)=>{const o=OPPS[c.opps[i]],st=i<c.res.length?(c.res[i]?'won':'lost'):i===c.round&&c.alive?'now':'';
     return `<div class="rnd ${st}" style="--k:${o[1]}"><i>${r.toUpperCase()}</i><em>${esc(o[0])}</em>${st==='won'?'<b>WON</b>':st==='lost'?'<b>KNOCKED OUT</b>':st==='now'?'<b style="color:var(--sun)">NEXT</b>':''}</div>`}).join('')+`</div>`}
  $('club-name').value=club.name;try{acctPill()}catch(e){}{const el=$('coins');el.textContent=club.coins.toLocaleString();if(shownCoins!=null&&club.coins!==shownCoins){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}shownCoins=club.coins}
  res();$('tt').textContent=club.tt;$('cp').textContent=club.cp.toLocaleString();$('legpill').textContent='Legacy Lv '+((club.leg||{}).lvl||0);ctkSync();$('ctkp').textContent=ctk();
  $('club-kit').innerHTML=[...KITS,...(cosOwned('kit_gold')?['#d4af37']:[])].map(c=>`<button type="button" style="background:${c}" aria-label="Kit colour" aria-pressed="${club.kit===c}" data-c="${c}"></button>`).join('');
  if(club.welcome){resultEl.hidden=false;resultEl.textContent=club.welcome;delete club.welcome;saveClub()}
  const q=sq();q.s=q.s.map(id=>id&&club.owned.includes(id)&&!mktLocked(id)?id:null);
  // pitch
  const slots=FORMS[q.f];
  const top=x=>(79-(x-.18)/.45*60).toFixed(1)+'%';
  $('pitchmini').innerHTML=`<div class="slot gk" style="left:50%;top:95%"><span>GK · CLUB KEEPER</span></div>`+slots.map((sl,i)=>{const id=q.s[i],p=byId(id);
    const pos=`left:${(sl.y*100).toFixed(1)}%;top:${top(sl.x)}`;
    if(!p)return `<button class="slot empty${selSlot===i?' sel':''}" data-slot="${i}" style="${pos}"><b>+</b><span>EMPTY</span><i>${sl.r}</i></button>`;
    const fit=natPos(p)===sl.r;
    const rb=q.att===i?'<em class="role att" title="Attacking role">⚡</em>':q.cap===i?'<em class="role" title="Captain">C</em>':'';
    return `<button class="slot t-${tier(p)}${selSlot===i?' sel':''}" data-slot="${i}" style="${pos}">${rb}<b>${slotRating(id,i)}</b><span>${esc(p.short)}</span><i class="${fit?'':'bad'}">${sl.r}${fit?'':' · '+natPos(p)}</i></button>`}).join('');
  $('forms').innerHTML=FORM_KEYS[GM].map(f=>`<button data-f="${f}" aria-pressed="${q.f===f}">${f}</button>`).join('');
  {const nm=i=>i!=null&&q.s[i]?esc(byId(q.s[i]).short):'none';
   $('roles').innerHTML=`<button data-role="att" aria-pressed="${q.att===selSlot}">⚡ Attacking: ${nm(q.att)}</button><button data-role="cap" aria-pressed="${q.cap===selSlot}">C Captain: ${nm(q.cap)}</button>`;
   $('roles-note').textContent='Attacking role: pushes right up and makes runs beyond the striker. Captain: sits deeper and stays back when you attack. Tap a role again to remove it.'}
  $('team-rating').textContent=teamRating();
  $('team-chem').textContent=q.s.filter((id,i)=>id&&natPos(byId(id))===slots[i].r).length+'/'+slots.length;
  $('sqtabs').innerHTML=sqList().map((x,i)=>`<button data-sq="${i}" aria-pressed="${i===(GM==='classical'?club.cactive:club.active)}">Squad ${i+1}${teamRating(x)?' · '+teamRating(x):''}</button>`).join('')+'<button data-best="1">Auto-pick best</button>';
  // bench
  const benchList=ownedPlayers().sort((a,b)=>{const r=slots[selSlot]?slots[selSlot].r:null,fa=r&&natPos(a)===r?1:0,fb=r&&natPos(b)===r?1:0;return (q.s.includes(b.id)-q.s.includes(a.id))||fb-fa||effOvr(b)-effOvr(a)});
  $('benchctl').innerHTML=`<span class="hint" style="margin:0">${benchList.length} players · best for the selected ${slots[selSlot]?slots[selSlot].r:''} spot first</span>`+(benchList.length>36?`<button class="ghost" data-benchall="1">${benchAll?'Show fewer':'Show all '+benchList.length}</button>`:'');
  $('bench').innerHTML=(benchAll?benchList:benchList.slice(0,36)).map(p=>{const at=q.s.indexOf(p.id);return cardHTML(p,{pickable:true,inteam:at>=0,badge:at>=0?slots[at].r[0]:'',
    extra:!p.isCustom?renameUI(p,'bench'):
      p.isCustom?`<button class="edit" data-edit="1">Edit player</button> <button class="buy" data-train="1" ${(custom.budget||BUDGET)>=650||club.coins<coachCost(myTrainBase())?'disabled':''}>${(custom.budget||BUDGET)>=650?'Fully trained':`Train +8 pts · ${priceTag(myTrainBase())} (session ${myTrainIx()+1}/${MYTRAIN_N})`}</button>`:''})}).join('');
  renderSquadExtras();
  // packs
  $('packs').innerHTML=PACKS.map(k=>{const free=(k.id==='silver'&&club.gift)||((club.free||{})[k.id]>0);const od=Object.entries(k.odds).filter(e=>e[1]).map(([t,v])=>`${TIERS[t].name} ${v}%`).join(' · ')+(depFx('scout')?` · top-rated chance +${depFx('scout')}% (scouting)`:'');
    return `<button class="packbtn t-${k.id==='premium'||k.id==='elite'?'special':k.id}" data-pack="${k.id}" ${!free&&club.coins<k.cost?'disabled':''}><b>${k.name}</b><span>${k.d}</span><span style="color:var(--tc)">Odds: ${od}</span><em>${free?`FREE${(club.free||{})[k.id]>1?' ×'+club.free[k.id]:''}`:k.cost.toLocaleString()+' coins'}</em></button>`}).join('');
  if(tab==='club')renderClub();
  const canFill=ownedPlayers().length>=4;
  goBtn.disabled=!canFill||(comp==='icon'&&!iconUnlocked());goBtn.textContent=goText();
}
const renderRoster=renderMenu;let shownCoins=null;
function toast(m){$('toast').textContent=m}
/* ---------- Friendly + House Rules ---------- */
const HRULES=[['golden','Golden goal','First goal wins it.'],['first3','First to 3','Match ends as soon as someone scores three.'],['nokeep','No keepers','Empty nets at both ends.'],
  ['giant','Giant ball','A huge beach ball. Easier to hit, harder to miss.'],['ice','Ice pitch','Everyone slides about. Ball keeps rolling.'],['wind','Windy','A gusty wind pushes the ball one way.'],
  ['turbo','Turbo','The whole game runs 30% faster.'],['night','Night match','Under the floodlights.']];
const hr=k=>comp==='friendly'&&club.hr&&!!club.hr[k];
let windX=0;
function renderFriendly(){$('diff-note').textContent=`${LV().name}: ${LV().note} Friendlies pay half coins but still give your players XP.`;
  $('cup').innerHTML=`<div class="cup-head"><b>House rules</b><span>Mix and match, then kick off</span></div><div class="hrgrid">`+HRULES.map(([k,n,d])=>`<button class="hrbtn" data-hr="${k}" aria-pressed="${!!(club.hr&&club.hr[k])}"><b>${n}</b><span>${d}</span></button>`).join('')+`</div>`}
/* ---------- Challenges ---------- */
const CHALS=[
  {id:'comeback',name:'Comeback Kings',d:'0–2 down, 90 seconds left. Win it.',score:[0,2],clock:90,win:()=>score[0]>score[1]},
  {id:'hold',name:'Hold the Lead',d:'1–0 up, 75 seconds left. Don’t concede.',score:[1,0],clock:75,win:()=>score[1]===0},
  {id:'tiki',name:'Tiki-Taka',d:'Score a Team Goal (3+ passes) inside 2 minutes.',clock:120,flag:['TEAM GOAL']},
  {id:'showboat',name:'Showboat',d:'Score straight after beating a man with a skill.',clock:120,flag:['SKILL GOAL','ANKLE BREAKER','SOLO GOAL']},
  {id:'distance',name:'From Distance',d:'Score a Screamer from long range inside 2 minutes.',clock:120,flag:['SCREAMER']},
  {id:'counter',name:'Lightning Counter',d:'Score a Counter-Attack goal inside 2 minutes.',clock:120,flag:['COUNTER-ATTACK']},
  {id:'short',name:'Down to Three',d:'One of your outfielders is off. Don’t lose in 2 minutes.',clock:120,short:true,win:()=>score[0]>=score[1]},
  {id:'clean',name:'Clean Sheet',d:'Win without conceding. Full 3 minutes.',clock:180,win:()=>score[0]>score[1]&&score[1]===0},
  {id:'hattrick',name:'Hat-trick Hero',d:'One of your players scores three. Full 3 minutes.',clock:180,hat:true}];
const today=()=>new Date().toISOString().slice(0,10);
const ordinal=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:n%10]||'th');
const dailyChal=()=>CHALS[Math.floor(Date.now()/864e5)%CHALS.length];
const chalId=()=>club.chalSel&&CHALS.some(c=>c.id===club.chalSel)?club.chalSel:dailyChal().id;
let chalWon=false,chalCur=null;
function renderChal(){const ch=club.chal||{},dl=dailyChal();
  $('diff-note').textContent=`Daily challenge: ${dl.name}. Beat it today for a 150 coin bonus. First clear of any challenge pays 90.`;
  $('cup').innerHTML=`<div class="cup-head"><b>Challenges</b><span>${Object.keys(ch.done||{}).length} of ${CHALS.length} cleared</span></div><div class="chgrid">`+CHALS.map(c=>`<button class="chbtn" data-chal="${c.id}" aria-pressed="${c.id===chalId()}"><b>${c.name}</b><span>${c.d}</span><em>${c.id===dl.id?'<span class="daily">★ DAILY</span> ':''}${(ch.done||{})[c.id]?'✓ cleared':''}${c.id===dl.id&&ch.daily===today()?' · daily done':''}</em></button>`).join('')+`</div>`}
/* ---------- Skill games ---------- */
const SGAMES={pens:{name:'Penalty Ladder',d:'Penalties until you miss. Their keeper gets sharper every kick.'},target:{name:'Target Practice',d:'45 seconds. Corners of the goal score 3, anywhere else 1.'},slalom:{name:'Dribble Slalom',d:'Weave through the gates, then finish into an empty net. Fastest time wins.'}};
const sgId=()=>SGAMES[club.sg]?club.sg:'pens';
let SG=null;
function renderSkill(){const b=club.sgBest||{};$('diff-note').textContent='Quick games to sharpen up. Coins for good scores, and your bests are saved.';
  $('cup').innerHTML=`<div class="cup-head"><b>Skill games</b><span>Your bests are kept</span></div><div class="chgrid">`+Object.entries(SGAMES).map(([k,g])=>`<button class="chbtn" data-sg="${k}" aria-pressed="${k===sgId()}"><b>${g.name}</b><span>${g.d}</span><em>${b[k]!=null?'Best: '+(k==='slalom'?b[k].toFixed(1)+'s':b[k]+(k==='pens'?' in a row':' pts')):'Not played yet'}</em></button>`).join('')+`</div>`}
/* ---------- Player XP ---------- */
const XPL=[0,100,250,450,700,1000,1400,1900,2500];
const xpOf=id=>(club.xp||{})[id]||0;
const lvlOf=id=>{const x=xpOf(id);let l=0;while(l<XPL.length-1&&x>=XPL[l+1])l++;return l};
function lvlHTML(p){if(!club.owned.includes(p.id))return'';const L=lvlOf(p.id),x=xpOf(p.id),M=XPL.length-1,a=XPL[L],b=XPL[Math.min(M,L+1)],pc=L>=M?100:Math.round((x-a)/(b-a)*100);
  return `<span class="lv">Lv ${L}${L>=2?' · +'+Math.min(3,Math.floor(L/2)):''}</span><div class="xpbar" title="${x} XP"><i style="width:${pc}%"></i></div>`}
// the stats a player actually takes onto the pitch: card stats plus everything you've invested in him
let levelUps=[];
function grantXP(won){levelUps=[];club.xp=club.xp||{};
  for(const p of players){if(p.team!==0||p.keeper||!p.st.id)continue;const id=p.st.id,before=lvlOf(id);
    const g=Math.round((25+(p.goals||0)*40+(p.mT||0)*12+(p.mS||0)*8+(won?20:0))*(1+depFx('train')/100));club.xp[id]=xpOf(id)+g;const after=lvlOf(id);
    if(after>before)levelUps.push(`${(byId(id)||p.st).short} reached Lv ${after}`)}}
/* ---------- Sticker album ---------- */
const ALBUM_REWARD={bronze:3000,silver:5000,gold:10000,special:15000,icon:25000};
function albumHTML(){const got=club.album||{};return `<div class="album">`+['bronze','silver','gold','special','icon'].map(tr=>{const all=PLAYERS.filter(p=>tier(p)===tr),have=all.filter(p=>club.owned.includes(p.id)).length,full=have===all.length;
  return `<div class="apage t-${tr}"><b>${TIERS[tr].name} page</b><div class="bar"><i style="width:${Math.round(have/all.length*100)}%"></i></div><span>${have} of ${all.length} stickers · complete it for ${ALBUM_REWARD[tr].toLocaleString()} coins</span>${got[tr]?'<span style="color:var(--mint);font-weight:800">✓ Page complete</span>':full?`<button class="buy" data-album="${tr}">Claim ${ALBUM_REWARD[tr].toLocaleString()}</button>`:''}</div>`}).join('')+`</div>`}
function placePlayer(id){
  const q=sq(),from=q.s.indexOf(id);
  if(from===selSlot)return;
  if(from>=0){q.s[from]=q.s[selSlot]}
  q.s[selSlot]=id;
  const next=q.s.indexOf(null);if(next>=0)selSlot=next;
  saveClub();S.tap&&S.tap();renderMenu();
}
$('cup').addEventListener('click',e=>{const c=e.target.closest('[data-club]');if(!c)return;viewClub=+c.dataset.club;const open=!!e.target.closest('.allclubs');renderMenu();if(open){const d=$('cup').querySelector('.allclubs');if(d)d.open=true}});
$('cup').addEventListener('click',e=>{const h=e.target.closest('[data-hr]'),c=e.target.closest('[data-chal]'),g=e.target.closest('[data-sg]');
  if(h){club.hr=club.hr||{};const k=h.dataset.hr;club.hr[k]=!club.hr[k];if(k==='golden'&&club.hr[k])club.hr.first3=false;if(k==='first3'&&club.hr[k])club.hr.golden=false;saveClub();renderMenu()}
  if(c){club.chalSel=c.dataset.chal;saveClub();renderMenu()}if(g){club.sg=g.dataset.sg;saveClub();renderMenu()}});
$('album').addEventListener('click',e=>{const b=e.target.closest('[data-album]');if(!b)return;const tr=b.dataset.album;club.album=club.album||{};if(club.album[tr])return;club.album[tr]=true;club.coins+=ALBUM_REWARD[tr];saveClub();S.goal();toast(`${TIERS[tr].name} page complete! +${ALBUM_REWARD[tr].toLocaleString()} coins`);renderMenu()});
$('cup').addEventListener('keydown',e=>{const c=e.target.closest('.tm[data-club]');if(c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();viewClub=+c.dataset.club;renderMenu()}});
$('pitchmini').addEventListener('click',e=>{const b=e.target.closest('[data-slot]');if(!b)return;const i=+b.dataset.slot,q=sq();
  if(i!==selSlot&&lastSlotClick===selSlot&&q.s[selSlot]&&q.s[i]){[q.s[i],q.s[selSlot]]=[q.s[selSlot],q.s[i]];lastSlotClick=-1;saveClub();selSlot=i;renderMenu();return}
  selSlot=i;lastSlotClick=i;renderMenu()});
function setName(id,name){const p=byId(id);if(!p||p.isCustom)return;name=(name||'').trim().slice(0,16);renameIn=null;
  if(!name||name===p.name0){delete NAMES[id];p.name=p.name0;p.short=p.short0}else{NAMES[id]=name;p.name=name;p.short=name.split(' ').pop().toUpperCase().slice(0,10)}
  try{localStorage.setItem('kickabout-names',JSON.stringify(NAMES))}catch(e){}cloudPush();renaming=null;renderMenu()}
function renameClick(e,where){
  if(e.target.closest('.rn input'))return true;
  const rs=e.target.closest('[data-rn-save]');if(rs){setName(rs.dataset.rnSave,$('rn-input').value);return true}
  const rz=e.target.closest('[data-rn-reset]');if(rz){setName(rz.dataset.rnReset,'');return true}
  const rn=e.target.closest('[data-rename]');if(rn){renaming=rn.dataset.rename;renameIn=where;renderMenu();const i=$('rn-input');if(i){i.focus();i.select()}return true}
  return false}
function renameKey(e){if(e.target.id!=='rn-input')return false;if(e.key==='Enter')setName(renaming,e.target.value);if(e.key==='Escape'){renaming=null;renameIn=null;renderMenu()}return true}
$('market').addEventListener('click',e=>renameClick(e,'coll'));
$('market').addEventListener('keydown',renameKey);
$('bench').addEventListener('click',e=>{
  if(renameClick(e,'bench'))return;
  if(e.target.closest('[data-edit]')){openEditor();return}
  const tr=e.target.closest('[data-train]');if(tr){const price=coachCost(myTrainBase());if((custom.budget||BUDGET)<650&&club.coins>=price){const was=ovr(custom),gain=Math.min(8,650-(custom.budget||BUDGET));club.coins-=price;custom.budget=(custom.budget||BUDGET)+gain;autoSpend(custom,gain);const now=ovr(custom);try{localStorage.setItem('kickabout-custom',JSON.stringify(custom))}catch(e){}saveClub();S.skill(2);renderMenu();showUpgrade(was,now);openEditor()}return}
  const c=e.target.closest('.card[data-id]');if(c){lastSlotClick=-1;placePlayer(c.dataset.id)}});
$('bench').addEventListener('keydown',e=>{if(renameKey(e))return;
  const c=e.target.closest('.card[data-id]');if(c&&e.target===c&&(e.key==='Enter'||e.key===' ')){e.preventDefault();placePlayer(c.dataset.id)}});
$('roles').addEventListener('click',e=>{const b=e.target.closest('[data-role]');if(!b)return;const q=sq(),r=b.dataset.role,o=r==='att'?'cap':'att';
  if(!q.s[selSlot]){toast('Pick a position with a player in it first.');return}
  if(q[r]===selSlot)q[r]=null;else{q[r]=selSlot;if(q[o]===selSlot)q[o]=null}saveClub();renderMenu()});
$('forms').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;sq().f=b.dataset.f;saveClub();renderMenu()});
$('packs').addEventListener('click',e=>{const b=e.target.closest('[data-pack]');if(b)openPack(b.dataset.pack)});
$('sqtabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.best){autoPick();toast('Picked your best line-up for this formation.')}
  else{if(GM==='classical')club.cactive=+b.dataset.sq;else club.active=+b.dataset.sq;selSlot=Math.max(0,sq().s.indexOf(null))}saveClub();renderMenu()});
for(const k of ['team','squad','club','online','board'])$('tab-'+k).onclick=()=>{tab=k;resultEl.hidden=true;toast('');renderMenu()};
function rollTier(odds){let r=Math.random()*100;for(const k of ['icon','special','gold','silver','bronze']){r-=odds[k]||0;if(r<0)return k}return Object.keys(odds).find(k=>odds[k]>0)||'bronze'}
// A pack is one tier, one card per position, ratings close together and new cards first, so every pick is a real dilemma.
function dealHardPick(t){
  // the best players in each tier are the rare ones: the pack's rating level leans hard towards the bottom of the tier
  // (scouting lifts the chance of it landing in the tier's top-rated quarter, see scoutAnchor)
  const inTier=PLAYERS.filter(p=>tier(p)===t),anchor=scoutAnchor(t);
  const out=['ATT','MID','DEF'].map(pos=>{const all=inTier.filter(p=>natPos(p)===pos),fresh=all.filter(p=>!club.owned.includes(p.id));
    const pool=(fresh.length?fresh:all).slice().sort((a,b)=>(Math.abs(ovr(a)-anchor)+(ovr(a)>anchor?3:0))-(Math.abs(ovr(b)-anchor)+(ovr(b)>anchor?3:0))+(Math.random()-.5)*2);
    return pick(pool.slice(0,2))});
  return out.sort(()=>Math.random()-.5)}
function drawFrom(t){const pool=PLAYERS.filter(p=>tier(p)===t);return pick(pool)}
const TR={bronze:0,silver:1,gold:2,special:3,icon:3};
function openPack(id){
  const k=PACKS.find(x=>x.id===id);const gift=id==='silver'&&club.gift,owed=(club.free||{})[id]>0,free=gift||owed;
  if(!free&&club.coins<k.cost)return;
  initAudio();if(ac&&ac.state==='suspended')ac.resume();
  if(gift)club.gift=false;else if(owed)club.free[id]--;else club.coins-=k.cost;
  const cards=dealHardPick(rollTier(k.odds));// rarity from the pack's own odds; scouting only works within it
  const res=cards.map(p=>({p,dup:club.owned.includes(p.id)}));
  saveClub();
  const el=$('pack');el.hidden=false;$('pack-title').textContent=k.name;$('pack-note').textContent='';$('pack-done').hidden=true;
  $('pack-cards').innerHTML=res.map(()=>'<div class="pc back"></div>').join('');
  const slots=[...$('pack-cards').children];let i=0;
  const T=(f,ms)=>setTimeout(f,RM?Math.min(ms,120):ms);
  function next(){
    if(i>=res.length){
      // all three are on the table: the player signs exactly one
      $('pack-note').textContent='Pick one player to sign. The other two walk away.';
      slots.forEach((slot,j)=>{slot.classList.add('pickme');slot.tabIndex=0;slot.setAttribute('role','button');slot.setAttribute('aria-label','Sign '+res[j].p.name);
        const choose=()=>{if(slots.some(x=>x.classList.contains('chosen')))return;const {p,dup}=res[j];
          if(dup){club.dupes=club.dupes||{};club.dupes[p.id]=(club.dupes[p.id]||0)+1}else{club.owned.push(p.id);club.paid=club.paid||{};club.paid[p.id]=k.cost;careerSigned(p)}saveClub();
          slots.forEach((x,m)=>{x.classList.remove('pickme');x.removeAttribute('tabindex');x.classList.add(m===j?'chosen':'gone')});
          S.goal();confetti(tier(p));
          $('pack-note').textContent=dup?`You already had ${p.name}. The duplicate is kept for Exchanges (or quick-sell it for ${TIERS[tier(p)].sell} coins in Club → Exchanges).`:`${p.name} signed! Put them in your line-up on the Squad tab.`;
          $('pack-done').hidden=false;$('pack-done').focus();renderMenu()};
        slot.onclick=choose;slot.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}}});
      slots[res.length-1].focus();return}
    const {p,dup}=res[i],slot=slots[i],tr=tier(p);i++;
    if(TR[tr]>=2){
      slot.className=`pc back tease t-${tr}`;slot.innerHTML=`<span class="sub">${natPos(p)}</span>`;tone(330,.25,'triangle',.1);
      T(()=>{slot.innerHTML=`<span class="sub">${natPos(p)} · ${esc(p.tag).toUpperCase()}</span>`;tone(440,.25,'triangle',.12)},700);
      T(()=>{slot.innerHTML+=`<span class="big">#${p.num}</span><span class="sub">${TIERS[tr].name.toUpperCase()}</span>`;tone(587,.3,'triangle',.14)},1400);
      T(()=>{reveal(slot,p,dup);S.goal();confetti(tr);T(next,900)},2100);
    }else{T(()=>{reveal(slot,p,dup);S.skill(TR[tr]);T(next,450)},350)}
  }
  T(next,400);
}
function reveal(slot,p,dup){const tr=tier(p);slot.className=`pc front t-${tr}`;
  slot.innerHTML=`<span class="flag ${dup?'dup':''}">${dup?'DUPLICATE':'NEW'}</span><span class="big">${ovr(p)}</span><span class="nm">${esc(p.name)}</span><span class="sub">${natPos(p)} · #${p.num} · ${esc(p.tag).toUpperCase()}</span><span class="sub" style="color:var(--tc)">E ${SKILLS[p.sk].name} · X ${SPECIALS[p.sp].name}</span>`}
function confetti(tr){const c=$('confetti');const cols=tr==='icon'?['#ff9ecb','#fff6e4','#8e8ff0','#ffd166']:['#ffd166','#fff6e4','#ff6f59','#7fe0b4'];
  for(let n=0;n<70;n++){const e=document.createElement('i');e.style.left=Math.random()*100+'%';e.style.background=pick(cols);e.style.animationDelay=Math.random()*.4+'s';e.style.animationDuration=1.4+Math.random()*1.2+'s';c.appendChild(e);setTimeout(()=>e.remove(),3200)}}
$('pack-done').onclick=()=>{$('pack').hidden=true;renderMenu()};
$('club-name').addEventListener('input',e=>{club.name=e.target.value.slice(0,14)||'My Club';saveClub()});
$('club-kit').onclick=e=>{const c=e.target.dataset.c;if(c){club.kit=c;saveClub();renderMenu()}};
document.querySelectorAll('.lvl button').forEach(b=>b.onclick=()=>{club.level=b.dataset.lv;saveClub();renderMenu()});
$('comps').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;if(['friendly','chal','skill','tour','league','wcc','icon'].includes(b.dataset.d)){club.comp=b.dataset.d;saveClub();renderMenu();return}club.comp='cup';if(b.dataset.d!==diffKey&&club.cup&&club.cup.round>0&&!cupOver())toast(`Left the ${CUPS[club.cup.tier]}. Your run there has ended.`);diffKey=b.dataset.d;DF=DIFFS[diffKey];try{localStorage.setItem('kickabout-diff',diffKey)}catch(e){}renderMenu()});
$('benchctl').addEventListener('click',e=>{if(e.target.closest('[data-benchall]')){benchAll=!benchAll;renderMenu()}});

/* ---------- editor ---------- */
const edEl=$('editor');let draft=null;
$('c-skill').innerHTML=Object.entries(SKILLS).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');
$('c-sp').innerHTML=Object.entries(SPECIALS).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');
function swatches(el,list,key){el.innerHTML=list.map(c=>`<button type="button" style="background:${c}" aria-label="${key} colour" aria-pressed="${draft[key]===c}" data-c="${c}"></button>`).join('')}
function statSum(){return STATK.reduce((s,[k])=>s+Math.round(draft[k]*100),0)}
function renderEditor(){
  const lk=draft.look||['short',0,0,1];$('c-style').value=lk[0];$('c-beard').checked=!!lk[2];
  $('c-name').value=draft.name;$('c-num').value=draft.num;$('c-skill').value=draft.sk;$('c-sp').value=draft.sp;
  $('c-skill-d').textContent=SKILLS[draft.sk].d;$('c-sp-d').textContent=SPECIALS[draft.sp].d;
  swatches($('c-skin'),SKINS,'skin');swatches($('c-hair'),HAIRS,'hair');
  $('c-stats').innerHTML=STATK.map(([k,l])=>`<div class="sl"><label for="c-${k}" style="display:block">${l}</label><input type="range" id="c-${k}" min="30" max="99" value="${Math.round(draft[k]*100)}" data-k="${k}"><output id="o-${k}">${Math.round(draft[k]*100)}</output></div>`).join('');
  updBudget();
}
function updBudget(){$('c-budget').innerHTML=`<b class="edovr">${ovr({...draft,isCustom:true})} OVR</b> · ${(draft.budget||BUDGET)-statSum()} points left`}
function showUpgrade(a,b){if(b>a){toast(`Training done! Overall ${a} → ${b}`+(tier({...custom,isCustom:true})!==tierAt(a)?` · now ${TIERS[tier(custom)].name}!`:''));S.skill(3)}else toast(`Training done! Overall ${b}`)}
// One-off: any training points you'd bought but not spent get put to use so your rating reflects them.
if(!custom.spentV2){const sum=STATK.reduce((t,[k])=>t+Math.round(custom[k]*100),0),left=(custom.budget||BUDGET)-sum;if(left>0)autoSpend(custom,left);custom.spentV2=1;try{localStorage.setItem('kickabout-custom',JSON.stringify(custom))}catch(e){}}
function tierAt(o){return o>=87?'icon':o>=80?'gold':o>=70?'silver':'bronze'}
function openEditor(){draft={...custom};edEl.hidden=false;renderEditor();$('c-name').focus()}
$('c-stats').addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;let v=+e.target.value;const other=statSum()-Math.round(draft[k]*100);v=Math.max(30,Math.min(v,(draft.budget||BUDGET)-other));e.target.value=v;draft[k]=v/100;$('o-'+k).textContent=v;updBudget()});
$('c-skin').onclick=e=>{const c=e.target.dataset.c;if(c){draft.skin=c;swatches($('c-skin'),SKINS,'skin')}};
$('c-hair').onclick=e=>{const c=e.target.dataset.c;if(c){draft.hair=c;swatches($('c-hair'),HAIRS,'hair')}};
$('c-skill').onchange=e=>{draft.sk=e.target.value;$('c-skill-d').textContent=SKILLS[draft.sk].d};
$('c-sp').onchange=e=>{draft.sp=e.target.value;$('c-sp-d').textContent=SPECIALS[draft.sp].d};
$('c-cancel').onclick=()=>{edEl.hidden=true};
$('c-save').onclick=()=>{
  draft.look=[$('c-style').value,0,$('c-beard').checked?1:0,1];
  draft.name=($('c-name').value.trim()||'Your Name').slice(0,12);draft.short=draft.name.split(' ').pop().toUpperCase().slice(0,10);draft.num=clamp(parseInt($('c-num').value)||99,1,99);
  const was=ovr(custom);custom={...draft,isCustom:true};try{localStorage.setItem('kickabout-custom',JSON.stringify(custom))}catch(e){}cloudPush();
  edEl.hidden=true;renderMenu();if(ovr(custom)!==was)toast(`Overall ${was} → ${ovr(custom)}`);
};

