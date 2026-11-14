export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function makeGaps(word, successes = 0, previous = []) {
  const positions = Array.from({ length: word.length }, (_, i) => i).filter(i => /[a-z]/i.test(word[i]));
  const count = Math.min(1 + Math.floor(successes / 2), Math.ceil(positions.length / 2));
  let gaps = shuffle(positions).slice(0, count).sort((a, b) => a - b);
  if (gaps.join() === previous.join()) {
    const replacement = positions.find(i => !gaps.includes(i));
    gaps = [...gaps.slice(1), replacement].sort((a, b) => a - b);
  }
  return gaps;
}
export function chooseRound(words, progress, previous = [], size = 5) {
  return shuffle(words).sort((a, b) => {
    const score = item => (progress[item.word]?.wins || 0) + (previous.includes(item.word) ? 0.5 : 0);
    return score(a) - score(b);
  }).slice(0, size);
}

// Wait for all gaps before giving feedback, so partial words never count as mistakes.
export function assessAttempt(word, gaps, letters) {
  if (gaps.some(index => !letters[index])) return { status: 'incomplete', incorrect: [] };
  const incorrect = gaps.filter(index => letters[index] !== word[index]);
  return { status: incorrect.length ? 'incorrect' : 'correct', incorrect };
}
