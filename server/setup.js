#!/usr/bin/env node
// Creates the server's two key pairs.
//   node setup.js            -> writes the private keys to server/secrets/keys.json (never share or commit this)
//                               and the PUBLIC keys to server/public-keys.json (the game build embeds these)
//   node setup.js --force    -> makes new keys (rotation). Rebuild and re-share the game afterwards: copies built
//                               with the old public keys will then ignore the server.
// SECRETS_FILE=/path/keys.json overrides where the private keys go.
'use strict';
const fs=require('node:fs');const path=require('node:path');const {generateKeys,writeSecret}=require('./lib/opscrypto');
const SECRETS=process.env.SECRETS_FILE||path.join(__dirname,'secrets','keys.json');
const PUB=process.env.PUBLIC_KEYS_FILE||path.join(__dirname,'public-keys.json');
if(fs.existsSync(SECRETS)&&!process.argv.includes('--force')){
  console.error(`Keys already exist at ${SECRETS}.\nRun with --force to replace them (then rebuild the game with "node build.mjs" and share the new file).`);process.exit(1)}
const k=generateKeys();writeSecret(SECRETS,k);
fs.writeFileSync(PUB,JSON.stringify({v:1,sig:k.sign.pub,enc:k.enc.pub,created:k.created},null,1)+'\n');
console.log(`Private keys: ${SECRETS} (keep this file private and backed up; it is ignored by git)`);
console.log(`Public keys:  ${PUB} (safe to share; "node build.mjs" puts these into the game file)`);
console.log('Next: add an administrator with "node admin-user.js add <name> admin", then rebuild the game.');
