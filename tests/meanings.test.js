import test from 'node:test';
import assert from 'node:assert/strict';
import { meaningRound, recordMeaningAttempt } from '../src/game/meanings.js';
import { getLesson, getChapter, getChapterLessons, getSubject, subjects } from '../src/data/lessons.js';
import { meaningLearnScreen, meaningPlayScreen, meaningSummaryScreen } from '../src/screens/meanings.js';
import { chapterScreen } from '../src/screens/chapters.js';
import { addWords, parseCatalog, serializeCatalog } from '../src/admin/content.js';
import catalog from '../src/data/catalog.js';
import { openMeanings } from '../src/meanings.js';

const lesson = getLesson('going-places-synonyms');

test('meaning rounds cover every pair with one correct and two distinct alternatives', () => {
  const before = structuredClone(lesson.words);
  for (let replay = 0; replay < 20; replay++) {
    const round = meaningRound(lesson.words);
    assert.deepEqual(round.map(q => q.item.word).sort(), lesson.words.map(item => item.word).sort());
    for (const question of round) {
      assert.equal(question.choices.length, 3);
      assert.equal(new Set(question.choices).size, 3);
      assert.equal(question.choices.filter(choice => choice === question.item.clue).length, 1);
      assert.ok(question.choices.every(choice => lesson.words.some(item => item.clue === choice)));
    }
  }
  assert.deepEqual(lesson.words, before);
  assert.deepEqual(meaningRound([{ word: 'a', clue: 'same' }, { word: 'b', clue: 'same' }])[0].choices, ['same']);
});

test('meaning mastery is independent of spelling and later retries preserve earned mastery', () => {
  const legacy = { arid: { wins: 4, gaps: [1], levels: { 1: { mastered: true } } } };
  const helped = recordMeaningAttempt(legacy, 'arid', true);
  assert.deepEqual(helped.arid.meaning, { attempted: true, mastered: false });
  assert.equal(legacy.arid.meaning, undefined);
  const mastered = recordMeaningAttempt(helped, 'arid', false);
  assert.equal(mastered.arid.meaning.mastered, true);
  assert.equal(recordMeaningAttempt(mastered, 'arid', true).arid.meaning.mastered, true);
  assert.deepEqual(mastered.arid.levels, legacy.arid.levels);
  assert.equal(mastered.arid.wins, 4);
});

