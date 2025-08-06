// Searchable Select (vanilla JS) - enhances <select> with an input + filtered list
(function(){
  function enhanceSelect(select){
    if(!select || select.dataset.searchableEnhanced) return;
    select.dataset.searchableEnhanced = "1";

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'ss-wrapper';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add('ss-hidden');

    // Input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ss-input';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('placeholder', select.getAttribute('placeholder') || 'Buscar…');
    if(select.required) input.required = true;
    wrapper.insertBefore(input, select);

    // List
    const list = document.createElement('ul');
    list.className = 'ss-list';
    wrapper.appendChild(list);

    // Clear button
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'ss-clear';
    clear.setAttribute('aria-label', 'Limpiar');
    clear.textContent = '×';
    wrapper.appendChild(clear);

    // Toggle button (chevron)
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ss-toggle';
    toggle.setAttribute('aria-label','Abrir/cerrar');
    toggle.textContent = '▾';
    wrapper.appendChild(toggle);

    // Build items
    let options = Array.from(select.options).map(opt => ({
      value: opt.value,
      label: opt.textContent,
      disabled: !!opt.disabled,
      header: (opt.getAttribute && opt.getAttribute('data-ss-header') === '1')
    }));

    function fold(s){ return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

    function rebuildOptions(){
      options = Array.from(select.options).map(opt => ({ value: opt.value, label: opt.textContent }));
    }

    let activeIndex = 0;

    function openList(){ render(input.value); list.style.display = 'block'; }
    function closeList(){ list.style.display = 'none'; }
    function isOpen(){ return list.style.display !== 'none'; }
    function setActive(i){
      const items = list.querySelectorAll('.ss-item:not(.disabled)');
      if(!items.length) return;
      if(i < 0) i = items.length - 1;
      if(i >= items.length) i = 0;
      activeIndex = i;
      list.querySelectorAll('.ss-item').forEach(el => el.classList.remove('active'));
      items[activeIndex].classList.add('active');
      items[activeIndex].scrollIntoView({block:'nearest'});
    }

    function commitCustom(){
      const raw = input.value.trim();
      const isMain = select.id === 'vCountry';
      if(!raw){
        // Vacío: en filtros seleccionar vacío (Todos los países); en vCountry limpiar
        select.value = isMain ? '' : '';
        closeList();
        select.dispatchEvent(new Event('change', {bubbles:true}));
        return;
      }
      // ¿Existe ya?
      const existing = Array.from(select.options).find(o => o.textContent === raw);
      if(existing){
        choose({value: existing.value, label: existing.textContent});
        return;
      }
      // Crear opción personalizada
      const opt = new Option(raw, raw);
      opt.setAttribute('data-ss-custom','1');
      select.add(opt);
      // Sincronizar
      select.value = raw;
      input.value = raw;
      if(typeof rebuildOptions === 'function') rebuildOptions();
      select.dispatchEvent(new Event('change', {bubbles:true}));
      closeList();
    }

    function render(filter="){
      const q = fold(filter.trim().toLowerCase());
      list.innerHTML = '';
      let count = 0;
      options.forEach((o, idx) => {
        const hay = fold(o.label.toLowerCase());
        if(o.header){
          if(!q){
            const h = document.createElement('li');
            h.className = 'ss-header';
            h.textContent = o.label;
            list.appendChild(h);
          }
          return;
        }
        if(!q || hay.includes(q)){
          const li = document.createElement('li');
          li.className = 'ss-item';
          li.textContent = o.label;
          li.dataset.value = o.value;
          if(o.disabled){ li.classList.add('disabled'); }
          if(!o.disabled){ li.addEventListener('click', () => choose(o)); }
          list.appendChild(li);
          if(!o.disabled){ count++; if(count === 1) li.classList.add('active'); }
        }
      });
      if(count){ list.style.display = 'block'; setActive(0); } else { list.style.display = 'none'; }
    }

    function choose(o){
      // Update select
      select.value = o.value;
      // Update input text
      input.value = o.label;
      // Close list
      closeList();
      // Dispatch change for app logic
      select.dispatchEvent(new Event('change', {bubbles:true}));
    }

    function syncFromSelect(){
      const opt = select.options[select.selectedIndex];
      if(opt){
        input.value = opt.textContent;
      }else{
        input.value = '';
      }
    }

    // Init value
    syncFromSelect();
    render("");

    // Events
    input.addEventListener('input', () => { render(input.value); openList(); });
    input.addEventListener('click', () => openList());
    input.addEventListener('blur', () => { setTimeout(()=>{ commitCustom(); }, 120); });
    input.addEventListener('focus', () => openList());
    input.addEventListener('keydown', (e) => {
      // Basic keyboard handling: Enter closes list if there's exact match
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        if(!isOpen()) openList(); else setActive(activeIndex+1);
        return;
      }
      if(e.key === 'ArrowUp'){
        e.preventDefault();
        if(!isOpen()) openList(); else setActive(activeIndex-1);
        return;
      }
      if(e.key === 'Enter'){
        const active = list.querySelector('.ss-item.active') || list.querySelector('.ss-item:not(.disabled)');
        if(active){
          e.preventDefault();
          const val = active.dataset.value;
          const lab = active.textContent;
          choose({value: val, label: lab});
        }
      }
      if(e.key === 'Escape'){
        closeList();
      }
    });

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      if(isOpen()) closeList(); else openList();
      input.focus();
    });

    clear.addEventListener('click', () => { closeList();
      input.value = '';
      select.value = '';
      render("");
      input.focus();
      select.dispatchEvent(new Event('change', {bubbles:true}));
    });

    document.addEventListener('click', (e) => {
      if(!wrapper.contains(e.target)){
        closeList();
      }
    });

    // When the app changes the select programmatically
    const obs = new MutationObserver(() => { rebuildOptions(); syncFromSelect(); render(input.value); });
    obs.observe(select, {attributes:true, childList:true, subtree:true});
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Enhance specific selects if present
    ['vCountry','countryFilter'].forEach(id => {
      const el = document.getElementById(id);
      if(el){ enhanceSelect(el); }
    });
    // Or any select marked explicitly
    document.querySelectorAll('select[data-searchable="true"]').forEach(enhanceSelect);
  
  // Immediate enhance if elements already exist
  ['vCountry','countryFilter'].forEach(id => {
    const el = document.getElementById(id);
    if(el){ enhanceSelect(el); }
  });
})();
