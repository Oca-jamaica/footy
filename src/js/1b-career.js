/* ---------- career: players, upgrades, leagues, World Club Championship, economy ---------- */
// Everything in here is shared by both game modes, except league seasons and championship runs, which each mode keeps
// separately (club.lg.volta / club.lg.classical and club.wcc.volta / club.wcc.classical).

/* ===== the player database ===== */
function origInsp(){return['Lionel Messi','Cristiano Ronaldo','Kylian Mbappé','Thierry Henry','Neymar','Erling Haaland','Mohamed Salah','Luis Suárez','Son Heung-min','Marcus Rashford','Ollie Watkins','Jamie Vardy',
  'Darwin Núñez','Antony','Lamine Yamal','Zinedine Zidane','Kevin De Bruyne','Luka Modrić','Jude Bellingham','Andrés Iniesta','Xavi','Kaká','Bruno Fernandes','N’Golo Kanté','Declan Rice','Cole Palmer',
  'James Maddison','Conor Gallagher','Dele Alli','Tomáš Souček','Paolo Maldini','Virgil van Dijk','Sergio Ramos','Roberto Carlos','Cafu','Dani Alves','William Saliba','John Stones','Ashley Cole','Ben White',
  'Harry Maguire','Eric Dier','Phil Jones','Micky van de Ven','James Milner','Theo Walcott','Ryan Shawcross','James Garner']}
// About a thousand made-up footballers, generated from a fixed seed so everyone gets the same cards and saves stay valid.
// Rarity bands: Bronze 45-64, Silver 65-74, Gold 75-89, Special 86-94, Icon 90-98.
function genPlayers(){
  let seed=20261108;const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  const P=a=>a[(R()*a.length)|0];
  const REG=[
    [['Alfie','Archie','Ben','Callum','Danny','Elliot','Freddie','George','Harvey','Isaac','Jamie','Kieran','Liam','Mason','Nathan','Ollie','Reece','Sam','Toby','Tyler','Will','Zak','Connor','Lewis','Owen'],
     ['Ashby','Barlow','Brennan','Calloway','Dawes','Fairley','Gatling','Hadley','Ingram','Jarrett','Kettle','Lowther','Marsh','Nolan','Oakes','Penrose','Quayle','Ridley','Stokes','Thorne','Underhill','Vickers','Whitlock','Yardley','Crowther','Pryce','Hollins']],
    [['Adrián','Álvaro','Carlos','Dani','Emilio','Fede','Gonzalo','Hugo','Iker','Javi','Joaquín','Mateo','Nacho','Pablo','Santi','Tomás','Unai','Valentín','Óscar','Ramiro','Ignacio','Lautaro','Ezequiel','Facundo'],
     ['Arrieta','Bermejo','Cabral','Domínguez','Escobedo','Ferrán','Galindo','Herrera','Ibarra','Jurado','Lozano','Medina','Navarrete','Olmedo','Paredes','Quiroga','Rivas','Salcedo','Toledo','Urrutia','Valdés','Zamora','Aranda','Cifuentes','Montoya']],
    [['Caio','Davi','Enzo','Felipe','Gabriel','Igor','Léo','Murilo','Otávio','Renan','Thiago','Vitor','Wesley','Gustavo','Matheus','Danilo','Rafael','Bruno','Ícaro','Juninho'],
     ['Almeida','Bastos','Cardoso','Duarte','Esteves','Falcão','Guimarães','Lacerda','Macedo','Nogueira','Pacheco','Queiroz','Rezende','Sampaio','Teixeira','Vasconcelos','Brandão','Coutinho Neto','Moreira','Peixoto']],
    [['Antoine','Bastien','Clément','Damien','Florian','Jules','Loïc','Mathis','Nolan','Quentin','Rayan','Théo','Yanis','Maxime','Adrien','Baptiste','Corentin','Hugo','Lilian','Sacha'],
     ['Aubert','Bellamy','Chevalier','Delorme','Fontaine','Garnier','Hébert','Joubert','Lacombe','Marchand','Noiret','Perrin','Rocher','Sauvage','Tessier','Vasseur','Leclair','Morel','Dufresne','Brassac']],
    [['Alessandro','Andrea','Davide','Federico','Gianluca','Lorenzo','Matteo','Nicolò','Riccardo','Simone','Tommaso','Stefano','Edoardo','Filippo','Giacomo','Pietro','Samuele','Raffaele'],
     ['Albertini','Bellucci','Castellano','De Santis','Esposito','Fabbri','Gallo','Lombardi','Marchetti','Negri','Orlandi','Palumbo','Rinaldi','Serra','Testa','Vitale','Zanetti','Morandi','Carrara','Ferrante']],
    [['Bastian','Dirk','Felix','Jonas','Julian','Lars','Lukas','Niklas','Timo','Sven','Daan','Jesse','Joris','Milan','Ruben','Stijn','Wout','Moritz','Jannik','Thijs'],
     ['Achterberg','Brandt','Dekker','Engel','Faber','Gerritsen','Hoffmann','Jansen','Kessler','Lindemann','Maas','Neumann','Oosterhuis','Pfeiffer','Reinders','Schreiber','Teunissen','Vogel','Winkler','Zander']],
    [['Anders','Emil','Erik','Henrik','Magnus','Mikkel','Oskar','Rasmus','Sander','Tobias','Viktor','Elias','Jonatan','Kasper','Leif','Nils'],
     ['Aasen','Berglund','Dahl','Ekström','Fjeld','Grønli','Halvorsen','Isaksen','Lindqvist','Moen','Nyberg','Ostrander','Rask','Sundby','Torvik','Vang']],
    [['Abdou','Babacar','Chidi','Emeka','Ibrahima','Kwame','Mamadou','Obinna','Seydou','Tunde','Yaw','Cheikh','Issa','Kelechi','Lamine','Oumar','Papa','Sekou','Tidiane','Uche'],
     ['Adeyemi','Boateng','Camara','Diallo','Eze','Fofana','Gueye','Kanté-Diop','Mensah','Ndiaye','Okonkwo','Owusu','Sarr','Traoré','Yeboah','Asante','Coulibaly','Danjuma','Ekwueme','Nwosu']],
    [['Daichi','Haruto','Hiroki','Kenta','Ren','Ryo','Sota','Takumi','Yuto','Ji-ho','Seung-woo','Hyun','Do-yun','Wei','Jun','Hao','Kaito','Riku','Tae-yang','Ming'],
     ['Aoki','Fujita','Hayashi','Ishikawa','Kobayashi','Matsuda','Nakano','Okada','Sakamoto','Takeda','Yamada','Baek','Cho','Han','Jang','Kwon','Seo','Liang','Zhou','Tan']],
    [['Aleks','Bojan','Dario','Filip','Ivan','Luka','Marko','Nikola','Petar','Stefan','Vuk','Josip','Mislav','Domagoj','Teodor','Andrej'],
     ['Babić','Čolak','Đurić','Horvat','Jovanović','Kovač','Lukić','Marić','Novak','Perić','Radić','Savić','Tomić','Vidović','Zorić','Petković']],
    [['Adam','Amir','Ayoub','Bilal','Hamza','Karim','Mehdi','Nabil','Omar','Rami','Samir','Youssef','Zakaria','Anas','Ilyas','Tarik'],
     ['Amrani','Benali','Chaouch','Dahmani','El Idrissi','Fadil','Haddad','Kaddouri','Lahlou','Mansouri','Nasri-Bey','Ouali','Rahmani','Saidi','Tazi','Zerrouki']]];
  const SHP={DEF:['cb','fb','ballcb','wingback'],MID:['b2b','playmaker','destroyer'],ATT:['finisher','speed','dribbler','power']};
  const TAG={finisher:['Fox in the Box','Poacher','Clinical Finisher','Box Predator','Goal Hanger'],speed:['Speed Merchant','Flying Winger','Rapid Runner','Burst Specialist','Touchline Sprinter'],
    dribbler:['Trickster','Street Baller','Silky Dribbler','Close Control','Flair Player'],power:['Target Man','Battering Ram','Powerhouse','Bulldozer','Big Unit'],
    playmaker:['Deep Playmaker','Metronome','Orchestrator','Visionary','Pass Master'],b2b:['Box-to-Box','Engine Room','Tireless Runner','All-Rounder','Workhorse'],
    destroyer:['Ball Winner','Midfield Enforcer','The Shield','Tackle Machine','Holding Mid'],cb:['Stopper','Rock at the Back','No-Nonsense','Aerial King','Last Line'],
    fb:['Steady Full-Back','Wide Defender','Recovery Runner','Overlapper'],ballcb:['Ball-Playing CB','Calm Centre-Back','Sweeper','Libero'],wingback:['Wing-Back','Flying Full-Back','Crossing Machine','Lung-Buster']};
  const PLAYS={finisher:'Lives in the box and finishes first time',speed:'Knocks it past you and is gone',dribbler:'Glued to the ball, loves a nutmeg',power:'Holds it up and hits it hard',
    playmaker:'Sees the pass nobody else does',b2b:'Covers every blade of grass',destroyer:'Breaks up play and keeps it simple',cb:'Wins headers and loves a block',
    fb:'Reliable up and down the flank',ballcb:'Steps out and starts attacks from the back',wingback:'Bombs on and whips crosses in'};
  const SPEC=['Derby Hero','Golden Night','Comeback King','Cup Hero','Breakthrough','Hall of Fame Season','Captain Fantastic','Rising Star','Record Breaker','Last-Minute Hero'];
  const ICT=['The Legend','The Wizard','The Maestro','The General','The Phenomenon','The Prince','The Emperor','The Magician','The Wall','The Bullet','The Professor','The Artist'];
  const ABI={finisher:'finisher',power:'finisher',playmaker:'passer',dribbler:'dribbler',speed:'speed',cb:'wall',ballcb:'wall',destroyer:'wall',b2b:'engine',fb:'speed',wingback:'engine'};
  const STY=['short','quiff','bald','mohawk','bun','afro','balding','buzz','curly','dreads','long','tuft'];
  const SKS=Object.values(SKMAP),SPS=Object.values(SPMAP);
  // every card is backed by a real footballer (see 1c-real.js); the card itself keeps a made-up name you can swap
  // for the real one. Ids sit in fixed blocks per rarity so cards in older saves keep their rarity.
  const used=new Set(ROWS.map(r=>r[1])),out=[],CC=realCC(),seen=new Set(origInsp());
  const SH={f:'finisher',s:'speed',d:'dribbler',p:'power',m:'playmaker',b:'b2b',x:'destroyer',c:'cb',l:'fb',a:'ballcb',w:'wingback'};
  const POS={finisher:'ATT',speed:'ATT',dribbler:'ATT',power:'ATT',playmaker:'MID',b2b:'MID',destroyer:'MID',cb:'DEF',fb:'DEF',ballcb:'DEF',wingback:'DEF'};
  const LK={},HC={k:0,d:1,b:2,r:3,g:4};for(const l of realLooks().split('\n')){const [n,sk,h,st,bd,ht]=l.split('|');LK[n]={skin:SKINS[+sk]||SKINS[1],hair:HAIRS[HC[h]??0],look:[st,0,+bd?1:0,+ht||1]}}
  const BASE={bronze:[0,340],silver:[340,240],gold:[580,230],special:[810,100],icon:[910,45]},D=realPlayers();
  for(const rar of ['bronze','silver','gold','special','icon']){let k=0;
    for(const line of D[rar].split('\n')){if(line[0]==='~'){k+=+line.slice(1);continue}const [real,cc,sc,rt]=line.split('|');if(!real||seen.has(real))continue;seen.add(real);
      const shape=SH[sc]||'b2b',pos=POS[shape],rating=clamp((+rt||60)-BASE_DROP-legDrop(+rt,rar==='icon'),43,98),v=statsFor(rating,shape),reg=P(REG);
      let name,g=0;do{name=P(reg[0])+' '+P(reg[1]);g++}while(used.has(name)&&g<40);if(used.has(name))name+=' Jr';used.add(name);
      const last=name.split(' ').slice(1).join(' '),id=k<BASE[rar][1]?'g'+(BASE[rar][0]+k):'gx'+rar[0]+k;k++;
      const p={id,name,short:last.toUpperCase().slice(0,10),num:pos==='DEF'?P([2,3,4,5,6,12,15,22]):pos==='MID'?P([6,8,10,14,16,18,20,23]):P([7,9,10,11,17,19,21,29]),
        tag:rar==='special'?P(SPEC):rar==='icon'?P(ICT):P(TAG[shape]),pos,pace:v[0],shot:v[1],fin:v[2],skill:v[3],pass:v[4],tackle:v[5],str:v[6],sk:P(SKS),sp:P(SPS),celeb:(R()*6)|0,
        skin:P(SKINS),hair:R()<.85?P(HAIRS.slice(0,5)):P(HAIRS),look:[P(STY),0,R()<.3?1:0,Math.round((.94+R()*.14)*100)/100],plays:PLAYS[shape],rar,insp:[real,(CC[cc]||[cc])[0]]};
      if(rar==='special'||rar==='icon')p.ab=ABI[shape];
      if(LK[real])Object.assign(p,LK[real]);// looks like the real player
      out.push(p)}}
  return out}

/* ===== signature abilities ===== */
// Specials and Icons each carry one. The stat lifts are real: they're applied whenever the player takes the pitch.
const ABIL={finisher:{name:'Elite Finisher',d:'+6 finishing, +4 shot power',fx:{fin:.06,shot:.04}},
  passer:{name:'Precision Passer',d:'+8 passing, +2 skill',fx:{pass:.08,skill:.02}},
  dribbler:{name:'Unstoppable Dribbler',d:'+8 skill, rides one tackle in five',fx:{skill:.08}},
  speed:{name:'Lightning Pace',d:'+6 pace, +2 finishing',fx:{pace:.06,fin:.02}},
  wall:{name:'Defensive Wall',d:'+8 defending, +4 strength',fx:{tackle:.08,str:.04}},
  engine:{name:'Engine',d:'+3 pace, defending and passing',fx:{pace:.03,tackle:.03,pass:.03}}};
