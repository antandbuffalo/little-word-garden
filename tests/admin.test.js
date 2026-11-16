import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import catalog from '../src/data/catalog.js';
import { subjects } from '../src/data/lessons.js';
import { parseCatalog, serializeCatalog, validateWords, addWords } from '../src/admin/content.js';
import { createGitHubClient } from '../src/admin/github.js';
import { TOKEN_KEY, tokenStore } from '../src/admin/token.js';
import { playScreen } from '../src/screens/play.js';
import { revealScreen } from '../src/screens/reveal.js';
import { summaryScreen } from '../src/screens/summary.js';
import { subjectScreen } from '../src/screens/subjects.js';
import { chapterScreen } from '../src/screens/chapters.js';
import { homeScreen } from '../src/screens/home.js';

const selection = { subjectId: 'science', chapterId: 'energy', lessonId: 'energy-hard-words', words: [{ clue: 'The star that warms us.', word: 'sun' }] };

test('catalog round trips as data and never executes downloaded JavaScript', async () => {
  assert.deepEqual(parseCatalog(serializeCatalog(catalog)), catalog);
  assert.deepEqual(parseCatalog(await readFile(new URL('../src/data/catalog.js', import.meta.url), 'utf8')), catalog);
  assert.throws(() => parseCatalog('export default (() => { throw new Error("executed"); })();'), /format has changed/);
  assert.throws(() => parseCatalog(serializeCatalog({ chapters: [], lessons: null })), /does not contain/);
});

test('word cards validate separate clues and words, normalize phrases, and keep clue punctuation', () => {
  assert.deepEqual(validateWords([
    { clue: ' A pet. ', word: 'CAT' },
    { clue: 'Energy | power.\nUsed for lights.', word: 'Electrical   energy' },
  ]), [
    { clue: 'A pet.', word: 'cat' },
    { clue: 'Energy | power.\nUsed for lights.', word: 'electrical energy' },
  ]);
  assert.throws(() => validateWords([]), /at least one/);
  assert.throws(() => validateWords([{ clue: ' ', word: 'cat' }]), /Card 1: add a clue/);
  for (const word of ['', 'a', 'café', 'cats!']) {
    assert.throws(() => validateWords([{ clue: 'Clue', word }]), /Card 1/);
  }
  assert.throws(() => validateWords([
    { clue: 'A pet.', word: 'cat' }, { clue: 'Another pet.', word: ' CAT ' },
  ]), /Card 2:.*more than once/);
});

test('adding words preserves existing content, collection IDs and input catalog', () => {
  const before = serializeCatalog(catalog);
  const result = addWords(catalog, selection, subjects);
  assert.equal(serializeCatalog(catalog), before);
  assert.deepEqual(result.catalog.chapters, catalog.chapters);
  assert.deepEqual(result.catalog.lessons[0], catalog.lessons[0]);
  assert.deepEqual(result.lesson.words.slice(0, -1), catalog.lessons[1].words);
  assert.deepEqual(result.lesson.words.at(-1), selection.words[0]);
  assert.equal(result.lesson.id, 'energy-hard-words');
  assert.throws(() => addWords(result.catalog, selection, subjects), /already in/);
  assert.throws(() => addWords(catalog, { ...selection, subjectId: 'other' }, subjects), /subject/);
  assert.throws(() => addWords(catalog, { ...selection, chapterId: 'missing' }, subjects), /chapter/);
});

test('new chapters get stable, unique IDs and a default collection without an icon field for words', () => {
  const first = addWords(catalog, { ...selection, subjectId: 'english', chapterId: '__new__', chapterTitle: 'Energy' }, subjects);
  assert.equal(first.chapter.id, 'energy-2');
  assert.equal(first.chapter.subjectId, 'english');
  assert.equal(first.lesson.chapterId, first.chapter.id);
  assert.equal(first.lesson.words[0].icon, undefined);
  assert.throws(() => addWords(first.catalog, { ...selection, subjectId: 'english', chapterId: '__new__', chapterTitle: 'energy' }, subjects), /already exists/);
  assert.throws(() => addWords(catalog, { ...selection, chapterId: '__new__', chapterTitle: '  ' }, subjects), /chapter name/);
  const emptyChapter = { ...catalog, chapters: [...catalog.chapters, { id: 'plants', subjectId: 'science', title: 'Plants' }] };
  assert.equal(addWords(emptyChapter, { ...selection, chapterId: 'plants' }, subjects).lesson.words.length, 1);
  const namedNew = addWords(catalog, { ...selection, chapterId: '__new__', chapterTitle: 'New' }, subjects);
  assert.equal(namedNew.chapter.id, 'new');
  const extended = addWords(namedNew.catalog, { ...selection, chapterId: 'new', words: [{ clue: 'A pet.', word: 'cat' }] }, subjects);
  assert.equal(extended.lesson.words.length, 2);
});

