import test from 'node:test';
import assert from 'node:assert/strict';
import { homeScreen } from '../src/screens/home.js';
import { playScreen } from '../src/screens/play.js';
import { revealScreen } from '../src/screens/reveal.js';
import { summaryScreen } from '../src/screens/summary.js';

const lesson = { title: 'A different lesson', words: [{ word: 'cat', clue: 'A pet that purrs.', icon: '🐈' }] };

test('home and reveal use the selected lesson content', () => {
  const home = homeScreen({ lesson, progress: {}, rounds: 0 });
  assert.ok(home.includes(lesson.title));
  assert.ok(home.includes('class="word-count">1<'));
  assert.ok(home.includes('cat'));
  assert.ok(revealScreen({ item: lesson.words[0] }).includes('cat'));
});

test('play screen switches from letter entry to next-word action', () => {
  const state = { item: lesson.words[0], index: 0, total: 1, gaps: [1], letters: {}, selected: 1, message: '' };
  const playing = playScreen({ ...state, solved: false });
  assert.ok(playing.includes('A pet that purrs.'));
  assert.ok(!playing.includes('id="check"'));
  assert.ok(!playing.includes('class="confetti"'));
  assert.ok(!playing.includes('id="next"'));
  const solved = playScreen({ ...state, letters: { 1: 'a' }, solved: true });
  assert.ok(solved.includes('id="next"'));
  assert.ok(solved.includes('See my garden'));
  assert.ok(solved.includes('class="confetti" aria-hidden="true"'));
  assert.ok(!solved.includes('id="check"'));
});

test('letter bank displays duplicate tokens and hides only the used token', () => {
  const html = playScreen({
    item: { word: 'good', clue: 'The opposite of bad.', icon: '🌟' },
    index: 0, total: 5, gaps: [1, 2], letters: { 1: 'o' }, selected: 2, solved: false, message: '',
    letterBank: [{ id: 0, letter: 'o' }, { id: 1, letter: 'o' }, { id: 2, letter: 'a' }],
    placements: { 1: 0 },
  });
  assert.ok(html.includes('class="letter-bank"'));
  assert.equal((html.match(/data-bank-id=/g) || []).length, 3);
  assert.equal((html.match(/disabled aria-hidden="true"/g) || []).length, 1);
  assert.ok(html.includes('data-bank-id="1" aria-label="Letter o" >o</button>'));
  assert.ok(!html.includes('class="keyboard"'));
  assert.ok(!html.includes('id="backspace"'));
  assert.ok(html.includes('tap to return letter'));
});

test('only incorrect gaps get red wobble feedback', () => {
  const html = playScreen({ item: lesson.words[0], index: 0, total: 1, gaps: [0, 1], letters: { 0: 'c', 1: 'x' }, selected: 1, solved: false, message: 'Try another letter.', incorrect: [1] });
  assert.equal((html.match(/aria-invalid="true"/g) || []).length, 1);
  assert.ok(html.includes('incorrect" data-gap="1"'));
  assert.ok(!html.includes('incorrect" data-gap="0"'));
  assert.ok(html.includes('Try another letter.'));
});

test('multiword phrases render separate word rows without a space tile', () => {
  const item = { word: 'electrical energy', clue: 'Powers lights.', icon: '⚡' };
  const html = playScreen({ item, index: 0, total: 5, gaps: [0, 11], letters: {}, selected: 0, solved: false, message: '' });
  assert.equal((html.match(/class="word-tiles"/g) || []).length, 2);
  assert.ok(html.includes('data-gap="0"'));
  assert.ok(html.includes('data-gap="11"'));
  assert.ok(!html.includes('Letter 11:'));
  const reveal = revealScreen({ item });
  assert.ok(reveal.includes('electrical energy'));
  assert.ok(reveal.includes('e · l · e · c · t · r · i · c · a · l / e · n · e · r · g · y'));
});

test('summary offers tricky-word practice only when needed', () => {
  for (const helped of [false, true]) {
    const results = [{ ...lesson.words[0], helped }];
    const html = summaryScreen({ total: 1, results, tricky: results.filter(r => r.helped), storageAvailable: true });
    assert.equal(html.includes('id="practice"'), helped);
    assert.ok(html.includes('You practised 1 word.'));
  }
});
