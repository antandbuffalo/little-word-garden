import { getLesson, getSubject, getChapter, getSubjectChapters, getChapterLessons, subjects, chapters, lessons } from './data/lessons.js?v=1794964464226';
import { makeGaps, shuffle, assessAttempt } from './game/spelling.js?v=1794964464226';
import { chooseLevelRound, levelStatus, unlockedLevel, recordLevelAttempt } from './game/levels.js?v=1794964464226';
import { createLetterBank, availableTiles, placeTile, lettersForPlacements } from './game/letter-bank.js?v=1794964464226';
import { createProgressStore } from './storage/progress.js?v=1794964464226';
import { homeScreen } from './screens/home.js?v=1794964464226';
import { playScreen } from './screens/play.js?v=1794964464226';
import { revealScreen } from './screens/reveal.js?v=1794964464226';
import { summaryScreen } from './screens/summary.js?v=1794964464226';
import { subjectsScreen, subjectScreen } from './screens/subjects.js?v=1794964464226';
import { chapterNavigation, chapterScreen } from './screens/chapters.js?v=1794964464226';
import { openMeanings } from './meanings.js?v=1794964464226';

let lesson = getLesson();

const main = document.querySelector('#main');
const homeButton = document.querySelector('#home-button');
let store = createProgressStore(lesson.id);
let saved = store.load();
let progress = saved.progress;
let rounds = saved.rounds;
let currentLevel = unlockedLevel(lesson.words, progress);
let round = [], index = 0, gaps = [], letters = {}, selected = 0, phase = 'home', helped = false, solved = false, results = [], previousRound = [], message = '';
let storageAvailable = true;
let incorrect = [];
let letterBank = [], placements = {};
function persist() { storageAvailable = store.save({ progress, rounds }); }
function title(text) { document.title = `${text} · Little Word Garden`; }
function home() {
  const chapter = getChapter(lesson.chapterId);
  const subject = getSubject(chapter.subjectId);
  if (lesson.activity === 'meanings') {
    phase = 'meanings'; homeButton.hidden = false; title(lesson.title);
    openMeanings({ main, lesson, chapter, subject, store });
    return;
  }
  phase = 'home'; homeButton.hidden = false; title(chapter.title);
  main.innerHTML = chapterNavigation(subject, chapter) + homeScreen({ lesson, chapter, progress, rounds, currentLevel });
  main.querySelectorAll('[data-level]').forEach(button => button.onclick = () => {
    const level = Number(button.dataset.level);
    if (level > unlockedLevel(lesson.words, progress)) return;
    currentLevel = level;
    home();
  });
  document.querySelector('#start').onclick = () => startRound();
}

function openLesson(nextLesson) {
  lesson = nextLesson;
  store = createProgressStore(lesson.id);
  saved = store.load();
  progress = saved.progress;
  rounds = saved.rounds;
  currentLevel = unlockedLevel(lesson.words, progress);
  previousRound = [];
  home();
}

function showSubjects() {
  phase = 'subjects'; homeButton.hidden = true; title('Choose a subject');
  main.innerHTML = subjectsScreen({ subjects, chapters, lessons });
}