for(const p of PLAYERS)if(!p.ab&&(tier(p)==='icon'||tier(p)==='special')){const s=p.sk;p.ab=p.pos==='DEF'?'wall':p.pos==='MID'?'passer':s==='burst'||p.sp==='turbo'?'speed':s==='elastico'||s==='rainbow'?'dribbler':'finisher'}

/* ===== club development: six departments, levels 1-5, coins plus Club Tokens ===== */
// Club Tokens come from Club Legacy: exactly one for every level gained. Each department level costs coins and 1 token.
const DEPCOST=[5000,10000,20000,35000],DEPMAX=5;
const DEPTS=[
  {k:'fan',n:'Fanbase',fx:[0,5,10,15,20],u:'% more match coins',d:'Bigger crowds and more supporters: extra coins from every match, on top of the mode multiplier.'},
  {k:'coach',n:'Coaching Staff',fx:[0,5,10,15,20],u:'% off training costs',d:'Cheaper coin costs for stat upgrades, evolutions, keeper training, created-player training and special ability upgrades. Training Token costs never change.'},
  {k:'train',n:'Training Facilities',fx:[0,5,10,15,25],u:'% more player XP',d:'Players level up faster from matches and training sessions (levels still stop at the maximum, and stats at each player’s potential).'},
  {k:'stad',n:'Stadium Development',fx:[0,1,2,3,4],u:'% more match coins',d:'Bigger stands, brighter floodlights, a fuller and livelier crowd, and a small attendance bonus on match coins.'},
  {k:'scout',n:'Scouting Department',fx:[0,2.5,5,7.5,10],u:'% better odds of the higher rarity',d:'In packs that can give two rarities, the chance of the higher one goes up by this much of itself (5% becomes 5.5% at the top level). Single-rarity packs are unchanged; Icons are never guaranteed.'},
  {k:'comm',n:'Commercial Department',fx:[0,5,10,15,20],u:'% more objective coins',d:'More coins from daily and weekly challenges and achievements, a sponsor payment at the end of every league season (500 per level), and your club on the stadium boards at level 3.'}];
const depLv=k=>clamp(((club.dept||{})[k])|0||1,1,DEPMAX);
const depFx=k=>DEPTS.find(d=>d.k===k).fx[depLv(k)-1];
const coachCost=c=>Math.round(c*(1-depFx('coach')/100));
const ctk=()=>{club.ctk=club.ctk||0;return club.ctk};
// existing clubs get one token for every Club Legacy level they already had (counted once, never twice)
function ctkSync(){const L=(club.leg||{}).lvl||0;club.ctkEarned=club.ctkEarned||0;if(L>club.ctkEarned){club.ctk=ctk()+(L-club.ctkEarned);club.ctkEarned=L}}
function depBuy(k){const D=DEPTS.find(d=>d.k===k);if(!D)return;const L=depLv(k);if(L>=DEPMAX){toast(`${D.n} is at the top level.`);return}
  const c=DEPCOST[L-1];if(club.coins<c||ctk()<1){toast(`Needs ${c.toLocaleString()} coins and 1 Club Token.`);return}
  club.coins-=c;club.ctk-=1;club.dept=club.dept||{};club.dept[k]=L+1;
  if(k==='stad'&&typeof buildCrowd==='function'){buildCrowd();pitchCv=null;skyCv=null}if(k==='comm'&&L+1>=3){club.cosOwned=[...new Set([...(club.cosOwned||[]),'boards_club'])]}
  toast(`${D.n} level ${L+1}: ${D.fx[L]}${D.u}`);S.goal();saveClub();renderMenu()}
// scouting: a relative lift for the higher rarity in two-rarity packs, taken from the lower one
function scoutOdds(odds){const s=depFx('scout')/100,ks=['bronze','silver','gold','special','icon'].filter(r=>(odds[r]||0)>0);if(!s||ks.length<2)return odds;
  const o={...odds},hi=ks[ks.length-1],lo=ks[0],add=Math.min(o[lo],o[hi]*s);o[hi]=Math.round((o[hi]+add)*100)/100;o[lo]=Math.round((o[lo]-add)*100)/100;return o}

function deptHTML(){ctkSync();const tk=ctk(),spent=DEPTS.reduce((a,D)=>a+depLv(D.k)-1,0);
  const fmt=(D,v)=>D.k==='stad'?`${[60,70,80,90,100][DEPTS.find(x=>x.k==='stad').fx.indexOf(v)]}% crowd · +${v}% match coins`:`${D.k==='coach'?'−':'+'}${v}${D.u}`;
  const rows=DEPTS.map(D=>{const L=depLv(D.k),max=L>=DEPMAX,c=max?0:DEPCOST[L-1],can=!max&&club.coins>=c&&tk>=1;
    return `<div class="panel dept"><div class="dhead"><h4>${D.n}</h4><span class="ablv">${[1,2,3,4,5].map(i=>`<i class="${i<=L?'on':''}"></i>`).join('')}</span><b class="dlv">Level ${L}/${DEPMAX}</b></div>
     <p class="hint" style="margin:2px 0 6px">${D.d}</p>
     <p>Now: <b>${L===1&&!D.fx[0]&&D.k!=='stad'?'no bonus yet':fmt(D,D.fx[L-1])}</b>${max?'':` · next level: <b class="dnext">${fmt(D,D.fx[L])}</b>`}</p>
     ${D.k==='comm'?`<p class="hint" style="margin:2px 0">Sponsor payment each league season: ${(500*(L-1)).toLocaleString()} coins${L<3?' · club advertising boards at level 3':' · club advertising boards unlocked'}</p>`:''}
     ${max?'<b class="maxl">MAX LEVEL</b>':`<button class="btn ${can?'gold':''}" data-dep="${D.k}" ${can?'':'disabled'}>Upgrade · ${c.toLocaleString()} coins + 1 Club Token</button>`}</div>`}).join('');
  return `<div class="panel"><h4>Club Development</h4><p><span class="ctk">${tk}</span> Club Token${tk===1?'':'s'} · ${(club.coins||0).toLocaleString()} coins · ${spent} of ${DEPTS.length*(DEPMAX-1)} department levels built</p>
   <p class="hint">You earn exactly 1 Club Token every time your Club Legacy level goes up (${club.ctkEarned||0} earned so far). Club Tokens are separate from Training Tokens. Each department level costs ${DEPCOST.map(c=>c.toLocaleString()).join(' / ')} coins plus 1 Club Token.  Fanbase and Stadium bonuses apply to every match, online included, on top of the mode multiplier.</p>
   <button class="btn" data-depcos="1">Cosmetic customisation →</button></div><div class="deptg">${rows}</div>`}

/* ===== special ability development ===== */
// Every card's special (X) has its own level, 1 to 10, bought with coins plus 2 Training Tokens a level. Levels cut the
// cooldown in a straight line from the level-1 time to the level-10 time for that ability's tier.
const ABTIER={through:[25,7],curler:[20,5],knuckle:[20,5],rocket:[20,5],bicycle:[20,5],slide:[20,5],turbo:[10,3.5],lob:[10,3.5],chip:[10,3.5]};
const ABCOST=[500,1000,1500,2500,3500,5000,7000,9500,13000],ABTT=2,ABMAX=10;
const ablOf=id=>clamp(((club.abl||{})[id])|0||1,1,ABMAX);
const cdSecs=(sp,L)=>{const T=ABTIER[sp];if(!T)return SPECIALS[sp]?SPECIALS[sp].cd/60:12;return Math.round((T[0]-(T[0]-T[1])*(clamp(L,1,ABMAX)-1)/9)*10)/10};
// cooldown in game frames (60 a second) for a player on the pitch: his own ability level
const spCdOf=p=>Math.round(cdSecs(p.st.sp,p.st.spLv||1)*60);
function ablBuy(id){const p=byId(id);if(!p||!club.owned.includes(id))return;const L=ablOf(id);if(L>=ABMAX){toast('Already at MAX LEVEL.');return}
  const c=coachCost(ABCOST[L-1]);if(club.coins<c||res().tt<ABTT){toast(`Needs ${c.toLocaleString()} coins and ${ABTT} Training Tokens.`);return}
  club.coins-=c;club.tt-=ABTT;club.abl=club.abl||{};club.abl[id]=L+1;
  toast(`${p.short}: ${SPECIALS[p.sp].name} level ${L+1} · cooldown ${cdSecs(p.sp,L)}s → ${cdSecs(p.sp,L+1)}s`);S.skill(2);saveClub();renderMenu()}

/* ===== upgrades, XP and evolutions ===== */
const RAR=['bronze','silver','gold','special','icon'];
const UPCAP={bronze:8,silver:10,gold:12,special:12,icon:14},UPBASE={bronze:100,silver:200,gold:400,special:800,icon:1300},STATMAX=5;
const OVRCAP={bronze:80,silver:86,gold:93,special:96,icon:99};
const upOf=id=>(club.up||{})[id]||{};
const upSpent=id=>Object.values(upOf(id)).reduce((a,b)=>a+b,0);
const upRoom=p=>Math.min(UPCAP[tier(p)],2+2*lvlOf(p.id));// levelling up through XP unlocks more room
const upCost=p=>coachCost(Math.round(UPBASE[tier(p)]*(1+.35*upSpent(p.id))/10)*10);
// Evolutions: multi-stage boosts for a favourite player, each stage needs an on-pitch objective plus coins and Training Tokens
const EVO={bronze:{boost:[3,2,2],coins:[400,800,1500],tt:[2,3,4]},silver:{boost:[2,2,2],coins:[800,1600,3000],tt:[2,4,6]},
  gold:{boost:[2,2,1],coins:[2000,4000,8000],tt:[3,5,8]},special:{boost:[1,1],coins:[6000,12000],tt:[5,10]},icon:{boost:[1],coins:[25000],tt:[15]}};
const EVOGOAL={ATT:{k:'g',n:[2,4,6],w:'goals'},MID:{k:'p',n:[12,25,40],w:'passes'},DEF:{k:'t',n:[5,10,16],w:'tackles won'}};
const evoOf=id=>(club.evo||{})[id]||{st:0,m:0,g:0,p:0,t:0};
function evoNeed(p){const e=evoOf(p.id),E=EVO[tier(p)];if(e.st>=E.boost.length)return null;const G=EVOGOAL[natPos(p)];
  return{stage:e.st,boost:E.boost[e.st],coins:coachCost(E.coins[e.st]),tt:E.tt[e.st],m:3+e.st*2,k:G.k,n:G.n[Math.min(e.st,G.n.length-1)],w:G.w,have:{m:e.m,v:e[G.k]||0}}}
const evoBoostN=(p,st)=>{const E=EVO[tier(p)];let b=0;for(let i=0;i<Math.min(st,E.boost.length);i++)b+=E.boost[i];return b};
const evoBoost=p=>evoBoostN(p,evoOf(p.id).st);
// the stats a player takes onto the pitch for a given development state: level, upgrade points per stat, evolution stages
function playStatsX(p,lv,u,est){const b={...p};
  const L=Math.min(3,Math.floor(lv/2));if(L)STATK.map(k=>k[0]).sort((x,y)=>p[y]-p[x]).slice(0,5).forEach(k=>b[k]+=.01*L);
  for(const k in u)if(k in b)b[k]+=u[k]*.01;
  let ev=evoBoostN(p,est);if(ev){const room=OVRCAP[tier(p)]-ovr({...b,isCustom:p.isCustom});ev=Math.max(0,Math.min(ev,room));for(const [k] of STATK)b[k]+=ev*.01}
  const ab=ABIL[p.ab];if(ab)for(const k in ab.fx)b[k]+=ab.fx[k];
  for(const [k] of STATK)b[k]=Math.min(.99,b[k]);return b}
// the stats a player actually takes onto the pitch: card stats plus everything you've invested in him
function playStats(p){if(!p||!p.id)return p;const b=playStatsX(p,lvlOf(p.id),upOf(p.id),evoOf(p.id).st);b.spLv=ablOf(p.id);return b}
const effOvr=p=>p?ovr(playStats(p)):0;
const top5=b=>[b.pace,b.shot,b.fin,b.skill,b.pass,b.tackle,b.str].sort((x,y)=>y-x).slice(0,5).reduce((a,c)=>a+c,0);
// the best he can ever reach: top level, every evolution, and the remaining upgrade points placed where they count most
// (points already spent stay where they are). Returns the overall, the stats and the plan of points still to spend.
function maxPlan(p){const lvMax=XPL.length-1,stMax=EVO[tier(p)].boost.length,u={...upOf(p.id)},cap=UPCAP[tier(p)],plan={};let left=cap-upSpent(p.id);
  while(left>0){let best=null,bv=-1;for(const [k] of STATK){if((u[k]||0)>=STATMAX)continue;const t={...u,[k]:(u[k]||0)+1},b=playStatsX(p,lvMax,t,stMax),v=ovr(b)*10+top5(b);if(v>bv+1e-9){bv=v;best=k}}
    if(!best)break;const now=playStatsX(p,lvMax,u,stMax),nx=playStatsX(p,lvMax,{...u,[best]:(u[best]||0)+1},stMax);if(top5(nx)<=top5(now)+1e-9)break;
    u[best]=(u[best]||0)+1;plan[best]=(plan[best]||0)+1;left--}
  const b=playStatsX(p,lvMax,u,stMax);return{ovr:Math.max(ovr(b),effOvr(p)),b,plan,left}}
// the most one stat can reach on its own: top level, every evolution, and every free upgrade point put into that stat
function statMax(p,k){const u={...upOf(p.id)},free=UPCAP[tier(p)]-upSpent(p.id);u[k]=Math.min(STATMAX,(u[k]||0)+free);return Math.round(playStatsX(p,XPL.length-1,u,EVO[tier(p)].boost.length)[k]*100)}
// what the next +1 in one stat does right now
function upPreview(p,k){const u=upOf(p.id),lv=lvlOf(p.id),st=evoOf(p.id).st,a=playStatsX(p,lv,u,st),b=playStatsX(p,lv,{...u,[k]:(u[k]||0)+1},st);
  return{s0:Math.round(a[k]*100),s1:Math.round(b[k]*100),o0:ovr(a),o1:ovr(b)}}
