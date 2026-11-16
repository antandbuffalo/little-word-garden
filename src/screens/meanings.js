import { escapeHTML } from './html.js';

export function meaningLearnScreen({ lesson, progress, storageAvailable = true }) {
  const mastered = lesson.words.filter(item => progress[item.word]?.meaning?.mastered).length;
  return `<section class="welcome meaning-learn"><span class="badge">READ AND DISCOVER</span>
    <h1>${escapeHTML(lesson.title)}</h1><p class="intro">Read each word and its meaning.<br>Then try choosing the meaning.</p>
    <dl class="meaning-pairs">${lesson.words.map(item => `<div><dt>${escapeHTML(item.word)}</dt><dd>${escapeHTML(item.clue)}</dd></div>`).join('')}</dl>
    <button id="meaning-start" class="primary">Choose the meaning <span aria-hidden="true">→</span></button>
    <p class="round-note">${mastered} of ${lesson.words.length} meanings learned · no timer</p>
    ${storageNotice(storageAvailable)}</section>`;
}

export function meaningPlayScreen({ question, index, total, wrong = [], solved = false }) {
  const { item, choices } = question;
  return `<section class="play meaning-play"><div class="play-top"><span class="eyebrow">WORDS &amp; MEANINGS</span><span class="counter">${index + 1} <span>/ ${total}</span></span></div>
    <div class="word-heading"><span class="badge">CHOOSE THE MEANING</span><h1 id="meaning-word" tabindex="-1">${escapeHTML(item.word)}</h1><p>What does this mean?</p></div>
    <div class="meaning-choices" role="group" aria-labelledby="meaning-word">${choices.map((choice, choiceIndex) => `<button class="meaning-choice ${solved && choice === item.clue ? 'correct' : ''} ${!solved && wrong.includes(choiceIndex) ? 'incorrect' : ''}" data-meaning-choice="${choiceIndex}" ${solved || wrong.includes(choiceIndex) ? 'disabled' : ''}>${escapeHTML(choice)}${solved && choice === item.clue ? ' <span aria-hidden="true">✓</span>' : ''}</button>`).join('')}</div>
    <div class="feedback ${solved ? 'success' : ''}" role="status" aria-live="polite">${solved ? `Lovely! ${escapeHTML(item.word)} → ${escapeHTML(item.clue)}` : wrong.length ? 'Try again. You can do it!' : 'Tap a meaning.'}</div>
    ${solved ? `<button id="meaning-next" class="primary">${index + 1 === total ? 'See my progress' : 'Next'} <span aria-hidden="true">→</span></button>` : ''}
    <button id="meaning-learn" class="text-button">Back to Learn</button></section>`;
}

export function meaningSummaryScreen({ results, storageAvailable }) {
  return `<section class="summary"><span class="badge">LOVELY LEARNING!</span><h1>Look what you learned!</h1><p>Every try helps you grow.</p>
    <dl class="meaning-pairs">${results.map(item => `<div><dt>${escapeHTML(item.word)}</dt><dd>${escapeHTML(item.clue)}<span class="meaning-result">${item.helped ? 'Keep practising ✿' : 'You knew it! ✿'}</span></dd></div>`).join('')}</dl>
    ${storageNotice(storageAvailable)}
    <button id="meaning-start" class="primary">Practise again <span aria-hidden="true">→</span></button>
    <button id="meaning-learn" class="text-button">Back to Learn</button></section>`;
}

function storageNotice(available) {
  return available ? '' : '<p class="saved-note" role="status">You can keep playing, but this device could not save your progress.</p>';
}
