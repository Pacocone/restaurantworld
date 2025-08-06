
// Country typing fallback: forces text input + datalist for country fields (works even if custom dropdown fails)
(function(){
  function fold(s){ return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function prettyCase(s){
  const minors = new Set(['de','del','la','las','los','y','and','of','the']);
  return s.split(/\s+/).map((w,i)=>{
    const lw = w.toLowerCase();
    if(i>0 && minors.has(lw)) return lw;
    return lw.charAt(0).toUpperCase() + lw.slice(1);
  }).join(' ');
}

  const COUNTRIES = ["España", "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Baréin", "Bélgica", "Belice", "Benín", "Bielorrusia", "Birmania (Myanmar)", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Colombia", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Esuatini", "Etiopía", "Fiyi", "Filipinas", "Finlandia", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Guyana", "Haití", "Honduras", "Hungría", "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia", "Jamaica", "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait", "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo", "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República del Congo", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumanía", "Rusia", "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam", "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda", "Uruguay", "Uzbekistán", "Vanuatu", "Vaticano", "Venezuela", "Vietnam", "Yemen", "Yibuti", "Zambia", "Zimbabue"];

  function makeInputForSelect(sel, opts){ 
    if(!sel || sel.dataset.ctEnhanced) return;
    sel.dataset.ctEnhanced = "1";

    const isMain = sel.id === 'vCountry';
    const parent = sel.parentNode;

    // Create input + datalist
    const input = document.createElement('input');
    input.type = 'text';
    input.id = sel.id + '_input';
    input.setAttribute('list', sel.id + '_datalist');
    input.setAttribute('placeholder', sel.getAttribute('placeholder') || (isMain ? 'Escribe un país / Type a country' : 'Escribe un país / Type a country'));
    input.autocomplete = 'off';
    input.style.margin = sel.style.margin || '';
    input.style.width = '100%';

    const dl = document.createElement('datalist');
    dl.id = sel.id + '_datalist';

    // Build options
    const unique = Array.from(new Set(COUNTRIES));
    unique.forEach(name => { 
      const o = document.createElement('option');
      o.value = name;
      dl.appendChild(o);
    });

    // Insert before the select, then hide select (but keep for app logic)
    parent.insertBefore(input, sel);
    parent.insertBefore(dl, sel);
    sel.style.display = 'none';

    // Seed value
    if(isMain && !sel.value) input.value = 'España';
    if(!isMain && !sel.value) input.value = '';

    // Sync helpers
    function commit(){
      let val = (input.value || '').trim();
      if(val){
        // Try to map to canonical country (ignoring case/accents)
        const f = fold(val);
        const found = COUNTRIES.find(c => fold(c) === f);
        if(found){ val = found; }
        else { val = prettyCase(val); }
      }
      input.value = val;
      sel.value = val;
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    }

    input.addEventListener('input', commit);
    input.addEventListener('change', commit);
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); input.blur(); } });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ['vCountry','countryFilter'].forEach(id => makeInputForSelect(document.getElementById(id)));
  });
})();