const potOvr=p=>maxPlan(p).ovr;
// the club keeper: one shared goalkeeper whose Goalkeeping you can train up
const GKMAX=8,gkCost=lv=>coachCost(Math.round(600*Math.pow(1.6,lv)/50)*50);
const keeperStats=team=>team===0?{gkv:.98+(club.gkLv||0)*.013}:{};
// chemistry: in position, a settled line-up, and a balanced mix of roles. Up to +3 on every stat at 100.
function chemOf(q=sq()){const c=chemParts(q);return c?c.total:0}
function chemParts(q=sq()){const slots=FORMS[q.f],ids=q.s;if(!ids.some(Boolean))return null;
  const inPos=ids.filter((id,i)=>id&&byId(id)&&natPos(byId(id))===slots[i].r).length/slots.length;
  const fam=(club.fam||{})[GM]||{},settled=ids.reduce((a,id)=>a+Math.min(8,id?fam[id]||0:0),0)/(8*slots.length);
  const shapes=new Set(ids.map(id=>id&&byId(id)).filter(Boolean).map(p=>p.pos||natPos(p))),mix=shapes.size>=3?1:shapes.size/3;
  return{inPos,settled,mix,n:slots.length,shapes:[...shapes],total:Math.round(100*(inPos*.6+settled*.25+mix*.15))}}
// tactics, per game mode: mentality, passing and pressing. 0 = low, 1 = balanced, 2 = high
const TAC=[{k:'ment',l:'Mentality',o:['Defensive','Balanced','Attacking']},{k:'pass',l:'Passing',o:['Patient','Mixed','Direct']},{k:'press',l:'Pressing',o:['Sit back','Normal','High press']}];
const tacSet=()=>{club.tac=club.tac||{};return club.tac[GM]=club.tac[GM]||{ment:1,pass:1,press:1}};
function tacOf(team){if(team===1){const o=OPP.tac||{};return{push:o.push||1,pass:o.pass||1,press:o.press||1}}
  const t=(club.tac||{})[PITCH!=='volta'?'classical':'volta']||{ment:1,pass:1,press:1};
  return{push:[.75,1,1.25][t.ment],pass:[.7,1,1.4][t.pass],press:[.8,1,1.22][t.press]}}

/* ===== economy ===== */
// Coins buy packs, upgrades, evolutions and keeper training. Training Tokens unlock advanced development (training
// sessions and evolutions). Club Points come from seasons and tournaments and buy cosmetics and stadium upgrades.
const MM=()=>GM==='classical'?1.5:1;// one-off league and championship prizes: Classical pays 1.5x
// match rewards follow the pitch you played on: Expanded gets a further 1.25x on top of Classical's 1.5x
const MULT={volta:1,classical:1.5,expanded:1.875},MULTN={volta:'Volta',classical:'Classical Standard',expanded:'Classical Expanded'};
const matchMul=()=>MULT[PITCH]||1;
let earnNote='';
// pay a match: base for the result plus per-goal coins, times the pitch multiplier and the difficulty, to the whole coin
function matchPay(label,base,goalCoins,diffMul,extra=0){const m=matchMul(),cb=(1+depFx('fan')/100)*(1+depFx('stad')/100),raw=(base+goalCoins)*m*diffMul*cb,coins=Math.round(raw)+extra;
  earnNote=`${label} ${base}${goalCoins?` + goals ${goalCoins}`:''}${m!==1?` × ${MULTN[PITCH]} ${m}`:''}${diffMul!==1?` × difficulty ${+diffMul.toFixed(2)}`:''}${cb!==1?` × club ${+cb.toFixed(3)}`:''}${extra?` + prize ${extra.toLocaleString()}`:''} = ${coins.toLocaleString()} coins`;return coins}
const res=()=>{club.tt=club.tt||0;club.cp=club.cp||0;return club};
function grant(r,why){if(!r)return'';const c=res(),bits=[];
  if(r.coins){c.coins+=r.coins;bits.push(`+${r.coins.toLocaleString()} coins`);if(r.coins>0)chProg('coins',r.coins)}
  if(r.tt){c.tt+=r.tt;bits.push(`+${r.tt} Training Token${r.tt>1?'s':''}`)}
  if(r.cp){c.cp+=r.cp;bits.push(`+${r.cp} Club Points`)}
  if(r.pack){c.free=c.free||{};c.free[r.pack]=(c.free[r.pack]||0)+1;bits.push(`free ${PACKS.find(k=>k.id===r.pack).name}`)}
  if(r.cos){c.cosOwned=c.cosOwned||[];if(!c.cosOwned.includes(r.cos)){c.cosOwned.push(r.cos);bits.push(`unlocked ${COS.find(x=>x.id===r.cos).name}`)}}
  if(r.xp)legacyXP(r.xp);
  return bits.join(' · ')}

/* ===== leagues: five divisions per mode, ten clubs, home and away ===== */
const DIVS=[{n:'Amateur Division',s:[.5,.6],df:'beginner',mul:1},{n:'Division 3',s:[.58,.68],df:'easy',mul:1.5},{n:'Division 2',s:[.66,.76],df:'normal',mul:2.2},
  {n:'Division 1',s:[.74,.84],df:'hard',mul:3.2},{n:'Legendary Division',s:[.82,.93],df:'legend',mul:4.5}];
const FINISH=[1500,1100,850,650,520,420,340,260,180,120];// coins for where you finish, times the division multiplier
const TOWNS=['Brackwater','Fenmoor','Kestrel Bay','Oakhollow','Redcliffe','Stonebridge','Marlow Vale','Ashgrove','Cinder Hill','Dunmore','Eastwick','Foxley','Granton','Hawkshead','Ironvale',
  'Juniper','Kingsmere','Larkspur','Millbrook','Northgate','Orchard Park','Pembury','Quarrytown','Rookwood','Saltmarsh','Thornbury','Upton Cross','Valemouth','Westholm','Yarrow','Bramblewick','Coldharbour'];
const SUFF=['United','City','Rovers','Athletic','Town','Wanderers','FC','Albion','County','Rangers','Harriers','Dynamo','Sporting','Olympic','Racing','Borough'];
const KITPOOL=['#ff6f59','#4fb3ff','#e8475f','#f4f1ea','#2f2f3a','#b06cf0','#5fc79a','#ffd166','#3f8fd8','#b94a2c','#1f8a70','#ff9ecb','#8e8ff0','#d9965f'];
function mkTeams(div,n,taken){const D=DIVS[div],out=[];const names=new Set(taken||[]);
  const towns=new Set();while(out.length<n){const town=pick(TOWNS),name=town+' '+pick(SUFF);if(names.has(name)||towns.has(town))continue;names.add(name);towns.add(town);
    out.push({id:'t'+Math.random().toString(36).slice(2,8),name,kit:pick(KITPOOL.filter(k=>!kitClash(k,club.kit)))||'#8e8ff0',str:Math.round(rnd(D.s[0],D.s[1])*100)/100,form:pick(FORM_KEYS[GM]),
      tac:{push:pick([.85,1,1.15]),pass:pick([.8,1,1.25]),press:pick([.85,1,1.15])}})}return out}
// round robin by the circle method: every club plays every other club once, 9 rounds of 5 matches (home and away alternate)
function mkFixtures(ids){const n=ids.length,a=ids.slice(),rounds=[];
  for(let r=0;r<n-1;r++){const m=[];for(let i=0;i<n/2;i++){const h=a[i],w=a[n-1-i];m.push(r%2&&i===0?{h:w,a:h}:{h,a:w})}rounds.push(m);a.splice(1,0,a.pop())}
  return rounds}
const cupSwap=(from,to)=>{club.cupBy=club.cupBy||{};club.cupBy[from]=club.cup;club.cup=club.cupBy[to]||null};
const lgOf=(m=GM)=>{club.lg=club.lg||{};return club.lg[m]};
function newSeason(m=GM,div=0,seasonNo=1){const g0=GM;GM=m;const teams=mkTeams(div,9);GM=g0;
  const ids=['me',...teams.map(t=>t.id)].sort(()=>Math.random()-.5);
  club.lg=club.lg||{};club.lg[m]={div,season:seasonNo,teams,fx:mkFixtures(ids),round:0,done:false,paid:false};saveClub();return club.lg[m]}
const lgTeam=(L,id)=>id==='me'?{id:'me',name:club.name||'My Club',kit:club.kit,str:teamRating()/100}:L.teams.find(t=>t.id===id);
// a simulated result: stronger sides score more, with plenty of luck
function simScore(sa,sb){const po=l=>{let k=0,p=Math.exp(-l),s=p,u=Math.random();while(u>s&&k<9){k++;p*=l/k;s+=p}return k};
  return[po(clamp(1.35+(sa-sb)*7,.25,4)),po(clamp(1.35+(sb-sa)*7,.25,4))]}
function lgTable(L){const rows={};for(const id of ['me',...L.teams.map(t=>t.id)])rows[id]={id,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,form:[]};
  for(const r of L.fx)for(const f of r){if(!f.r)continue;const [a,b]=f.r,H=rows[f.h],A=rows[f.a];H.p++;A.p++;H.gf+=a;H.ga+=b;A.gf+=b;A.ga+=a;
    if(a>b){H.w++;A.l++;H.pts+=3;H.form.push('W');A.form.push('L')}else if(a<b){A.w++;H.l++;A.pts+=3;H.form.push('L');A.form.push('W')}else{H.d++;A.d++;H.pts++;A.pts++;H.form.push('D');A.form.push('D')}}
  return Object.values(rows).sort((x,y)=>y.pts-x.pts||(y.gf-y.ga)-(x.gf-x.ga)||y.gf-x.gf||(x.id==='me'?-1:y.id==='me'?1:0))}
const myFixture=L=>L&&!L.done?L.fx[L.round].find(f=>f.h==='me'||f.a==='me'):null;
// your result goes in, the rest of the round is played out, and the season moves on
function lgRecord(L,gf,ga){const f=myFixture(L);if(!f)return;f.r=f.h==='me'?[gf,ga]:[ga,gf];
  for(const o of L.fx[L.round])if(!o.r){const a=lgTeam(L,o.h),b=lgTeam(L,o.a);o.r=simScore(a.str,b.str)}
  L.round++;if(L.round>=L.fx.length){L.done=true;seasonEnd(L)}}
function seasonEnd(L){if(L.paid)return null;L.paid=true;const m=GM,T=lgTable(L),pos=T.findIndex(r=>r.id==='me')+1,me=T[pos-1],D=DIVS[L.div],out=[];
  let coins=Math.round(FINISH[pos-1]*D.mul*MM()/10)*10,cp=Math.round((11-pos)*6*D.mul);const tt=pos<=3?3:1;
  if(pos===1){coins+=Math.round(2000*MM());club.trophies=club.trophies||{};club.trophies['lg_'+m+'_'+L.div]=(club.trophies['lg_'+m+'_'+L.div]||0)+1;out.push(`CHAMPIONS of the ${D.n}!`);stat('titles',1)}
  const promo=pos<=3&&L.div<4,releg=pos>=8&&L.div>0;
  if(promo){coins+=Math.round(750*MM());out.push(`Promoted to ${DIVS[L.div+1].n}`);stat('promos_'+m,1);if(L.div+1===4)stat('legend_'+m,1)}
  if(releg)out.push(`Relegated to ${DIVS[L.div-1].n}`);
  if(me.l===0)stat('unbeaten',1);
  const spon=500*(depLv('comm')-1);if(spon){coins+=spon;out.push(`Sponsor payment +${spon}`)}
  const got=grant({coins,cp,tt,xp:300+(11-pos)*60},'season');
  club.hist=club.hist||[];club.hist.unshift({m,season:L.season,div:L.div,pos,pts:me.pts,w:me.w,d:me.d,l:me.l,gf:me.gf,ga:me.ga,note:out.join(' · ')});club.hist=club.hist.slice(0,60);
  // a top-three finish earns a place in next season's World Club Championship
  const W=wccOf(m);if(W&&!W.done)wccClose(m);
  if(pos<=3){club.wcc=club.wcc||{};club.wcc[m]=newWcc(m,L.season+1);out.push('Qualified for the World Club Championship!')}
  L.summary={pos,coins,cp,tt,lines:out,got,next:clamp(L.div+(promo?1:releg?-1:0),0,4)};
  achCheck();saveClub();return L.summary}
function lgNext(m=GM){const L=lgOf(m);if(!L||!L.done)return;const s=L.summary||{next:L.div};newSeason(m,s.next,L.season+1)}

