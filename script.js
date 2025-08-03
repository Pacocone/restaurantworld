// Diagnóstico de registro de usuario: muestra e.code/e.message
let appFB=null, auth=null, db=null;

async function initFirebase(){
  try{
    appFB = firebase.initializeApp(window.FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
    try{ await auth.signInAnonymously(); }
    catch(e){ showMsg('Fallo auth anónima — código: '+(e.code||'?')+' — '+(e.message||'')); }
  }catch(e){
    showMsg('Init Firebase falló — '+(e.code||'?')+' — '+(e.message||''));
  }
}
function showMsg(t){
  const el = document.getElementById('onboardMsg');
  if(el){ el.textContent = t; }
  console.log('[DIAG]', t);
}
function usernameDocId(name){ return (name||'').toLowerCase(); }

async function claimUsername(name){
  try{
    if(!db || !auth) return {ok:false, reason:'not-ready'};
    if(!auth.currentUser){
      try{ await auth.signInAnonymously(); }
      catch(e){ return {ok:false, reason:'auth-failed', code:e.code, msg:e.message}; }
    }
    const id = usernameDocId(name);
    const ref = db.collection('profiles').doc(id);
    const snap = await ref.get();
    if(snap.exists) return {ok:false, reason:'exists'};
    await ref.set({
      username: name,
      restaurants: [],
      ownerUid: auth.currentUser.uid,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return {ok:true};
  }catch(e){
    return {ok:false, reason:'firestore-error', code:e.code, msg:e.message};
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await initFirebase();
  const input = document.getElementById('onboardUsername');
  const btn = document.getElementById('onboardSave');
  const msg = document.getElementById('onboardMsg');

  btn.addEventListener('click', async ()=>{
    const val = (input.value||'').trim();
    if(!val){ msg.textContent = 'Escribe un usuario.'; return; }
    msg.textContent = 'Registrando…';
    const res = await claimUsername(val);
    if(res.ok){ msg.style.color='#0a0'; msg.textContent='OK. Usuario creado.'; return; }
    msg.style.color='#a00';
    msg.textContent = 'Fallo — motivo: '+(res.reason||'?') + (res.code? (' | código: '+res.code):'') + (res.msg? (' | '+res.msg):'');
    console.log('claimUsername', res);
  });

  document.querySelectorAll('#navTabs button').forEach(b=> b.addEventListener('click',()=>{
    document.querySelectorAll('#navTabs button').forEach(x=>x.classList.toggle('active', x===b));
    document.querySelectorAll('.tab').forEach(s=> s.classList.toggle('active', s.id==='tab-'+b.dataset.tab));
  }));
  document.getElementById('themeDark').onclick = ()=> document.documentElement.setAttribute('data-theme','dark');
  document.getElementById('themeLight').onclick= ()=> document.documentElement.setAttribute('data-theme','light');
  document.getElementById('themeAuto').onclick = ()=> document.documentElement.setAttribute('data-theme','auto');
});
