// ===== i18n (ES/EN) =====
const I18N = {
  es: {
    app_title: "🍽️ Mis Restaurantes",
    install_btn: "⬇️ Instalar",
    share_btn: "🔗 Compartir",
    tab_add: "Añadir visita",
    tab_summary: "Resumen",
    tab_history: "Historial",
    tab_explore: "Explorar",
    tab_friends: "Amigos",
    new_visit: "Nueva visita",
    lbl_restaurant: "Restaurante",
    lbl_city: "Ciudad",
    lbl_date: "Fecha",
    lbl_diners: "N.º de comensales",
    lbl_total: "Importe total (€)",
    lbl_avg: "Precio medio / comensal",
    btn_search: "🔎 Buscar",
    lbl_rating: "Valoración (0–5)",
    lbl_notes: "Observaciones",
    lbl_ticket: "Ticket (foto)",
    btn_remove_ticket: "🗑️ Quitar ticket",
    tip_ticket: "Consejo: toma la foto en vertical y comprueba que se lea el total.",
    btn_save_visit: "Guardar visita",
    btn_cancel: "Cancelar",
    filter_by_rest: "Filtrar por restaurante",
    select_city: "Selecciona ciudad",
    btn_view_summary: "Ver resumen",
    my_profile: "Mi perfil",
    username_label: "Usuario:",
    btn_delete_user: "🗑️ Borrar usuario",
    btn_signout: "🚪 Cerrar sesión",
    public_summary_hint: "Resumen público: <strong>restaurante, ciudad, clasificación y precio medio</strong> con enlace a Maps. Las fotos de tickets se guardan solo en tu dispositivo.",
    your_username: "Tu nombre de usuario",
    username_hint: "Elige un nombre público para que tus amigos vean tu resumen.",
    btn_save: "Guardar",
    auth_title: "Acceso",
    auth_subtitle: "Inicia sesión o <strong>crea tu cuenta</strong> con email y contraseña.",
    btn_continue: "Continuar",
    btn_reset: "🔑 Restablecer",
    share_title: "Compartir app",
    share_subtitle: "Comparte este enlace o escanea el QR para abrir la app.",
    btn_copy: "📋 Copiar",
    btn_native_share: "Compartir",
    btn_close: "Cerrar",
    ticket_title: "Ticket"
  },
  en: {
    app_title: "🍽️ My Restaurants",
    install_btn: "⬇️ Install",
    share_btn: "🔗 Share",
    tab_add: "Add visit",
    tab_summary: "Summary",
    tab_history: "History",
    tab_explore: "Explore",
    tab_friends: "Friends",
    new_visit: "New visit",
    lbl_restaurant: "Restaurant",
    lbl_city: "City",
    lbl_date: "Date",
    lbl_diners: "Number of diners",
    lbl_total: "Total amount (€)",
    lbl_avg: "Average price / diner",
    btn_search: "🔎 Search",
    lbl_rating: "Rating (0–5)",
    lbl_notes: "Notes",
    lbl_ticket: "Receipt (photo)",
    btn_remove_ticket: "🗑️ Remove ticket",
    tip_ticket: "Tip: take the photo vertically and make sure the total is legible.",
    btn_save_visit: "Save visit",
    btn_cancel: "Cancel",
    filter_by_rest: "Filter by restaurant",
    select_city: "Select city",
    btn_view_summary: "View summary",
    my_profile: "My profile",
    username_label: "Username:",
    btn_delete_user: "🗑️ Delete username",
    btn_signout: "🚪 Sign out",
    public_summary_hint: "Public summary: <strong>restaurant, city, rating and average price</strong> with a Maps link. Receipt photos are stored only on your device.",
    your_username: "Your username",
    username_hint: "Choose a public name so friends can view your summary.",
    btn_save: "Save",
    auth_title: "Sign in",
    auth_subtitle: "Sign in or <strong>create an account</strong> with email and password.",
    btn_continue: "Continue",
    btn_reset: "🔑 Reset password",
    share_title: "Share app",
    share_subtitle: "Share this link or scan the QR to open the app.",
    btn_copy: "📋 Copy",
    btn_native_share: "Share",
    btn_close: "Close",
    ticket_title: "Receipt"
  }
};

let LANG = localStorage.getItem('lang') || (navigator.language||'es').slice(0,2);
if(!['es','en'].includes(LANG)) LANG='es';
function t(key){
  return (I18N[LANG] && I18N[LANG][key]) || (I18N['es'][key]) || key;
}
function applyI18n(){
  document.documentElement.lang = LANG;
  const nodes = document.querySelectorAll('[data-i18n]');
  nodes.forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(!key) return;
    // Allow innerHTML for hints that contain <strong>
    const val = t(key);
    if(val.includes('<strong>')) el.innerHTML = val;
    else el.textContent = val;
  });
  const sel = document.getElementById('langSelect');
  if(sel) sel.value = LANG;
}

