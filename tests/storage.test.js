import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressStore } from '../src/storage/progress.js';
import { DEFAULT_LESSON_ID } from '../src/data/lessons.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('existing progress survives the reorganisation', () => {
  const state = { progress: { skeleton: { wins: 2, gaps: [1, 3] } }, rounds: 3 };
  const storage = memoryStorage({ 'little-word-garden-v1': JSON.stringify(state) });
  assert.deepEqual(createProgressStore(DEFAULT_LESSON_ID, storage).load(), state);
});

test('lessons keep separate progress, even for the same spelling', () => {
  const storage = memoryStorage();
  const first = createProgressStore(DEFAULT_LESSON_ID, storage);
  const second = createProgressStore('another-lesson', storage);
  const firstState = { progress: { germs: { wins: 2 } }, rounds: 1 };
  assert.equal(first.save(firstState), true);
  assert.deepEqual(second.load(), { progress: {}, rounds: 0 });
  second.save({ progress: { germs: { wins: 4 } }, rounds: 2 });
  assert.deepEqual(first.load(), firstState);
});

test('unavailable or invalid storage does not stop the game', () => {
  for (const value of ['broken json', 'null', '{"progress":[],"rounds":-1}']) {
    const storage = memoryStorage({ 'little-word-garden-v1': value });
    assert.deepEqual(createProgressStore(DEFAULT_LESSON_ID, storage).load(), { progress: {}, rounds: 0 });
  }
  const unavailable = createProgressStore(DEFAULT_LESSON_ID, {
    getItem() { throw new Error('Storage blocked'); },
    setItem() { throw new Error('Storage blocked'); },
  });
  assert.deepEqual(unavailable.load(), { progress: {}, rounds: 0 });
  assert.equal(unavailable.save({}), false);
});
