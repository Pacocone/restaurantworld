// install.js: registers the SW and adds an "Install" floating button on Android
(function(){
  // Register SW
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/restaurantworld/sw.js?ver=1').catch(console.warn);
    });
  }

  let deferredPrompt = null;
  let btn = null;

  function ensureButton(){
    // Use existing button if present
    btn = document.getElementById('btnInstallApp');
    if (btn) return btn;

    // Otherwise create a floating button
    btn = document.createElement('button');
    btn.id = 'btnInstallApp';
    btn.textContent = '⬇️ Instalar';
    btn.style.position = 'fixed';
    btn.style.right = '12px';
    btn.style.bottom = '12px';
    btn.style.padding = '10px 14px';
    btn.style.border = '0';
    btn.style.borderRadius = '24px';
    btn.style.fontWeight = '600';
    btn.style.boxShadow = '0 4px 14px rgba(0,0,0,.25)';
    btn.style.background = '#ff6d00';
    btn.style.color = '#000';
    btn.style.cursor = 'pointer';
    btn.style.zIndex = '9999';
    btn.style.display = 'none'; // hidden by default
    document.body.appendChild(btn);
    return btn;
  }

  // Detect standalone to hide the button
  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const b = ensureButton();
    if (!isStandalone()) b.style.display = 'inline-block';
  });

  window.addEventListener('appinstalled', () => {
    if (btn) btn.style.display = 'none';
    deferredPrompt = null;
  });

  document.addEventListener('click', async (ev) => {
    const target = ev.target;
    if (!target) return;
    if (target.id === 'btnInstallApp') {
      if (!deferredPrompt) { target.style.display = 'none'; return; }
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch {}
      target.style.display = 'none';
      deferredPrompt = null;
    }
  });
})();