// ==== Firebase init (with LOCAL persistence) ====
let appFB=null, auth=null, db=null;
async function initFirebase(){
  try{
    appFB = firebase.initializeApp(window.FIREBASE_CONFIG || {});
    auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    db = firebase.firestore();
    auth.languageCode = LANG;
    if(!auth.currentUser){
      try{ await auth.signInAnonymously(); }catch(e){ console.warn('Auth anónima falló', e); }
    }
  }catch(e){ console.error('Firebase init error', e); }
}

// ==== Estado local ====
let visits = [];
let myUser = null;

/* ====== A2HS (Add to Home Screen) ====== */
let deferredPrompt = null;
function initA2HS(){
  const btn = document.getElementById('btnInstallApp');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btn.classList.remove('hidden');
  });
  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch {}
    btn.classList.add('hidden');
    deferredPrompt = null;
  });
  window.addEventListener('appinstalled', () => btn.classList.add('hidden'));
}

// ==== IndexedDB para tickets ====
let idb=null;
function openDB(){
  return new Promise((resolve, reject)=>{
    if(idb) return resolve(idb);
    const req = indexedDB.open('restaurantworld-db', 1);
    req.onupgradeneeded = (e)=>{
      const dbx = e.target.result;
      if(!dbx.objectStoreNames.contains('tickets')){
        dbx.createObjectStore('tickets', {keyPath: 'id'});
      }
    };
    req.onsuccess = ()=>{ idb=req.result; resolve(idb); };
    req.onerror   = ()=> reject(req.error);
  });
}
function idbPut(store, obj){
  return openDB().then(dbx=> new Promise((resolve,reject)=>{
    const tx = dbx.transaction(store, 'readwrite');
    tx.objectStore(store).put(obj);
    tx.oncomplete = ()=> resolve(true);
    tx.onerror = ()=> reject(tx.error);
  }));
}
function idbGet(store, key){
  return openDB().then(dbx=> new Promise((resolve,reject)=>{
    const tx = dbx.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = ()=> resolve(req.result);
    req.onerror = ()=> reject(req.error);
  }));
}
function idbDel(store, key){
  return openDB().then(dbx=> new Promise((resolve,reject)=>{
    const tx = dbx.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = ()=> resolve(true);
    tx.onerror = ()=> reject(tx.error);
  }));
}

// ==== Utilidades ====
function saveData(){ localStorage.setItem('visits', JSON.stringify(visits)); }
function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function getTicketsIndex(){ return JSON.parse(localStorage.getItem('ticketsIndex')||'{}'); }
function setTicketsIndex(m){ localStorage.setItem('ticketsIndex', JSON.stringify(m)); }
function toTitleCase(str){
  if(!str) return str;
  return str.toLowerCase().split(' ').map(w => w.split('-').map(p => p ? p[0].toUpperCase()+p.slice(1) : p).join('-')).join(' ').trim();
}
function canonicalShareUrl(){
  const u = new URL(window.location.href);
  u.search = ''; u.hash='';
  if(!u.pathname.endsWith('/')){
    const last = u.pathname.split('/').pop();
    if(!last.includes('.')) u.pathname = u.pathname + '/';
  }
  return u.toString();
}