/* ===== World Club Championship: 64 clubs, straight knockout ===== */
const WROUNDS=['Round of 64','Round of 32','Round of 16','Quarter-finals','Semi-finals','Final'];
const WPRIZE=[0,500,1000,2000,4000,7500,15000];// for reaching each round (R32 .. final) and for winning it; Classical pays 1.5x
const WCLUBS=[['Porto Azul','#3f8fd8'],['Real Sierra','#f4f1ea'],['Atlético Cordillera','#e8475f'],['FC Nordlicht','#2f2f3a'],['Sporting Lusitano','#1f8a70'],['Inter Lagunare','#4fb3ff'],
  ['Dynamo Volga','#3f8fd8'],['Sakura Shimizu','#ff9ecb'],['Seoul Phoenix','#e8475f'],['Lagos Lions','#5fc79a'],['Accra Stars','#ffd166'],['Cairo Pharaohs','#b94a2c'],['Casablanca Atlas','#1f8a70'],
  ['Buenos Aires Juniors','#ffd166'],['Montevideo Celeste','#4fb3ff'],['São Paulo Paulistas','#f4f1ea'],['Rio Atlântico','#ff6f59'],['Bogotá Cóndores','#b06cf0'],['Lima Incas','#e8475f'],
  ['Ciudad Azteca','#5fc79a'],['Toronto Maples','#e8475f'],['Bay City Breakers','#4fb3ff'],['Sydney Harbour','#3f8fd8'],['Auckland Kiwis','#2f2f3a'],['Jakarta Garuda','#e8475f'],
  ['Istanbul Bosphorus','#ffd166'],['Athens Olympians','#4fb3ff'],['Belgrade Eagles','#e8475f'],['Zagreb Checkers','#f4f1ea'],['Warsaw Wings','#f4f1ea'],['Prague Bohemia','#5fc79a'],
  ['Vienna Waltz','#b06cf0'],['Basel Rhine','#e8475f'],['Brussels Royals','#b06cf0'],['Amsterdam Canals','#ff6f59'],['Rotterdam Harbour','#2f2f3a'],['Hamburg Hanse','#3f8fd8'],
  ['Munich Alpine','#e8475f'],['Milano Navigli','#2f2f3a'],['Roma Imperiali','#b94a2c'],['Napoli Vesuvio','#4fb3ff'],['Torino Granata','#b94a2c'],['Marseille Phocéens','#4fb3ff'],
  ['Lyon Lumière','#f4f1ea'],['Paris Seine','#3f8fd8'],['Sevilla Giralda','#f4f1ea'],['Valencia Taronja','#ffd166'],['Bilbao Ría','#e8475f'],['Glasgow Thistle','#5fc79a'],
  ['Dublin Liffey','#1f8a70'],['Manchester Mills','#e8475f'],['London Docklands','#2f2f3a'],['Liverpool Mersey','#e8475f'],['Lisbon Tejo','#ff6f59'],['Oslo Fjord','#4fb3ff'],
  ['Stockholm Archipelago','#ffd166'],['Copenhagen Vikings','#e8475f'],['Riyadh Falcons','#5fc79a'],['Doha Pearls','#b06cf0'],['Tokyo Shogun','#2f2f3a'],['Shanghai Dragons','#e8475f'],
  ['Mumbai Tigers','#ffd166'],['Johannesburg Gold','#ffd166']];
const wccOf=(m=GM)=>(club.wcc||{})[m]||null;
// a few extra clubs so there are always 63 to draw from
for(const [n,k] of [['Nairobi Rhinos','#1f8a70'],['Kyiv Chestnuts','#ffd166'],['Santiago Andes','#e8475f'],['Quito Volcanes','#b06cf0'],['Tbilisi Wolves','#2f2f3a'],['Helsinki Frost','#4fb3ff'],['Edinburgh Castle','#b94a2c'],['Marrakech Oasis','#ffd166']])if(WCLUBS.length<70)WCLUBS.push([n,k]);
function newWcc(m,season){const pool=WCLUBS.map((c,i)=>({id:'w'+i,name:c[0],kit:kitClash(c[1],club.kit)?pick(KITPOOL.filter(k=>!kitClash(k,club.kit))):c[1],str:Math.round(rnd(.76,.97)*100)/100,form:pick(FORM_KEYS[m])}))
    .sort(()=>Math.random()-.5).slice(0,63);
  // seeding: the strongest clubs start in different quarters, so the final really is the best of them
  pool.sort((a,b)=>b.str-a.str);const seeds=pool.slice(0,8),rest=pool.slice(8).sort(()=>Math.random()-.5),slots=new Array(64).fill(null);
  [0,32,16,48,8,40,24,56].forEach((s,i)=>slots[s]=seeds[i].id);let j=0;const meAt=63;slots[meAt]='me';for(let i=0;i<64;i++)if(!slots[i])slots[i]=rest[j++].id;
  const r0=[];for(let i=0;i<64;i+=2)r0.push({a:slots[i],b:slots[i+1]});
  return{season,clubs:pool,rounds:[r0],round:0,alive:true,done:false,paid:{},champ:null}}
const wTeam=(W,id)=>id==='me'?{id:'me',name:club.name||'My Club',kit:club.kit,str:teamRating()/100}:W.clubs.find(c=>c.id===id);
const wMy=W=>W&&W.alive&&!W.done?W.rounds[W.round].find(x=>x.a==='me'||x.b==='me'):null;
function wSimRound(W){const R=W.rounds[W.round];for(const x of R)if(!x.w){let [a,b]=simScore(wTeam(W,x.a).str,wTeam(W,x.b).str);x.sa=a;x.sb=b;if(a===b){x.pen=true;x.w=Math.random()<.5?x.a:x.b}else x.w=a>b?x.a:x.b}
  if(W.round<5){const nx=[];for(let i=0;i<R.length;i+=2)nx.push({a:R[i].w,b:R[i+1].w});W.rounds.push(nx)}}
// knocked out or the season ran out: the rest of the tournament plays itself
function wccClose(m){const W=wccOf(m);if(!W||W.done)return;W.alive=false;while(true){wSimRound(W);if(W.round>=5){W.champ=W.rounds[5][0].w;W.done=true;break}W.round++}}
function wccRecord(W,gf,ga,pw){const x=wMy(W);if(!x)return null;const meA=x.a==='me',won=gf>ga||pw===0;
  x.sa=meA?gf:ga;x.sb=meA?ga:gf;x.pen=pw!=null;x.w=won?'me':(meA?x.b:x.a);
  if(!won){W.alive=false;W.exit=W.round;wSimRound(W);if(W.round>=5){W.champ=W.rounds[5][0].w;W.done=true}else{W.round++;while(!W.done){wSimRound(W);if(W.round>=5){W.champ=W.rounds[5][0].w;W.done=true}else W.round++}}return{won:false}}
  wSimRound(W);const reached=W.round+1;// 1 = R32 ... 5 = final, 6 = champions
  let prize=0;if(W.round>=5){W.done=true;W.champ='me'}
  const key=W.round>=5?6:reached;if(!W.paid[key]){W.paid[key]=true;prize=Math.round(WPRIZE[key]*MM())}
  if(!W.done)W.round++;
  return{won:true,prize,champ:W.done,reached:key}}

/* ===== club records ===== */
const stat=(k,n=1)=>{club.st=club.st||{};club.st[k]=(club.st[k]||0)+n};
const stv=k=>(club.st||{})[k]||0;

/* ===== daily and weekly challenges ===== */
const DAILY=[{id:'win2',n:'Win 2 matches',k:'wins',v:2,r:{coins:250,tt:1}},{id:'goals5',n:'Score 5 goals',k:'goals',v:5,r:{coins:200,tt:1}},
  {id:'pass15',n:'Complete 15 passes',k:'passes',v:15,r:{coins:150,tt:1}},{id:'clean1',n:'Keep a clean sheet',k:'clean',v:1,r:{coins:250,tt:1}},
  {id:'skills5',n:'Land 5 skill moves',k:'skills',v:5,r:{coins:150,tt:1}},{id:'cwin1',n:'Win a Classical match',k:'cwins',v:1,r:{coins:300,tt:1}},
  {id:'lg2',n:'Play 2 league matches',k:'lgplay',v:2,r:{coins:200,tt:1}},{id:'tk8',n:'Win 8 tackles',k:'tackles',v:8,r:{coins:180,tt:1}}];
const WEEKLY=[{id:'win10',n:'Win 10 matches',k:'wins',v:10,r:{coins:1500,tt:4}},{id:'clean3',n:'Keep 3 clean sheets',k:'clean',v:3,r:{coins:1000,tt:3}},
  {id:'coin2k',n:'Earn 2,000 coins',k:'coins',v:2000,r:{coins:800,tt:3}},{id:'goals25',n:'Score 25 goals',k:'goals',v:25,r:{coins:1200,tt:4}},
  {id:'lgw5',n:'Win 5 league matches',k:'lgwins',v:5,r:{coins:1200,tt:4,cp:40}},{id:'cw3',n:'Win 3 Classical matches',k:'cwins',v:3,r:{coins:1400,tt:4}}];
const weekKey=()=>{const d=new Date(),j=new Date(d.getFullYear(),0,1);return d.getFullYear()+'-W'+Math.ceil(((d-j)/864e5+j.getDay()+1)/7)};
function chState(){const c=club.chs=club.chs||{},day=today(),wk=weekKey();
  const deal=(pool,key,n)=>{let h=0;for(const ch of key)h=(h*31+ch.charCodeAt(0))>>>0;const a=pool.slice();const out=[];while(out.length<n&&a.length){h=(h*1103515245+12345)>>>0;out.push(a.splice(h%a.length,1)[0])}return out.map(x=>({id:x.id,v:0,claimed:false}))};
  if(c.day!==day){c.day=day;c.d=deal(DAILY,day,3)}if(c.wk!==wk){c.wk=wk;c.w=deal(WEEKLY,wk,3)}return c}
const commBoost=r=>r.coins?{...r,coins:Math.round(r.coins*(1+depFx('comm')/100))}:r;
function chProg(k,n){if(!n)return;const c=chState();for(const [list,pool] of [[c.d,DAILY],[c.w,WEEKLY]])for(const x of list){const d=pool.find(q=>q.id===x.id);if(d&&d.k===k&&!x.claimed)x.v=Math.min(d.v,x.v+n)}}
function chClaim(which,id){const c=chState(),list=which==='d'?c.d:c.w,pool=which==='d'?DAILY:WEEKLY,x=list.find(q=>q.id===id),d=pool.find(q=>q.id===id);
  if(!x||!d||x.claimed||x.v<d.v)return;x.claimed=true;toast(`${d.n}: `+grant(commBoost(d.r)));S.goal();saveClub();renderMenu()}

/* ===== Club Legacy: a level for your whole club, every match counts, even the losses ===== */
const legNeed=l=>450+l*110;
function legReward(l){const r={coins:300+l*40};if(l%3===0)r.tt=2;if(l%5===0)r.pack='gold';if(l%10===0){r.pack='premium';r.cp=100}if(l===15||l===35)r.pack='elite';if(l===25||l===50)r.pack='icon';if(l===20)r.cos='theme_dusk';return r}
function legacyXP(x){ctkSync();const L=club.leg=club.leg||{xp:0,lvl:0};L.xp+=Math.round(x);
  while(L.xp>=legNeed(L.lvl)){L.xp-=legNeed(L.lvl);L.lvl++;club.ctk=ctk()+1;club.ctkEarned=Math.max(club.ctkEarned||0,L.lvl);const got=grant(legReward(L.lvl))+' · +1 Club Token';club.legLog=[`Club Legacy level ${L.lvl}: ${got}`,...(club.legLog||[])].slice(0,12);legacyUps.push(L.lvl)}}
let legacyUps=[];

/* ===== achievements (claim once, they stay on your cabinet as badges) ===== */
const nOwned=()=>club.owned.length;
const ACH=[
  {id:'firstwin',n:'First Win',d:'Win a match',t:()=>stv('wins')>=1,r:{coins:300}},
  {id:'wins50',n:'Fifty Up',d:'Win 50 matches',p:()=>[stv('wins'),50],r:{coins:3000,tt:5}},
  {id:'goals100',n:'Century',d:'Score 100 goals',p:()=>[stv('goals'),100],r:{coins:2500,tt:3}},
  {id:'title',n:'Champions',d:'Win a league title',t:()=>stv('titles')>=1,r:{coins:2000,cp:100}},
  {id:'unbeaten',n:'Invincibles',d:'Finish a league season unbeaten',t:()=>stv('unbeaten')>=1,r:{coins:5000,pack:'premium'}},
  {id:'promo3',n:'Climbers',d:'Gain promotion three times',p:()=>[stv('promos_volta')+stv('promos_classical'),3],r:{coins:4000,tt:5}},
  {id:'legv',n:'Volta Legend',d:'Reach the Legendary Division in Volta',t:()=>stv('legend_volta')>=1,r:{pack:'elite',cos:'pitch_diag'}},
  {id:'legc',n:'Classical Legend',d:'Reach the Legendary Division in Classical',t:()=>stv('legend_classical')>=1,r:{pack:'elite',cos:'stad3'}},
  {id:'wccv',n:'World Champions · Volta',d:'Win the World Club Championship in Volta',t:()=>stv('wcc_volta')>=1,r:{pack:'icon',cos:'kit_gold'}},
  {id:'wccc',n:'World Champions · Classical',d:'Win the World Club Championship in Classical',t:()=>stv('wcc_classical')>=1,r:{pack:'icon',cos:'theme_night'}},
  {id:'icon1',n:'Icon Signed',d:'Sign an Icon',t:()=>club.owned.some(id=>byId(id)&&tier(byId(id))==='icon'),r:{coins:2000}},
  {id:'evo1',n:'Evolved',d:'Complete an evolution stage',t:()=>stv('evos')>=1,r:{coins:1500,tt:2}},
  {id:'evomax',n:'Fully Evolved',d:'Take a player through every evolution stage',t:()=>stv('evomax')>=1,r:{pack:'elite'}},
  {id:'maxup',n:'Maxed Out',d:'Use every upgrade point on one player',t:()=>club.owned.some(id=>byId(id)&&!byId(id).isCustom&&upSpent(id)>=UPCAP[tier(byId(id))]),r:{tt:5,cp:60}},
  {id:'both',n:'Two Sides of the Game',d:'Win a match in both Volta and Classical',t:()=>stv('vwins')>=1&&stv('cwins')>=1,r:{coins:800}},
  {id:'dream',n:'Dream Team',d:'Field a Classical line-up of eight Icons',t:()=>club.csquads.some(q=>q.s.every(id=>id&&byId(id)&&tier(byId(id))==='icon')),r:{coins:50000,cos:'boards_gold'}},
  ...[[25,{coins:1000}],[50,{coins:2000,pack:'silver'}],[100,{pack:'gold',tt:3}],[250,{pack:'premium',cp:150}],[500,{pack:'elite',cp:300}],[1000,{pack:'icon',cos:'theme_gold'}]].map(([n,r])=>
    ({id:'col'+n,n:`Collector · ${n}`,d:`Collect ${n} different footballers`,p:()=>[nOwned(),n],r}))];
