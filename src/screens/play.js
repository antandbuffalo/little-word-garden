export function playScreen({ item, index, total, gaps, letters, selected, solved, message, incorrect = [] }) {
  return `<section class="play">${solved ? confetti() : ''}<div class="play-top"><span class="eyebrow">A LITTLE SPELLING ADVENTURE</span><span class="counter">${index + 1} <span>/ ${total}</span></span></div><div class="progress-track" role="progressbar" aria-label="Words finished" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${index + (solved ? 1 : 0)}"><div style="width:${(index + (solved ? 1 : 0)) / total * 100}%"></div></div><div class="word-heading"><span class="badge">${solved ? '✿ A WORD GROWN!' : 'LET’S FIND THE LETTERS'}</span><h1>${solved ? 'You’ve got it!' : 'What’s missing?'}</h1><p>${solved ? 'A little practice makes your spelling stronger.' : 'Fill the gaps to grow this word.'}</p></div><div class="clue"><span class="clue-icon" aria-hidden="true">${item.icon}</span><div><span class="eyebrow">YOUR CLUE</span><p>${item.clue}</p></div></div><div class="tiles ${item.word.includes(' ') ? 'phrase' : ''}" aria-label="Word with ${gaps.length} missing letters">${wordTiles({ word: item.word, gaps, letters, selected, solved, incorrect })}</div><div id="feedback" class="feedback ${solved ? 'success' : ''} ${incorrect.length ? 'error' : ''}" role="status" aria-live="polite">${message || `${gaps.length} missing ${gaps.length === 1 ? 'letter' : 'letters'} · fill the gaps to see how you did`}</div>${solved ? `<div class="success-art" aria-hidden="true">✧ 🌷 ✧</div><button id="next" class="primary">${index + 1 === total ? 'See my garden' : 'Next word'} <span>→</span></button>` : `<div class="keyboard" aria-label="Letter keyboard">${['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row, i) => `<div class="key-row">${[...row].map(l => `<button class="key" data-letter="${l}" aria-label="${l}">${l}</button>`).join('')}${i === 2 ? '<button class="key backspace" id="backspace" aria-label="Erase letter">⌫</button>' : ''}</div>`).join('')}</div><button class="text-button" id="reveal">☀ &nbsp; Show me the word</button>`}</section>`;
}

function confetti() {
  const colors = ['#ac91c5', '#e2b660', '#8fa97d', '#dc9e88', '#8bbbbb'];
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 30 }, (_, i) =>
    `<i style="--left:${(i * 37 + 5) % 100}%;--delay:${(i % 6) * 45}ms;--drift:${((i * 29) % 140) - 70}px;--spin:${i % 2 ? 420 : -420}deg;--color:${colors[i % colors.length]}"></i>`
  ).join('')}</div>`;
}

function wordTiles({ word, gaps, letters, selected, solved, incorrect }) {
  const tile = (letter, i) => gaps.includes(i)
    ? `<button class="tile gap ${selected === i && !solved ? 'selected' : ''} ${solved ? 'correct' : ''} ${incorrect.includes(i) ? 'incorrect' : ''}" data-gap="${i}" ${incorrect.includes(i) ? 'aria-invalid="true"' : ''} aria-label="Letter ${i + 1}, ${letters[i] || 'missing'}" ${solved ? 'disabled' : ''}>${letters[i] || '<span class="dash">_</span>'}</button>`
    : `<span class="tile fixed" aria-label="Letter ${i + 1}: ${letter}">${letter}</span>`;
  if (!word.includes(' ')) return [...word].map(tile).join('');
  // Keep words on separate rows and retain their original letter indexes.
  return [...word.matchAll(/\S+/g)].map((match, wordIndex) =>
    `<div class="word-tiles" role="group" aria-label="Word ${wordIndex + 1}">${[...match[0]].map((letter, i) => tile(letter, match.index + i)).join('')}</div>`
  ).join('');
}
