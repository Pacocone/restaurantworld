// State
let visits = [];

function saveData(){ localStorage.setItem('visits', JSON.stringify(visits)); }
function genId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

/* Title Case for cities (words and hyphenated parts) */
function toTitleCase(str){
  if(!str) return str;
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.split('-').map(p => p ? p[0].toUpperCase()+p.slice(1) : p).join('-'))
    .join(' ')
    .trim();
}

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

function setTheme(mode){
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
}
function initTheme(){
  const saved = localStorage.getItem('theme') || 'auto';
  setTheme(saved);
  document.getElementById('themeDark').onclick=()=>setTheme('dark');
  document.getElementById('themeLight').onclick=()=>setTheme('light');
  document.getElementById('themeAuto').onclick=()=>setTheme('auto');
}

/* Tabs */
function showTab(name){
  document.querySelectorAll('#navTabs button').forEach(b=>{
    const active = b.dataset.tab===name;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  document.querySelectorAll('main .tab').forEach(s=> s.classList.toggle('active', s.id===`tab-${name}`));
}
function initTabs(){
  document.querySelectorAll('#navTabs button').forEach(b=> b.addEventListener('click',()=> showTab(b.dataset.tab)));
}

/* Visit form + stars + avg */
function updateAvg(){
  const diners = Number(document.getElementById('vDiners').value)||0;
  const total  = Number(document.getElementById('vTotal').value)||0;
  const out = document.getElementById('vAvg');
  out.value = diners>0 ? (total/diners).toFixed(2) : '';
}
function initStars(){
  const stars = document.getElementById('stars');
  const v = document.getElementById('vRatingValue');
  function paint(n){
    stars.querySelectorAll('[data-value]').forEach(btn=>{
      const val = Number(btn.dataset.value);
      btn.classList.toggle('selected', val>0 && val<=n);
    });
  }
  stars.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-value]');
    if(!btn) return;
    const n = Number(btn.dataset.value);
    document.getElementById('vRatingValue').value = n;
    paint(n);
  });
  paint(Number(v.value||0));
}

/* Datalists */
function updateDatalists(){
  const dlr = document.getElementById('dl-rest');
  const dlc = document.getElementById('dl-city');
  const names = [...new Set(visits.map(v=>v.name).filter(Boolean))].sort();
  const cities= [...new Set(visits.map(v=>v.city).filter(Boolean))].sort();
  dlr.innerHTML = names.map(n=>`<option value="${n}">`).join('');
  dlc.innerHTML = cities.map(c=>`<option value="${c}">`).join('');
}