/* ==== Auth email/contraseña ==== */
async function ensureAuthEmailPass(){
  if(!auth) return;
  if(auth.currentUser && !auth.currentUser.isAnonymous) return;

  const modal = document.getElementById('authModal');
  const email = document.getElementById('authEmail');
  const pass  = document.getElementById('authPass');
  const btn   = document.getElementById('btnAuthContinue');
  const btnReset = document.getElementById('btnResetPass');
  const msg   = document.getElementById('authMsg');

  modal.classList.remove('hidden');
  msg.textContent = LANG==='en' ? 'Sign in or create an account.' : 'Inicia sesión o crea tu cuenta.';

  btnReset.onclick = async ()=>{
    const em = (email.value||'').trim();
    if(!em){ msg.textContent = LANG==='en' ? 'Enter your email to receive the reset link.' : 'Escribe tu email para enviar el enlace de restablecimiento.'; return; }
    try{
      await auth.sendPasswordResetEmail(em);
      msg.textContent = LANG==='en' ? 'We sent you a reset email.' : 'Te hemos enviado un email para restablecer la contraseña.';
    }catch(e){
      console.warn('reset error', e);
      msg.textContent = (LANG==='en' ? 'Cannot send email: ' : 'No se pudo enviar el email: ') + (e.code || '');
    }
  };

  return new Promise((resolve)=>{
    btn.onclick = async ()=>{
      const em = (email.value||'').trim();
      const pw = (pass.value||'').trim();
      if(!em || !pw){ msg.textContent = LANG==='en' ? 'Fill in email and password.' : 'Completa email y contraseña.'; return; }
      if(pw.length < 6){ msg.textContent = LANG==='en' ? 'Password must be at least 6 characters.' : 'La contraseña debe tener al menos 6 caracteres.'; return; }
      msg.textContent = LANG==='en' ? 'Checking…' : 'Comprobando…';

      try{
        await auth.signInWithEmailAndPassword(em, pw);
        modal.classList.add('hidden'); resolve(true); return;
      }catch(e){
        if(e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential'){
          try{
            if(auth.currentUser && auth.currentUser.isAnonymous){
              const cred = firebase.auth.EmailAuthProvider.credential(em, pw);
              await auth.currentUser.linkWithCredential(cred);
            }else{
              await auth.createUserWithEmailAndPassword(em, pw);
            }
            modal.classList.add('hidden'); resolve(true); return;
          }catch(e2){
            if(e2.code === 'auth/email-already-in-use'){
              msg.textContent = LANG==='en' ? 'Email already in use. Try signing in or reset.' : 'Ese email ya existe. Prueba a iniciar sesión o usa "Restablecer".';
              return;
            }
            if(e2.code === 'auth/invalid-email'){
              msg.textContent = LANG==='en' ? 'Invalid email.' : 'Email no válido.'; return;
            }
            if(e2.code === 'auth/weak-password'){
              msg.textContent = LANG==='en' ? 'Weak password.' : 'Contraseña demasiado débil.'; return;
            }
            console.error('create/link error', e2);
            msg.textContent = (LANG==='en' ? 'Could not create account: ' : 'No se pudo crear la cuenta: ') + (e2.code || '');
            return;
          }
        }else if(e.code === 'auth/wrong-password'){
          msg.textContent = LANG==='en' ? 'Incorrect password.' : 'Contraseña incorrecta.'; return;
        }else if(e.code === 'auth/too-many-requests'){
          msg.textContent = LANG==='en' ? 'Too many attempts. Try later.' : 'Demasiados intentos. Espera e inténtalo de nuevo.'; return;
        }else if(e.code === 'auth/invalid-email'){
          msg.textContent = LANG==='en' ? 'Invalid email.' : 'Email no válido.'; return;
        }else{
          console.warn('signIn error', e);
          msg.textContent = (LANG==='en' ? 'Cannot sign in: ' : 'No se pudo acceder: ') + (e.code || '');
          return;
        }
      }
    };
  });
}

/* ==== Usuario ==== */
async function ensureUsername(){
  myUser = localStorage.getItem('myUser') || null;
  const label = document.getElementById('myUsernameLabel');
  const msg = document.getElementById('onboardMsg');
  label.textContent = myUser || '—';
  if(!myUser){
    const m = document.getElementById('onboard');
    m.classList.remove('hidden');
    document.getElementById('onboardSave').onclick = async ()=>{
      const val = document.getElementById('onboardUsername').value.trim();
      if(!val){ msg.textContent = LANG==='en' ? 'Enter a username.' : 'Escribe un usuario.'; return; }
      const res = await claimUsername(val);
      if(!res.ok){
        if(res.reason==='exists') msg.textContent = LANG==='en' ? 'That username already exists. Try another.' : 'Ese usuario ya existe. Prueba otro.';
        else msg.textContent = LANG==='en' ? 'Could not register username (connection or rules).' : 'No se pudo registrar el usuario (conexión o reglas).';
        return;
      }
      myUser = val;
      localStorage.setItem('myUser', myUser);
      label.textContent = myUser;
      msg.textContent = '';
      m.classList.add('hidden');
      publishSummary();
    };
  }
}

function clearUser(){
  localStorage.removeItem('myUser');
  myUser = null;
  document.getElementById('myUsernameLabel').textContent = '—';
  document.getElementById('onboard').classList.remove('hidden');
}