test('correct meaning clears previous wrong highlights while retaining the correct pair and Next', () => {
  const question = { item: { word: 'leap over', clue: '<jump>' }, choices: ['<jump>', 'Dry.', 'Heat.'] };
  const retry = meaningPlayScreen({ question, index: 0, total: 4, wrong: [1] });
  assert.ok(retry.includes('Try again.'));
  assert.match(retry, /meaning-choice [^"]*incorrect/);
  assert.match(retry, /data-meaning-choice="1" disabled/);
  assert.ok(!retry.includes('id="meaning-next"'));
  const solved = meaningPlayScreen({ question, index: 3, total: 4, wrong: [1], solved: true });
  assert.ok(!solved.includes('incorrect'));
  assert.equal((solved.match(/meaning-choice correct/g) || []).length, 1);
  assert.ok(solved.includes('leap over → &lt;jump&gt;'));
  assert.ok(solved.includes('id="meaning-next"'));
  assert.ok(solved.includes('See my progress'));
});

test('Learn shows every full pair and summary reports storage failure with escaped text', () => {
  const learn = meaningLearnScreen({ lesson, progress: {} });
  for (const item of lesson.words) {
    assert.ok(learn.includes(item.word));
    assert.ok(learn.includes(item.clue));
  }
  assert.ok(!/data-gap|data-bank-id|data-level/.test(learn));
  const summary = meaningSummaryScreen({ results: [{ word: 'leap over', clue: '<jump>', helped: true }], storageAvailable: false });
  assert.ok(summary.includes('Keep practising'));
  assert.ok(summary.includes('could not save'));
  assert.ok(summary.includes('id="meaning-start"'));
  assert.ok(summary.includes('&lt;jump&gt;'));
  assert.ok(!summary.includes('<jump>'));
});

test('chapter navigation and admin publishing preserve the meaning activity and original spelling collection', () => {
  const chapter = getChapter('going-places');
  const html = chapterScreen({ chapter, subject: getSubject('english'), lessons: getChapterLessons(chapter.id) });
  assert.ok(html.includes('#lesson/going-places-words'));
  assert.ok(html.includes('#lesson/going-places-synonyms'));
  assert.ok(html.includes('Words &amp; Meanings'));
  assert.ok(html.includes('Learn and practise'));
  const result = addWords(catalog, { subjectId: 'english', chapterId: chapter.id, lessonId: lesson.id, words: [{ word: 'quick', clue: 'Fast.' }] }, subjects);
  assert.equal(parseCatalog(serializeCatalog(result.catalog)).lessons.find(item => item.id === lesson.id).activity, 'meanings');
  assert.deepEqual(result.catalog.lessons.find(item => item.id === 'going-places-words'), getLesson('going-places-words'));
});

// A small DOM adapter exercises the real event handlers without a browser dependency.
function activityDOM() {
  let html = '', buttons = [];
  return {
    get innerHTML() { return html; },
    set innerHTML(value) {
      html = value;
      buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(([, attrs, text]) => ({
        id: attrs.match(/id="([^"]+)"/)?.[1],
        dataset: { meaningChoice: attrs.match(/data-meaning-choice="([^"]+)"/)?.[1] },
        disabled: attrs.includes('disabled'), text,
        addEventListener(event, handler) { this[event] = handler; },
        focus() {},
      }));
    },
    querySelectorAll() { return buttons.filter(button => button.dataset.meaningChoice !== undefined); },
    querySelector(selector) {
      return selector.startsWith('#') ? buttons.find(button => button.id === selector.slice(1)) : buttons.find(button => button.dataset.meaningChoice !== undefined && !button.disabled);
    },
  };
}

test('meaning flow supports retry then correct, explicit Next, summary, replay and reload', () => {
  const main = activityDOM();
  let saved = { progress: {}, rounds: 0 };
  const store = { load: () => structuredClone(saved), save: state => { saved = structuredClone(state); return true; } };
  const options = { main, lesson, chapter: getChapter('going-places'), subject: getSubject('english'), store };
  openMeanings(options);
  main.querySelector('#meaning-start').click();
  let firstWord;
  for (let index = 0; index < lesson.words.length; index++) {
    const word = main.innerHTML.match(/id="meaning-word"[^>]*>([^<]+)/)[1];
    const item = lesson.words.find(item => item.word === word);
    if (index === 0) {
      firstWord = word;
      main.querySelectorAll().find(button => button.text !== item.clue).click();
      assert.ok(main.innerHTML.includes('Try again.'));
      assert.ok(!main.querySelector('#meaning-next'));
    }
    main.querySelectorAll().find(button => button.text === item.clue).click();
    assert.ok(!main.innerHTML.includes('incorrect'));
    assert.ok(main.innerHTML.includes(`${word} → ${item.clue}`));
    // Repeated clicks on the solved answer must not record another result.
    main.querySelectorAll().find(button => button.text.startsWith(item.clue)).click();
    main.querySelector('#meaning-next').click();
  }
  assert.equal(saved.rounds, 1);
  assert.equal(Object.keys(saved.progress).length, 4);
  assert.equal(saved.progress[firstWord].meaning.mastered, false);
  assert.equal(Object.values(saved.progress).filter(record => record.meaning.mastered).length, 3);
  assert.ok(main.innerHTML.includes('Look what you learned!'));
  main.querySelector('#meaning-start').click();
  assert.ok(main.innerHTML.includes('meaning-word'));
  main.querySelector('#meaning-learn').click();
  assert.ok(main.innerHTML.includes('3 of 4 meanings learned'));
  openMeanings(options);
  assert.ok(main.innerHTML.includes('3 of 4 meanings learned'));
});
