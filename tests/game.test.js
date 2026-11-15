import test from 'node:test';
import assert from 'node:assert/strict';
import { getLesson, lessons } from '../src/data/lessons.js';
import { makeGaps, chooseRound, assessAttempt } from '../src/game/spelling.js';
const WORDS = getLesson().words;

test('automatic feedback waits until every gap is filled', () => {
  assert.deepEqual(assessAttempt('good', [1, 2], { 1: 'x' }), { status: 'incomplete', incorrect: [] });
  assert.deepEqual(assessAttempt('good', [1, 2], { 1: 'o', 2: 'o' }), { status: 'correct', incorrect: [] });
  const letters = { 1: 'x', 2: 'o' };
  assert.deepEqual(assessAttempt('good', [1, 2], letters), { status: 'incorrect', incorrect: [1] });
  assert.equal(letters[1], 'x', 'Keep the wrong letter visible for feedback');
  letters[1] = 'o';
  assert.equal(assessAttempt('good', [1, 2], letters).status, 'correct');
});

test('all school words rotate letter gaps and keep readable letters at each level', () => {
  const allWords = lessons.flatMap(lesson => lesson.words);
  assert.equal(allWords.length, 20);
  for (const { word } of allWords) {
    const letterCount = word.replace(/[^a-z]/g, '').length;
    let previous = [];
    for (let level = 1; level <= 4; level++) {
      const gaps = makeGaps(word, level, previous);
      assert.equal(gaps.length, Math.min(level === 4 ? Math.max(3, Math.ceil(letterCount / 2)) : level, letterCount - 1));
      assert.equal(new Set(gaps).size, gaps.length);
      assert.ok(gaps.every(i => i >= 0 && i < word.length));
      assert.ok(gaps.every(i => /[a-z]/.test(word[i])));
      assert.notDeepEqual(gaps, previous);
      previous = gaps;
    }
  }
});

test('Electrical energy keeps its space and checks letters across both words', () => {
  const word = 'electrical energy';
  const gaps = makeGaps(word, 4);
  assert.ok(!gaps.includes(10));
  const letters = Object.fromEntries(gaps.map(index => [index, word[index]]));
  assert.equal(assessAttempt(word, gaps, letters).status, 'correct');
  delete letters[gaps.at(-1)];
  assert.equal(assessAttempt(word, gaps, letters).status, 'incomplete');
});

test('rounds contain five distinct words and cover unpractised words next', () => {
  const first = chooseRound(WORDS, {});
  assert.equal(new Set(first.map(w => w.word)).size, 5);
  const progress = Object.fromEntries(first.map(w => [w.word, { wins: 1 }]));
  const second = chooseRound(WORDS, progress, first.map(w => w.word));
  assert.equal(second.length, 5);
  assert.ok(second.every(w => !progress[w.word]));
});

test('rounds only use the selected lesson and support short lessons', () => {
  const words = [{ word: 'cat' }, { word: 'dog' }];
  const round = chooseRound(words, {});
  assert.equal(round.length, 2);
  assert.ok(round.every(item => words.includes(item)));
  assert.deepEqual(chooseRound([], {}), []);
});