function usernameDocId(name){ return (name||'').toLowerCase(); }
async function claimUsername(name){
  try{
    if(!db || !auth || !auth.currentUser) return {ok:false, reason:'not-ready'};
    const id = usernameDocId(name);
    const ref = db.collection('profiles').doc(id);
    const snap = await ref.get();
    if(snap.exists){
      const data = snap.data()||{};
      if(data.ownerUid === auth.currentUser.uid){
        return {ok:true, owned:true};
      }else{
        return {ok:false, reason:'exists'};
      }
    }
    await ref.set({
      username: name,
      usernameLower: id,
      restaurants: [],
      ownerUid: auth.currentUser.uid,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return {ok:true};
  }catch(e){
    console.error('claimUsername error', e);
    return {ok:false};
  }
}

function buildMinimalSummary(){
  const byKey = {};
  visits.forEach(v=>{
    const k = v.name+'|'+v.city;
    (byKey[k] = byKey[k] || []).push(v);
  });
  const restaurants = Object.entries(byKey).map(([k,arr])=>{
    const [name,city] = k.split('|');
    const avgRating = arr.reduce((a,v)=>a+v.rating,0)/arr.length || 0;
    const avgPrice  = arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length || 0;
    const mapsUrl   = 'https://www.google.com/maps/search/' + encodeURIComponent(name + ' ' + city);
    return { name, city, rating: Number(avgRating.toFixed(2)), avgPrice: Number(avgPrice.toFixed(2)), mapsUrl };
  }).sort((a,b)=> b.rating-a.rating || a.name.localeCompare(b.name));
  return { username: myUser || null, restaurants };
}

async function publishSummary(){
  try{
    if(!db || !auth || !auth.currentUser || !myUser) return;
    const minimal = buildMinimalSummary();
    const id = usernameDocId(myUser);
    const ref = db.collection('profiles').doc(id);
    await ref.set({
      ...minimal,
      usernameLower: id,
      ownerUid: auth.currentUser.uid,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});
  }catch(e){ console.error('publishSummary error', e); }
}

/* ==== Formulario (incluye ticket) ==== */
let pendingTicketFile = null;

function updateAvg(){
  const diners = Number(document.getElementById('vDiners').value)||0;
  const total  = Number(document.getElementById('vTotal').value)||0;
  document.getElementById('vAvg').value = diners>0 ? (total/diners).toFixed(2) : '';
}
function initStars(){
  const stars = document.getElementById('stars');
  const v = document.getElementById('vRatingValue');
  function paint(n){ stars.querySelectorAll('[data-value]').forEach(btn=>{ const val = Number(btn.dataset.value); btn.classList.toggle('selected', val>0 && val<=n); }); }
  stars.addEventListener('click', (e)=>{ const btn = e.target.closest('button[data-value]'); if(!btn) return; const n = Number(btn.dataset.value); document.getElementById('vRatingValue').value = n; paint(n); });
  paint(Number(v.value||0));
}
function updateDatalists(){
  const dlr = document.getElementById('dl-rest');
  const dlc = document.getElementById('dl-city');
  const names = [...new Set(visits.map(v=>v.name).filter(Boolean))].sort();
  const cities= [...new Set(visits.map(v=>v.city).filter(Boolean))].sort();
  dlr.innerHTML = names.map(n=>`<option value="${n}">`).join('');
  dlc.innerHTML = cities.map(c=>`<option value="${c}">`).join('');
}
function initForm(){
  const f = document.getElementById('visitForm');
  const inpTicket = document.getElementById('vTicket');
  const thumbImg = document.getElementById('ticketThumb');
  const btnClear = document.getElementById('btnClearTicket');

  ['vDiners','vTotal'].forEach(id => document.getElementById(id).addEventListener('input', updateAvg));
  updateAvg(); initStars();
  document.getElementById('btnMaps').onclick=()=>{
    const q = encodeURIComponent(document.getElementById('vMaps').value || document.getElementById('vName').value);
    if(q) window.open(`https://www.google.com/maps/search/${q}`,'_blank');
  };

  inpTicket.addEventListener('change', async ()=>{
    const f = inpTicket.files && inpTicket.files[0];
    if(!f){ thumbImg.classList.add('hidden'); thumbImg.src=''; pendingTicketFile=null; return; }
    const dataUrl = await readFile(f);
    thumbImg.src = dataUrl;
    thumbImg.classList.remove('hidden');
    pendingTicketFile = f;
  });
  btnClear.addEventListener('click', ()=>{
    inpTicket.value = '';
    pendingTicketFile = null;
    thumbImg.src=''; thumbImg.classList.add('hidden');
  });

  f.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const cityRaw = document.getElementById('vCity').value.trim();
    const visit = {
      id: genId(),
      user: myUser || null,
      name: document.getElementById('vName').value.trim(),
      city: toTitleCase(cityRaw),
      date: document.getElementById('vDate').value,
      diners: Number(document.getElementById('vDiners').value),
      totalPrice: Number(document.getElementById('vTotal').value),
      rating: Number(document.getElementById('vRatingValue').value||0),
      notes: document.getElementById('vNotes').value.trim()
    };
    visits.push(visit);
    saveData();
    updateDatalists();
    renderAll();

    if(pendingTicketFile){
      try{
        const blob = await makeResizedBlob(pendingTicketFile, 1600);
        const thumb = await makeThumbBlob(pendingTicketFile, 400);
        await idbPut('tickets', { id: visit.id, mime: 'image/jpeg', blob, thumb, ts: Date.now() });
        const idx = getTicketsIndex(); idx[visit.id]=1; setTicketsIndex(idx);
      }catch(e){ console.error('Ticket store failed', e); }
    }

    await publishSummary();
    f.reset();
    document.getElementById('vDiners').value = '';
    document.getElementById('vTotal').value = '';
    document.getElementById('vRatingValue').value = 0;
    pendingTicketFile=null;
    document.getElementById('ticketThumb').src=''; document.getElementById('ticketThumb').classList.add('hidden');
    updateAvg(); initStars();
  });
}