test('chapters with multiple collections require an explicit collection selection', () => {
  const multiple = { ...catalog, lessons: [...catalog.lessons, { id: 'extra', chapterId: 'energy', title: 'More', words: [] }] };
  assert.throws(() => addWords(multiple, { ...selection, lessonId: '' }, subjects), /collection/);
  const result = addWords(multiple, { ...selection, lessonId: 'extra' }, subjects);
  assert.deepEqual(result.catalog.lessons[1], catalog.lessons[1]);
  assert.equal(result.lesson.id, 'extra');
});

test('GitHub publishing commits UTF-8 data using the loaded SHA and default branch', async () => {
  const calls = [];
  const encoded = Buffer.from(serializeCatalog(catalog)).toString('base64');
  const replies = [{ default_branch: 'main' }, { content: encoded, sha: 'old-sha' }, { content: { sha: 'new-sha' }, commit: { html_url: 'https://github.com/antandbuffalo/little-word-garden/commit/123' } }];
  const client = createGitHubClient('test-token', async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => replies.shift() };
  });
  const snapshot = await client.load();
  assert.deepEqual(snapshot, { catalog, branch: 'main', sha: 'old-sha' });
  const added = addWords(catalog, selection, subjects);
  const result = await client.publish(snapshot, added.catalog, added.added);
  assert.equal(result.sha, 'new-sha');
  assert.match(calls[1].url, /contents\/src\/data\/catalog.js\?ref=main$/);
  assert.equal(calls[2].options.method, 'PUT');
  assert.equal(calls[2].options.headers.Authorization, 'Bearer test-token');
  const body = JSON.parse(calls[2].options.body);
  assert.equal(body.sha, 'old-sha');
  assert.equal(body.branch, 'main');
  assert.deepEqual(parseCatalog(Buffer.from(body.content, 'base64').toString('utf8')), added.catalog);
  assert.ok(!JSON.stringify(body).includes('test-token'));
});

test('GitHub errors explain rejected tokens, conflicts and uncertain network outcomes', async () => {
  for (const [code, message] of [[401, /rejected/], [403, /denied/], [404, /not found/], [409, /changed/], [422, /branch rules/], [500, /could not complete/]]) {
    const client = createGitHubClient('token', async () => ({ ok: false, status: code }));
    await assert.rejects(client.load(), message);
  }
  const client = createGitHubClient('token', async () => { throw new Error('network'); });
  await assert.rejects(client.load(), /connection/);
  await assert.rejects(client.publish({ branch: 'main', sha: 'old' }, catalog, 1), /may have succeeded/);
});

test('saved tokens reload and clear without touching game progress; storage failures are handled', () => {
  const data = new Map([['little-word-garden-v1', 'progress']]);
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const store = tokenStore(() => storage);
  assert.equal(store.load(), '');
  assert.equal(store.save('example'), true);
  assert.equal(tokenStore(() => storage).load(), 'example');
  assert.equal(data.get(TOKEN_KEY), 'example');
  assert.equal(store.clear(), true);
  assert.equal(store.load(), '');
  assert.equal(data.get('little-word-garden-v1'), 'progress');
  const blocked = tokenStore(() => { throw new Error('blocked'); });
  assert.equal(blocked.load(), '');
  assert.equal(blocked.save('example'), false);
  assert.equal(blocked.clear(), false);
});

test('admin content renders as text in the game and icons are optional', () => {
  const text = '<img src=x onerror=alert(1)> & "clue"';
  const item = { word: 'cat', clue: text };
  const html = playScreen({ item, index: 0, total: 1, gaps: [1], letters: {}, selected: 1, solved: false, message: '' });
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('undefined'));
  assert.ok(!html.includes('clue-icon'));
  assert.ok(!revealScreen({ item }).includes('undefined'));
  assert.ok(!summaryScreen({ total: 1, results: [item], tricky: [], storageAvailable: true }).includes('undefined'));
  const chapter = { id: 'test', subjectId: 'science', title: text };
  const lesson = { id: 'test-words', chapterId: 'test', title: text, words: [item] };
  const subject = subjects.find(item => item.id === 'science');
  for (const page of [subjectScreen({ subject, chapters: [chapter], lessons: [lesson] }), chapterScreen({ subject, chapter, lessons: [lesson] }), homeScreen({ chapter, lesson, progress: {}, rounds: 0 })]) {
    assert.ok(!page.includes('<img'));
    assert.ok(page.includes('&lt;img'));
  }
});
