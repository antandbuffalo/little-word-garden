import test from 'node:test';
import assert from 'node:assert/strict';
import { lessons } from '../src/data/lessons.js';
import { makeGaps, assessAttempt } from '../src/game/spelling.js';
import { createLetterBank, availableTiles, placeTile, lettersForPlacements } from '../src/game/letter-bank.js';

test('bank has one token per missing letter, including duplicates, plus 3–4 extras', () => {
  for (const random of [() => 0, () => 0.99]) {
    const bank = createLetterBank('good', [1, 2], random);
    assert.equal(bank.filter(tile => tile.letter === 'o').length, 2);
    assert.ok(bank.length === 5 || bank.length === 6);
    assert.equal(new Set(bank.map(tile => tile.id)).size, bank.length);
    assert.ok(bank.every(tile => /^[a-z]$/.test(tile.letter)));
  }
});

test('every chapter word and phrase can be completed using its bank', () => {
  for (const { word } of lessons.flatMap(lesson => lesson.words)) {
    for (const level of [1, 2, 3, 4]) {
      const gaps = makeGaps(word, level);
      const bank = createLetterBank(word, gaps);
      let placements = {};
      for (const gap of gaps) {
        const tile = availableTiles(bank, placements).find(tile => tile.letter === word[gap]);
        assert.ok(tile, `Missing ${word[gap]} for ${word}`);
        placements = placeTile(bank, placements, gap, tile.id);
      }
      assert.equal(assessAttempt(word, gaps, lettersForPlacements(bank, placements)).status, 'correct');
      assert.equal(availableTiles(bank, placements).length, bank.length - gaps.length);
    }
  }
});

test('a used token cannot fill another gap, while a duplicate can', () => {
  const bank = createLetterBank('good', [1, 2]);
  const [first, second] = bank.filter(tile => tile.letter === 'o');
  let placements = placeTile(bank, {}, 1, first.id);
  assert.equal(placeTile(bank, placements, 2, first.id), placements);
  assert.equal(placeTile(bank, placements, 2, -1), placements);
  placements = placeTile(bank, placements, 2, second.id);
  assert.deepEqual(lettersForPlacements(bank, placements), { 1: 'o', 2: 'o' });
});

test('replacing or clearing a gap returns the previous token to the bank', () => {
  const bank = createLetterBank('cat', [1]);
  const correct = bank.find(tile => tile.letter === 'a');
  const wrong = bank.find(tile => tile.letter !== 'a');
  let placements = placeTile(bank, {}, 1, wrong.id);
  assert.ok(!availableTiles(bank, placements).includes(wrong));
  placements = placeTile(bank, placements, 1, correct.id);
  assert.ok(availableTiles(bank, placements).includes(wrong));
  assert.deepEqual(lettersForPlacements(bank, placements), { 1: 'a' });
  delete placements[1];
  assert.equal(availableTiles(bank, placements).length, bank.length);
  assert.deepEqual(lettersForPlacements(bank, placements), {});
});