/* ==== Resumen / Historial / Explorar ==== */
function renderSummary(){
  const host = document.getElementById('summary');
  if(!visits.length){ host.innerHTML='<p class="small">' + (LANG==='en'?'No visits yet.':'Aún no hay visitas.') + '</p>'; return; }
  const byRestCityCount = {}; const byRestYear = {};
  visits.forEach(v=>{
    byRestCityCount[v.name] = byRestCityCount[v.name] || {};
    byRestCityCount[v.name][v.city] = (byRestCityCount[v.name][v.city]||0)+1;
    const y = new Date(v.date).getFullYear();
    byRestYear[v.name] = byRestYear[v.name] || {};
    byRestYear[v.name][y] = byRestYear[v.name][y]||[];
    byRestYear[v.name][y].push(v);
  });
  let html = `<div class="card"><div class="section-title">${t('tab_summary')} ${t('lbl_restaurant')?.toLowerCase?.()?'' : ''}</div>`;
  Object.keys(byRestYear).sort().forEach(name=>{
    const cityCounts = byRestCityCount[name]||{};
    const mainCity = Object.keys(cityCounts).sort((a,b)=> (cityCounts[b]||0)-(cityCounts[a]||0))[0]||'';
    html += `<h3 class="rest-title">🍴 ${name}${mainCity?` <span class="rest-city">(${mainCity})</span>`:''}</h3><ul>`;
    Object.keys(byRestYear[name]).sort().forEach(y=>{
      const arr = byRestYear[name][y];
      const r = (arr.reduce((a,v)=>a+v.rating,0)/arr.length || 0).toFixed(1);
      const p = (arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length || 0).toFixed(2);
      const yearTxt = LANG==='en' ? 'Year' : 'Año';
      html += `<li>📅 <strong>${yearTxt} ${y}</strong>: ${LANG==='en'?'visits':'visitas'} ${arr.length}, ${LANG==='en'?'avg':''} ${r}, ${LANG==='en'?'avg price €':'precio medio €'}${p}</li>`;
    });
    html += `</ul>`;
  });
  html += `</div>`;
  const byYear = {};
  visits.forEach(v=>{ const y = new Date(v.date).getFullYear(); byYear[y] = (byYear[y]||[]).concat(v); });
  html += `<div class="card"><div class="section-title">${LANG==='en'?'Summary by year':'Resumen por año'}</div>`;
  Object.keys(byYear).sort().forEach(y=>{
    const arr = byYear[y];
    const r = (arr.reduce((a,v)=>a+v.rating,0)/arr.length || 0).toFixed(1);
    const p = (arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length || 0).toFixed(2);
    const total = arr.reduce((a,v)=>a+v.totalPrice,0).toFixed(2);
    html += `<div>📅 ${LANG==='en'?'Year':'Año'} ${y} — ${LANG==='en'?'Visits':'Visitas'}: ${arr.length}, ${LANG==='en'?'Avg. rating':'Puntuación media'}: ${r}, ${LANG==='en'?'Avg. price':'Precio medio'}: €${p}, <strong>${LANG==='en'?'Total spent':'Total gastado'}: €${total}</strong></div>`;
  });
  html += `</div>`;
  document.getElementById('summary').innerHTML = html;
}

