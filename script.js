
// === Firebase init ===
try{
  if(window.FIREBASE_CONFIG && (!firebase.apps || !firebase.apps.length)){
    firebase.initializeApp(window.FIREBASE_CONFIG);
  }
}catch(e){ console.warn('Firebase init error', e); }
const auth = (typeof firebase!=='undefined' && firebase.auth) ? firebase.auth() : null;
const db   = (typeof firebase!=='undefined' && firebase.firestore) ? firebase.firestore() : null;

// === Auth UI helpers ===
function showAuth(show){
  const authView=document.getElementById('authView');
  const appView=document.getElementById('appView');
  if(!authView||!appView) return;
  if(show){ authView.classList.remove('hidden'); appView.classList.add('hidden'); }
  else    { authView.classList.add('hidden'); appView.classList.remove('hidden'); }
}
function askUsername(onSave){
  const modal=document.getElementById('usernameModal');
  const input=document.getElementById('usernameInput');
  const msg=document.getElementById('usernameMsg');
  if(!modal||!input) return;
  msg.textContent='';
  modal.classList.remove('hidden');
  document.getElementById('btnSaveUsername').onclick=async ()=>{
    const u = (input.value||'').trim();
    if(u.length<3){ msg.textContent = 'Mínimo 3 caracteres'; return; }
    try{ await onSave(u); modal.classList.add('hidden'); }catch(e){ msg.textContent = e.message||String(e); }
  };
}

let visits = JSON.parse(localStorage.getItem('visits')||'[]');
function saveVisits(){localStorage.setItem('visits',JSON.stringify(visits));}
function formatTitle(str){return str.toLowerCase().replace(/(^|\s)\S/g,l=>l.toUpperCase());}