function route() {
  const [page, id] = location.hash.slice(1).split('/');
  if (page === 'subject') {
    const subject = getSubject(id);
    if (!subject) { showSubjects(); return; }
    phase = 'subject'; homeButton.hidden = false; title(subject.title);
    main.innerHTML = subjectScreen({ subject, chapters: getSubjectChapters(subject.id), lessons });
  } else if (page === 'chapter') {
    const chapter = getChapter(id);
    if (!chapter) { showSubjects(); return; }
    const collections = getChapterLessons(chapter.id).filter(item => item.words.length);
    if (collections.length === 1) openLesson(collections[0]);
    else {
      phase = 'chapter'; homeButton.hidden = false; title(chapter.title);
      main.innerHTML = chapterScreen({ subject: getSubject(chapter.subjectId), chapter, lessons: collections });
    }
  } else if (page === 'lesson' && getLesson(id)?.words.length) {
    openLesson(getLesson(id));
  } else showSubjects();
  window.scrollTo(0, 0);
}
function startRound(words) {
  round = words || chooseLevelRound(lesson.words, progress, currentLevel, previousRound); previousRound = round.map(w => w.word); index = 0; results = []; homeButton.hidden = false; beginWord();
}
function beginWord() {
  const item = round[index];
  const record = progress[item.word] || {};
  gaps = makeGaps(item.word, currentLevel, record.gaps || []);
  letterBank = createLetterBank(item.word, gaps);
  placements = {};
  progress[item.word] = { ...record, gaps }; persist();
  letters = {}; incorrect = []; selected = gaps[0]; helped = false; solved = false; message = ''; phase = 'play'; renderPlay();
}
function renderPlay() {
  const active = document.activeElement;
  const focusSelector = active?.dataset.gap !== undefined ? `[data-gap="${active.dataset.gap}"]` : active?.dataset.bankId !== undefined ? `[data-gap="${selected}"]` : null;
  const item = round[index]; title('Fill the gaps');
  main.innerHTML = playScreen({ item, index, total: round.length, gaps, letters, selected, solved, message, incorrect, letterBank, placements, currentLevel });
  main.querySelectorAll('[data-gap]').forEach(b => b.onclick = () => {
    if (solved) return;
    selected = Number(b.dataset.gap);
    delete placements[selected];
    delete letters[selected];
    incorrect = incorrect.filter(g => g !== selected);
    message = '';
    renderPlay();
  });
  main.querySelectorAll('[data-bank-id]').forEach(b => b.onclick = () => enterTile(Number(b.dataset.bankId)));
  if (solved) document.querySelector('#next').onclick = nextWord;
  else document.querySelector('#reveal').onclick = reveal;
  if (solved) document.querySelector('#next').focus({ preventScroll: true });
  else if (focusSelector) main.querySelector(focusSelector)?.focus({ preventScroll: true });
}
function enterTile(tileId) {
  if (phase !== 'play' || solved) return;
  const next = placeTile(letterBank, placements, selected, tileId);
  if (next === placements) return;
  placements = next;
  letters = lettersForPlacements(letterBank, placements); message = '';
  incorrect = incorrect.filter(g => g !== selected);
  const needsLetter = g => !letters[g] || incorrect.includes(g);
  const later = gaps.find(g => g > selected && needsLetter(g));
  selected = later ?? gaps.find(needsLetter) ?? selected;
  check();
  renderPlay();
}
function erase() {
  if (phase !== 'play' || solved) return;
  if (!letters[selected]) selected = [...gaps].reverse().find(g => g < selected) ?? selected;
  delete placements[selected];
  delete letters[selected]; incorrect = incorrect.filter(g => g !== selected); message = ''; renderPlay();
}
function check() {
  if (solved || phase !== 'play') return;
  const item = round[index];
  const attempt = assessAttempt(item.word, gaps, letters);
  if (attempt.status === 'incomplete') return;
  incorrect = attempt.incorrect;
  if (attempt.status === 'correct') {
    solved = true; message = helped ? 'Lovely practice! You finished the word. ✿' : 'Wonderful! You found every missing letter. ✿';
    if (!helped) progress[item.word].wins = (progress[item.word].wins || 0) + 1;
    progress = recordLevelAttempt(progress, item.word, currentLevel, helped);
    results.push({ ...item, helped }); persist();
  } else {
    helped = true; selected = incorrect[0]; message = 'Almost! Try another letter in the red gaps. You can do it.';
  }
}
function reveal() {
  helped = true; phase = 'reveal';
  const item = round[index];
  main.innerHTML = revealScreen({ item });
  document.querySelector('#try-again').onclick = () => { phase = 'play'; placements = {}; letters = {}; incorrect = []; selected = gaps[0]; message = ''; renderPlay(); };
}
function nextWord() { index++; if (index < round.length) beginWord(); else finish(); }
function finish() {
  phase = 'summary'; rounds++; persist(); title('Your garden is growing');
  const tricky = results.filter(r => r.helped);
  const status = levelStatus(lesson.words, progress, currentLevel);
  main.innerHTML = summaryScreen({ total: round.length, results, tricky, storageAvailable, currentLevel, status });
  const nextLevel = document.querySelector('#next-level');
  if (nextLevel) nextLevel.onclick = () => { currentLevel++; previousRound = []; startRound(); };
  document.querySelector('#another').onclick = () => startRound();
  if (tricky.length) document.querySelector('#practice').onclick = () => startRound(shuffle(tricky));
  document.querySelector('#back-home').onclick = home;
}
homeButton.onclick = () => { location.hash = 'subjects'; };
window.addEventListener('hashchange', route);
document.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('a')) return;
  if (phase !== 'play') return;
  if (/^[a-z]$/i.test(event.key)) {
    event.preventDefault();
    const tile = availableTiles(letterBank, placements).find(tile => tile.letter === event.key.toLowerCase());
    if (tile) enterTile(tile.id);
  }
  else if (event.key === 'Backspace') { event.preventDefault(); erase(); }
  else if (event.key === 'Enter' && solved && !event.target.closest('button')) { event.preventDefault(); nextWord(); }
});
route();