function deleteVisit(id){
  const before = visits.length;
  visits = visits.filter(v=>v.id!==id);
  if(visits.length!==before){
    saveData(); updateDatalists(); renderAll(); publishSummary();
    const idx = getTicketsIndex();
    if(idx[id]){ delete idx[id]; setTicketsIndex(idx); idbDel('tickets', id); }
  }
}
function renderHistory(){
  const mount = document.getElementById('history');
  const filterSel = document.getElementById('histFilter');
  const prev = filterSel.value || 'Todos';
  const names = ['Todos', ...new Set(visits.map(v=>v.name))].sort();
  filterSel.innerHTML = names.map(n=>`<option value="${n}">${n==='Todos'?'📂 '+(LANG==='en'?'All restaurants':'Todos los restaurantes'):`🍴 ${n}`}</option>`).join('');
  filterSel.value = names.includes(prev) ? prev : 'Todos';
  const chosen = filterSel.value;
  const data = visits.filter(v=> chosen==='Todos' || v.name===chosen);
  const idx = getTicketsIndex();

  const byYear = {};
  data.forEach(v=>{ const y = new Date(v.date).getFullYear(); byYear[y] = (byYear[y]||[]).concat(v); });
  let html = '';
  Object.keys(byYear).sort().forEach(y=>{
    const arr = byYear[y].sort((a,b)=> new Date(b.date)-new Date(a.date));
    const avg = arr.length? (arr.reduce((a,v)=>a+v.rating,0)/arr.length):0;
    const price = arr.length? (arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length):0;
    html += `<div class="card"><div class="section-title">${LANG==='en'?'Year':'Año'} ${y} — ${arr.length} ${LANG==='en'?'visits':'visitas'}, ${LANG==='en'?'avg':''} ${avg.toFixed(1)}, €${price.toFixed(2)}</div>`;
    html += `<ul>`;
    arr.forEach(v=>{
      const per = (v.totalPrice/v.diners).toFixed(2);
      const stars = '★'.repeat(v.rating)+'☆'.repeat(5-v.rating);
      const dateStr = new Date(v.date).toLocaleDateString();
      html += `<li class="visit-row">
        <div class="visit-main">
          ${dateStr} — ${v.name} (${v.city}) — ${v.diners} — €${per}/${LANG==='en'?'pp':'pers.'}
          <span class="small"> ${stars}</span>
        </div>
        <div class="row-actions">
          <button class="icon-btn danger" data-del-id="${v.id}" title="${LANG==='en'?'Delete visit':'Borrar visita'}">🗑️</button>
        </div>
      </li>`;
      if(v.notes){ html += `<li class="small" style="margin:-.3rem 0 .4rem 0">📝 ${v.notes}</li>`; }
    });
    html += `</ul></div>`;
  });
  mount.innerHTML = html||'<p class="small">' + (LANG==='en'?'No visits.':'Sin visitas.') + '</p>';
  if(!filterSel.dataset.bound){
    filterSel.addEventListener('change', renderHistory);
    filterSel.dataset.bound = '1';
  }
  mount.querySelectorAll('[data-del-id]').forEach(btn=> btn.addEventListener('click', ()=> deleteVisit(btn.dataset.delId)));
}

/* ==== Explorar ==== */
function renderExplore(){
  const host = document.getElementById('explore');
  const sel = document.getElementById('cityFilter');
  const prevVal = (sel.value || '*').toLowerCase();
  const cityMap = new Map();
  visits.forEach(v=>{ if(v.city){ const lc = v.city.toLowerCase(); if(!cityMap.has(lc)) cityMap.set(lc, v.city); } });
  const keys = ['*', ...Array.from(cityMap.keys()).sort()];
  sel.innerHTML = keys.map(k=> `<option value="${k}">${k==='*' ? (LANG==='en'?'🌍 All cities':'🌍 Todas las ciudades') : '🏙️ '+cityMap.get(k)}</option>`).join('');
  sel.value = keys.includes(prevVal) ? prevVal : '*';
  const chosen = sel.value;
  const groups = {};
  visits.forEach(v=>{
    const cityKey = (v.city||'').toLowerCase();
    if(chosen!=='*' && cityKey!==chosen) return;
    const key = v.name+'|'+(v.city||'');
    groups[key] = groups[key] || [];
    groups[key].push(v);
  });
  const rows = Object.entries(groups).map(([k,arr])=>{
    const [name,city] = k.split('|');
    const avgRating = arr.reduce((a,v)=>a+v.rating,0)/arr.length || 0;
    const avgPrice  = arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length || 0;
    return {name, city, avgRating, avgPrice};
  }).sort((a,b)=> b.avgRating-a.avgRating || a.name.localeCompare(b.name));
  let html='';
  rows.forEach(item=>{
    const stars = '★'.repeat(Math.round(item.avgRating))+'☆'.repeat(5-Math.round(item.avgRating));
    const url = 'https://www.google.com/maps/search/'+encodeURIComponent(item.name+' '+item.city);
    html += `<div class="card">
      <div class="section-title">🍴 ${item.name} — <span class="rest-city">🏙️ ${item.city}</span></div>
      <div>${LANG==='en'?'Average rating':'Puntuación media'}: ${item.avgRating.toFixed(1)} <span class="small">${stars}</span></div>
      <div>${LANG==='en'?'Average price':'Precio medio'}: €${item.avgPrice.toFixed(2)}</div>
      <p><a href="${url}" target="_blank">🗺️ ${LANG==='en'?'Open in Maps':'Abrir en Maps'}</a></p>
    </div>`;
  });
  host.innerHTML = html || '<p class="small">' + (LANG==='en'?'No results.':'No hay resultados.') + '</p>';
  if(!sel.dataset.bound){ sel.addEventListener('change', renderExplore); sel.dataset.bound = '1'; }
}

/* ==== Amigos ==== */
let unsubUsers = null;
async function fetchFriend(name){
  if(!db) return null;
  const id = (name||'').toLowerCase();
  const snap = await db.collection('profiles').doc(id).get();
  if(!snap.exists) return null;
  const data = snap.data() || {};
  if(!Array.isArray(data.restaurants)) data.restaurants = [];
  return data;
}
function getSeen(){ return JSON.parse(localStorage.getItem('friendsSeen')||'[]'); }
function setSeen(arr){ localStorage.setItem('friendsSeen', JSON.stringify(arr.slice(0,200))); }

