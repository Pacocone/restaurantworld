// ===== Firebase init =====
let appFB=null, auth=null, db=null;
function initFirebase(){
  if(!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey){
    console.warn('Falta configuración de Firebase. Edita firebase-config.js');
    return;
  }
  appFB = firebase.initializeApp(window.FIREBASE_CONFIG);
  auth = firebase.auth();
  db = firebase.firestore();
  auth.signInAnonymously().catch(console.error);
}

// ===== Local state =====
let visits = [];
let myUser = null;

function saveData(){ localStorage.setItem('visits', JSON.stringify(visits)); }
function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

/* Title Case for cities */
function toTitleCase(str){
  if(!str) return str;
  return str.toLowerCase().split(' ').map(w => w.split('-').map(p => p ? p[0].toUpperCase()+p.slice(1) : p).join('-')).join(' ').trim();
}

/* ---- USER ---- */
async function ensureUsername(){
  myUser = localStorage.getItem('myUser') || null;
  const label = document.getElementById('myUsernameLabel');
  label.textContent = myUser || '—';
  if(!myUser){
    const m = document.getElementById('onboard');
    m.classList.remove('hidden');
    document.getElementById('onboardSave').onclick = async ()=>{
      const val = document.getElementById('onboardUsername').value.trim();
      if(!val) return;
      const ok = await claimUsername(val);
      if(!ok){ alert('Ese usuario ya existe. Prueba otro.'); return; }
      myUser = val;
      localStorage.setItem('myUser', myUser);
      label.textContent = myUser;
      m.classList.add('hidden');
      publishSummary(); // primera publicación
    };
  }
}

function clearUser(){
  localStorage.removeItem('myUser');
  myUser = null;
  document.getElementById('myUsernameLabel').textContent = '—';
  document.getElementById('onboard').classList.remove('hidden');
}

/* ---- FIRESTORE helpers ---- */
function usernameDocId(name){ return (name||'').toLowerCase(); }

async function claimUsername(name){
  if(!db || !auth.currentUser) return false;
  const id = usernameDocId(name);
  const ref = db.collection('profiles').doc(id);
  const snap = await ref.get();
  if(snap.exists) return false; // ya ocupado
  await ref.set({
    username: name,
    restaurants: [],
    ownerUid: auth.currentUser.uid,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return true;
}

function buildMinimalSummary(){
  // Agrupar por name|city y calcular rating medio y precio medio
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
    return {
      name,
      city,
      rating: Number(avgRating.toFixed(2)),
      avgPrice: Number(avgPrice.toFixed(2)),
      mapsUrl
    };
  }).sort((a,b)=> b.rating-a.rating || a.name.localeCompare(b.name));
  return { username: myUser || null, restaurants };
}

async function publishSummary(){
  if(!db || !auth.currentUser || !myUser) return;
  const minimal = buildMinimalSummary();
  const id = usernameDocId(myUser);
  const ref = db.collection('profiles').doc(id);
  await ref.set({
    ...minimal,
    ownerUid: auth.currentUser.uid,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, {merge:true}).catch(console.error);
}

async function fetchFriend(user){
  if(!db) throw new Error('Sin backend');
  const id = usernameDocId(user);
  const snap = await db.collection('profiles').doc(id).get();
  return snap.exists ? snap.data() : null;
}

/* ---- LOAD/SAVE VISITS ---- */
function loadData(){
  const raw = localStorage.getItem('visits');
  visits = raw ? JSON.parse(raw) : [];
  let changed=false;
  visits.forEach(v=>{
    if(!v.id){ v.id = genId(); changed=true; }
    if(v.city){
      const norm = toTitleCase(v.city);
      if(norm !== v.city){ v.city = norm; changed = true; }
    }
  });
  if(changed) saveData();
}

/* ---- THEME ---- */
function setTheme(mode){ document.documentElement.setAttribute('data-theme', mode); localStorage.setItem('theme', mode); }
function initTheme(){
  const saved = localStorage.getItem('theme') || 'auto';
  setTheme(saved);
  document.getElementById('themeDark').onclick=()=>setTheme('dark');
  document.getElementById('themeLight').onclick=()=>setTheme('light');
  document.getElementById('themeAuto').onclick=()=>setTheme('auto');
}

/* ---- TABS ---- */
function showTab(name){
  document.querySelectorAll('#navTabs button').forEach(b=>{
    const active = b.dataset.tab===name;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('main .tab').forEach(s=> s.classList.toggle('active', s.id===`tab-${name}`));
}
function initTabs(){ document.querySelectorAll('#navTabs button').forEach(b=> b.addEventListener('click',()=> showTab(b.dataset.tab))); }

/* ---- FORM ---- */
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
  ['vDiners','vTotal'].forEach(id => document.getElementById(id).addEventListener('input', updateAvg));
  updateAvg(); initStars();
  document.getElementById('btnMaps').onclick=()=>{
    const q = encodeURIComponent(document.getElementById('vMaps').value || document.getElementById('vName').value);
    if(q) window.open(`https://www.google.com/maps/search/${q}`,'_blank');
  };
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
    // Publica automáticamente el resumen mínimo para que otros lo vean
    await publishSummary();
    f.reset();
    document.getElementById('vDiners').value = 1;
    document.getElementById('vTotal').value = 0;
    document.getElementById('vRatingValue').value = 0;
    updateAvg(); initStars();
  });
}

