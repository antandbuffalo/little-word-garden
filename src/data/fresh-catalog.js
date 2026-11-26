import { parseCatalog } from '../admin/content.js?v=1795702967401';

export async function fetchCatalog(url, request = globalThis.fetch) {
  const fresh = new URL(url);
  fresh.searchParams.set('check', String(Date.now()));
  const response = await request(fresh.href, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Could not load the latest words.');
  return parseCatalog(await response.text());
}

export async function loadCatalog(fallback, url, request) {
  try { return await fetchCatalog(url, request); }
  catch { return fallback; }
}