function subscribeUsernames(){
  if(!db) return;
  if(unsubUsers) return;
  const dl  = document.getElementById('dl-friends');
  const list= document.getElementById('friendsSavedList');
  const mergeAndRender = (serverNames)=>{
    const seen = getSeen();
    const all = Array.from(new Set([...serverNames, ...seen]));
    dl.innerHTML = all.map(n=>`<option value="${n}">`).join('');
    list.innerHTML = all.length ? all.map(n=>`<li data-user="${n}">👤 ${n}</li>`).join('') : '<li class="small">' + (LANG==='en'?'No users':'Sin usuarios') + '</li>';
  };
  unsubUsers = db.collection('profiles').orderBy('usernameLower').limit(500)
    .onSnapshot(snap=>{
      const names = [];
      snap.forEach(doc=>{
        const d = doc.data()||{};
        names.push(d.username || doc.id);
      });
      mergeAndRender(names);
    }, err=> console.warn('subscribeUsernames error', err));
}

function initFriends(){
  const inp = document.getElementById('friendInput');
  const btn = document.getElementById('btnFriend');
  const view= document.getElementById('friendView');
  const toggleBtn = document.getElementById('btnFriendDropdown');
  const list = document.getElementById('friendsSavedList');

  function saveSeen(name){
    if(!name) return;
    const arr = getSeen();
    if(!arr.includes(name)){ arr.unshift(name); setSeen(arr); }
  }

  async function showFriend(){
    const q = inp.value.trim();
    if(!q){ view.innerHTML = '<p class="small">' + (LANG==='en'?'Type a username':'Escribe un usuario') + '</p>'; return; }
    view.innerHTML = '<p class="small">' + (LANG==='en'?'Loading…':'Cargando…') + '</p>';
    try{
      const data = await fetchFriend(q);
      if(!data || !Array.isArray(data.restaurants)){ view.innerHTML = '<p class="small">' + (LANG==='en'?'User not found or no summary.':'No existe ese usuario o no tiene resumen.') + '</p>'; return; }
      saveSeen(q);
      const byCity = {};
      data.restaurants.forEach(r=>{ (byCity[r.city] = byCity[r.city] || []).push(r); });
      Object.keys(byCity).forEach(c=> byCity[c].sort((a,b)=> b.rating-a.rating || a.name.localeCompare(b.name)));
      const cities = Object.keys(byCity).sort((a,b)=> a.localeCompare(b));

      let html = `<div class="card"><div class="section-title">${data.username || q}</div>`;
      cities.forEach(city=>{
        html += `<div class="city-title">🏙️ ${city}</div><ul>`;
        byCity[city].forEach(r=>{
          const stars = '★'.repeat(Math.round(r.rating||0))+'☆'.repeat(5-Math.round(r.rating||0));
          const url = r.mapsUrl || ('https://www.google.com/maps/search/' + encodeURIComponent((r.name||'') + ' ' + (r.city||'')));
          html += `<li>🍴 ${r.name}: ${Number(r.rating||0).toFixed(1)} <span class="small">${stars}</span>, €${Number(r.avgPrice||0).toFixed(2)} — <a href="${url}" target="_blank">Maps</a></li>`;
        });
        html += `</ul>`;
      });
      html += `</div>`;
      view.innerHTML = html;
    }catch(e){
      console.error(e);
      view.innerHTML = '<p class="small">' + (LANG==='en'?'Error loading profile.':'Error cargando el perfil.') + '</p>';
    }
  }

  btn.onclick = showFriend;
  inp.addEventListener('change', showFriend);
  inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); showFriend(); } });

  toggleBtn.addEventListener('click', ()=> list.classList.toggle('hidden'));
  list.addEventListener('click', (e)=>{
    const li = e.target.closest('li[data-user]');
    if(!li) return;
    inp.value = li.dataset.user;
    list.classList.add('hidden');
    showFriend();
  });

  subscribeUsernames();
  document.getElementById('btnChangeUser').onclick = clearUser;
  document.getElementById('btnSignOut').onclick = async ()=>{
    try{
      await auth.signOut();
      location.reload();
    }catch(e){ console.warn(e); }
  };
}