document.addEventListener('DOMContentLoaded',()=>{
  const tabs=document.querySelectorAll('#navTabs button');
  const sections=document.querySelectorAll('.tab');
  tabs.forEach(btn=>btn.addEventListener('click',()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      sections.forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab)?.classList.add('active');
      if(btn.dataset.tab==='summary')renderSummary();
      if(btn.dataset.tab==='history')populateHistoryFilter();
      if(btn.dataset.tab==='explore')populateExploreFilters();
      if(btn.dataset.tab==='friends')populateFriends();
  }));

  const vDiners=document.getElementById('vDiners');
  const vTotal=document.getElementById('vTotal');
  const vAvg=document.getElementById('vAvg');
  const currencySelect=document.getElementById('currencySelect');
  function calcAvg(){
    const diners=parseFloat(vDiners.value)||0;
    const total=parseFloat(vTotal.value)||0;
    vAvg.value=diners>0?(total/diners).toFixed(2)+' '+currencySelect.value:'';
  }
  [vDiners,vTotal,currencySelect].forEach(el=>el.addEventListener('input',calcAvg));

  // Theme toggle
  document.getElementById('themeToggleLight').addEventListener('click',()=>{document.documentElement.setAttribute('data-theme','light');localStorage.setItem('theme','light');});
  document.getElementById('themeToggleDark').addEventListener('click',()=>{document.documentElement.setAttribute('data-theme','dark');localStorage.setItem('theme','dark');});
  document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'light');

  // Language
  document.getElementById('langEs').addEventListener('click',()=>applyLang('es'));
  document.getElementById('langEn').addEventListener('click',()=>applyLang('en'));
  function applyLang(lang){
    localStorage.setItem('lang',lang);
    const t=(es,en)=>lang==='en'?en:es;
    document.getElementById('titleApp').textContent=t('🍽️ Mis Restaurantes','🍽️ My Restaurants');
    // Nav tabs
    const navAdd = document.querySelector('#navTabs [data-tab="add"]');
    const navSummary = document.querySelector('#navTabs [data-tab="summary"]');
    const navHistory = document.querySelector('#navTabs [data-tab="history"]');
    const navExplore = document.querySelector('#navTabs [data-tab="explore"]');
    const navFriends = document.querySelector('#navTabs [data-tab="friends"]');
    if(navAdd) navAdd.textContent = t('➕ Añadir visita','➕ Add visit');
    if(navSummary) navSummary.textContent = t('📊 Resumen','📊 Summary');
    if(navHistory) navHistory.textContent = t('📜 Historial','📜 History');
    if(navExplore) navExplore.textContent = t('🌍 Explorar','🌍 Explore');
    if(navFriends) navFriends.textContent = t('👥 Amigos','👥 Friends');

    document.getElementById('labelName').textContent=t('Restaurante 🍴','Restaurant 🍴');
    document.getElementById('labelCity').textContent=t('Ciudad 🏙️','City 🏙️');
    document.getElementById('labelDate').textContent=t('Fecha 📅','Date 📅');
    document.getElementById('labelDiners').textContent=t('Número de comensales 👥','Number of diners 👥');
    document.getElementById('labelTotal').textContent=t('Precio total 💰','Total price 💰');
    document.getElementById('labelAvg').textContent=t('Precio medio por comensal ⚖️','Average price per diner ⚖️');
    document.getElementById('labelNotes').textContent=t('Observaciones 📝','Notes 📝');
    document.getElementById('labelTicket').textContent=t('Ticket 📷','Ticket 📷');
    document.getElementById('labelRating').textContent=t('Valoración ⭐','Rating ⭐');
    document.getElementById('labelFilter').textContent=t('Filtrar por restaurante 🍽️','Filter by restaurant 🍽️');
    document.getElementById('labelCitySel').textContent=t('Selecciona ciudad 🌍','Select city 🌍');
    document.getElementById('labelUserSel').textContent=t('Selecciona usuario 👤','Select user 👤');
    document.getElementById('labelCountrySel').textContent=t('Selecciona país 🌎','Select country 🌎');
    document.getElementById('labelSearch').textContent=t('Buscar restaurante 🔎','Search restaurant 🔎');
    const si=document.getElementById('searchInput'); if(si) si.placeholder=t('Escribe el nombre','Type the name');
    document.getElementById('labelFriendSel').textContent=t('Selecciona amigo 🤝','Select friend 🤝');
    if(window.refreshCountryOptions){ window.refreshCountryOptions(); }
  }
  applyLang(localStorage.getItem('lang')||'es');

  // Ticket preview
  const ticketInput=document.getElementById('ticketInput');
  const ticketPreview=document.getElementById('ticketPreview');
  const ticketImage=document.getElementById('ticketImage');
  document.getElementById('removeTicket').addEventListener('click',()=>{ticketPreview.classList.add('hidden');ticketInput.value='';});
  ticketInput.addEventListener('change',()=>{const file=ticketInput.files[0];if(file){ticketImage.src=URL.createObjectURL(file);ticketPreview.classList.remove('hidden');}});

  // Stars rating
  const stars=document.querySelectorAll('#stars span');
  const rating=document.getElementById('vRating');
  stars.forEach(star=>star.addEventListener('click',()=>{
      const val=+star.dataset.value;
      rating.value=val;
      stars.forEach(s=>s.classList.toggle('selected',s.dataset.value<=val));
  }));

  // Submit
  document.getElementById('visitForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=formatTitle(vName.value.trim());
    visits.push({name:name,city:formatTitle(vCity.value.trim()),country:document.getElementById('vCountry').value,date:vDate.value,diners:+vDiners.value,total:+vTotal.value,currency:currencySelect.value,notes:vNotes.value,rating:+rating.value});
    saveVisits();
    e.target.reset();vAvg.value='';rating.value=0;stars.forEach(s=>s.classList.remove('selected'));ticketPreview.classList.add('hidden');
  });
});

// Summary

function getRestaurantIcon(name){
  const lower=name.toLowerCase();
  if(lower.includes('sushi')) return '🍣';
  if(lower.includes('pizza')) return '🍕';
  if(lower.includes('burger')||lower.includes('hamburg')) return '🍔';
  if(lower.includes('taco')) return '🌮';
  if(lower.includes('salad')||lower.includes('ensalada')) return '🥗';
  if(lower.includes('steak')||lower.includes('carne')) return '🥩';
  return '🍽️';
}
function formatTitle(str){return str.toLowerCase().replace(/(^|\s)\S/g,l=>l.toUpperCase());}
function renderSummary(){

  let html='<h3>Por restaurante</h3>';
  const grouped={};
  visits.forEach(v=>{
    const key=v.name.toLowerCase()+'|'+v.city.toLowerCase();
    if(!grouped[key])grouped[key]={visits:0,total:0,ratings:[],name:v.name,city:v.city};
    grouped[key].visits++;grouped[key].total+=v.total;grouped[key].ratings.push(v.rating);
  });
  for(const k in grouped){
    const g=grouped[k];
    const avgPrice=(g.total/g.visits).toFixed(2);
    const avgRating=(g.ratings.reduce((a,b)=>a+b,0)/g.visits).toFixed(1);
    html+=`<div class="card"><h4>${getRestaurantIcon(g.name)} ${formatTitle(g.name)}</h4>Ciudad: ${formatTitle(g.city)}<br>Visitas: ${g.visits}<br>⭐${avgRating}<br>Total: ${g.total} €<br>Precio medio: ${avgPrice} €</div>`;
  }
  html+='<h3>Por año</h3>';
  const yearly={};
  visits.forEach(v=>{
    const year=v.date.split('-')[0];
    if(!yearly[year])yearly[year]={visits:0,total:0};
    yearly[year].visits++;yearly[year].total+=v.total;
  });
  for(const y in yearly){
    const g=yearly[y];
    html+=`<div class="card"><h4>${y}</h4>Visitas: ${g.visits}<br>Total gastado: ${g.total} €<br>Media: ${(g.total/g.visits).toFixed(2)} €</div>`;
  }
  document.getElementById('summary').innerHTML=html;
}

