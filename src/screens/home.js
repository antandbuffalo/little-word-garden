import { escapeHTML } from './html.js?v=1795702967401';
import { levelPicker } from './levels.js?v=1795702967401';

export function homeScreen({ lesson, chapter, progress, rounds, currentLevel = 1 }) {
  return `<section class="welcome"><div class="eyebrow"><span></span> ${chapter ? 'LET’S EXPLORE THIS CHAPTER' : 'YOUR LITTLE LEARNING SPACE'}</div><h1>${chapter ? escapeHTML(chapter.title) : 'Little words.<br>Big <em>discoveries.</em>'}</h1><p class="intro">Choose a level.<br>Grow one word at a time.</p>${levelPicker({ words: lesson.words, progress, currentLevel })}<button class="primary start" id="start">Play Level ${currentLevel} <span>↗</span></button><div class="round-note">${Math.min(5, lesson.words.length)} words · no timer · just you!</div></section>
<section class="lesson"><div class="lesson-top"><span class="lesson-icon">▤</span><div><span class="eyebrow">THIS WEEK’S WORDS</span><h2>${escapeHTML(lesson.title)}</h2></div><span class="word-count">${lesson.words.length}</span></div><div class="word-list">${lesson.words.map(w => `<span>${w.word}<span class="learned">${progress[w.word]?.wins ? ' ✿' : ''}</span></span>`).join('')}</div><p class="saved-note">${rounds ? `${rounds} ${rounds === 1 ? 'round' : 'rounds'} completed. Your garden is growing!` : 'Start with one missing letter. Grow from there.'}</p></section>`;
}
