import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stampVersion } from '../scripts/version.mjs';
import { fetchCatalog, loadCatalog } from '../src/data/fresh-catalog.js';
import { serializeCatalog } from '../src/admin/content.js';

test('one timestamp versions HTML, CSS and all imports in the source tree without a build', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'word-garden-version-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = pathToFileURL(`${directory}/`);
  for (const path of ['index.html', 'admin.html', 'src', 'assets']) {
    await cp(new URL(`../${path}`, import.meta.url), new URL(path, root), { recursive: true });
  }
  const originalCatalog = await readFile(new URL('src/data/catalog.js', root), 'utf8');
  const current = '1795000000000', latest = '1795000010000';
  for (const version of [current, latest]) {
    assert.equal(await stampVersion(root, Number(version)), version);
    assert.equal(JSON.parse(await readFile(new URL('version.json', root), 'utf8')).version, version);
    const visited = new Set();
    async function checkModule(url) {
      if (visited.has(url.href)) return;
      visited.add(url.href);
      const source = await readFile(url, 'utf8');
      for (const [, path] of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
        const next = new URL(path, url);
        assert.equal(next.searchParams.get('v'), version, path);
        await checkModule(next);
      }
    }
    for (const page of ['index.html', 'admin.html']) {
      const html = await readFile(new URL(page, root), 'utf8');
      assert.ok(html.includes(`name="app-version" content="${version}"`));
      for (const [, path] of html.matchAll(/(?:src|href)="((?:src|assets)\/[^"]+)"/g)) {
        const url = new URL(path, root);
        assert.equal(url.searchParams.get('v'), version);
        if (url.pathname.endsWith('.js')) await checkModule(url);
        else await readFile(url);
      }
      assert.ok(html.includes(page === 'index.html' ? 'href="admin.html"' : 'href="index.html#subjects"'));
    }
    assert.ok(visited.size > 15);
    assert.ok([...visited].some(path => path.endsWith(`catalog.js?v=${version}`)));
    assert.equal(await readFile(new URL('src/data/catalog.js', root), 'utf8'), originalCatalog);
  }
  await assert.rejects(stampVersion(root, 'bad-version'), /timestamp/);
});

test('latest deployed catalog bypasses caches, is parsed as data, and falls back on network failure', async () => {
  const fallback = { chapters: [], lessons: [] };
  const fresh = { chapters: [{ id: 'new-chapter' }], lessons: [] };
  let requested;
  const request = async (url, options) => {
    requested = { url, options };
    return { ok: true, text: async () => serializeCatalog(fresh) };
  };
  const url = new URL('https://example.test/garden/src/data/catalog.js');
  assert.deepEqual(await loadCatalog(fallback, url, request), fresh);
  assert.equal(requested.options.cache, 'no-store');
  assert.ok(new URL(requested.url).searchParams.has('check'));
  assert.equal(new URL(requested.url).pathname, url.pathname);
  assert.deepEqual(await loadCatalog(fallback, url, async () => { throw new Error('Offline'); }), fallback);
  assert.deepEqual(await loadCatalog(fallback, url, async () => ({ ok: false })), fallback);
  const unsafe = async () => ({ ok: true, text: async () => 'export default (() => { throw new Error("executed"); })();' });
  await assert.rejects(fetchCatalog(url, unsafe), /format has changed/);
});