function populateHistoryFilter(){
  const sel=document.getElementById('histFilter');
  const restaurants=[...new Set(visits.map(v=>v.name))];
  sel.innerHTML='<option value="">Todos</option>'+restaurants.map(r=>`<option>${r}</option>`).join('');
  renderHistory();
  sel.addEventListener('change',renderHistory);
}

function renderHistory(){
  const sel=document.getElementById('histFilter');
  const filter=sel.value.toLowerCase();
  let data=filter?visits.filter(v=>v.name.toLowerCase()===filter):visits;
  let html='';
  data.forEach((v,i)=>{html+=`<div class="card"><h4>${getRestaurantIcon(v.name)} ${formatTitle(v.name)}</h4>${v.date} (${v.city}) ⭐${v.rating} - ${v.total}${v.currency} <button onclick="deleteVisit(${i})">🗑️</button></div>`;});
  document.getElementById('history').innerHTML=html;
}
function deleteVisit(i){visits.splice(i,1);saveVisits();renderHistory();}

function populateExploreFilters(){
  const citySel=document.getElementById('cityFilter');
  const cities=[...new Set(visits.map(v=>v.city))];
  citySel.innerHTML='<option value="all">Todas las ciudades</option>'+cities.map(c=>`<option>${c}</option>`).join('');
  const countries=[...new Set(visits.map(v=>v.country||''))];
  document.getElementById('countryFilter').onchange=renderExplore;
  citySel.onchange=renderExplore;
  document.getElementById('friendExplore').innerHTML='<option>Usuario1</option>';
}
function renderExplore(){
  const city=document.getElementById('cityFilter').value.toLowerCase();
  const country=document.getElementById('countryFilter').value.toLowerCase();
  const search=document.getElementById('searchInput').value.toLowerCase();
  let data=visits.filter(v=>(!city||city==='all'||v.city.toLowerCase()===city)&&(!country||country==='all'||(v.country||'').toLowerCase()===country)&&(!search||v.name.toLowerCase().includes(search)));
  let html='';
  data.forEach(v=>{
    html+=`<div class="card"><h4>${getRestaurantIcon(v.name)} ${formatTitle(v.name)}</h4>Ciudad: ${v.city} - País: ${v.country||''}<br>⭐${v.rating} - ${(v.total/v.diners).toFixed(2)} ${v.currency} <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name+' '+v.city+' '+(v.country||''))}" target="_blank">Maps</a></div>`;
  });
  document.getElementById('explore').innerHTML=html;
}
function populateFriends(){
  let users=[...new Set(visits.map(v=>v.user||'Usuario1'))];document.getElementById('friendSelect').innerHTML='<option value="all">Todos los usuarios</option>'+users.map(u=>`<option>${u}</option>`).join('');
  document.getElementById('friendView').innerHTML='<div class="card"><h4>Usuario1</h4>(Resumen de amigos no implementado en local)</div>';
}

document.getElementById('langEs').addEventListener('click',()=>{document.getElementById('langEs').classList.add('selected');document.getElementById('langEn').classList.remove('selected');});
document.getElementById('langEn').addEventListener('click',()=>{document.getElementById('langEn').classList.add('selected');document.getElementById('langEs').classList.remove('selected');});
document.getElementById('themeToggleLight').addEventListener('click',()=>{document.getElementById('themeToggleLight').classList.add('selected');document.getElementById('themeToggleDark').classList.remove('selected');});
document.getElementById('themeToggleDark').addEventListener('click',()=>{document.getElementById('themeToggleDark').classList.add('selected');document.getElementById('themeToggleLight').classList.remove('selected');});

