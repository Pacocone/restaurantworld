// Script mínimo (puedes reemplazar por tu lógica actual)
function setTheme(mode){ document.documentElement.setAttribute('data-theme', mode); localStorage.setItem('theme', mode); }
function initTheme(){
  const saved = localStorage.getItem('theme') || 'auto';
  setTheme(saved);
  document.getElementById('themeDark').onclick=()=>setTheme('dark');
  document.getElementById('themeLight').onclick=()=>setTheme('light');
  document.getElementById('themeAuto').onclick=()=>setTheme('auto');
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
function updateAvg(){
  const diners = Number(document.getElementById('vDiners').value)||0;
  const total  = Number(document.getElementById('vTotal').value)||0;
  document.getElementById('vAvg').value = diners>0 ? (total/diners).toFixed(2) : '';
}
function initForm(){
  ['vDiners','vTotal'].forEach(id => document.getElementById(id).addEventListener('input', updateAvg));
  updateAvg();
  const stars = document.getElementById('stars');
  const v = document.getElementById('vRatingValue');
  function paint(n){ stars.querySelectorAll('[data-value]').forEach(btn=>{ const val = Number(btn.dataset.value); btn.classList.toggle('selected', val>0 && val<=n); }); }
  stars.addEventListener('click', (e)=>{ const btn = e.target.closest('button[data-value]'); if(!btn) return; const n = Number(btn.dataset.value); document.getElementById('vRatingValue').value = n; paint(n); });
  paint(Number(v.value||0));
  document.getElementById('btnMaps').onclick=()=>{
    const q = encodeURIComponent(document.getElementById('vMaps').value || document.getElementById('vName').value);
    if(q) window.open(`https://www.google.com/maps/search/${q}`,'_blank');
  };
}
function initShare(){
  document.getElementById('btnShare').addEventListener('click', async ()=>{
    const url = window.location.href.split('#')[0];
    if(navigator.share){
      try{ await navigator.share({title:'Mis Restaurantes', text:'Pruébala', url}); }catch{}
    }else{
      try{ await navigator.clipboard.writeText(url); alert('Enlace copiado'); }catch{ alert(url); }
    }
  });
}
document.addEventListener('DOMContentLoaded', ()=>{
  initTheme(); initTabs(); initForm(); initShare();
});