/* ==== Tickets ==== */
function readFile(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
function loadImage(src){ return new Promise((res,rej)=>{ const img=new Image(); img.onload=()=>res(img); img.onerror=rej; img.src=src; }); }
function canvasToBlob(canvas, type='image/jpeg', quality=0.8){
  return new Promise(resolve => canvas.toBlob(b=>resolve(b), type, quality));
}
async function makeResizedBlob(file, maxDim=1600){
  try{
    const dataUrl = await readFile(file);
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const cv = document.createElement('canvas'); cv.width=w; cv.height=h;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await canvasToBlob(cv, 'image/jpeg', 0.8);
    return blob || file;
  }catch(e){
    console.warn('Resize failed, storing original', e);
    return file;
  }
}
async function makeThumbBlob(file, maxDim=400){
  return makeResizedBlob(file, maxDim);
}

/* ==== Tema / Share / Tabs / Render ==== */
function setTheme(mode){ document.documentElement.setAttribute('data-theme', mode); localStorage.setItem('theme', mode); }
function initTheme(){
  const saved = localStorage.getItem('theme') || 'auto';
  setTheme(saved);
  document.getElementById('themeDark').onclick=()=>setTheme('dark');
  document.getElementById('themeLight').onclick=()=>setTheme('light');
  document.getElementById('themeAuto').onclick=()=>setTheme('auto');
}

function initLang(){
  applyI18n();
  const sel = document.getElementById('langSelect');
  sel.value = LANG;
  sel.addEventListener('change', ()=>{
    LANG = sel.value;
    localStorage.setItem('lang', LANG);
    if(auth) auth.languageCode = LANG;
    applyI18n();
    renderAll(); // re-render texts in content areas
  });
}

function initShare(){
  const btn = document.getElementById('btnShareApp');
  const modal = document.getElementById('shareModal');
  const link = document.getElementById('shareLink');
  const btnCopy = document.getElementById('btnCopyLink');
  const btnNative = document.getElementById('btnNativeShare');
  const btnClose = document.getElementById('btnCloseShare');
  const qr = document.getElementById('qrImg');
  const msg = document.getElementById('shareMsg');

  function openShare(){
    const url = canonicalShareUrl();
    link.value = url;
    qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(url);
    msg.textContent = '';
    modal.classList.remove('hidden');
  }

  btn.addEventListener('click', openShare);
  btnClose.addEventListener('click', ()=> modal.classList.add('hidden'));
  btnCopy.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(link.value);
      msg.textContent = LANG==='en' ? 'Link copied.' : 'Enlace copiado.';
    }catch(e){
      msg.textContent = LANG==='en' ? 'Could not copy. Select and copy manually.' : 'No se pudo copiar. Selecciona y copia manualmente.';
    }
  });
  btnNative.addEventListener('click', async ()=>{
    const url = link.value;
    if(navigator.share){
      try{
        await navigator.share({ title: t('app_title').replace('🍽️ ', ''), text: LANG==='en'?'Join the app':'Únete a la app', url });
        msg.textContent = LANG==='en' ? 'Shared.' : 'Compartido.';
      }catch(e){ msg.textContent = LANG==='en' ? 'Action canceled.' : 'Acción cancelada.'; }
    }else{
      msg.textContent = LANG==='en' ? 'Native share not supported. Use copy or QR.' : 'Tu navegador no soporta compartir nativo. Usa copiar o el QR.';
    }
  });
}

function showTab(name){
  document.querySelectorAll('#navTabs button').forEach(b=>{
    const active = b.dataset.tab===name;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('main .tab').forEach(s=> s.classList.toggle('active', s.id===`tab-${name}`));
}
function initTabs(){ document.querySelectorAll('#navTabs button').forEach(b=> b.addEventListener('click',()=> showTab(b.dataset.tab))); }
function renderAll(){ renderSummary(); renderHistory(); renderExplore(); }

document.addEventListener('DOMContentLoaded', async ()=>{
  initTheme();
  initTabs();
  initLang();
  initShare();
  initA2HS();
  await openDB();
  const raw = localStorage.getItem('visits'); visits = raw ? JSON.parse(raw) : [];
  await initFirebase();
  if(!(firebase.auth().currentUser && !firebase.auth().currentUser.isAnonymous)){
    await ensureAuthEmailPass();
  }
  await ensureUsername();
  initForm();
  updateDatalists();
  renderAll();
  initFriends();
});

/* ==== Ver ticket desde Historial ==== */
async function viewTicket(visitId){
  try{
    const rec = await idbGet('tickets', visitId);
    if(!rec || !rec.blob){ alert(LANG==='en'?'Ticket not found.':'No se encontró el ticket.'); return; }
    const url = URL.createObjectURL(rec.blob);
    const img = document.getElementById('ticketViewImg');
    img.src = url;
    document.getElementById('ticketModal').classList.remove('hidden');
    document.getElementById('btnCloseTicket').onclick = ()=>{
      document.getElementById('ticketModal').classList.add('hidden');
      URL.revokeObjectURL(url);
    };
  }catch(e){
    console.error(e);
    alert(LANG==='en'?'Could not open the ticket.':'No se pudo abrir el ticket.');
  }
}