/* ---- SUMMARY/HISTORY/EXPLORE ---- */
function renderSummary(){
  const host = document.getElementById('summary');
  if(!visits.length){ host.innerHTML='<p class="small">Aún no hay visitas.</p>'; return; }
  const byRestCityCount = {}; const byRestYear = {};
  visits.forEach(v=>{
    byRestCityCount[v.name] = byRestCityCount[v.name] || {};
    byRestCityCount[v.name][v.city] = (byRestCityCount[v.name][v.city]||0)+1;
    const y = new Date(v.date).getFullYear();
    byRestYear[v.name] = byRestYear[v.name] || {};
    byRestYear[v.name][y] = (byRestYear[v.name][y]||[]).concat(v);
  });
  let html = `<div class="card"><div class="section-title">Resumen por restaurante</div>`;
  Object.keys(byRestYear).sort().forEach(name=>{
    const cityCounts = byRestCityCount[name]||{};
    const mainCity = Object.keys(cityCounts).sort((a,b)=> (cityCounts[b]||0)-(cityCounts[a]||0))[0]||'';
    html += `<h3 class="rest-title">🍴 ${name}${mainCity?` <span class="rest-city">(${mainCity})</span>`:''}</h3><ul>`;
    Object.keys(byRestYear[name]).sort().forEach(y=>{
      const arr = byRestYear[name][y];
      const r = (arr.reduce((a,v)=>a+v.rating,0)/arr.length || 0).toFixed(1);
      const p = (arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length || 0).toFixed(2);
      html += `<li>📅 <strong>Año ${y}</strong>: visitas ${arr.length}, media ${r}, precio medio €${p}</li>`;
    });
    html += `</ul>`;
  });
  html += `</div>`;
  const byYear = {};
  visits.forEach(v=>{ const y = new Date(v.date).getFullYear(); byYear[y] = (byYear[y]||[]).concat(v); });
  html += `<div class="card"><div class="section-title">Resumen por año</div>`;
  Object.keys(byYear).sort().forEach(y=>{
    const arr = byYear[y];
    const r = (arr.reduce((a,v)=>a+v.rating,0)/arr.length || 0).toFixed(1);
    const p = (arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length || 0).toFixed(2);
    const total = arr.reduce((a,v)=>a+v.totalPrice,0).toFixed(2);
    html += `<div>📅 Año ${y} — Visitas: ${arr.length}, Puntuación media: ${r}, Precio medio: €${p}, <strong>Total gastado: €${total}</strong></div>`;
  });
  html += `</div>`;
  document.getElementById('summary').innerHTML = html;
}

function deleteVisit(id){
  const before = visits.length;
  visits = visits.filter(v=>v.id!==id);
  if(visits.length!==before){ saveData(); updateDatalists(); renderAll(); publishSummary(); }
}
function renderHistory(){
  const mount = document.getElementById('history');
  const filterSel = document.getElementById('histFilter');
  const prev = filterSel.value || 'Todos';
  const names = ['Todos', ...new Set(visits.map(v=>v.name))].sort();
  filterSel.innerHTML = names.map(n=>`<option value="${n}">${n==='Todos'?'📂 Todos los restaurantes':`🍴 ${n}`}</option>`).join('');
  filterSel.value = names.includes(prev) ? prev : 'Todos';
  const chosen = filterSel.value;
  const data = visits.filter(v=> chosen==='Todos' || v.name===chosen);
  const byYear = {};
  data.forEach(v=>{ const y = new Date(v.date).getFullYear(); byYear[y] = (byYear[y]||[]).concat(v); });
  let html = '';
  Object.keys(byYear).sort().forEach(y=>{
    const arr = byYear[y].sort((a,b)=> new Date(b.date)-new Date(a.date));
    const avg = arr.length? (arr.reduce((a,v)=>a+v.rating,0)/arr.length):0;
    const price = arr.length? (arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length):0;
    html += `<div class="card"><div class="section-title">Año ${y} — ${arr.length} visitas, media ${avg.toFixed(1)}, €${price.toFixed(2)}</div>`;
    html += `<ul>`;
    arr.forEach(v=>{
      const per = (v.totalPrice/v.diners).toFixed(2);
      const stars = '★'.repeat(v.rating)+'☆'.repeat(5-v.rating);
      html += `<li class="visit-row">
        <div class="visit-main">
          ${new Date(v.date).toLocaleDateString()} — ${v.name} (${v.city}) — ${v.diners} — €${per}/pers.
          <span class="small"> ${stars}</span>
        </div>
        <button class="icon-btn danger" data-del-id="${v.id}" title="Borrar visita">🗑️</button>
      </li>`;
      if(v.notes){ html += `<li class="small" style="margin:-.3rem 0 .4rem 0">📝 ${v.notes}</li>`; }
    });
    html += `</ul></div>`;
  });
  mount.innerHTML = html||'<p class="small">Sin visitas.</p>';
  if(!filterSel.dataset.bound){ filterSel.addEventListener('change', renderHistory); filterSel.dataset.bound = '1'; }
  mount.querySelectorAll('[data-del-id]').forEach(btn=> btn.addEventListener('click', ()=> deleteVisit(btn.dataset.delId)));
}

