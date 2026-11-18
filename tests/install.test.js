import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startInstall } from '../src/install.js';

function setup(standalone = false) {
  const events = {}, mediaEvents = {}, clicks = {};
  const button = { hidden: true, addEventListener: (name, fn) => { clicks[name] = fn; } };
  const status = { hidden: true, textContent: '' };
  const document = { querySelector: selector => selector === '#install-app' ? button : status };
  const window = {
    navigator: {},
    matchMedia: () => ({ matches: standalone, addEventListener: (name, fn) => { mediaEvents[name] = fn; } }),
    addEventListener: (name, fn) => { events[name] = fn; },
    get localStorage() { throw new Error('Installation must not touch saved progress'); },
  };
  startInstall(document, window);
  return { events, mediaEvents, clicks, button, status };
}

test('install waits for browser eligibility and a user tap; dismissal consumes the prompt', async () => {
  const app = setup();
  let prevented = 0, prompted = 0;
  const prompt = {
    preventDefault: () => { prevented++; },
    prompt: async () => { prompted++; },
    userChoice: Promise.resolve({ outcome: 'dismissed' }),
  };
  assert.equal(app.button.hidden, true);
  app.events.beforeinstallprompt(prompt);
  assert.equal(prevented, 1);
  assert.equal(prompted, 0);
  assert.equal(app.button.hidden, false);
  await app.clicks.click();
  await app.clicks.click();
  assert.equal(prompted, 1);
  assert.equal(app.button.hidden, true);
  assert.equal(app.status.hidden, true);
  app.events.beforeinstallprompt(prompt);
  assert.equal(app.button.hidden, false);
});

test('accepting begins installation; completion removes install promotion', async () => {
  const app = setup();
  app.events.beforeinstallprompt({
    preventDefault() {}, prompt: async () => {},
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  await app.clicks.click();
  assert.match(app.status.textContent, /Installation started/);
  app.events.appinstalled();
  assert.match(app.status.textContent, /is installed/);
  assert.equal(app.button.hidden, true);
  app.events.beforeinstallprompt({ preventDefault() { assert.fail('Already installed'); } });
  assert.equal(app.button.hidden, true);
});

test('failed prompt gives browser-menu instructions and cannot be reused', async () => {
  const app = setup();
  let calls = 0;
  app.events.beforeinstallprompt({
    preventDefault() {}, prompt: async () => { calls++; throw new Error('Unavailable'); },
  });
  await app.clicks.click();
  await app.clicks.click();
  assert.equal(calls, 1);
  assert.equal(app.status.hidden, false);
  assert.match(app.status.textContent, /browser menu/);
});

test('standalone launches and switches do not offer installation', async () => {
  const launched = setup(true);
  launched.events.beforeinstallprompt({ preventDefault() { assert.fail('Standalone'); } });
  assert.equal(launched.button.hidden, true);
  const app = setup();
  app.events.beforeinstallprompt({ preventDefault() {}, prompt() { assert.fail('Stale prompt'); } });
  app.mediaEvents.change({ matches: true });
  assert.equal(app.button.hidden, true);
  await app.clicks.click();
});

test('manifest launches inside either root or GitHub Pages project scope with valid PNG icons', async () => {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
  for (const base of ['https://example.test/', 'https://example.github.io/little-word-garden/']) {
    const manifestURL = new URL('manifest.webmanifest', base);
    assert.equal(new URL(manifest.id, manifestURL).href, base);
    assert.equal(new URL(manifest.scope, manifestURL).href, base);
    assert.equal(new URL(manifest.start_url, manifestURL).href, `${base}#subjects`);
    for (const icon of manifest.icons) {
      assert.ok(new URL(icon.src, manifestURL).href.startsWith(base));
    }
  }
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(icon.src, root));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});