const achDone=a=>a.t?a.t():a.p()[0]>=a.p()[1];
function achCheck(){club.achR=club.achR||{};let fresh=0;for(const a of ACH)if(!club.ach?.[a.id]&&achDone(a)&&!club.achR[a.id]){club.achR[a.id]=true;fresh++}return fresh}
function achClaim(id){club.ach=club.ach||{};const a=ACH.find(x=>x.id===id);if(!a||club.ach[id]||!achDone(a))return;club.ach[id]=Date.now();toast(`Achievement: ${a.n}! `+grant(commBoost(a.r)));S.goal();saveClub();renderMenu()}

/* ===== exchanges: turn duplicates into something better (repeatable) ===== */
const EXCH=[{id:'b2s',n:'Bronze Exchange',need:{bronze:5},coins:150,out:{pack:'silver'}},{id:'s2g',n:'Silver Exchange',need:{silver:4},coins:500,out:{pack:'gold'}},
  {id:'g2p',n:'Gold Exchange',need:{gold:4},coins:1500,out:{pack:'premium'}},{id:'sp2e',n:'Special Exchange',need:{special:3},coins:4000,out:{pack:'elite'}},
  {id:'iconq',n:'Icon Quest',need:{special:2,gold:8},coins:15000,out:{pack:'icon'}},{id:'camp',n:'Training Camp',need:{bronze:3,silver:2},coins:0,out:{tt:4}}];
const dupCount=r=>Object.entries(club.dupes||{}).reduce((a,[id,n])=>a+(byId(id)&&tier(byId(id))===r?n:0),0);
function exchDo(id){const x=EXCH.find(e=>e.id===id);if(!x)return;for(const r in x.need)if(dupCount(r)<x.need[r])return;if(club.coins<x.coins)return;
  club.coins-=x.coins;for(const r in x.need){let left=x.need[r];for(const [pid,n] of Object.entries(club.dupes).sort((a,b)=>ovr(byId(a[0])||{})-ovr(byId(b[0])||{}))){if(!left)break;const p=byId(pid);if(!p||tier(p)!==r)continue;const k=Math.min(n,left);club.dupes[pid]-=k;left-=k;if(!club.dupes[pid])delete club.dupes[pid]}}
  toast(`${x.n} done: `+grant(x.out));S.goal();saveClub();renderMenu()}
function sellDupes(){let c=0;for(const [id,n] of Object.entries(club.dupes||{})){const p=byId(id);if(p)c+=TIERS[tier(p)].sell*n}club.dupes={};club.coins+=c;toast(`Sold your duplicates for ${c.toLocaleString()} coins.`);saveClub();renderMenu()}

/* ===== customisation: Club Points (and a few prizes you can only win) ===== */
const COS=[{id:'pitch_stripes',k:'pitch',name:'Classic stripes',cp:0},{id:'pitch_checks',k:'pitch',name:'Checkerboard mow',cp:150},{id:'pitch_diag',k:'pitch',name:'Diagonal mow',cp:200,win:1},
  {id:'theme_day',k:'theme',name:'Floodlit evening',cp:0},{id:'theme_dusk',k:'theme',name:'Golden dusk',cp:250},{id:'theme_night',k:'theme',name:'Midnight under the lights',cp:400,win:1},{id:'theme_gold',k:'theme',name:'Champions’ gold',cp:0,win:1},
  {id:'stad1',k:'stad',name:'Local ground (crowd 60%)',cp:0},{id:'stad2',k:'stad',name:'New stand (crowd 85%)',cp:300},{id:'stad3',k:'stad',name:'Sell-out stadium (crowd 100%)',cp:600},
  {id:'boards_std',k:'boards',name:'League boards',cp:0},{id:'boards_club',k:'boards',name:'Your club on the boards',cp:150},{id:'boards_gold',k:'boards',name:'Gold boards',cp:0,win:1},
  {id:'kit_std',k:'kitx',name:'Standard kits',cp:0},{id:'kit_gold',k:'kitx',name:'Champion gold kit',cp:0,win:1}];
const cosOwned=id=>COS.find(c=>c.id===id)?.cp===0&&!COS.find(c=>c.id===id)?.win||(club.cosOwned||[]).includes(id);
const cosOn=k=>{const sel=(club.cos||{})[k];return sel&&cosOwned(sel)?sel:COS.find(c=>c.k===k&&c.cp===0&&!c.win).id};
function cosBuy(id){const c=COS.find(x=>x.id===id);if(!c||cosOwned(id))return;if(c.win){toast('This one has to be won.');return}if(res().cp<c.cp){toast('Not enough Club Points yet.');return}
  club.cp-=c.cp;club.cosOwned=[...(club.cosOwned||[]),id];cosUse(id)}
function cosUse(id){const c=COS.find(x=>x.id===id);if(!c||!cosOwned(id))return;club.cos=club.cos||{};club.cos[c.k]=id;if(c.k==='kitx'&&id==='kit_gold')club.kit='#d4af37';
  pitchCv=null;if(typeof buildCrowd==='function')buildCrowd();saveClub();renderMenu()}

/* ===== after every match ===== */
// signing a player
function careerSigned(p){stat('signed',1);achCheck()}
// called once the coins are in: records, challenges, legacy, chemistry, evolution progress
// Training Tokens = max(0, goals scored - goals conceded), once per completed match, in every mode (online too)
function gdTokens(gf,ga){const n=Math.max(0,(gf|0)-(ga|0));if(n){res();club.tt+=n;earnNote+=` · +${n} Training Token${n>1?'s':''} (goal difference)`}saveClub()}
function careerAfterMatch(){if(NET.on||SG)return;const gf=score[0],ga=score[1],pw=pen&&pen.winner!=null?pen.winner:null,won=gf>ga||pw===0,draw=gf===ga&&pw==null;
  stat('matches');if(won){stat('wins');stat(GM==='classical'?'cwins':'vwins')}stat('goals',gf);if(ga===0)stat('cleans');
  chProg('wins',won?1:0);chProg('goals',gf);chProg('passes',stats.passes||0);chProg('clean',ga===0?1:0);chProg('skills',stats.skills||0);chProg('tackles',stats.tackles||0);
  if(GM==='classical'&&won)chProg('cwins',1);if(comp==='league'){chProg('lgplay',1);if(won)chProg('lgwins',1)}
  legacyXP(60+(won?80:draw?30:0)+gf*12);
  // the line-up that played gets more familiar with each other; players left out drift a little
  const q=sq(),fam=(club.fam=club.fam||{})[GM]=(club.fam||{})[GM]||{};for(const id in fam)if(!q.s.includes(id))fam[id]=Math.max(0,fam[id]-1);for(const id of q.s)if(id)fam[id]=(fam[id]||0)+1;
  // evolution objectives count what each player did on the pitch
  club.evo=club.evo||{};for(const p of players){if(p.team!==0||p.keeper||!p.st.id)continue;const id=p.st.id;if(!club.owned.includes(id))continue;
    const e=club.evo[id]=club.evo[id]||{st:0,m:0,g:0,p:0,t:0};e.m++;e.g+=p.goals||0;e.p+=p.mP||0;e.t+=p.mT||0}
  if(matchRatings&&matchRatings.motm.p.team===0&&won&&Math.random()<.35){grant({tt:1});earnNote+=' · +1 Training Token (man of the match bonus)'}
  gdTokens(gf,ga);
  achCheck();saveClub()}

/* ===== spending ===== */
function upBuy(id,k){const p=byId(id);if(!p||p.isCustom||!club.owned.includes(id))return;const u=(club.up=club.up||{})[id]=club.up[id]||{};
  if(upSpent(id)>=upRoom(p)){toast(upRoom(p)<UPCAP[tier(p)]?`Level ${p.short} up by playing him to unlock more upgrades.`:'Fully upgraded.');return}
  if((u[k]||0)>=STATMAX||playStats(p)[k]>=.99){toast('That stat is maxed.');return}
  const c=upCost(p);if(club.coins<c){toast(`Needs ${c.toLocaleString()} coins.`);return}
  const before=effOvr(p),b0=Math.round(playStats(p)[k]*100);club.coins-=c;u[k]=(u[k]||0)+1;const after=effOvr(p);
  upFlash={id,k,from:b0,to:Math.round(playStats(p)[k]*100),o0:before,o1:after};S.skill(1);achCheck();saveClub();renderMenu()}
let upFlash=null;
function evoDo(id){const p=byId(id),N=p&&evoNeed(p);if(!N)return;if(N.have.m<N.m||N.have.v<N.n){toast('Finish the objective first.');return}
  if(club.coins<N.coins||res().tt<N.tt){toast('Not enough coins or Training Tokens.');return}
  const before=effOvr(p);club.coins-=N.coins;club.tt-=N.tt;club.evo[id]={st:N.stage+1,m:0,g:0,p:0,t:0};stat('evos');if(!evoNeed(p))stat('evomax');
  toast(`${p.name} evolved! ${before} → ${effOvr(p)} OVR`);S.goal();confetti(tier(p));achCheck();saveClub();renderMenu()}
function trainDo(id){const p=byId(id);if(!p||res().tt<2)return;club.tt-=2;club.xp=club.xp||{};const b=lvlOf(id);const gx=Math.round(100*(1+depFx('train')/100));club.xp[id]=(club.xp[id]||0)+gx;
  toast(`Training session: ${p.short} +${gx} XP`+(lvlOf(id)>b?` · now Lv ${lvlOf(id)}`:''));S.skill(1);saveClub();renderMenu()}
function gkTrain(){const lv=club.gkLv||0;if(lv>=GKMAX)return;const c=gkCost(lv);if(club.coins<c){toast(`Needs ${c.toLocaleString()} coins.`);return}club.coins-=c;club.gkLv=lv+1;toast(`Keeper training: Goalkeeping now ${gkRating()}`);S.skill(1);saveClub();renderMenu()}
const gkRating=()=>70+(club.gkLv||0)*3;

/* ===== first run of the career: everyone gets a few more bodies so a 9-a-side line-up is possible ===== */
function careerInit(){ctkSync();for(const m of ['volta','classical']){const L=(club.lg||{})[m];if(L&&!L.done&&L.fx.length===18&&L.round<9)L.fx=L.fx.slice(0,9)}
  if(club.v2)return;club.v2=1;const b=PLAYERS.filter(p=>p.rar==='bronze'&&!club.owned.includes(p.id)).sort(()=>Math.random()-.5);
  const pos={DEF:2,MID:3,ATT:2},add=[];for(const P0 of ['DEF','MID','ATT'])add.push(...b.filter(p=>p.pos===P0).slice(0,pos[P0]));
  const s=PLAYERS.filter(p=>p.rar==='silver'&&!club.owned.includes(p.id)).sort(()=>Math.random()-.5).slice(0,1);
  for(const p of [...add,...s])club.owned.push(p.id);res();club.tt+=3;club.coins+=1000;
  club.compBy={volta:'league',classical:'league'};if(!['cup','tour','friendly','chal','skill','league','wcc'].includes(club.comp))club.comp='league';
  club.welcome=`Welcome to the new season! Your squad has ${add.length+s.length} new academy players, 1,000 coins and 3 Training Tokens to get started.`;
  const g0=GM;GM='classical';autoPick(club.csquads[0]);GM=g0;saveClub()}

/* ===== menus ===== */
function goText(){
  if(comp==='league'){const L=lgOf();if(!L)return'Start the season';if(L.done)return'See the season review';const f=myFixture(L),o=lgTeam(L,f.h==='me'?f.a:f.h);return`Round ${L.round+1}: ${f.h==='me'?'vs':'at'} ${o.name}`}
  if(comp==='wcc'){const W=wccOf();if(!W)return'Not qualified yet';if(W.done||!W.alive)return W.champ==='me'?'Champions!':'Knocked out';const x=wMy(W),o=wTeam(W,x.a==='me'?x.b:x.a);return`${WROUNDS[W.round]} vs ${o.name}`}
  return comp==='friendly'?'Play a friendly':comp==='chal'?`Try: ${CHALS.find(c=>c.id===chalId()).name}`:comp==='skill'?`Play ${SGAMES[sgId()].name}`:comp==='tour'?(tourOver()?'Enter a new tournament':`Play ${TROUNDS[club.tour.round].replace(/s$/,'').toLowerCase()} vs ${clubName(myMatch().a===ME?myMatch().b:myMatch().a)}`):cupOver()?(club.cup.alive?'Defend the trophy':'Enter the cup again'):`Play ${ROUNDS[club.cup.round].toLowerCase()} vs ${OPPS[club.cup.opps[club.cup.round]][0]}`}
const fmtX=x=>{const v=+x.toFixed(3);return Number.isInteger(v)?v.toFixed(1):String(v)};
function renderModes(){const dm=LV().coin,dn=dm!==1?` <i class="dmul">incl. ${LV().name} ×${fmtX(dm)}</i>`:'';const lv=m=>{const L=(club.lg||{})[m];return L?DIVS[L.div].n:'Amateur Division'},w=m=>{const W=(club.wcc||{})[m];return W&&!W.done&&W.alive?' · in the World Club Championship':''};
  $('modes').innerHTML=`<button class="modecard" data-gm="volta" aria-pressed="${GM==='volta'}"><div class="mh"><b>VOLTA</b><i>5v5</i></div><span>Fast-paced football in the cage · 2 min matches</span><em>${fmtX(dm)}× coins${dn}</em><small>${lv('volta')}${w('volta')}</small></button>
   <button class="modecard cl" data-gm="classical" aria-pressed="${GM==='classical'}"><div class="mh"><b>CLASSICAL</b><i>9v9</i></div><span>Full-pitch tactical football</span><em>${fmtX(1.5*dm)}× coins · Expanded pitch ${fmtX(1.875*dm)}×${dn}</em><small>${lv('classical')}${w('classical')}</small></button>`+
   (GM==='classical'?(()=>{const v=club.cpitch==='expanded'?'expanded':'standard';return `<div class="pitchsw"><span class="lab">PITCH SIZE</span><div class="seg" data-v="${v}" role="radiogroup" aria-label="Pitch size"><i class="thumb"></i>${[['standard','STANDARD','Large pitch · 3 min · 1.5× coins'],['expanded','EXPANDED','Extra-large pitch · 3½ min · 1.875× coins (1.5 × 1.25) · more room for long balls and counters']].map(([k,n,d])=>
     `<button data-pitch="${k}" role="radio" aria-checked="${v===k}" aria-pressed="${v===k}" title="${d}">${n}</button>`).join('')}</div>${v==='expanded'?'<span class="pbonus">+1.25× coins</span>':''}<small>${v==='expanded'?`3½ min · ${fmtX(1.875*dm)}× total`:`3 min · ${fmtX(1.5*dm)}× coins`}</small></div>`})():'')}
