'use strict';
// Dashboard page. Everything shown comes from the server's API; every change goes through a confirmation with a
// reason (and your password again for the sensitive ones), and the server checks your role before doing anything.
// Player-supplied text is only ever inserted as text, never as HTML.
let ME=null,CSRF='',TAB='overview',timer=null,clubOpen='';
const $=s=>document.querySelector(s);
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs||{})){if(v==null||v===false)continue;
    if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v)}
  for(const k of kids.flat(9)){if(k==null||k===false)continue;e.append(k instanceof Node?k:document.createTextNode(String(k)))}return e}
async function api(path,body){const r=await fetch(path,body?{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':CSRF},body:JSON.stringify(body)}:{credentials:'same-origin'});
  if(r.status===401){location.href='/';throw new Error('Signed out')}const d=await r.json().catch(()=>({error:'Unexpected reply ('+r.status+')'}));if(!r.ok)throw new Error(d.error||('Error '+r.status));return d}
const RANK={viewer:1,moderator:2,admin:3},can=l=>ME&&RANK[ME.role]>=RANK[l];
function flash(t,bad){const f=$('#flash');f.textContent=t||'';f.className=t?('on'+(bad?' bad':'')):'';if(t&&!bad)setTimeout(()=>{if(f.textContent===t){f.textContent='';f.className=''}},6000)}
const ago=t=>{if(!t)return'never';const s=Math.round((Date.now()-t)/1000);return s<5?'just now':s<60?s+'s ago':s<3600?Math.round(s/60)+' min ago':s<86400?Math.round(s/3600)+' h ago':Math.round(s/86400)+' d ago'};
const when=t=>t?new Date(t).toLocaleString():'';
const dur=s=>s<60?s+'s':s<3600?Math.floor(s/60)+'m '+(s%60)+'s':Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m';
const STN={menu:'In menus',match:'Playing the computer',pens:'Penalty shoot-out',online:'In an online match',search:'Searching for a match',lobby:'In a private lobby',idle:'Tab in background'};
const MDN={volta:'Volta',classical:'Classical',expanded:'Classical Expanded'};
const CAT={cheating:'Cheating',name:'Offensive name',abuse:'Abuse / harassment',other:'Other'};
const chip=(t,c)=>h('span',{class:'chip '+(c||'')},t);
const clubLink=(rid,label)=>rid?h('button',{class:'link',onclick:()=>{clubOpen=rid;show('clubs')}},label||rid):h('span',{class:'mute'},label||'unknown');
function table(cols,rows,empty){return h('div',{class:'tw'},h('table',{},h('tr',{},cols.map(c=>h('th',{},c))),rows.length?rows.map(r=>h('tr',{},r.map(c=>h('td',{},c)))):h('tr',{},h('td',{colspan:cols.length,class:'mute'},empty||'Nothing yet.'))))}

// ---------------------------------------------------------------- confirmation dialog
function confirmAction({title,lines,danger,password,fields}){return new Promise(done=>{const m=$('#modal');
    const reason=h('textarea',{maxlength:500,placeholder:'Why? (saved in the audit log)'}),pw=password?h('input',{type:'password',autocomplete:'current-password'}):null;
    const ok=h('input',{type:'checkbox'}),err=h('p',{class:'err'}),go=h('button',{class:danger?'danger':'',disabled:true},'Confirm');
    const check=()=>{go.disabled=!(ok.checked&&reason.value.trim().length>=5&&(!pw||pw.value.length>0))};[reason,ok].forEach(x=>x.addEventListener('input',check));if(pw)pw.addEventListener('input',check);
    const close=v=>{m.hidden=true;m.textContent='';document.removeEventListener('keydown',esc);done(v)};const esc=e=>{if(e.key==='Escape')close(null)};document.addEventListener('keydown',esc);
    go.addEventListener('click',()=>close({reason:reason.value.trim(),password:pw?pw.value:undefined,confirm:true}));
    m.textContent='';m.append(h('div',{class:'dlg',role:'dialog','aria-modal':'true','aria-label':title},h('h3',{},title),h('ul',{},lines.map(l=>h('li',{},l))),fields||null,
      h('label',{},'Reason (required, at least 5 characters)',reason),pw?h('label',{},'Your password (needed for this action)',pw):null,
      h('label',{class:'chk'},ok,'I’ve checked the details above'),err,h('div',{class:'btns'},h('button',{class:'ghost',onclick:()=>close(null)},'Cancel'),go)));
    m.hidden=false;reason.focus()})}
async function act(path,body,opts){const c=await confirmAction(opts);if(!c)return null;try{const r=await api(path,{...body,...c});flash('Done: '+opts.title);await render();return r}catch(e){flash(e.message,true);return null}}

// ---------------------------------------------------------------- views
const TABS=[['overview','Overview'],['live','Players & matches'],['clubs','Clubs'],['reports','Reports'],['problems','Problems'],['susp','Suspensions & appeals'],['corr','Corrections'],['ops','Maintenance & announcements'],['audit','Audit log']];
let counts={};
function nav(){const n=$('#tabs');n.textContent='';for(const [k,l] of TABS){const c=k==='reports'?counts.reports:k==='problems'?counts.problems:k==='susp'?counts.appeals:0;
  n.append(h('button',{'aria-pressed':String(TAB===k),onclick:()=>show(k)},l,c?h('span',{class:'n'},c):null))}}
function show(k){TAB=k;nav();render()}
async function render(){clearTimeout(timer);const v=$('#view');let out;
  try{out=await VIEWS[TAB]()}catch(e){out=h('p',{class:'mute'},e.message)}
  v.textContent='';v.append(out);if(TAB==='overview'||TAB==='live')timer=setTimeout(render,5000)}
const VIEWS={
  async overview(){const s=await api('/api/state');counts=s.open;nav();const up=s.relays.filter(r=>r.up).length;
    return h('div',{},
      s.maint.on?h('p',{class:'panel'},chip('Maintenance mode is ON','bad'),' ',s.maint.msg):null,
      up?null:h('p',{class:'panel'},chip('Not connected to any relay','bad'),' The dashboard can’t see players or reach them until a relay connects. Check this computer’s internet connection.'),
      h('div',{class:'grid'},
        [[s.live.players,'Players online now','game pages that sent a heartbeat in the last minute'],[s.matches.length,'Online matches in progress',''],
         [Object.values(s.queues).reduce((a,q)=>a+q.searching,0),'Searching in matchmaking','from the live matchmaking queues'],[s.lobbies.length,'In private lobbies',''],
         [s.clubs.directory,'Clubs in the directory',s.clubs.directoryActive24h+' updated in the last 24 h'],[s.clubs.seen24h,'Clubs seen in 24 h','by heartbeat'],
         [s.open.reports,'Open player reports',''],[s.open.problems,'Open problem reports',''],[s.open.appeals,'Appeals waiting',''],[s.open.suspensions,'Active suspensions','']]
        .map(([n,l,sub])=>h('div',{class:'card'},h('div',{class:'big'},n),h('div',{class:'lbl'},l),sub?h('div',{class:'note'},sub):null))),
      h('h2',{},'Players by activity'),table(['Activity','Players'],Object.entries(s.live.byState).map(([k,n])=>[STN[k]||k,n]),'Nobody online right now.'),
      h('h2',{},'Relays'),h('p',{class:'note'},'The game talks through these public relays. The dashboard reads player messages and publishes its signed control message on each one.'),
      table(['Relay','Status','Messages','Control published'],s.relays.map(r=>[r.name,r.up?chip('connected','ok'):chip('down','bad'),r.msgs,r.ctlAt?ago(r.ctlAt):(r.err||'not yet')])),
      h('p',{class:'note'},`Signed control message #${s.ctl.seq} (${s.ctl.bytes} bytes). Server keys created ${when(Date.parse(s.keys.created))}. Updated ${new Date(s.t).toLocaleTimeString()}.`))},
  async live(){const s=await api('/api/state');counts=s.open;nav();
    return h('div',{},
      h('h2',{},`Online matches (${s.matches.length})`),table(['Players','Type','Pitch','Score','Clock','Ping','Route','Running'],s.matches.map(m=>[
        h('div',{},m.players.map(p=>h('div',{},clubLink(p.rid,p.nm||'?'),' ',h('span',{class:'mute'},(p.mg?p.mg+' · ':'')+(p.role||''))))),m.kind,MDN[m.fmt]||m.fmt,m.sc?m.sc.join(' – '):'',m.clk?dur(m.clk):'',m.rtt?m.rtt+' ms':'',m.rt||'',dur(Math.round((s.t-m.since)/1000))]),'No online matches right now.'),
      h('h2',{},'Matchmaking queues'),table(['Queue','Searching now','Being paired'],Object.entries(s.queues).filter(([,q])=>q.searching).map(([k,q])=>{const [a,b]=k.split('-');return[`${a[0].toUpperCase()+a.slice(1)} · ${MDN[b]}`,q.searching,q.pairing]}),'Nobody searching.'),
      h('h2',{},`Private lobbies (${s.lobbies.length})`),table(['Club','Manager','Role','Pitch','Waiting'],s.lobbies.map(l=>[clubLink(l.rid,l.nm),l.mg,l.role==='host'?'hosting':'joining',MDN[l.fmt]||l.fmt,dur(l.waiting)]),'No open lobbies.'),
      h('h2',{},`Players online (${s.live.players})`),table(['Club','Manager','Doing','Mode','Level','For','Version'],s.live.list.map(p=>[clubLink(p.rid,p.nm),p.mg,STN[p.st]||p.st,MDN[p.md]||p.md,p.lv,dur(p.for),p.ver]),'Nobody online right now.'),
      h('h2',{},'Recent online results'),await matchesTable(15))},
  async clubs(){const box=h('div',{});const q=h('input',{placeholder:'Search club, manager or id',value:''}),res=h('div',{});
    const run=async()=>{const d=await api('/api/clubs?q='+encodeURIComponent(q.value.trim()));res.textContent='';
      res.append(h('p',{class:'note'},`${d.total} clubs known (public directory plus heartbeats). Showing ${d.clubs.length}.`),
        table(['Club','Manager','Team','Played','Last seen',''],d.clubs.map(c=>[clubLink(c.rid,c.nm||c.rid),c.mg,c.team||'',c.played,ago(c.last),c.susp?chip('suspended','bad'):'']),'No clubs match.'))};
    q.addEventListener('keydown',e=>{if(e.key==='Enter')run()});box.append(h('div',{class:'row'},h('label',{},'Find a club',q),h('button',{onclick:run},'Search')),res);
    if(clubOpen)box.prepend(await clubDetail(clubOpen));await run();return box},
  async reports(){const d=await api('/api/reports');return h('div',{},h('p',{class:'note'},'Sent by players from View Squad or after an online match. The sender’s identity is what their game reported, so treat it as a lead, not proof.'),
      table(['When','From','About','Category','What they said','Status',''],d.reports.map(r=>[ago(r.at),h('span',{},r.from.nm||'?',h('br'),h('span',{class:'mute'},r.from.mg||'')),
        h('span',{},clubLink(r.target.rid,r.target.nm||r.target.rid),h('br'),h('span',{class:'mute'},r.target.mg||'')),CAT[r.cat]||r.cat,h('div',{class:'long'},r.txt||h('span',{class:'mute'},'(no text)'),h('div',{class:'note'},'from '+r.ctx)),
        h('span',{},chip(r.status,r.status==='open'?'warn':''),r.note?h('div',{class:'note'},`${r.by}: ${r.note}`):null),
        can('moderator')?h('div',{class:'acts'},['reviewed','dismissed','actioned'].filter(x=>x!==r.status).map(st=>h('button',{class:'ghost',onclick:()=>act('/api/report/'+r.id,{status:st},{title:`Mark report as ${st}`,lines:[`Report about ${r.target.nm||r.target.rid}`,`From ${r.from.nm||'?'}: ${CAT[r.cat]}`]})},st)),
          r.target.rid?h('button',{class:'ghost',onclick:()=>{clubOpen=r.target.rid;show('clubs')}},'Open club'):null):''] ),'No reports.'))},
  async problems(){const d=await api('/api/problems');return h('div',{},table(['When','From','Type','Details','Game info','Status',''],d.problems.map(p=>[ago(p.at),h('span',{},p.from.nm||'?',h('br'),h('span',{class:'mute'},p.from.mg||'')),
      (p.auto?'Automatic error report':({bug:'Bug',online:'Online / connection',performance:'Performance',account:'Account / save',other:'Other'})[p.cat]||p.cat),h('div',{class:'long'},p.txt||h('span',{class:'mute'},'(no text)')),
      h('div',{class:'note'},`version ${p.info.ver||'?'} · ${STN[p.info.st]||''} ${MDN[p.info.md]||''} ${p.info.rt?'· '+p.info.rt:''}`,p.info.errs.length?h('pre',{},p.info.errs.join('\n')):null),
      h('span',{},chip(p.status,p.status==='open'?'warn':''),p.note?h('div',{class:'note'},`${p.by}: ${p.note}`):null),
      can('moderator')?h('div',{class:'acts'},['investigating','resolved','not-a-bug'].filter(x=>x!==p.status).map(st=>h('button',{class:'ghost',onclick:()=>act('/api/problem/'+p.id,{status:st},{title:`Mark problem as ${st}`,lines:[`${p.from.nm||'?'}: ${(p.txt||'').slice(0,80)}`]})},st))):'']),'No problem reports.'))},
  async susp(){const d=await api('/api/suspensions');return h('div',{},
      h('p',{class:'note'},'A suspended club can’t search, host or join online matches, and other players’ games hide it from matchmaking and the leaderboard. To suspend a club, open it under Clubs.'),
      table(['Club','Why','From','Until','By / reason','Appeal','Status',''],d.suspensions.map(s=>[clubLink(s.rid,s.nm||s.rid),CAT[s.cat]||s.cat,when(s.at),when(s.until),h('span',{},s.by,h('div',{class:'note long'},s.reason)),
        s.appeal?h('div',{class:'long'},s.appeal.txt,h('div',{class:'note'},`${s.appeal.status} · ${ago(s.appeal.at)}${s.appeal.note?` · ${s.appeal.by}: ${s.appeal.note}`:''}`)):h('span',{class:'mute'},'none'),
        s.active?chip('active','bad'):chip(s.status),
        s.active&&can('moderator')?h('div',{class:'acts'},h('button',{class:'ghost',onclick:()=>act(`/api/suspension/${s.id}/lift`,{},{title:'Lift suspension',lines:[`Club: ${s.nm}`,s.appeal&&s.appeal.status==='pending'?'This also accepts their appeal.':'The club can play online again straight away.']})},s.appeal&&s.appeal.status==='pending'?'Accept appeal & lift':'Lift'),
          s.appeal&&s.appeal.status==='pending'?h('button',{class:'ghost',onclick:()=>act(`/api/suspension/${s.id}/uphold`,{},{title:'Reject appeal (keep suspension)',lines:[`Club: ${s.nm}`,`Suspended until ${when(s.until)}`]})},'Reject appeal'):null):'']),'No suspensions.'))},
  async corr(){const d=await api('/api/corrections');return h('div',{},
      h('p',{class:'note'},'Corrections change one player’s coins or Training Tokens. Each one is signed by this server, applied once by that player’s game, and kept in the audit log. To make one, open the club under Clubs.'),
      table(['When','Club','Coins','Training Tokens','Message to player','By / reason','Status',''],d.corrections.map(g=>[when(g.at),clubLink(g.rid,g.nm||g.rid),g.coins,g.tt,g.msg,h('span',{},g.by,h('div',{class:'note long'},g.reason)),
        h('span',{},chip(g.status,g.status==='applied'?'ok':g.status==='pending'?'warn':''),g.appliedAt?h('div',{class:'note'},'reported '+ago(g.appliedAt)):null),
        g.status==='pending'&&can('admin')?h('button',{class:'ghost',onclick:()=>act(`/api/correction/${g.id}/cancel`,{},{title:'Cancel correction',lines:[`Club: ${g.nm}`,`Coins ${g.coins}, Training Tokens ${g.tt}`,'Only stops it for games that haven’t applied it yet.']})},'Cancel'):'']),'No corrections yet.'))},
  async ops(){const s=await api('/api/state');const box=h('div',{});
    const msg=h('input',{maxlength:200,value:s.maint.msg||'',placeholder:'Online play is paused for maintenance. Please try again soon.'});
    box.append(h('h2',{},'Maintenance mode'),h('div',{class:'panel'},
      h('p',{},s.maint.on?chip('ON','bad'):chip('off','ok'),s.maint.since?h('span',{class:'note'},` changed ${ago(s.maint.since)} by ${s.maint.by}`):null),
      h('p',{class:'note'},'While on, nobody can start, search for, host or join an online match. Matches already being played carry on. Single-player is never affected.'),
      can('admin')?h('div',{},h('label',{},'Message players see',msg),h('div',{class:'row'},
        s.maint.on?h('button',{onclick:()=>act('/api/maintenance',{on:false},{title:'Turn maintenance mode OFF',lines:['Online play opens again for everyone.'],password:true})},'Turn off')
          :h('button',{class:'danger',onclick:()=>act('/api/maintenance',{on:true,msg:msg.value},{title:'Turn maintenance mode ON',lines:['Blocks new online matches for every player.',`Message: “${msg.value||msg.placeholder}”`],danger:true,password:true})},'Turn on'))):h('p',{class:'note'},'Only an admin can change this.')));
    const at=h('input',{maxlength:220,placeholder:'e.g. New season starts Friday!'}),lvl=h('select',{},h('option',{value:'info'},'Info'),h('option',{value:'warn'},'Important')),hrs=h('input',{type:'number',min:0,max:720,value:24});
    box.append(h('h2',{},'Announcements'),h('p',{class:'note'},'Shown at the top of every player’s menu (up to 3 at once).'),
      table(['Text','Level','Ends',''],s.ann.map(a=>[a.text,a.lvl,a.until?when(a.until):'when removed',can('moderator')?h('button',{class:'ghost',onclick:()=>act(`/api/announce/${a.id}/remove`,{},{title:'Remove announcement',lines:[`“${a.text}”`]})},'Remove'):'']),'No announcements.'),
      can('moderator')?h('div',{class:'panel'},h('div',{class:'row'},h('label',{},'New announcement',at),h('label',{},'Level',lvl),h('label',{},'Hours (0 = until removed)',hrs)),
        h('button',{onclick:()=>{if(at.value.trim().length<3){flash('Write the announcement first.',true);return}act('/api/announce',{text:at.value,lvl:lvl.value,hours:+hrs.value},{title:'Publish announcement',lines:[`“${at.value.trim()}”`,`${lvl.value==='warn'?'Important':'Info'}, ${+hrs.value?hrs.value+' hours':'until removed'}`,'Every player sees it.']})}},'Publish')):null);
    return box},
  async audit(){const d=await api('/api/audit?n=500');return h('div',{},
      h('p',{},d.chain.ok?chip(`audit log intact (${d.chain.lines} entries)`,'ok'):chip(`audit log altered near entry ${d.chain.line}`,'bad')),
      table(['When','Who','Action','Target','Details','Reason'],d.entries.map(e=>[new Date(e.at).toLocaleString(),`${e.admin} (${e.role})`,e.action,e.target,h('pre',{},Object.keys(e.details||{}).length?JSON.stringify(e.details):''),h('div',{class:'long'},e.reason)]),'Nothing logged yet.'))}};
async function matchesTable(n){const d=await api('/api/matches');return table(['Finished','Type','Pitch','Host','Score','Joined',''],d.matches.slice(0,n||200).map(m=>[ago(m.at),m.kind,MDN[m.fmt]||m.fmt,
  m.host?clubLink(m.host.rid,m.host.nm):'?',m.sc?m.sc.join(' – '):'',m.guest?clubLink(m.guest.rid,m.guest.nm):'?',m.disagree?chip('scores disagree','warn'):m.by.length<2?chip('one side reported',''):chip('both confirmed','ok')]),'No results yet.')}
async function clubDetail(rid){const c=await api('/api/club/'+rid);const p=c.profile,name=(p&&p.n)||(c.seen&&c.seen.nm)||rid;const box=h('div',{class:'panel'});
  const close=h('button',{class:'ghost',onclick:()=>{clubOpen='';render()}},'Close');
  const active=c.suspensions.find(s=>s.status==='active'&&(!s.until||s.until>Date.now()));
  box.append(h('div',{class:'row'},h('h2',{},name),close),
    h('p',{},`Manager: ${(p&&p.mg)||(c.seen&&c.seen.mg)||'not given'} · id ${rid} · `,c.live?chip('online now','ok'):chip('offline'),active?[' ',chip('suspended until '+when(active.until),'bad')]:null),
    p?h('p',{class:'note'},`Volta team ${p.sq.volta.r} · Classical team ${p.sq.classical.r} · played ${p.pl} · Volta ${p.rk.volta.pd?p.rk.volta.rp+' RP':'unranked'} (${p.rk.volta.w}-${p.rk.volta.d}-${p.rk.volta.l}) · Classical ${p.rk.classical.pd?p.rk.classical.rp+' RP':'unranked'} (${p.rk.classical.w}-${p.rk.classical.d}-${p.rk.classical.l}) · profile updated ${ago(p.t)}`):h('p',{class:'note'},'Not in the public directory.'),
    c.seen?h('p',{class:'note'},`Heartbeats: first ${when(c.seen.first)}, last ${ago(c.seen.last)}, ${c.seen.sessions} sessions, ${c.seen.devices} game save${c.seen.devices===1?'':'s'} linked${c.seen.devices>1?' (more than one save claims this club: corrections are disabled)':''}.`):h('p',{class:'note'},'This club’s game hasn’t sent a heartbeat (live status off, or not seen since the server started).'));
  if(can('moderator')&&!active){const days=h('input',{type:'number',min:1,max:365,value:7}),cat=h('select',{},Object.entries(CAT).map(([k,v])=>h('option',{value:k},v)));
    box.append(h('h3',{},'Suspend from online play'),h('div',{class:'row'},h('label',{},'Days (1–365)',days),h('label',{},'Category (shown to the player)',cat),
      h('button',{class:'danger',onclick:()=>act('/api/suspend',{rid,days:+days.value,cat:cat.value},{title:'Suspend club from online play',lines:[`Club: ${name} (${rid})`,`For ${+days.value} day(s), until about ${when(Date.now()+days.value*864e5)}`,`Category shown to them: ${CAT[cat.value]}`,'They can still play single-player and can appeal.'],danger:true,password:true})},'Suspend…')))}
  if(can('admin')){const coins=h('input',{type:'number',min:-1000000,max:1000000,value:0}),tt=h('input',{type:'number',min:-1000,max:1000,value:0}),msg=h('input',{maxlength:140,placeholder:'Shown to the player, e.g. Refund for the lost match'});
    box.append(h('h3',{},'Progression correction'),h('p',{class:'note'},'Adds (or with a minus, removes) coins or Training Tokens. Applied once, by this player’s own game, the next time it is online in the next 14 days. A removal never takes a balance below zero.'),
      h('div',{class:'row'},h('label',{},'Coins',coins),h('label',{},'Training Tokens',tt),h('label',{},'Message to the player',msg),
        h('button',{onclick:()=>{const c1=Math.round(+coins.value)||0,t1=Math.round(+tt.value)||0;if(!c1&&!t1){flash('Enter a coin or Training Token change.',true);return}
          act('/api/correction',{rid,coins:c1,tt:t1,msg:msg.value},{title:'Send progression correction',lines:[`Club: ${name} (${rid})`,`Coins: ${c1>0?'+':''}${c1}`,`Training Tokens: ${t1>0?'+':''}${t1}`,`Message: “${msg.value||'A correction from the Sunday Kickabout team.'}”`],danger:c1<0||t1<0,password:true})}},'Send correction…')))}
  box.append(h('h3',{},'Suspensions'),table(['From','Until','Status','Reason'],c.suspensions.map(s=>[when(s.at),when(s.until),s.status,s.reason]),'None.'),
    h('h3',{},'Corrections'),table(['When','Coins','TT','Status','Reason'],c.corrections.map(g=>[when(g.at),g.coins,g.tt,g.status,g.reason]),'None.'),
    h('h3',{},'Reports about this club'),table(['When','From','Category','Text','Status'],c.reports.map(r=>[ago(r.at),r.from.nm,CAT[r.cat],r.txt,r.status]),'None.'),
    h('h3',{},'Recent online results'),table(['When','Host','Score','Joined'],c.matches.map(m=>[ago(m.at),m.host?m.host.nm:'?',m.sc?m.sc.join(' – '):'',m.guest?m.guest.nm:'?']),'None.'));
  return box}

(async()=>{try{ME=await api('/api/me');CSRF=ME.csrf}catch(e){return}
  $('#me').textContent=`${ME.user} · ${ME.role}`;
  $('#logout').addEventListener('click',async()=>{try{await api('/api/logout',{})}catch(e){}location.href='/'});
  nav();render()})();
