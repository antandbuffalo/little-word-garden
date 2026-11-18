import { shuffle } from './spelling.js?v=1794964464226';

export function meaningRound(words) {
  return shuffle(words).map(item => ({
    item,
    choices: shuffle([item.clue, ...shuffle([...new Set(words.map(word => word.clue))]
      .filter(clue => clue !== item.clue)).slice(0, 2)]),
  }));
}

export function recordMeaningAttempt(progress, word, helped) {
  const record = progress[word] || {};
  return {
    ...progress,
    [word]: {
      ...record,
      meaning: { attempted: true, mastered: Boolean(record.meaning?.mastered || !helped) },
    },
  };
}
