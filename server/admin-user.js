#!/usr/bin/env node
// Manages dashboard accounts (stored as scrypt hashes in DATA_DIR/admins.json, never in the game file).
//   node admin-user.js add <name> <viewer|moderator|admin>   asks for a password (12+ characters) twice
//   node admin-user.js passwd <name>                         changes a password
//   node admin-user.js role <name> <viewer|moderator|admin>
//   node admin-user.js totp <name>                           turns on authenticator-app codes for that account
//   node admin-user.js totp-off <name>
//   node admin-user.js remove <name>
//   node admin-user.js list
// --password-stdin reads the password from standard input instead of prompting (for scripts).
// Roles: viewer = monitoring only; moderator = + announcements, reports, problems, suspensions and appeals;
//        admin = + maintenance mode and progression corrections.
'use strict';
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {hashPassword,writeSecret,b32encode}=require('./lib/opscrypto');
const DATA=process.env.DATA_DIR||path.join(__dirname,'data'),FILE=path.join(DATA,'admins.json');
const ROLES=['viewer','moderator','admin'];
const load=()=>{try{return JSON.parse(fs.readFileSync(FILE,'utf8'))}catch(e){return{v:1,users:{}}}};
const save=d=>writeSecret(FILE,d);
const [cmd,name,arg]=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const okName=n=>/^[a-z0-9_.-]{2,32}$/i.test(n||'');
function ask(q,hidden){return new Promise(res=>{const rl=require('node:readline').createInterface({input:process.stdin,output:process.stdout,terminal:true});
  if(hidden){rl._writeToOutput=s=>{if(s.includes(q))rl.output.write(q);else rl.output.write('')}}
  rl.question(q,a=>{rl.close();if(hidden)process.stdout.write('\n');res(a)})})}
async function password(){if(process.argv.includes('--password-stdin')){const s=fs.readFileSync(0,'utf8').replace(/\r?\n$/,'');return s}
  const a=await ask('Password (12+ characters): ',true),b=await ask('Same password again: ',true);if(a!==b){console.error('The passwords differ.');process.exit(1)}return a}
(async()=>{const d=load();
  if(cmd==='list'){for(const [n,u] of Object.entries(d.users))console.log(n.padEnd(20),u.role.padEnd(10),u.totp?'with authenticator':'password only');if(!Object.keys(d.users).length)console.log('(no accounts yet)');return}
  if(!okName(name)){console.error('Give an account name: 2-32 letters, numbers, . _ -');process.exit(1)}
  if(cmd==='add'||cmd==='passwd'){if(cmd==='add'&&d.users[name]){console.error('That account exists; use passwd or role.');process.exit(1)}
    if(cmd==='passwd'&&!d.users[name]){console.error('No such account.');process.exit(1)}
    const role=cmd==='add'?arg:d.users[name].role;if(!ROLES.includes(role)){console.error('Role must be one of: '+ROLES.join(', '));process.exit(1)}
    const pw=await password();if(pw.length<12){console.error('Use at least 12 characters.');process.exit(1)}
    d.users[name]={...(d.users[name]||{}),role,hash:hashPassword(pw),changed:new Date().toISOString()};save(d);console.log(`${cmd==='add'?'Added':'Updated'} ${name} (${role}).`)}
  else if(cmd==='role'){if(!d.users[name]||!ROLES.includes(arg)){console.error('Usage: role <name> <'+ROLES.join('|')+'>');process.exit(1)}d.users[name].role=arg;save(d);console.log(`${name} is now ${arg}.`)}
  else if(cmd==='totp'){if(!d.users[name]){console.error('No such account.');process.exit(1)}const sec=b32encode(crypto.randomBytes(20));d.users[name].totp=sec;save(d);
    console.log('Add this to your authenticator app (it is shown once):\n  secret: '+sec+'\n  otpauth://totp/Sunday%20Kickabout%20Admin:'+encodeURIComponent(name)+'?secret='+sec+'&issuer=Sunday%20Kickabout%20Admin')}
  else if(cmd==='totp-off'){if(d.users[name]){delete d.users[name].totp;save(d);console.log('Authenticator codes turned off for '+name)}}
  else if(cmd==='remove'){delete d.users[name];save(d);console.log('Removed '+name)}
  else{console.error('Commands: add, passwd, role, totp, totp-off, remove, list');process.exit(1)}})();
