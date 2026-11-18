import { catalogSnapshot } from './data/lessons.js?v=1794964464226';
import { fetchCatalog } from './data/fresh-catalog.js?v=1794964464226';

export function updateURL(href, version) {
  const url = new URL(href);
  url.searchParams.set('v', version);
  return url.href;
}

export function watchUpdates({ version, href, fetchVersion, onUpdate, checkCatalog, now = Date.now }) {
  let checking = false;
  let lastCheck = -Infinity;
  let available = null;
  return async function check() {
    if (checking || available || now() - lastCheck < 15000) return;
    checking = true;
    lastCheck = now();
    try {
      const url = new URL('version.json', href);
      url.searchParams.set('check', String(now()));
      const response = await fetchVersion(url.href, {
        cache: 'no-store', signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return;
      const latest = (await response.json()).version;
      if (typeof latest !== 'string' || !/^\d{13}$/.test(latest)) return;
      if (latest !== version) available = latest;
      else if (checkCatalog && await checkCatalog()) available = String(now());
      else return;
      onUpdate(available);
    } catch {
      // Offline, failed, or timed-out checks must never interrupt practice.
    } finally {
      checking = false;
    }
  };
}

export function startUpdates(document, window) {
  const version = document.querySelector('meta[name="app-version"]')?.content;
  if (!version || version === 'development') return;
  const check = watchUpdates({
    version,
    href: window.location.href,
    fetchVersion: window.fetch.bind(window),
    checkCatalog: async () => JSON.stringify(await fetchCatalog(
      new URL('src/data/catalog.js', window.location.href), window.fetch.bind(window),
    )) !== catalogSnapshot,
    onUpdate(latest) {
      const banner = document.createElement('aside');
      banner.className = 'update-banner';
      banner.setAttribute('aria-label', 'App update');
      const message = document.createElement('p');
      message.setAttribute('role', 'status');
      message.textContent = document.querySelector('.admin-app')
        ? 'A new version is ready. Finish publishing before refreshing.'
        : 'A new version is ready. Refresh when you finish your word.';
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Refresh';
      button.addEventListener('click', () => {
        // Keep the current chapter/hash and other query parameters. No storage
        // is cleared, and no automatic reload can interrupt a word or draft.
        window.location.replace(updateURL(window.location.href, latest));
      });
      banner.append(message, button);
      document.body.append(banner);
    },
  });
  void check();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') void check();
  }, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check();
  });
  window.addEventListener('pageshow', () => void check());
  window.addEventListener('online', () => void check());
}

if (typeof document !== 'undefined') startUpdates(document, window);
