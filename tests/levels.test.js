import test from 'node:test';
import assert from 'node:assert/strict';
import { getLesson } from '../src/data/lessons.js';
import { LEVELS, chooseLevelRound, levelStatus, unlockedLevel, recordLevelAttempt } from '../src/game/levels.js';
import { makeGaps } from '../src/game/spelling.js';
import { levelPicker } from '../src/screens/levels.js';
import { summaryScreen } from '../src/screens/summary.js';

const words = getLesson().words;

test('two five-word rounds cover the chapter before the next level unlocks', () => {
  let progress = {};
  assert.equal(unlockedLevel(words, progress), 1);
  const first = chooseLevelRound(words, progress, 1);
  assert.equal(first.length, 5);
  for (const item of first) progress = recordLevelAttempt(progress, item.word, 1, false);
  assert.equal(unlockedLevel(words, progress), 1);
  const second = chooseLevelRound(words, progress, 1);
  assert.equal(second.length, 5);
  assert.ok(second.every(item => !first.includes(item)));
  for (const item of second) progress = recordLevelAttempt(progress, item.word, 1, false);
  assert.deepEqual(levelStatus(words, progress, 1), { mastered: 10, total: 10, complete: true });
  assert.equal(unlockedLevel(words, progress), 2);
  assert.equal(levelStatus(words, progress, 2).mastered, 0);
});

test('helped words wait for practice and independently solving them unlocks the next level', () => {
  let progress = {};
  const first = chooseLevelRound(words, progress, 1);
  for (const [index, item] of first.entries()) progress = recordLevelAttempt(progress, item.word, 1, index === 0);
  const second = chooseLevelRound(words, progress, 1);
  assert.equal(second.length, 5);
  assert.ok(second.every(item => !first.includes(item)));
  for (const item of second) progress = recordLevelAttempt(progress, item.word, 1, false);
  assert.equal(unlockedLevel(words, progress), 1);
  assert.deepEqual(chooseLevelRound(words, progress, 1), [first[0]]);
  progress = recordLevelAttempt(progress, first[0].word, 1, false);
  assert.equal(unlockedLevel(words, progress), 2);
  progress = recordLevelAttempt(progress, first[0].word, 1, true);
  assert.equal(unlockedLevel(words, progress), 2, 'Replay mistakes do not remove earned progress');
});

test('all four levels are independent and completed levels remain replayable', () => {
  let progress = {};
  for (const { id } of LEVELS) {
    for (const item of words) progress = recordLevelAttempt(progress, item.word, id, false);
    assert.equal(unlockedLevel(words, progress), Math.min(id + 1, 4));
  }
  const replay = chooseLevelRound(words, progress, 1);
  const nextReplay = chooseLevelRound(words, progress, 1, replay.map(item => item.word));
  assert.equal(replay.length, 5);
  assert.ok(nextReplay.every(item => !replay.includes(item)));
  assert.equal(levelStatus(words, progress, 4).complete, true);
});

test('level gaps increase without hiding spaces or every letter in a short word', () => {
  assert.deepEqual([1, 2, 3, 4].map(level => makeGaps('electrical energy', level).length), [1, 2, 3, 8]);
  assert.deepEqual([1, 2, 3, 4].map(level => makeGaps('prey', level).length), [1, 2, 3, 3]);
  assert.deepEqual([1, 2, 3, 4].map(level => makeGaps('cat', level).length), [1, 2, 2, 2]);
});

test('legacy wins are preserved without inventing completed levels', () => {
  const progress = { skeleton: { wins: 12, gaps: [1] } };
  assert.equal(unlockedLevel(words, progress), 1);
  const updated = recordLevelAttempt(progress, 'skeleton', 1, false);
  assert.equal(updated.skeleton.wins, 12);
  assert.deepEqual(updated.skeleton.gaps, [1]);
});

test('level picker locks later levels and the final summary offers no fifth level', () => {
  const html = levelPicker({ words, progress: {}, currentLevel: 1 });
  assert.equal((html.match(/ disabled/g) || []).length, 3);
  assert.ok(html.includes('Finish Level 1 to unlock'));
  const summary = summaryScreen({ total: 5, results: [], tricky: [], storageAvailable: true, currentLevel: 4, status: { mastered: 10, total: 10, complete: true } });
  assert.ok(summary.includes('all four levels'));
  assert.ok(!summary.includes('id="next-level"'));
  assert.ok(summary.includes('Replay Level 4'));
});
