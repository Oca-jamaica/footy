'use strict';
document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();const msg=document.getElementById('msg'),go=document.getElementById('go');
  go.disabled=true;msg.textContent='Checking…';
  try{const r=await fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({user:document.getElementById('u').value.trim(),password:document.getElementById('p').value,code:document.getElementById('c').value.trim()})});
    const d=await r.json().catch(()=>({}));if(r.ok){location.href='/admin';return}msg.textContent=d.error||('Sign-in failed ('+r.status+')')}
  catch(err){msg.textContent='Can’t reach the dashboard server.'}
  document.getElementById('p').value='';go.disabled=false});