function renderExplore(){
  const host = document.getElementById('explore');
  const sel = document.getElementById('cityFilter');
  const prevVal = (sel.value || '*').toLowerCase();
  const cityMap = new Map();
  visits.forEach(v=>{ if(v.city){ const lc = v.city.toLowerCase(); if(!cityMap.has(lc)) cityMap.set(lc, v.city); } });
  const keys = ['*', ...Array.from(cityMap.keys()).sort()];
  sel.innerHTML = keys.map(k=> `<option value="${k}">${k==='*' ? '🌍 Todas las ciudades' : '🏙️ '+cityMap.get(k)}</option>`).join('');
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
      <div>Puntuación media: ${item.avgRating.toFixed(1)} <span class="small">${stars}</span></div>
      <div>Precio medio: €${item.avgPrice.toFixed(2)}</div>
      <p><a href="${url}" target="_blank">🗺️ Abrir en Maps</a></p>
    </div>`;
  });
  host.innerHTML = html || '<p class="small">No hay resultados.</p>';
  if(!sel.dataset.bound){ sel.addEventListener('change', renderExplore); sel.dataset.bound = '1'; }
}

/* ---- FRIENDS ---- */
function getSeen(){ return JSON.parse(localStorage.getItem('friendsSeen')||'[]'); }
function setSeen(arr){ localStorage.setItem('friendsSeen', JSON.stringify(arr.slice(0,50))); }

function initFriends(){
  const inp = document.getElementById('friendInput');
  const btn = document.getElementById('btnFriend');
  const dl  = document.getElementById('dl-friends');
  const view= document.getElementById('friendView');
  const toggleBtn = document.getElementById('btnFriendDropdown');
  const list = document.getElementById('friendsSavedList');

  const seen = getSeen();
  dl.innerHTML = seen.map(n=>`<option value="${n}">`).join('');
  drawSavedDropdown();

  function saveSeen(name){
    if(!name) return;
    const arr = getSeen();
    if(!arr.includes(name)){ arr.unshift(name); setSeen(arr); dl.innerHTML = arr.map(n=>`<option value="${n}">`).join(''); drawSavedDropdown(); }
  }
  function drawSavedDropdown(){
    const arr = getSeen();
    list.innerHTML = arr.length ? arr.map(n=>`<li data-user="${n}">👤 ${n}</li>`).join('') : '<li class="small">Sin usuarios guardados</li>';
  }

  async function showFriend(){
    const q = inp.value.trim();
    if(!q){ view.innerHTML = '<p class="small">Escribe un usuario</p>'; return; }
    view.innerHTML = '<p class="small">Cargando…</p>';
    try{
      const data = await fetchFriend(q);
      if(!data || !Array.isArray(data.restaurants)){ view.innerHTML = '<p class="small">No existe ese usuario o no tiene resumen.</p>'; return; }
      saveSeen(q);
      // Ordena por ciudad y dentro por rating desc
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
      view.innerHTML = '<p class="small">Error cargando el perfil.</p>';
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

  document.getElementById('btnChangeUser').onclick = clearUser;
}

/* ---- RENDER ALL ---- */
function renderAll(){ renderSummary(); renderHistory(); renderExplore(); }

document.addEventListener('DOMContentLoaded', async ()=>{
  initFirebase();
  initTheme();
  loadData();
  await ensureUsername();
  initTabs();
  initForm();
  updateDatalists();
  renderAll();
  initFriends();
  // Publicación inicial por si ya hay visitas
  publishSummary();
});