const kd=k=>`<span class="kitdot" style="background:${k}"></span>`;
function renderLeague(){let L=lgOf();if(!L)L=newSeason(GM,0,1);const D=DIVS[L.div],T=lgTable(L);
  $('diff-note').textContent=`${LV().name}: ${LV().note} ${GM==='classical'?'Classical 9v9':'Volta 5v5'} · Season ${L.season} · ${D.n}. Top 3 go up${L.div===4?' (you’re at the top)':''}, bottom 3 go down${L.div===0?' (not from here)':''}. A top-3 finish also earns a World Club Championship place.`;
  const tabs=`<div class="subtabs">${[['table','League table'],['fix','Fixtures & results'],['rew','Season rewards']].map(([k,n])=>`<button data-lgv="${k}" aria-pressed="${lgView===k}">${n}</button>`).join('')}</div>`;
  let body='';
  if(L.done&&L.summary){const S0=L.summary;body+=`<div class="panel welcome"><h4>Season ${L.season} complete: ${ordinal(S0.pos)} in the ${D.n}</h4><p>${S0.lines.join(' · ')||'Mid-table finish.'}</p><p>Rewards: ${S0.got}</p><button class="go" data-lgnext="1" style="font-size:18px">Start season ${L.season+1} in the ${DIVS[S0.next].n}</button></div>`}
  if(lgView==='table'){const n=T.length;
    body+=`<div class="ltwrap"><table class="lt"><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Form</th></tr>`+T.map((r,i)=>{const t=lgTeam(L,r.id);
      return `<tr class="${r.id==='me'?'me':''} ${i<3&&L.div<4?'up':''} ${i>=n-3&&L.div>0?'down':''}"><td>${i+1}</td><td>${kd(t.kit)}${esc(t.name)}${r.id!=='me'?` <span class="hint" style="font-size:11px">${Math.round(t.str*100)}</span>`:''}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td><b>${r.pts}</b></td><td>${r.form.slice(-5).map(x=>`<span class="frm ${x}">${x}</span>`).join('')}</td></tr>`}).join('')+`</table></div>
      <p class="hint">Green edge: promotion places. Red edge: relegation. Numbers next to clubs are their team ratings; yours is ${teamRating()}.</p>`}
  else if(lgView==='fix'){const nm=id=>esc(lgTeam(L,id).name);
    const show=L.fx.map((r,i)=>({r,i})).filter(({i})=>i>=L.round-3&&i<=L.round+3);
    body+=show.map(({r,i})=>`<div class="panel"><h4>Round ${i+1}${i===L.round&&!L.done?' · next':''}</h4><div class="fxl">`+r.map(f=>{const me=f.h==='me'||f.a==='me';
      return `<div class="fxr ${me?'me':''}"><i>${f.r?'FT':i===L.round?'NEXT':'—'}</i><span>${nm(f.h)}</span><span class="sc">${f.r?f.r.join('–'):'v'}</span><span class="a">${nm(f.a)}</span></div>`}).join('')+`</div></div>`).join('');
    body+=`<p class="hint">Showing three rounds either side of now. All ${L.fx.length} rounds: every club plays every other club once.</p>`}
  else{const m=MM(),pm=GM==='classical'?(club.cpitch==='expanded'?1.875:1.5):1,pn=GM==='classical'?(club.cpitch==='expanded'?'Classical Expanded 1.875×':'Classical Standard 1.5×'):'Volta 1.0×';body+=`<div class="panel"><h4>What this season pays</h4>
    <p>Each match (${pn}, before difficulty): win ${Math.round(100*pm)} · draw ${Math.round(40*pm)} · loss ${Math.round(20*pm)} coins, plus ${Math.round(10*pm)} per goal. Man of the match: +${Math.round(25*pm)} coins (and sometimes a Training Token).</p>
    <p>League title bonus: ${(2000*m).toLocaleString()} coins. Promotion bonus: ${(750*m).toLocaleString()} coins.</p>
    <p>Finishing position in the ${D.n} (×${D.mul}): `+FINISH.map((c,i)=>`${ordinal(i+1)} ${Math.round(c*D.mul*m/10)*10}`).join(' · ')+`</p>
    <p>Club Points and Training Tokens for every finish, more near the top. A top-3 finish qualifies you for next season’s World Club Championship.</p></div>`+
    `<div class="panel"><h4>Club history</h4>${(club.hist||[]).filter(h=>h.m===GM).slice(0,8).map(h=>`<p>Season ${h.season} · ${DIVS[h.div].n}: ${ordinal(h.pos)}, ${h.pts} pts (${h.w}W ${h.d}D ${h.l}L) ${h.note?'· '+esc(h.note):''}</p>`).join('')||'<p class="hint">Your finished seasons will show here.</p>'}</div>`}
  $('cup').innerHTML=`<div class="cup-head"><b>${D.n}</b><span>${GM==='classical'?'CLASSICAL':'VOLTA'} · Season ${L.season} · Round ${Math.min(L.fx.length,L.round+1)} of ${L.fx.length}</span></div>`+tabs+body}
function renderWcc(){const W=wccOf();
  if(!W){$('diff-note').textContent='Finish in the top three of your league to qualify. The championship is played during the following season.';
    $('cup').innerHTML=`<div class="cup-head"><b>World Club Championship</b><span>Not qualified yet</span></div><div class="panel"><p>64 of the world’s best clubs, straight knockout, played during the season after you qualify. Opponents are much stronger than league sides, and the final is against one of the top seeds.</p>
    <div class="prize">${WROUNDS.slice(1).map((r,i)=>`<span>Reach ${r}: ${Math.round(WPRIZE[i+1]*MM()).toLocaleString()}</span>`).join('')}<span>Win it: ${Math.round(WPRIZE[6]*MM()).toLocaleString()} + Elite Pack + trophy + exclusive cosmetic</span></div></div>`;return}
  const st=W.done?(W.champ==='me'?'You are world champions!':`Won by ${esc(wTeam(W,W.champ).name)}`):W.alive?`Next: ${WROUNDS[W.round]}`:'Knocked out';
  $('diff-note').textContent=`World Club Championship for season ${W.season}. Knockout: level games go to penalties. ${GM==='classical'?'Classical prizes are 1.5×.':''}`;
  const cols=W.rounds.map((R,ri)=>{const list=ri<2?R.filter(x=>x.a==='me'||x.b==='me'||x.w==='me'||ri>=W.round-0&&false):R;const mine=R.filter(x=>x.a==='me'||x.b==='me');
    const shown=ri<=1?[...mine,...R.filter(x=>!mine.includes(x)).slice(0,ri===0?5:7)]:R;
    return `<div class="bcol"><b>${WROUNDS[ri]}</b>${shown.map(x=>{const nm=id=>esc(wTeam(W,id).name),cl=id=>x.w?(x.w===id?'w':'l'):'';
      return `<div class="bm ${x.a==='me'||x.b==='me'?'me':''}"><span class="${cl(x.a)}">${nm(x.a)}<em>${x.w?x.sa:''}</em></span><span class="${cl(x.b)}">${nm(x.b)}<em>${x.w?x.sb:''}${x.pen?' p':''}</em></span></div>`}).join('')}${ri<=1&&R.length>shown.length?`<span class="hint" style="font-size:11px">+ ${R.length-shown.length} more ties</span>`:''}</div>`}).join('');
  $('cup').innerHTML=`<div class="cup-head"><b>World Club Championship</b><span>${st}</span></div><div class="prize">${WROUNDS.slice(1).map((r,i)=>`<span class="${W.paid[i+1]?'got':''}">${r}: ${Math.round(WPRIZE[i+1]*MM()).toLocaleString()}</span>`).join('')}<span class="${W.paid[6]?'got':''}">Champions: ${Math.round(WPRIZE[6]*MM()).toLocaleString()}</span></div><div class="bracket">${cols}</div>`}
$('modes').addEventListener('click',e=>{const pz=e.target.closest('[data-pitch]');if(pz){club.cpitch=pz.dataset.pitch;saveClub();renderMenu();return}const b=e.target.closest('[data-gm]');if(b)setGM(b.dataset.gm)});
$('cup').addEventListener('click',e=>{const v=e.target.closest('[data-lgv]');if(v){lgView=v.dataset.lgv;renderMenu();return}
  if(e.target.closest('[data-lgnext]')){lgNext();lgView='table';toast('New season, new fixtures. Good luck!');renderMenu()}});
function renderSquadExtras(){
  $('sqhead').innerHTML=`<span class="hint" style="margin:0">Editing your</span>`+['volta','classical'].map(m=>`<button class="ghost" data-sqgm="${m}" aria-pressed="${GM===m}" style="${GM===m?'color:var(--sun);border-color:var(--sun)':''}">${m==='volta'?'Volta 5v5':'Classical 9v9'} line-up</button>`).join('');
  $('team-chemistry').textContent=chemOf();
  const T=tacSet();$('tactics').innerHTML=TAC.map(x=>`<div class="panel"><div class="lab">${x.l.toUpperCase()}</div><div class="forms">${x.o.map((o,i)=>`<button data-tac="${x.k}" data-v="${i}" aria-pressed="${T[x.k]===i}">${o}</button>`).join('')}</div></div>`).join('')+
    chemHTML()}
function chemHTML(){const c=chemParts()||{inPos:0,settled:0,mix:0,n:FORMS[sq().f].length,shapes:[],total:0},pct=v=>Math.round(v*100),bar=v=>`<div class="prog"><i style="width:${pct(v)}%"></i></div>`;
  const boost=(c.total*.02).toFixed(1);
  return `<div class="panel" style="grid-column:1/-1"><div class="lab">CHEMISTRY ${c.total}/100 · right now every player gets +${boost} on every stat</div>
   <div class="twocol" style="gap:8px;margin-top:4px">
    <div><b>In position · ${Math.round(c.inPos*c.n)}/${c.n}</b> <span class="hint" style="margin:0">(60% of chemistry)</span>${bar(c.inPos)}</div>
    <div><b>Settled line-up · ${pct(c.settled)}%</b> <span class="hint" style="margin:0">(25%)</span>${bar(c.settled)}</div>
    <div><b>Role mix · ${c.shapes.length}/3</b> <span class="hint" style="margin:0">(15%)</span>${bar(c.mix)}</div></div>
   <details class="guide" style="margin-top:6px"><summary>How chemistry works and how to raise it</summary>
    <p><b>What it does:</b> chemistry adds up to +2 to every stat of every outfield player (all seven: pace, shooting, finishing, dribbling, passing, defending and physical) for the whole match. At 50 chemistry it’s +1. It counts in league, cup, Championship and friendly matches, not online.</p>
    <p><b>1. Play people in their own position (60%).</b> A defender in a DEF slot, a midfielder in MID, an attacker in ATT. Out-of-position players also lose up to 14% of their stats, so this matters twice. The pitch shows a red label on anyone out of position. <i>Auto-pick best</i> fills every slot with a natural fit.</p>
    <p><b>2. Keep the same line-up (25%).</b> Each match a player starts adds one to his familiarity, up to 8 matches. Players you drop lose one per match. Rotating every game keeps this near zero; sticking with a settled side fills it in about eight matches. Volta and Classical each keep their own.</p>
    <p><b>3. Mix the roles (15%).</b> Have at least one defender, one midfielder and one attacker on the pitch. A line-up with no midfielder loses this part.</p>
    <p><b>Quick wins:</b> press Auto-pick best, then play the same team for a few matches in a row.</p></details></div>`}
$('sqhead').addEventListener('click',e=>{const b=e.target.closest('[data-sqgm]');if(b)setGM(b.dataset.sqgm)});
$('tactics').addEventListener('click',e=>{const b=e.target.closest('[data-tac]');if(!b)return;tacSet()[b.dataset.tac]=+b.dataset.v;saveClub();renderMenu()});
$('legpill').onclick=()=>{tab='club';ctab='legacy';renderMenu()};$('ctkp').onclick=()=>{tab='club';ctab='dept';renderMenu()};

/* ----- the Club tab ----- */
const CTABS=[['coll','Collection'],['upg','Development'],['abil','Special Abilities'],['dept','Club Development'],['packs','Packs'],['chal','Challenges'],['ach','Achievements'],['legacy','Club Legacy'],['exch','Exchanges'],['cos','Customise'],['cab','Trophy Cabinet'],['market','Transfer Market']];
function renderClub(){achCheck();const cs=chState(),chDot=[...cs.d.map(x=>[x,DAILY]),...cs.w.map(x=>[x,WEEKLY])].some(([x,P0])=>!x.claimed&&x.v>=P0.find(q=>q.id===x.id).v),achDot=ACH.some(a=>!(club.ach||{})[a.id]&&achDone(a));
  $('ctabs').innerHTML=CTABS.map(([k,n])=>`<button data-ct="${k}" aria-selected="${ctab===k}">${n}${(k==='chal'&&chDot)||(k==='ach'&&achDot)?'<span class="dot"></span>':''}</button>`).join('');
  const B0=$('club-body');B0.innerHTML='';
  if(ctab==='coll')renderCollection();else if(ctab==='upg')B0.innerHTML=devHTML();else if(ctab==='abil')B0.innerHTML=ablHTML();else if(ctab==='dept')B0.innerHTML=deptHTML();else if(ctab==='chal')B0.innerHTML=chalHTML();else if(ctab==='ach')B0.innerHTML=achHTML();
  else if(ctab==='legacy')B0.innerHTML=legHTML();else if(ctab==='exch')B0.innerHTML=exchHTML();else if(ctab==='cos')B0.innerHTML=cosHTML();else if(ctab==='cab')B0.innerHTML=cabHTML();
  else if(ctab==='market')B0.innerHTML=`<div class="soon"><b>Transfer Market</b><p>Coming soon.</p><p class="hint">Buy the exact footballer you want for a fixed coin price, with search and a wishlist. Not open yet: keep saving those coins.</p></div>`}
