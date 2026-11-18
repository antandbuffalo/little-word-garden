import test from 'node:test';
import assert from 'node:assert/strict';
import { updateURL, watchUpdates, startUpdates } from '../src/updates.js';

const current = '1795000000000';
const latest = '1795000010000';
const href = 'https://example.github.io/little-word-garden/?v=old&source=phone#chapter/energy';
const reply = version => ({ ok: true, json: async () => ({ version }) });

test('refresh bypasses cached HTML while preserving project path, query and chapter', () => {
  const url = new URL(updateURL(href, latest));
  assert.equal(url.pathname, '/little-word-garden/');
  assert.equal(url.searchParams.get('v'), latest);
  assert.equal(url.searchParams.get('source'), 'phone');
  assert.equal(url.hash, '#chapter/energy');
  assert.equal(new URL(updateURL('https://example.test/game/admin.html#draft', latest)).pathname, '/game/admin.html');
});

test('checks bypass caches and prompt once only when the release changes', async () => {
  let time = 0;
  let version = current;
  const notices = [], requests = [];
  const check = watchUpdates({
    version: current, href, now: () => time,
    fetchVersion: async (url, options) => { requests.push({ url, options }); return reply(version); },
    onUpdate: next => notices.push(next),
  });
  await check();
  assert.deepEqual(notices, []);
  assert.equal(new URL(requests[0].url).pathname, '/little-word-garden/version.json');
  assert.equal(requests[0].options.cache, 'no-store');
  assert.ok(requests[0].options.signal instanceof AbortSignal);
  version = latest;
  await check();
  assert.equal(requests.length, 1);
  time = 15000;
  await check();
  assert.deepEqual(notices, [latest]);
  assert.notEqual(requests[0].url, requests[1].url);
  time = 30000;
  await check();
  assert.equal(requests.length, 2);
});

test('offline, missing, malformed and timed-out checks allow later retries', async () => {
  let time = 0;
  const replies = [
    () => { throw new Error('Offline'); },
    () => ({ ok: false }),
    () => ({ ok: true, json: async () => { throw new SyntaxError('Not JSON'); } }),
    () => reply('<script>invalid</script>'),
    () => { throw new DOMException('Timed out', 'TimeoutError'); },
    () => reply(latest),
  ];
  const notices = [];
  const check = watchUpdates({
    version: current, href, now: () => time,
    fetchVersion: async () => replies.shift()(), onUpdate: next => notices.push(next),
  });
  for (let i = 0; i < 6; i++) {
    await check();
    assert.equal(notices.length, i === 5 ? 1 : 0);
    time += 15000;
  }
});

test('simultaneous foreground and periodic checks share one request', async () => {
  let resolve;
  let requests = 0;
  const notices = [];
  const check = watchUpdates({
    version: current, href,
    fetchVersion: () => { requests++; return new Promise(done => { resolve = done; }); },
    onUpdate: next => notices.push(next),
  });
  const pending = check();
  await check();
  resolve(reply(latest));
  await pending;
  assert.equal(requests, 1);
  assert.deepEqual(notices, [latest]);
});

test('content-only admin publishing offers Refresh without a new release timestamp', async () => {
  const notices = [];
  let changed = false, time = Number(latest);
  const check = watchUpdates({
    version: current, href, now: () => time,
    fetchVersion: async () => reply(current),
    checkCatalog: async () => changed,
    onUpdate: next => notices.push(next),
  });
  await check();
  assert.deepEqual(notices, []);
  changed = true;
  time += 15000;
  await check();
  assert.deepEqual(notices, [String(time)]);
});

test('mobile prompt waits for a tap, checks on resume and never touches storage', async () => {
  const nodes = [], documentEvents = {}, windowEvents = {}, timers = [];
  let navigated;
  const document = {
    visibilityState: 'visible',
    querySelector: selector => selector === 'meta[name="app-version"]' ? { content: current } : null,
    addEventListener: (name, fn) => { documentEvents[name] = fn; },
    body: { append: node => nodes.push(node) },
    createElement: tag => ({
      tag, children: [], events: {}, attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; },
      append(...children) { this.children.push(...children); },
      addEventListener(name, fn) { this.events[name] = fn; },
    }),
  };
  const window = {
    location: { href, replace: url => { navigated = url; } },
    fetch: async () => reply(latest),
    setInterval: (fn, ms) => timers.push({ fn, ms }),
    addEventListener: (name, fn) => { windowEvents[name] = fn; },
    get localStorage() { throw new Error('Update must not touch storage'); },
  };
  startUpdates(document, window);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes.length, 1);
  assert.equal(navigated, undefined);
  const [message, button] = nodes[0].children;
  assert.equal(message.attributes.role, 'status');
  assert.equal(button.textContent, 'Refresh');
  assert.equal(timers[0].ms, 300000);
  assert.equal(typeof documentEvents.visibilitychange, 'function');
  assert.equal(typeof windowEvents.pageshow, 'function');
  assert.equal(typeof windowEvents.online, 'function');
  button.events.click();
  assert.equal(navigated, updateURL(href, latest));
  documentEvents.visibilitychange();
  windowEvents.pageshow();
  windowEvents.online();
  timers[0].fn();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(nodes.length, 1);
});