/* Add visit */
function initForm(){
  const f = document.getElementById('visitForm');
  ['vDiners','vTotal'].forEach(id => document.getElementById(id).addEventListener('input', updateAvg));
  updateAvg();
  initStars();
  document.getElementById('btnMaps').onclick=()=>{
    const q = encodeURIComponent(document.getElementById('vMaps').value || document.getElementById('vName').value);
    if(q) window.open(`https://www.google.com/maps/search/${q}`,'_blank');
  };
  f.addEventListener('submit', (e)=>{
    e.preventDefault();
    const cityRaw = document.getElementById('vCity').value.trim();
    const visit = {
      id: genId(),
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
    f.reset();
    document.getElementById('vDiners').value = 1;
    document.getElementById('vTotal').value = 0;
    document.getElementById('vRatingValue').value = 0;
    updateAvg();
    initStars();
  });
}

/* SUMMARY */
function renderSummary(){
  const host = document.getElementById('summary');
  if(!visits.length){ host.innerHTML='<p class="small">Aún no hay visitas.</p>'; return; }

  const byRestCityCount = {};
  const byRestYear = {};
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
  visits.forEach(v=>{
    const y = new Date(v.date).getFullYear();
    byYear[y] = (byYear[y]||[]).concat(v);
  });
  html += `<div class="card"><div class="section-title">Resumen por año</div>`;
  Object.keys(byYear).sort().forEach(y=>{
    const arr = byYear[y];
    const r = (arr.reduce((a,v)=>a+v.rating,0)/arr.length || 0).toFixed(1);
    const p = (arr.reduce((a,v)=>a+v.totalPrice/v.diners,0)/arr.length || 0).toFixed(2);
    const total = arr.reduce((a,v)=>a+v.totalPrice,0).toFixed(2);
    html += `<div>📅 Año ${y} — Visitas: ${arr.length}, Puntuación media: ${r}, Precio medio: €${p}, <strong>Total gastado: €${total}</strong></div>`;
  });
  html += `</div>`;

  host.innerHTML = html;
}

/* HISTORY + delete */
function deleteVisit(id){
  const before = visits.length;
  visits = visits.filter(v=>v.id!==id);
  if(visits.length!==before){
    saveData(); updateDatalists(); renderAll();
  }
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
  data.forEach(v=>{
    const y = new Date(v.date).getFullYear();
    byYear[y] = (byYear[y]||[]).concat(v);
  });

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
          ${new Date(v.date).toLocaleDateString()} — ${v.name} (${v.city}) — ${v.diners} comensales — €${per}/pers.
          <span class="small"> ${stars}</span>
        </div>
        <button class="icon-btn danger" data-del-id="${v.id}" title="Borrar visita">🗑️</button>
      </li>`;
      if(v.notes){
        html += `<li class="small" style="margin:-.3rem 0 .4rem 0">📝 ${v.notes}</li>`;
      }
    });
    html += `</ul></div>`;
  });
  mount.innerHTML = html||'<p class="small">Sin visitas.</p>';

  if(!filterSel.dataset.bound){
    filterSel.addEventListener('change', renderHistory);
    filterSel.dataset.bound = '1';
  }
  mount.querySelectorAll('[data-del-id]').forEach(btn=> btn.addEventListener('click', ()=> deleteVisit(btn.dataset.delId)));
}

/* EXPLORE — case-insensitive city filter, Title Case stored */
function renderExplore(){
  const host = document.getElementById('explore');
  const sel = document.getElementById('cityFilter');

  const prevVal = (sel.value || '*').toLowerCase();

  // Map lowerCity -> displayCity (first seen form)
  const cityMap = new Map();
  visits.forEach(v=>{
    if(!v.city) return;
    const lc = v.city.toLowerCase();
    if(!cityMap.has(lc)) cityMap.set(lc, v.city);
  });
  const keys = ['*', ...Array.from(cityMap.keys()).sort()];
  sel.innerHTML = keys.map(k=>{
    const label = k==='*' ? '🌍 Todas las ciudades' : `🏙️ ${cityMap.get(k)}`;
    return `<option value="${k}">${label}</option>`;
  }).join('');
  sel.value = keys.includes(prevVal) ? prevVal : '*';

  const chosen = sel.value; // '*' or lowercased city key

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

  if(!sel.dataset.bound){
    sel.addEventListener('change', renderExplore);
    sel.dataset.bound = '1';
  }
}

/* FRIENDS (mock) */
const friendsData = [
  {username:'Ana', totalRestaurants:12, avgRating:4.3, avgPrice:25.6,
    restaurants:[
      {name:'Restaurante Sol', city:'Madrid', avgRating:4.5, avgPrice:30},
      {name:'Casa María', city:'Sevilla', avgRating:4.2, avgPrice:22}
    ]},
  {username:'Carlos', totalRestaurants:8, avgRating:3.9, avgPrice:18.2,
    restaurants:[
      {name:'El Puerto', city:'Valencia', avgRating:4.0, avgPrice:20},
      {name:'Arenal', city:'Valencia', avgRating:3.8, avgPrice:17}
    ]},
  {username:'Lucía', totalRestaurants:10, avgRating:4.6, avgPrice:27.0,
    restaurants:[
      {name:'Monte', city:'Oviedo', avgRating:4.8, avgPrice:29},
      {name:'Praia', city:'A Coruña', avgRating:4.4, avgPrice:25}
    ]}
];
function renderFriends(){
  const inp = document.getElementById('friendInput');
  const btn = document.getElementById('btnFriend');
  const dl  = document.getElementById('dl-friends');
  const view= document.getElementById('friendView');
  dl.innerHTML = friendsData.map(f=>`<option value="${f.username}">`).join('');

  function loadFriend(){
    const q = inp.value.trim().toLowerCase();
    if(!q){ view.innerHTML = '<p class="small">Escribe un nombre (Ana, Carlos, Lucía...)</p>'; return; }
    const exact = friendsData.find(x=> x.username.toLowerCase()===q);
    const starts= friendsData.find(x=> x.username.toLowerCase().startsWith(q));
    const contains = friendsData.find(x=> x.username.toLowerCase().includes(q));
    const f = exact || starts || contains;
    if(!f){ view.innerHTML='<p class="small">No encontrado.</p>'; return; }

    // Por ciudad, ordenado por rating desc dentro
    const byCity = {};
    f.restaurants.forEach(r=> (byCity[r.city] = byCity[r.city] || []).push(r) );
    const cityNames = Object.keys(byCity).sort((a,b)=> a.localeCompare(b));
    cityNames.forEach(c=> byCity[c].sort((a,b)=> b.avgRating-a.avgRating || a.name.localeCompare(b.name)));

    let html = `<div class="card"><div class="section-title">${f.username}</div>
      <div>Total de restaurantes: ${f.totalRestaurants}</div>
      <div>Puntuación media: ${f.avgRating}</div>
      <div>Precio medio por persona: €${f.avgPrice}</div>
      <div class="section-title" style="margin-top:.6rem">Clasificación por ciudad</div>`;
    cityNames.forEach(city=>{
      html += `<div class="city-title">🏙️ ${city}</div><ul>`;
      byCity[city].forEach(r=>{
        const stars = '★'.repeat(Math.round(r.avgRating))+'☆'.repeat(5-Math.round(r.avgRating));
        html += `<li>🍴 ${r.name}: ${r.avgRating.toFixed(1)} <span class="small">${stars}</span>, €${r.avgPrice.toFixed(2)}</li>`;
      });
      html += `</ul>`;
    });
    html += `</div>`;

    view.innerHTML = html;
  }

  btn.onclick = loadFriend;
  inp.addEventListener('change', loadFriend);
  inp.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); loadFriend(); } });
}

/* Render all */
function renderAll(){ renderSummary(); renderHistory(); renderExplore(); }

document.addEventListener('DOMContentLoaded', ()=>{
  initTheme(); loadData(); initTabs(); initForm(); updateDatalists(); renderAll(); renderFriends();
});