document.getElementById('searchInput').addEventListener('input', renderExplore);

// Firebase integration placeholder
function saveVisitToFirestore(visit){
  db.collection('visits').add(visit)
    .then(()=>console.log('Saved to Firestore'))
    .catch(console.error);
}


// === Auth wiring ===
document.addEventListener('DOMContentLoaded',()=>{
  const email = document.getElementById('authEmail');
  const pass  = document.getElementById('authPassword');
  const msg   = document.getElementById('authMsg');

  function say(m){ if(msg) msg.textContent = m||''; }

  if(document.getElementById('btnRegister')){
    document.getElementById('btnRegister').addEventListener('click', async ()=>{
      if(!auth){ showAuth(false); return; } // fallback
      try{
        const cred = await auth.createUserWithEmailAndPassword((email.value||'').trim(), pass.value||'');
        say('Cuenta creada');
      }catch(e){
        if(e && e.code==='auth/email-already-in-use'){
          try{
            await auth.signInWithEmailAndPassword((email.value||'').trim(), pass.value||'');
            say('Sesión iniciada');
          }catch(e2){ say(e2.message||String(e2)); }
        }else{
          say(e.message||String(e));
        }
      }
    });
  }
  if(document.getElementById('btnLogin')){
    document.getElementById('btnLogin').addEventListener('click', async ()=>{
      if(!auth){ showAuth(false); return; }
      try{
        await auth.signInWithEmailAndPassword((email.value||'').trim(), pass.value||'');
        say('Sesión iniciada');
      }catch(e){ say(e.message||String(e)); }
    });
  }
  if(document.getElementById('btnReset')){
    document.getElementById('btnReset').addEventListener('click', async ()=>{
      if(!auth){ say(''); return; }
      try{ await auth.sendPasswordResetEmail((email.value||'').trim()); say('Email de restablecimiento enviado'); }
      catch(e){ say(e.message||String(e)); }
    });
  }
  if(document.getElementById('btnLogout')){
    document.getElementById('btnLogout').addEventListener('click', async ()=>{
      if(auth){ await auth.signOut(); }
    });
  }

  if(auth){
    auth.onAuthStateChanged(async (user)=>{
      if(user){
        // Ensure username document
        try{
          if(db){
            const ref = db.collection('users').doc(user.uid);
            const snap = await ref.get();
            if(!snap.exists || !snap.data() || !snap.data().username){
              askUsername(async (uname)=>{
                await ref.set({ email:user.email, username: uname, createdAt: new Date() }, { merge:true });
              });
            }
          }
        }catch(e){ console.warn('Username check error', e); }
        showAuth(false);
      }else{
        showAuth(true);
      }
    });
  }else{
    // No Firebase => show app
    showAuth(false);
  }
});

// Hook auth labels into applyLang if it exists
(function(){
  const prevApply = window.applyLang;
  window.applyLang = function(lang){
    if(prevApply) prevApply(lang);
    const t=(es,en)=>lang==='en'?en:es;
    const set=(id,es,en)=>{ const el=document.getElementById(id); if(el) el.textContent=t(es,en); };
    set('authTitle','Iniciar sesión','Sign in');
    set('labelEmail','Correo','Email');
    set('labelPassword','Contraseña','Password');
    const btnR=document.getElementById('btnRegister'); if(btnR) btnR.textContent=t('Crear cuenta','Create account');
    const btnL=document.getElementById('btnLogin'); if(btnL) btnL.textContent=t('Entrar','Sign in');
    const btnF=document.getElementById('btnReset'); if(btnF) btnF.textContent=t('¿Olvidaste la contraseña?','Forgot password?');
    const uTitle=document.getElementById('usernameTitle'); if(uTitle) uTitle.textContent=t('Elige tu nombre de usuario','Choose your username');
    const uIn=document.getElementById('usernameInput'); if(uIn) uIn.placeholder=t('Tu nombre de usuario','Your username');
    const uBtn=document.getElementById('btnSaveUsername'); if(uBtn) uBtn.textContent=t('Guardar','Save');
    const lo=document.getElementById('btnLogout'); if(lo) lo.title=t('Salir','Sign out');
  };
  // call with stored lang to refresh labels
  try{ window.applyLang(localStorage.getItem('lang')||'es'); }catch(_){}
})();
