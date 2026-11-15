import { chooseRound, shuffle } from './spelling.js';

export const LEVELS = [
  { id: 1, description: '1 missing letter' },
  { id: 2, description: '2 missing letters' },
  { id: 3, description: '3 missing letters' },
  { id: 4, description: 'Half the letters or more' },
];

export function levelStatus(words, progress, level) {
  const mastered = words.filter(item => progress[item.word]?.levels?.[level]?.mastered).length;
  return { mastered, total: words.length, complete: words.length > 0 && mastered === words.length };
}

export function unlockedLevel(words, progress) {
  return LEVELS.find(level => !levelStatus(words, progress, level.id).complete)?.id ?? 4;
}

export function recordLevelAttempt(progress, word, level, helped) {
  const record = progress[word] || {};
  const previous = record.levels?.[level];
  return {
    ...progress,
    [word]: {
      ...record,
      levels: { ...record.levels, [level]: { attempted: true, mastered: Boolean(previous?.mastered || !helped) } },
    },
  };
}

export function chooseLevelRound(words, progress, level, previous = []) {
  const pending = words.filter(item => !progress[item.word]?.levels?.[level]?.mastered);
  // A replay still visits a fresh set of words before repeating the last round.
  if (!pending.length) return chooseRound(words, {}, previous);
  return shuffle(pending).sort((a, b) =>
    Number(Boolean(progress[a.word]?.levels?.[level]?.attempted)) -
    Number(Boolean(progress[b.word]?.levels?.[level]?.attempted))
  ).slice(0, 5);
}