$('ctabs').addEventListener('click',e=>{const b=e.target.closest('[data-ct]');if(b){ctab=b.dataset.ct;renderMenu()}});
function renderCollection(){const F=collF,own=new Set(club.owned);
  $('collect-count').textContent=`${club.owned.length} of ${PLAYERS.length+1} collected`;
  $('album').innerHTML=albumHTML();
  $('collctl').innerHTML=`<input id="cf-q" placeholder="Search name" value="${esc(F.q)}" aria-label="Search">`+
    `<select id="cf-own" aria-label="Show">${[['owned','My players'],['all','Everyone'],['missing','Not collected']].map(([v,n])=>`<option value="${v}" ${F.own===v?'selected':''}>${n}</option>`).join('')}</select>`+
    `<select id="cf-r" aria-label="Rarity"><option value="all">All rarities</option>${RAR.map(r=>`<option value="${r}" ${F.r===r?'selected':''}>${TIERS[r].name}</option>`).join('')}</select>`+
    `<select id="cf-pos" aria-label="Position">${['all','ATT','MID','DEF'].map(v=>`<option value="${v}" ${F.pos===v?'selected':''}>${v==='all'?'All positions':v}</option>`).join('')}</select>`+
    `<select id="cf-sort" aria-label="Sort">${[['ovr','Rating'],['rar','Rarity'],['pos','Position'],['up','Upgrade level'],['name','Name']].map(([v,n])=>`<option value="${v}" ${F.sort===v?'selected':''}>Sort: ${n}</option>`).join('')}</select>`;
  const q=F.q.trim().toLowerCase();let list=[...PLAYERS,custom].filter(p=>(F.own==='all'||(F.own==='owned')===own.has(p.id))&&(F.r==='all'||tier(p)===F.r)&&(F.pos==='all'||natPos(p)===F.pos)&&(!q||p.name.toLowerCase().includes(q)));
  const RI=r=>RAR.indexOf(r);const sv=p=>own.has(p.id)?effOvr(p):ovr(p);const sorts={ovr:(a,b)=>sv(b)-sv(a),rar:(a,b)=>RI(tier(b))-RI(tier(a))||ovr(b)-ovr(a),pos:(a,b)=>natPos(a).localeCompare(natPos(b))||ovr(b)-ovr(a),up:(a,b)=>upSpent(b.id)+evoOf(b.id).st*5-upSpent(a.id)-evoOf(a.id).st*5||ovr(b)-ovr(a),name:(a,b)=>a.name.localeCompare(b.name)};
  list.sort(sorts[F.sort]||sorts.ovr);const per=24,pages=Math.max(1,Math.ceil(list.length/per));F.page=clamp(F.page,0,pages-1);
  $('market').innerHTML=list.slice(F.page*per,F.page*per+per).map(p=>{const o=own.has(p.id);
    const h=cardHTML(o?p:{...p,name:NAMES[p.id]||p.name},{nolv:!o,extra:o?`<div class="cact">${p.isCustom?'':`<button data-upg="${p.id}">Upgrade</button>`}<button data-cmp="${p.id}" aria-pressed="${cmpIds.includes(p.id)}">Compare</button>${(club.dupes||{})[p.id]?`<span class="hint" style="margin:0">+${club.dupes[p.id]} duplicate</span>`:''}</div>`+renameUI(p,'coll'):`<span class="owned" style="color:var(--muted)">Found in packs</span>`});
    return o?h:h.replace('class="card ','class="card locked ')}).join('')||'<p class="hint">Nobody matches.</p>';
  $('pager').innerHTML=pages>1?`<button class="ghost" data-pg="-1" ${F.page?'':'disabled'}>‹ Prev</button><span>Page ${F.page+1} of ${pages} · ${list.length} players</span><button class="ghost" data-pg="1" ${F.page<pages-1?'':'disabled'}>Next ›</button>`:`<span>${list.length} players</span>`;
  const C2=cmpIds.map(byId).filter(Boolean);
  $('compare').innerHTML=C2.length?`<div class="panel"><h4>Compare</h4><div class="ltwrap"><table class="lt"><tr><th></th><th>Player</th><th>OVR</th>${STATK.map(([,l])=>`<th>${l}</th>`).join('')}<th>Ability</th></tr>${C2.map(p=>{const s=playStats(p);
    return `<tr><td><button class="btn" data-cmp="${p.id}">✕</button></td><td>${esc(p.name)} <span class="tier t-${tier(p)}">${TIERS[tier(p)].name}</span></td><td><b>${effOvr(p)}</b></td>${STATK.map(([k])=>{const v=Math.round(s[k]*100),best=Math.max(...C2.map(x=>Math.round(playStats(x)[k]*100)));return `<td style="${v===best&&C2.length>1?'color:var(--mint);font-weight:800':''}">${v}</td>`}).join('')}<td>${p.ab?ABIL[p.ab].name:'—'}</td></tr>`}).join('')}</table></div></div>`:''}
for(const id of ['cf-q','cf-own','cf-r','cf-pos','cf-sort'])document.addEventListener('change',e=>{if(e.target.id===id){collF[{'cf-q':'q','cf-own':'own','cf-r':'r','cf-pos':'pos','cf-sort':'sort'}[id]]=e.target.value;collF.page=0;renderMenu()}});
$('collctl').addEventListener('keydown',e=>{if(e.target.id==='cf-q'&&e.key==='Enter'){collF.q=e.target.value;collF.page=0;renderMenu()}});
$('pager').addEventListener('click',e=>{const b=e.target.closest('[data-pg]');if(b){collF.page+=+b.dataset.pg;renderMenu()}});
document.addEventListener('click',e=>{const c=e.target.closest('[data-cmp]');if(c&&!$('menu').hidden){const id=c.dataset.cmp;cmpIds=cmpIds.includes(id)?cmpIds.filter(x=>x!==id):[...cmpIds,id].slice(-3);renderMenu();return}
  const u=e.target.closest('[data-upg]');if(u&&!$('menu').hidden){upId=u.dataset.upg;tab='club';ctab='upg';upFlash=null;renderMenu();window.scrollTo&&$('club-body').scrollIntoView({block:'start'})}});
/* development: upgrades, training, evolutions, the club keeper */
function devHTML(){const mine=ownedPlayers().filter(p=>!p.isCustom);if(!upId||!club.owned.includes(upId))upId=(mine[0]||{}).id;const p=byId(upId);
  const pickList=`<select id="dev-pick" aria-label="Player">${mine.map(x=>`<option value="${x.id}" ${x.id===upId?'selected':''}>${esc(x.name)} · ${effOvr(x)} ${TIERS[tier(x)].name}</option>`).join('')}</select>`;
  const gk=`<div class="panel"><h4>Club goalkeeper · Goalkeeping ${gkRating()}</h4><p class="hint">Your keeper plays in every match in both modes. Training makes him react faster and reach further.</p>${(club.gkLv||0)>=GKMAX?'<p class="flash">Fully trained.</p>':`<button class="btn gold" data-gk="1" ${club.coins<gkCost(club.gkLv||0)?'disabled':''}>Train to ${gkRating()+3} · ${gkCost(club.gkLv||0).toLocaleString()} coins</button>`}</div>`;
  if(!p)return gk+'<p class="hint">Sign players from packs to develop them.</p>';
  const s=playStats(p),base=p,u=upOf(p.id),room=upRoom(p),spent=upSpent(p.id),cap=UPCAP[tier(p)],cost=upCost(p),L=lvlOf(p.id),N=evoNeed(p);
  const MP=maxPlan(p),now=effOvr(p),lvMax=XPL.length-1,lb=Math.min(3,Math.floor(L/2));
  const rows=STATK.map(([k,l])=>{const b=Math.round(base[k]*100),v=Math.round(s[k]*100),mx=statMax(p,k),fl=upFlash&&upFlash.id===p.id&&upFlash.k===k,pv=upPreview(p,k),
      lock=spent>=room||(u[k]||0)>=STATMAX||v>=99,why=v>=99?'stat at 99':(u[k]||0)>=STATMAX?`+${STATMAX} limit reached`:spent>=room?(room<cap?'level up to unlock':'no points left'):'';
    return `<div class="strow dv"><span>${l}</span><div class="bar"><i style="width:${b}%"></i><u style="left:${b}%;width:${Math.max(0,v-b)}%"></u><s style="left:${v}%;width:${Math.max(0,mx-v)}%"></s></div><b>${fl?`<span class="flash">${upFlash.from}→</span>`:''}${v}</b><em title="Most this stat can reach">max ${mx}</em>
      <button data-up="${k}" ${lock||club.coins<cost?'disabled':''} title="${lock?why:`${l} ${pv.s0} → ${pv.s1}, overall ${pv.o0} → ${pv.o1}`}">${lock?why:`${l} ${pv.s0} → ${pv.s1} · OVR ${pv.o0}${pv.o1!==pv.o0?` → <b>${pv.o1}</b>`:' (no change)'} · ${cost.toLocaleString()}`}</button></div>`}).join('');
  const planTxt=Object.keys(MP.plan).length?Object.entries(MP.plan).map(([k,n])=>`${STATK.find(x=>x[0]===k)[1]} +${n}`).join(', '):'';
  const evo=N?`<div class="panel"><h4>Evolution · stage ${N.stage+1} of ${EVO[tier(p)].boost.length}</h4><p>+${N.boost} to every stat. Objective: play ${N.m} matches (${Math.min(N.have.m,N.m)}/${N.m}) and get ${N.n} ${N.w} (${Math.min(N.have.v,N.n)}/${N.n}) with him in your line-up.</p>
      <div class="prog"><i style="width:${Math.round(100*Math.min(1,(Math.min(1,N.have.m/N.m)+Math.min(1,N.have.v/N.n))/2))}%"></i></div>
      <p>After this stage: OVR <b>${now} → ${ovr(playStatsX(p,L,u,N.stage+1))}</b></p><button class="btn gold" data-evo="1" ${N.have.m<N.m||N.have.v<N.n||club.coins<N.coins||club.tt<N.tt?'disabled':''}>Evolve · ${N.coins.toLocaleString()} coins + ${N.tt} Training Tokens</button><p class="hint">Evolutions stop at ${OVRCAP[tier(p)]} overall for ${TIERS[tier(p)].name} players.</p></div>`
    :`<div class="panel"><h4>Evolution</h4><p class="flash">Fully evolved.</p></div>`;
  return `<div class="row" style="justify-content:center">${pickList}</div><div class="upg"><div>${cardHTML(p,{})}</div><div style="display:grid;gap:8px">
    <div class="panel t-${tier(p)}"><h4>Upgrades · ${spent}/${cap} points used</h4><div class="potrow"><div><span class="ovrbig">${now}</span><small>current OVR</small></div><div><span class="ovrbig pot">${MP.ovr}</span><small>max achievable</small></div><div><span class="ovrbig rem">+${MP.ovr-now}</span><small>remaining potential</small></div><div><span class="ovrbig">${ovr(p)}</span><small>base card</small></div></div>
    <p class="hint" style="margin:4px 0">Still to come: ${cap-spent} upgrade point${cap-spent===1?'':'s'}${room<cap?` (${Math.max(0,room-spent)} usable now, the rest unlock as he levels up)`:''} · ${EVO[tier(p)].boost.length-evoOf(p.id).st} evolution stage${EVO[tier(p)].boost.length-evoOf(p.id).st===1?'':'s'} · level bonus +${lb} now, +3 at level 6${planTxt?` · best use of the points left: ${planTxt}`:''}. Max achievable counts all of that; chemistry adds up to +3 more in matches. ${TIERS[tier(p)].name} evolutions stop at ${OVRCAP[tier(p)]}.</p>
    ${upFlash&&upFlash.id===p.id?`<p class="flash">Upgraded: ${upFlash.o0} → ${upFlash.o1} OVR</p>`:''}
    <p class="hint">Level ${L} unlocks ${room} of ${cap} upgrade points${room<cap?' · play him or train him to level up for more':''}. Each stat can go up by ${STATMAX}. Each point costs a little more than the last.</p>${rows}</div>
    <div class="panel"><h4>Training · Level ${L}</h4><p class="hint">${xpOf(p.id)} XP. Matches give XP (more for goals, tackles and wins). A training session gives +${Math.round(100*(1+depFx('train')/100))} XP${depFx('train')?` (Training Facilities +${depFx('train')}%)`:''}. Every two levels adds +1 to his five best stats (up to +3).${L<lvMax?` Next level at ${XPL[L+1]} XP${L%2===1&&lb<3?`: five best stats +1, OVR ${now} → ${ovr(playStatsX(p,L+1,u,evoOf(p.id).st))}`:''}.`:' Top level reached.'}</p><button class="btn" data-train2="1" ${club.tt<2?'disabled':''}>Train · 2 Training Tokens</button></div>
    ${ablPanel(p)}${evo}${p.ab?`<div class="panel"><h4>Signature ability · ${ABIL[p.ab].name}</h4><p>${ABIL[p.ab].d}. Always on when he plays.</p></div>`:''}${gk}</div></div>`}
