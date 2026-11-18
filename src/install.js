// Chrome owns install eligibility. Only offer a button with a usable prompt.
// Installation adds a launcher; the app continues to load online as before.
export function startInstall(document, window) {
  const button = document.querySelector('#install-app');
  const status = document.querySelector('#install-status');
  if (!button || !status) return;

  const standalone = window.matchMedia('(display-mode: standalone)');
  let pending = null;
  let installed = standalone.matches || window.navigator.standalone === true;

  function hideInstall() {
    pending = null;
    button.hidden = true;
  }

  window.addEventListener('beforeinstallprompt', event => {
    if (installed) return;
    event.preventDefault();
    pending = event;
    status.hidden = true;
    button.hidden = false;
  });

  button.addEventListener('click', async () => {
    if (!pending) return;
    const prompt = pending;
    hideInstall(); // A browser prompt can only be used once.
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        hideInstall();
        status.textContent = 'Installation started. Look for Word Garden on your home screen.';
        status.hidden = false;
      }
    } catch {
      status.textContent = 'To install, open your browser menu and choose Install app or Add to Home screen.';
      status.hidden = false;
    }
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    hideInstall();
    status.textContent = 'Word Garden is installed. Open it from your home screen.';
    status.hidden = false;
  });
  standalone.addEventListener('change', event => {
    installed = event.matches || installed;
    if (installed) {
      hideInstall();
      status.hidden = true;
    }
  });
}

if (typeof document !== 'undefined') startInstall(document, window);