$('club-body').addEventListener('change',e=>{if(e.target.id==='dev-pick'){upId=e.target.value;upFlash=null;renderMenu()}});
$('club-body').addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;
  if(d.up)upBuy(upId,d.up);else if(d.evo)evoDo(upId);else if(d.train2)trainDo(upId);else if(d.gk)gkTrain();
  else if(d.dep)depBuy(d.dep);else if(d.depcos){ctab='cos';renderMenu()}
  else if(d.abl)ablBuy(d.abl);else if(d.ablall){ablAll=!ablAll;renderMenu()}else if(d.ablsort){ablSort=d.ablsort;renderMenu()}
  else if(d.chc)chClaim(d.chw,d.chc);else if(d.ach)achClaim(d.ach);else if(d.exch)exchDo(d.exch);else if(d.sell)sellDupes();else if(d.cosb)cosBuy(d.cosb);else if(d.cosu)cosUse(d.cosu);
  else if(d.badge){club.badge=d.badge;saveClub();renderMenu()}});
function chalHTML(){const c=chState(),row=(x,P0,w)=>{const d=P0.find(q=>q.id===x.id);if(!d)return'';const done=x.v>=d.v;
  return `<div class="chi"><span><b>${d.n}</b> <em>${x.v.toLocaleString()} / ${d.v.toLocaleString()}</em></span>${x.claimed?'<span class="flash">Claimed ✓</span>':`<button class="btn ${done?'gold':''}" data-chc="${x.id}" data-chw="${w}" ${done?'':'disabled'}>${done?'Claim ':''}${grantPreview(d.r)}</button>`}<div class="prog"><i style="width:${Math.round(100*Math.min(1,x.v/d.v))}%"></i></div></div>`};
  return `<div class="twocol"><div class="panel"><h4>Daily challenges</h4><p class="hint">New ones every day. Progress from both modes counts.</p><div class="chl">${c.d.map(x=>row(x,DAILY,'d')).join('')}</div></div>
    <div class="panel"><h4>Weekly challenges</h4><p class="hint">New ones every Monday-ish.</p><div class="chl">${c.w.map(x=>row(x,WEEKLY,'w')).join('')}</div></div></div>`}
const grantPreview=r=>[r.coins&&`${r.coins.toLocaleString()} coins`,r.tt&&`${r.tt} TT`,r.cp&&`${r.cp} CP`,r.pack&&PACKS.find(k=>k.id===r.pack).name,r.cos&&COS.find(c=>c.id===r.cos).name].filter(Boolean).join(' + ');
function achHTML(){const A=club.ach||{};return `<div class="panel"><h4>Achievements · ${Object.keys(A).length} of ${ACH.length}</h4><p class="hint">Claim each one once. Claimed achievements show as badges in your Trophy Cabinet.</p><div class="achg">${ACH.map(a=>{const done=achDone(a),pr=a.p?a.p():null;
  return `<div class="ach ${A[a.id]?'claimed':done?'done':''}"><b>${a.n}</b><span class="hint" style="margin:0">${a.d}</span>${pr&&!A[a.id]?`<div class="prog"><i style="width:${Math.round(100*Math.min(1,pr[0]/pr[1]))}%"></i></div><span class="hint" style="margin:0">${Math.min(pr[0],pr[1])} / ${pr[1]}</span>`:''}<span style="color:var(--sun)">${grantPreview(a.r)}</span>${!A[a.id]&&done?`<button class="btn gold" data-ach="${a.id}">Claim</button>`:''}</div>`}).join('')}</div></div>`}
function legHTML(){const L=club.leg||{xp:0,lvl:0},need=legNeed(L.lvl),nx=legReward(L.lvl+1);
  return `<div class="panel"><h4>Club Legacy · Level ${L.lvl}</h4><p>${L.xp.toLocaleString()} / ${need.toLocaleString()} XP</p><div class="prog"><i style="width:${Math.round(100*L.xp/need)}%"></i></div>
   <p>Next reward: <b>${grantPreview(nx)}</b></p><p class="hint">Every match earns Club XP, win or lose, in both modes, plus big chunks for league seasons. Each level pays out automatically. Milestones: Gold Pack every 5 levels, Premium Pack every 10, Elite Pack at 15 and 35, an Icon Pack at 25 and 50.</p>
   <h4 style="margin-top:8px">Coming up</h4>${[1,2,3,4,5].map(i=>`<p>Level ${L.lvl+i}: ${grantPreview(legReward(L.lvl+i))}</p>`).join('')}
   ${(club.legLog||[]).length?`<h4 style="margin-top:8px">Recent</h4>${club.legLog.slice(0,6).map(x=>`<p class="hint" style="margin:2px 0">${esc(x)}</p>`).join('')}`:''}</div>`}
function exchHTML(){const tot=Object.values(club.dupes||{}).reduce((a,b)=>a+b,0),val=Object.entries(club.dupes||{}).reduce((a,[id,n])=>a+(byId(id)?TIERS[tier(byId(id))].sell*n:0),0);
  return `<div class="panel"><h4>Duplicates · ${tot}</h4><p>${RAR.map(r=>`${TIERS[r].name}: ${dupCount(r)}`).join(' · ')}</p>${tot?`<button class="btn" data-sell="1">Quick-sell all for ${val.toLocaleString()} coins</button>`:'<p class="hint">Duplicates from packs land here.</p>'}</div>
   <div class="achg" style="margin-top:8px">${EXCH.map(x=>{const ok=Object.entries(x.need).every(([r,n])=>dupCount(r)>=n)&&club.coins>=x.coins;
    return `<div class="ach ${ok?'done':''}"><b>${x.n}</b><span>Hand in: ${Object.entries(x.need).map(([r,n])=>`${n} ${TIERS[r].name} duplicate${n>1?'s':''} (${dupCount(r)})`).join(' + ')}${x.coins?` + ${x.coins.toLocaleString()} coins`:''}</span><span style="color:var(--sun)">You get: ${grantPreview(x.out)}</span><button class="btn gold" data-exch="${x.id}" ${ok?'':'disabled'}>Exchange</button></div>`}).join('')}</div>`}
// one row per footballer: his special, level, cooldown now and next, the price, and the button
let ablAll=false,ablSort='lvl';
function ablRow(p){const sp=p.sp,L=ablOf(p.id),max=L>=ABMAX,now=cdSecs(sp,L),nx=max?now:cdSecs(sp,L+1),c=max?0:ABCOST[L-1],can=!max&&club.coins>=c&&(club.tt||0)>=ABTT;
  return `<tr><td>${esc(p.name)} <span class="hint" style="font-size:11px">${effOvr(p)}</span></td><td><b style="color:var(--sun)">${SPECIALS[sp].name}</b></td>
    <td><div class="ablv">${[...Array(ABMAX)].map((_,i)=>`<i class="${i<L?'on':''}"></i>`).join('')}</div><span class="hint" style="font-size:11px">Level ${L}</span></td>
    <td>${now.toFixed(1)}s</td><td>${max?'—':nx.toFixed(1)+'s'}</td><td>${max?'—':'<span class="flash">−'+(now-nx).toFixed(1)+'s</span>'}</td>
    <td>${max?'<b class="maxl">MAX LEVEL</b>':`<button class="btn ${can?'gold':''}" data-abl="${p.id}" ${can?'':'disabled'}>${c.toLocaleString()} coins + ${ABTT} TT</button>`}</td></tr>`}
function ablPanel(p){const L=ablOf(p.id),max=L>=ABMAX,sp=p.sp,now=cdSecs(sp,L),nx=max?now:cdSecs(sp,L+1),c=max?0:ABCOST[L-1];
  return `<div class="panel"><h4>Special ability · ${SPECIALS[sp].name} · Level ${L}/${ABMAX}</h4><div class="ablv">${[...Array(ABMAX)].map((_,i)=>`<i class="${i<L?'on':''}"></i>`).join('')}</div>
    <p>Cooldown ${now.toFixed(1)}s${max?' · <b class="maxl">MAX LEVEL</b>':` → ${nx.toFixed(1)}s at level ${L+1} (−${(now-nx).toFixed(1)}s)`}</p>
    ${max?'':`<button class="btn gold" data-abl="${p.id}" ${club.coins>=c&&(club.tt||0)>=ABTT?'':'disabled'}>Upgrade · ${c.toLocaleString()} coins + ${ABTT} Training Tokens</button>`}
    <p class="hint">Only this footballer’s ${SPECIALS[sp].name} gets faster. Level 1 → 10 costs 43,500 coins and 18 Training Tokens in total.</p></div>`}
function ablHTML(){const own=ownedPlayers().filter(p=>SPECIALS[p.sp]),sorts={lvl:(a,b)=>ablOf(b.id)-ablOf(a.id)||effOvr(b)-effOvr(a),ovr:(a,b)=>effOvr(b)-effOvr(a),name:(a,b)=>a.name.localeCompare(b.name),ab:(a,b)=>SPECIALS[a.sp].name.localeCompare(SPECIALS[b.sp].name)||effOvr(b)-effOvr(a)};
  const list=own.sort(sorts[ablSort]||sorts.lvl),shown=ablAll?list:list.slice(0,25);
  const tiers=[['Through Ball',ABTIER.through],['Curler, Knuckleball, Rocket, Bicycle Kick, Interceptor',ABTIER.curler],['Turbo, Chip Pass, Chip',ABTIER.turbo]];
  return `<div class="panel"><h4>Special Ability Development</h4><p>You have <b>${club.coins.toLocaleString()}</b> coins and <b>${club.tt||0}</b> Training Tokens. Every level costs 2 Training Tokens; coins rise from 500 to 13,000.</p>
    <p class="hint">${tiers.map(([n,T])=>`${n}: ${T[0]}s at level 1 → ${T[1]}s at level 10`).join(' · ')}</p>
    <div class="subtabs" style="justify-content:flex-start;margin:6px 0">${[['lvl','Level'],['ovr','Rating'],['ab','Ability'],['name','Name']].map(([k,n])=>`<button data-ablsort="${k}" aria-pressed="${ablSort===k}">Sort: ${n}</button>`).join('')}</div>
    <div class="ltwrap"><table class="lt abt"><tr><th>Footballer</th><th>Ability</th><th>Level</th><th>Cooldown</th><th>Next</th><th>Saves</th><th></th></tr>${shown.map(ablRow).join('')}</table></div>
    ${list.length>25?`<button class="ghost" data-ablall="1" style="margin-top:6px">${ablAll?'Show fewer':'Show all '+list.length}</button>`:''}</div>`}
const BADGES=['⚽','🦁','🦅','🐺','⭐','🔥','👑','⚡','🌊','🛡️','🐉','🌟'];
function cosHTML(){const groups=[['pitch','Pitch'],['theme','Stadium lighting'],['stad','Stadium'],['boards','Advertising boards'],['kitx','Kit']];
  return `<div class="panel"><h4>Club Points: ${res().cp.toLocaleString()}</h4><p class="hint">Earned from league seasons and the World Club Championship. Cosmetic only: nothing here changes how matches play.</p>
   <div class="lab">CLUB BADGE</div><div class="forms">${BADGES.map(b=>`<button data-badge="${b}" aria-pressed="${(club.badge||'⚽')===b}">${b}</button>`).join('')}</div></div>`+
   groups.map(([k,n])=>`<div class="panel" style="margin-top:8px"><h4>${n}</h4><div class="cosg">${COS.filter(c=>c.k===k).map(c=>{const o=cosOwned(c.id),on=cosOn(k)===c.id;
    return `<div class="ach ${on?'claimed':''}"><b>${c.name}</b>${on?'<span class="flash">In use</span>':o?`<button class="btn" data-cosu="${c.id}">Use</button>`:c.win?'<span class="hint" style="margin:0">Earned through achievements</span>':`<button class="btn gold" data-cosb="${c.id}" ${club.cp<c.cp?'disabled':''}>Buy · ${c.cp} CP</button>`}</div>`}).join('')}</div></div>`).join('')}
function cabHTML(){const T=club.trophies||{},items=[];for(const m of ['volta','classical'])for(let d=0;d<5;d++)if(T['lg_'+m+'_'+d])items.push([`🏆`,`${DIVS[d].n} (${m==='volta'?'Volta':'Classical'})`,T['lg_'+m+'_'+d]]);
  for(const m of ['volta','classical'])if(T['wcc_'+m])items.push(['🌍',`World Club Champions (${m==='volta'?'Volta':'Classical'})`,T['wcc_'+m]]);
  for(const k in CUPS)if(T[k])items.push(['🥇',CUPS[k],T[k]]);if(T.tour)items.push(['🏅','Grand Tournament',T.tour]);
  const A=club.ach||{};
  return `<div class="panel"><h4>${club.badge||'⚽'} ${esc(club.name||'My Club')} · Trophy Cabinet</h4><div class="cabinet">${items.map(([e,n,c])=>`<div class="troph"><b>${e}</b>${esc(n)}<br><span class="flash">×${c}</span></div>`).join('')||'<p class="hint">Win something and it lives here forever.</p>'}</div></div>
   <div class="panel" style="margin-top:8px"><h4>Badges</h4><div class="cabinet">${ACH.filter(a=>A[a.id]).map(a=>`<div class="troph"><b>🎖️</b>${esc(a.n)}</div>`).join('')||'<p class="hint">Claimed achievements show here.</p>'}</div></div>
   <div class="panel" style="margin-top:8px"><h4>Club history</h4><p>${stv('matches')} matches · ${stv('wins')} wins · ${stv('goals')} goals · ${stv('cleans')} clean sheets · ${stv('titles')} league titles · ${stv('promos_volta')+stv('promos_classical')} promotions</p>
   ${(club.hist||[]).slice(0,20).map(h=>`<p class="hint" style="margin:2px 0">${h.m==='volta'?'Volta':'Classical'} season ${h.season} · ${DIVS[h.div].n}: ${ordinal(h.pos)} with ${h.pts} pts${h.note?' · '+esc(h.note):''}</p>`).join('')}</div>`}
